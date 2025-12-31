-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (replaces TbaUserAdmin)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    account_non_locked BOOLEAN DEFAULT true,
    profile_id INTEGER,
    company_id INTEGER;
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Sessions table (replaces UserSession)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    client_type VARCHAR(50) DEFAULT 'web',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracker Sessions table (replaces TrackerSession)
CREATE TABLE tracker_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_status VARCHAR(50) DEFAULT 'ACTIVE',
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    total_duration BIGINT DEFAULT 0,
    active_duration BIGINT DEFAULT 0,
    idle_duration BIGINT DEFAULT 0,
    logout_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracker Activity Logs table (replaces TrackerActivityLog)
CREATE TABLE tracker_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES tracker_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50),
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracker Screenshots table (replaces TrackerScreenshot)
CREATE TABLE tracker_screenshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES tracker_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT,
    image_data BYTEA,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracker Pauses table (replaces TrackerPause)
CREATE TABLE tracker_pauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES tracker_sessions(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration BIGINT DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracker Idle Events table (replaces TrackerIdleEvent)
CREATE TABLE tracker_idle_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES tracker_sessions(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Movements table (replaces UserMovements)
CREATE TABLE user_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    movement_type VARCHAR(255),
    description TEXT,
    ip_address VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Notifications table (replaces SystemNotification)
CREATE TABLE system_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    profile_id INTEGER,
    message TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_tracker_sessions_user_id ON tracker_sessions(user_id);
CREATE INDEX idx_tracker_sessions_start_time ON tracker_sessions(start_time);
CREATE INDEX idx_tracker_activity_logs_session_id ON tracker_activity_logs(session_id);
CREATE INDEX idx_tracker_activity_logs_user_id ON tracker_activity_logs(user_id);
CREATE INDEX idx_tracker_screenshots_session_id ON tracker_screenshots(session_id);
CREATE INDEX idx_tracker_screenshots_user_id ON tracker_screenshots(user_id);
CREATE INDEX idx_tracker_screenshots_captured_at ON tracker_screenshots(captured_at);
CREATE INDEX idx_tracker_pauses_session_id ON tracker_pauses(session_id);
CREATE INDEX idx_tracker_idle_events_session_id ON tracker_idle_events(session_id);
CREATE INDEX idx_user_movements_user_id ON user_movements(user_id);
CREATE INDEX idx_system_notifications_user_id ON system_notifications(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracker_sessions_updated_at BEFORE UPDATE ON tracker_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

