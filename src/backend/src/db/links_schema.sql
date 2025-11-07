-- ============================================
-- TechLedger Links System Schema
-- Many-to-many links for all hierarchy objects
-- ============================================

-- Main links table (single source of truth for all links)
CREATE TABLE links (
    id SERIAL PRIMARY KEY,
    
    -- Core link data
    url VARCHAR(2048) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Classification
    link_type VARCHAR(50) NOT NULL DEFAULT 'documentation',
        -- Options: 'documentation', 'video', 'support_article', 'tool', 
        --          'internal_wiki', 'vendor_site', 'training', 'other'
    
    -- Access control
    auth_required VARCHAR(50) NOT NULL DEFAULT 'none',
        -- Options: 'none', 'login', 'vpn', 'sso', 'credentials'
    access_notes TEXT,
        -- e.g., "Use your company email to log in"
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'active',
        -- Options: 'active', 'inactive', 'broken', 'outdated'
    verified_at TIMESTAMP,
        -- Last time link was checked and confirmed working
    
    -- Context
    notes TEXT,
        -- Why this link is relevant, what it contains, etc.
    
    -- Display preferences
    thumbnail_url VARCHAR(2048),
    open_in_new_tab BOOLEAN DEFAULT true,
    
    -- Audit fields
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_url CHECK (url ~* '^https?://'),
    CONSTRAINT valid_link_type CHECK (link_type IN (
        'documentation', 'video', 'support_article', 'tool',
        'internal_wiki', 'vendor_site', 'training', 'other'
    )),
    CONSTRAINT valid_auth_required CHECK (auth_required IN (
        'none', 'login', 'vpn', 'sso', 'credentials'
    )),
    CONSTRAINT valid_status CHECK (status IN (
        'active', 'inactive', 'broken', 'outdated'
    ))
);

-- ============================================
-- Junction Tables (Many-to-Many Relationships)
-- ============================================

-- Links to Systems (e.g., "Salesforce Documentation")
CREATE TABLE system_links (
    id SERIAL PRIMARY KEY,
    system_id INTEGER NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
    link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    context_notes TEXT,
        -- Why this link is relevant to THIS system specifically
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(system_id, link_id)
);

-- Links to Actions (e.g., "How to login - video tutorial")
CREATE TABLE action_links (
    id SERIAL PRIMARY KEY,
    action_id INTEGER NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    context_notes TEXT,
        -- Why this link is relevant to THIS action specifically
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(action_id, link_id)
);

-- Links to Roles (e.g., "Sales Rep Onboarding Guide")
CREATE TABLE role_links (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    context_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(role_id, link_id)
);

-- Links to Tasks (e.g., "Best Practices for Processing Payments")
CREATE TABLE task_links (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    context_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(task_id, link_id)
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX idx_links_status ON links(status);
CREATE INDEX idx_links_link_type ON links(link_type);
CREATE INDEX idx_links_created_by ON links(created_by);
CREATE INDEX idx_links_verified_at ON links(verified_at);

CREATE INDEX idx_system_links_system_id ON system_links(system_id);
CREATE INDEX idx_system_links_link_id ON system_links(link_id);
CREATE INDEX idx_system_links_order ON system_links(system_id, display_order);

CREATE INDEX idx_action_links_action_id ON action_links(action_id);
CREATE INDEX idx_action_links_link_id ON action_links(link_id);
CREATE INDEX idx_action_links_order ON action_links(action_id, display_order);

CREATE INDEX idx_role_links_role_id ON role_links(role_id);
CREATE INDEX idx_role_links_link_id ON role_links(link_id);
CREATE INDEX idx_role_links_order ON role_links(role_id, display_order);

CREATE INDEX idx_task_links_task_id ON task_links(task_id);
CREATE INDEX idx_task_links_link_id ON task_links(link_id);
CREATE INDEX idx_task_links_order ON task_links(task_id, display_order);

-- ============================================
-- Useful Views
-- ============================================

-- View to see all active links with their associations
CREATE VIEW v_link_usage AS
SELECT 
    l.id as link_id,
    l.url,
    l.title,
    l.link_type,
    l.auth_required,
    l.status,
    COUNT(DISTINCT sl.id) as system_count,
    COUNT(DISTINCT al.id) as action_count,
    COUNT(DISTINCT rl.id) as role_count,
    COUNT(DISTINCT tl.id) as task_count,
    l.created_at,
    l.verified_at
FROM links l
LEFT JOIN system_links sl ON l.id = sl.link_id
LEFT JOIN action_links al ON l.id = al.link_id
LEFT JOIN role_links rl ON l.id = rl.link_id
LEFT JOIN task_links tl ON l.id = tl.link_id
GROUP BY l.id;

-- View to find orphaned links (not associated with anything)
CREATE VIEW v_orphaned_links AS
SELECT l.*
FROM links l
LEFT JOIN system_links sl ON l.id = sl.link_id
LEFT JOIN action_links al ON l.id = al.link_id
LEFT JOIN role_links rl ON l.id = rl.link_id
LEFT JOIN task_links tl ON l.id = tl.link_id
WHERE sl.id IS NULL 
  AND al.id IS NULL 
  AND rl.id IS NULL 
  AND tl.id IS NULL;

-- View to find links that need verification (older than 90 days)
CREATE VIEW v_links_need_verification AS
SELECT 
    l.*,
    COALESCE(l.verified_at, l.created_at) as last_check,
    CURRENT_TIMESTAMP - COALESCE(l.verified_at, l.created_at) as days_since_check
FROM links l
WHERE l.status = 'active'
  AND (l.verified_at IS NULL OR l.verified_at < CURRENT_TIMESTAMP - INTERVAL '90 days')
ORDER BY COALESCE(l.verified_at, l.created_at) ASC;

-- ============================================
-- Sample Data for Testing
-- ============================================

-- Sample links (you'd insert these after you have users)
-- INSERT INTO links (url, title, description, link_type, auth_required, created_by) VALUES
-- ('https://help.salesforce.com/login', 'Salesforce Login Help', 'Official documentation for logging into Salesforce', 'documentation', 'none', 1),
-- ('https://www.youtube.com/watch?v=example', 'QuickBooks Tutorial - Creating Invoices', 'Step-by-step video guide', 'video', 'none', 1),
-- ('https://internal-wiki.company.com/onboarding', 'Sales Rep Onboarding', 'Internal guide for new sales representatives', 'internal_wiki', 'sso', 1);
