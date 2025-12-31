-- Migration: Remove default_project_id and default_task_id from users table
-- This migration removes the default project/task columns from users table
-- as defaults are now fetched from assigned projects/tasks only

-- Drop the trigger that validates default_task belongs to default_project
DROP TRIGGER IF EXISTS validate_user_default_task_project ON users;

-- Drop the function that validates default_task belongs to default_project
DROP FUNCTION IF EXISTS validate_default_task_project();

-- Drop indexes for default_project_id and default_task_id
DROP INDEX IF EXISTS idx_users_default_project_id;
DROP INDEX IF EXISTS idx_users_default_task_id;

-- Drop foreign key constraints (they will be dropped automatically when columns are dropped)
-- But we'll explicitly handle them to be safe

-- Remove the columns from users table
ALTER TABLE users 
    DROP COLUMN IF EXISTS default_project_id,
    DROP COLUMN IF EXISTS default_task_id;

-- Note: The tracker_sessions table already has project_id and task_id columns
-- which are used to track which project/task a session belongs to.
-- These columns remain in tracker_sessions and are required for session tracking.

