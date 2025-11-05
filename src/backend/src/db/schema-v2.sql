-- TechLedger Enhanced Schema v2
-- Adds: Departments, Practice Groups, Action Sequences

-- ============================================================================
-- EXISTING TABLES (unchanged)
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Systems table (top level - e.g., "Salesforce", "QuickBooks")
CREATE TABLE IF NOT EXISTS systems (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- NEW: ORGANIZATIONAL HIERARCHY
-- ============================================================================

-- Departments table (sub-units of Systems)
-- Example: Salesforce → Sales Department, Finance Department
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    system_id INTEGER REFERENCES systems(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Practice Groups table (sub-units of Departments)
-- Example: Finance → Accounts Payable, Accounts Receivable
CREATE TABLE IF NOT EXISTS practice_groups (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- UPDATED: ACTIONS TABLE
-- ============================================================================

-- Actions table (atomic documentation units)
-- NOW: Belong to Practice Groups (not directly to Systems)
-- For backwards compatibility: system_id is nullable
CREATE TABLE IF NOT EXISTS actions (
    id SERIAL PRIMARY KEY,
    system_id INTEGER REFERENCES systems(id) ON DELETE CASCADE,  -- Legacy/optional
    practice_group_id INTEGER REFERENCES practice_groups(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    steps JSONB,  -- Array of step objects
    screenshots JSONB,  -- Array of screenshot references
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- At least one parent required
    CONSTRAINT action_has_parent CHECK (system_id IS NOT NULL OR practice_group_id IS NOT NULL)
);

-- ============================================================================
-- NEW: ACTION SEQUENCES (Workflows/Procedures)
-- ============================================================================

-- Action Sequences table (ordered collections of actions)
-- Example: "Complete Lead Creation Workflow" = Login → Navigate → Create → Save
CREATE TABLE IF NOT EXISTS action_sequences (
    id SERIAL PRIMARY KEY,
    practice_group_id INTEGER REFERENCES practice_groups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sequence Actions junction table (many-to-many with order)
-- Links actions to sequences in a specific order
CREATE TABLE IF NOT EXISTS sequence_actions (
    id SERIAL PRIMARY KEY,
    sequence_id INTEGER REFERENCES action_sequences(id) ON DELETE CASCADE,
    action_id INTEGER REFERENCES actions(id) ON DELETE CASCADE,
    order_number INTEGER NOT NULL,
    notes TEXT,
    UNIQUE(sequence_id, action_id),
    UNIQUE(sequence_id, order_number)  -- Each order_number unique per sequence
);

-- ============================================================================
-- EXISTING TABLES (unchanged)
-- ============================================================================

-- Screenshots table
CREATE TABLE IF NOT EXISTS screenshots (
    id SERIAL PRIMARY KEY,
    action_id INTEGER REFERENCES actions(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255),
    ocr_data JSONB,
    vision_data JSONB,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles table (for role-based navigation)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table (for task-based navigation)
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role-Task junction table (many-to-many)
CREATE TABLE IF NOT EXISTS role_tasks (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    UNIQUE(role_id, task_id)
);

-- Task-Action junction table (many-to-many)
CREATE TABLE IF NOT EXISTS task_actions (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    action_id INTEGER REFERENCES actions(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    notes TEXT,
    UNIQUE(task_id, action_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Existing indexes
CREATE INDEX IF NOT EXISTS idx_systems_user_id ON systems(user_id);
CREATE INDEX IF NOT EXISTS idx_actions_system_id ON actions(system_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_action_id ON screenshots(action_id);
CREATE INDEX IF NOT EXISTS idx_role_tasks_role_id ON role_tasks(role_id);
CREATE INDEX IF NOT EXISTS idx_role_tasks_task_id ON role_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_actions_task_id ON task_actions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_actions_action_id ON task_actions(action_id);

-- New indexes for hierarchy
CREATE INDEX IF NOT EXISTS idx_departments_system_id ON departments(system_id);
CREATE INDEX IF NOT EXISTS idx_practice_groups_department_id ON practice_groups(department_id);
CREATE INDEX IF NOT EXISTS idx_actions_practice_group_id ON actions(practice_group_id);
CREATE INDEX IF NOT EXISTS idx_action_sequences_practice_group_id ON action_sequences(practice_group_id);
CREATE INDEX IF NOT EXISTS idx_sequence_actions_sequence_id ON sequence_actions(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_actions_action_id ON sequence_actions(action_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE departments IS 'Organizational sub-units of systems (e.g., Sales, Finance)';
COMMENT ON TABLE practice_groups IS 'Specialized groups within departments (e.g., Accounts Payable)';
COMMENT ON TABLE action_sequences IS 'Ordered workflows/procedures composed of multiple actions';
COMMENT ON TABLE sequence_actions IS 'Junction table linking actions to sequences with order';

COMMENT ON COLUMN actions.practice_group_id IS 'Primary parent - actions belong to practice groups';
COMMENT ON COLUMN actions.system_id IS 'Legacy/optional - for backwards compatibility or direct system actions';
COMMENT ON COLUMN sequence_actions.order_number IS 'Execution order within the sequence (1, 2, 3...)';
