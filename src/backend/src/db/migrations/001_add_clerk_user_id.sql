-- Migration: Add clerk_user_id to users table
-- This links Clerk authentication users to our database users

ALTER TABLE users
ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255) UNIQUE;

-- Create index for fast lookups by clerk_user_id
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);

-- Update: Make email nullable since Clerk might not always provide email
ALTER TABLE users
ALTER COLUMN email DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN users.clerk_user_id IS 'Clerk authentication user ID (e.g., user_2abc123...)';
