-- TechLedger Schema Migration: v1 → v2
-- Adds: Departments, Practice Groups, Action Sequences
-- Run this against your existing database

BEGIN;

-- ============================================================================
-- STEP 1: CREATE NEW TABLES
-- ============================================================================

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    system_id INTEGER REFERENCES systems(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Practice Groups table
CREATE TABLE IF NOT EXISTS practice_groups (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Action Sequences table
CREATE TABLE IF NOT EXISTS action_sequences (
    id SERIAL PRIMARY KEY,
    practice_group_id INTEGER REFERENCES practice_groups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sequence Actions junction table
CREATE TABLE IF NOT EXISTS sequence_actions (
    id SERIAL PRIMARY KEY,
    sequence_id INTEGER REFERENCES action_sequences(id) ON DELETE CASCADE,
    action_id INTEGER REFERENCES actions(id) ON DELETE CASCADE,
    order_number INTEGER NOT NULL,
    notes TEXT,
    UNIQUE(sequence_id, action_id),
    UNIQUE(sequence_id, order_number)
);

-- ============================================================================
-- STEP 2: ALTER EXISTING ACTIONS TABLE
-- ============================================================================

-- Add new columns to actions (if they don't exist)
DO $$ 
BEGIN
    -- Add practice_group_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'actions' AND column_name = 'practice_group_id'
    ) THEN
        ALTER TABLE actions ADD COLUMN practice_group_id INTEGER REFERENCES practice_groups(id) ON DELETE CASCADE;
    END IF;

    -- Add display_order column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'actions' AND column_name = 'display_order'
    ) THEN
        ALTER TABLE actions ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;

    -- Make system_id nullable (for backwards compatibility)
    ALTER TABLE actions ALTER COLUMN system_id DROP NOT NULL;
END $$;

-- Add constraint: action must have at least one parent
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'action_has_parent'
    ) THEN
        ALTER TABLE actions ADD CONSTRAINT action_has_parent 
        CHECK (system_id IS NOT NULL OR practice_group_id IS NOT NULL);
    END IF;
END $$;

-- ============================================================================
-- STEP 3: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_departments_system_id ON departments(system_id);
CREATE INDEX IF NOT EXISTS idx_practice_groups_department_id ON practice_groups(department_id);
CREATE INDEX IF NOT EXISTS idx_actions_practice_group_id ON actions(practice_group_id);
CREATE INDEX IF NOT EXISTS idx_action_sequences_practice_group_id ON action_sequences(practice_group_id);
CREATE INDEX IF NOT EXISTS idx_sequence_actions_sequence_id ON sequence_actions(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_actions_action_id ON sequence_actions(action_id);

-- ============================================================================
-- STEP 4: ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE departments IS 'Organizational sub-units of systems (e.g., Sales, Finance)';
COMMENT ON TABLE practice_groups IS 'Specialized groups within departments (e.g., Accounts Payable)';
COMMENT ON TABLE action_sequences IS 'Ordered workflows/procedures composed of multiple actions';
COMMENT ON TABLE sequence_actions IS 'Junction table linking actions to sequences with order';

COMMENT ON COLUMN actions.practice_group_id IS 'Primary parent - actions belong to practice groups';
COMMENT ON COLUMN actions.system_id IS 'Legacy/optional - for backwards compatibility or direct system actions';

-- ============================================================================
-- STEP 5: VERIFY MIGRATION
-- ============================================================================

-- Check that new tables exist
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_name IN ('departments', 'practice_groups', 'action_sequences', 'sequence_actions')) = 4,
           'Not all new tables were created';
    
    ASSERT (SELECT COUNT(*) FROM information_schema.columns 
            WHERE table_name = 'actions' AND column_name IN ('practice_group_id', 'display_order')) = 2,
           'Actions table not properly updated';
    
    RAISE NOTICE '✅ Migration completed successfully!';
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================

/*
To rollback this migration:

BEGIN;
DROP TABLE IF EXISTS sequence_actions CASCADE;
DROP TABLE IF EXISTS action_sequences CASCADE;
DROP TABLE IF EXISTS practice_groups CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
ALTER TABLE actions DROP COLUMN IF EXISTS practice_group_id;
ALTER TABLE actions DROP COLUMN IF EXISTS display_order;
ALTER TABLE actions DROP CONSTRAINT IF EXISTS action_has_parent;
ALTER TABLE actions ALTER COLUMN system_id SET NOT NULL;
COMMIT;
*/
