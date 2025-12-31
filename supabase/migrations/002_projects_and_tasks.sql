-- Migration: Add Projects and Tasks support
-- This migration adds project and task management with user assignments

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table (tasks belong to projects)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Project assignments (many-to-many)
CREATE TABLE user_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

-- User-Task assignments (many-to-many)
CREATE TABLE user_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, task_id)
);

-- Add default project and task references to users table
ALTER TABLE users 
    ADD COLUMN default_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    ADD COLUMN default_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

-- Add project and task references to tracker_sessions for future expansion
ALTER TABLE tracker_sessions
    ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    ADD COLUMN task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_projects_is_active ON projects(is_active);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_is_active ON tasks(is_active);
CREATE INDEX idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX idx_user_projects_project_id ON user_projects(project_id);
CREATE INDEX idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX idx_user_tasks_task_id ON user_tasks(task_id);
CREATE INDEX idx_users_default_project_id ON users(default_project_id);
CREATE INDEX idx_users_default_task_id ON users(default_task_id);
CREATE INDEX idx_tracker_sessions_project_id ON tracker_sessions(project_id);
CREATE INDEX idx_tracker_sessions_task_id ON tracker_sessions(task_id);

-- Add triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraint to ensure default_task belongs to default_project (if both are set)
CREATE OR REPLACE FUNCTION validate_default_task_project()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.default_task_id IS NOT NULL AND NEW.default_project_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM tasks 
            WHERE id = NEW.default_task_id 
            AND project_id = NEW.default_project_id
        ) THEN
            RAISE EXCEPTION 'Default task must belong to the default project';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER validate_user_default_task_project
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION validate_default_task_project();

