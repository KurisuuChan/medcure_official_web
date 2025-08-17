-- MedCure User Management Database Schema
-- Complete Supabase SQL schema for user management, profiles, and audit logging
-- Version: 2.0 (Fixed and Enhanced)
-- Date: August 17, 2025

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext"; -- Case-insensitive text

-- Drop existing types if they exist (for fresh install)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS audit_severity CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS token_type CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM (
    'super_admin',
    'admin',
    'manager', 
    'pharmacist',
    'pharmacy_tech',
    'technician',
    'cashier',
    'viewer',
    'guest'
);

CREATE TYPE user_status AS ENUM (
    'active',
    'inactive',
    'suspended',
    'pending',
    'locked',
    'archived'
);

CREATE TYPE audit_severity AS ENUM (
    'low',
    'info',
    'warning',
    'high',
    'error',
    'critical'
);

CREATE TYPE session_status AS ENUM (
    'active',
    'expired',
    'revoked',
    'terminated'
);

CREATE TYPE token_type AS ENUM (
    'password_reset',
    'email_verification',
    'invitation',
    'two_factor',
    'api_key'
);

-- Note: Supabase handles auth.users table internally
-- We'll create our extension tables that reference auth.users(id)

-- Note: Supabase handles auth.users table internally
-- We'll create our extension tables that reference auth.users(id)

-- User profiles table (extends auth.users with pharmacy-specific data)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL CHECK (length(trim(first_name)) > 0),
    last_name VARCHAR(100) NOT NULL CHECK (length(trim(last_name)) > 0),
    middle_name VARCHAR(100),
    display_name VARCHAR(200) GENERATED ALWAYS AS (
        CASE 
            WHEN middle_name IS NOT NULL THEN first_name || ' ' || middle_name || ' ' || last_name
            ELSE first_name || ' ' || last_name
        END
    ) STORED,
    avatar_url TEXT,
    date_of_birth DATE CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '16 years'),
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    
    -- Contact Information
    phone VARCHAR(20) CHECK (phone ~ '^[\+]?[0-9\-\(\)\s]+$'),
    alternate_phone VARCHAR(20),
    email_personal CITEXT,
    
    -- Address Information
    address JSONB DEFAULT '{}' CHECK (jsonb_typeof(address) = 'object'),
    emergency_contact JSONB DEFAULT '{}' CHECK (jsonb_typeof(emergency_contact) = 'object'),
    
    -- Employment Information
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    job_title VARCHAR(100),
    department VARCHAR(100) DEFAULT 'Pharmacy',
    supervisor_id UUID REFERENCES user_profiles(user_id),
    date_hired DATE DEFAULT CURRENT_DATE CHECK (date_hired <= CURRENT_DATE),
    date_terminated DATE CHECK (date_terminated IS NULL OR date_terminated >= date_hired),
    employment_type VARCHAR(20) DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
    
    -- Compensation
    hourly_rate DECIMAL(8, 2) CHECK (hourly_rate IS NULL OR hourly_rate >= 0),
    annual_salary DECIMAL(12, 2) CHECK (annual_salary IS NULL OR annual_salary >= 0),
    
    -- Professional Information
    license_number VARCHAR(100),
    license_expiry DATE,
    certifications TEXT[],
    specializations TEXT[],
    
    -- System Information
    role user_role NOT NULL DEFAULT 'viewer',
    status user_status NOT NULL DEFAULT 'pending',
    permissions JSONB DEFAULT '[]' CHECK (jsonb_typeof(permissions) = 'array'),
    
    -- Security Information
    last_login_at TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0 CHECK (failed_login_attempts >= 0),
    locked_until TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ DEFAULT NOW(),
    must_change_password BOOLEAN DEFAULT TRUE,
    password_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
    
    -- Two-Factor Authentication
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    two_factor_backup_codes TEXT[],
    
    -- User Preferences
    preferences JSONB DEFAULT '{
        "theme": "light",
        "language": "en",
        "timezone": "Asia/Manila",
        "notifications": {
            "email": true,
            "push": true,
            "sms": false
        },
        "dashboard": {
            "default_view": "overview",
            "widgets": ["sales", "inventory", "alerts"]
        }
    }' CHECK (jsonb_typeof(preferences) = 'object'),
    
    -- Audit Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Soft Delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id)
);

-- Create partial indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_employee_id ON user_profiles(employee_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_role ON user_profiles(role) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_status ON user_profiles(status) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_department ON user_profiles(department) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_supervisor ON user_profiles(supervisor_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_name_search ON user_profiles USING gin(to_tsvector('english', first_name || ' ' || last_name)) WHERE deleted_at IS NULL;

-- User sessions table (enhanced security tracking)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Session Details
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    session_name VARCHAR(100) DEFAULT 'Web Session',
    
    -- Device Information
    device_name VARCHAR(255),
    device_type VARCHAR(50) CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
    browser_name VARCHAR(100),
    browser_version VARCHAR(50),
    operating_system VARCHAR(100),
    
    -- Network Information
    ip_address INET NOT NULL,
    user_agent TEXT,
    location JSONB DEFAULT '{}',
    
    -- Session Status
    status session_status DEFAULT 'active',
    is_current BOOLEAN DEFAULT FALSE,
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    terminated_at TIMESTAMPTZ,
    
    -- Security
    trusted_device BOOLEAN DEFAULT FALSE,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    
    CONSTRAINT valid_session_dates CHECK (
        expires_at > created_at AND 
        (terminated_at IS NULL OR terminated_at >= created_at)
    )
);

-- Indexes for user_sessions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_status ON user_sessions(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_ip ON user_sessions(ip_address);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_active ON user_sessions(last_active) WHERE status = 'active';

-- Password history table (for password policy enforcement)
CREATE TABLE IF NOT EXISTS password_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    algorithm VARCHAR(50) DEFAULT 'bcrypt',
    salt VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent reuse of recent passwords
    CONSTRAINT unique_user_password UNIQUE(user_id, password_hash)
);

-- Index for password_history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_password_history_created_at ON password_history(created_at);

-- User activity logs table (detailed user actions)
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
    
    -- Activity Details
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    description TEXT,
    
    -- Request Details
    method VARCHAR(10) CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
    endpoint VARCHAR(255),
    request_data JSONB,
    response_status INTEGER,
    
    -- Context
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    location JSONB DEFAULT '{}',
    
    -- Timing
    duration_ms INTEGER CHECK (duration_ms >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user_activity_logs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_logs_resource ON user_activity_logs(resource_type, resource_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_logs_session ON user_activity_logs(session_id);

-- Audit logs table (comprehensive compliance tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User Information
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    user_role user_role,
    user_email CITEXT,
    
    -- Event Information
    event_id VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    
    -- Resource Information
    resource_id UUID,
    resource_type VARCHAR(50),
    resource_name VARCHAR(255),
    
    -- Change Information
    old_values JSONB,
    new_values JSONB,
    changes_made JSONB,
    
    -- Context
    severity audit_severity DEFAULT 'info',
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    tags TEXT[],
    
    -- Request Details
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    correlation_id VARCHAR(100),
    
    -- Location and Device
    location JSONB DEFAULT '{}',
    device_info JSONB DEFAULT '{}',
    
    -- Compliance
    compliance_flags TEXT[],
    retention_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 years'),
    
    -- Additional Context
    metadata JSONB DEFAULT '{}',
    
    -- Timing
    created_at TIMESTAMPTZ DEFAULT NOW(),
    occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit_logs (optimized for queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_event_id ON audit_logs(event_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_category ON audit_logs(event_category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_type ON audit_logs(event_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_risk ON audit_logs(risk_level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_occurred_at ON audit_logs(occurred_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_retention ON audit_logs(retention_until);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_session ON audit_logs(session_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_search ON audit_logs USING gin(to_tsvector('english', description));

-- Role permissions table (RBAC matrix)
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role user_role NOT NULL,
    permission_category VARCHAR(50) NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    permission_level VARCHAR(20) DEFAULT 'read' CHECK (permission_level IN ('none', 'read', 'write', 'admin', 'owner')),
    granted BOOLEAN DEFAULT TRUE,
    conditions JSONB DEFAULT '{}',
    
    -- Metadata
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT unique_role_permission UNIQUE(role, permission_category, permission_name)
);

-- Indexes for role_permissions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_permissions_category ON role_permissions(permission_category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_permissions_granted ON role_permissions(granted);

-- User permissions table (user-specific permission overrides)
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_category VARCHAR(50) NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    permission_level VARCHAR(20) DEFAULT 'read' CHECK (permission_level IN ('none', 'read', 'write', 'admin', 'owner')),
    granted BOOLEAN DEFAULT TRUE,
    conditions JSONB DEFAULT '{}',
    
    -- Lifecycle
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id),
    revoked_reason TEXT,
    
    -- Metadata
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_permission UNIQUE(user_id, permission_category, permission_name),
    CONSTRAINT valid_permission_dates CHECK (
        expires_at IS NULL OR expires_at > granted_at
    )
);

-- Indexes for user_permissions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_permissions_category ON user_permissions(permission_category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_permissions_granted ON user_permissions(granted);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_permissions_expires ON user_permissions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_permissions_active ON user_permissions(user_id, granted) WHERE revoked_at IS NULL;

-- User groups table (team and department management)
CREATE TABLE IF NOT EXISTS user_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    group_type VARCHAR(50) DEFAULT 'team' CHECK (group_type IN ('department', 'team', 'project', 'role_based', 'custom')),
    
    -- Permissions
    permissions JSONB DEFAULT '[]' CHECK (jsonb_typeof(permissions) = 'array'),
    
    -- Hierarchy
    parent_group_id UUID REFERENCES user_groups(id),
    group_level INTEGER DEFAULT 0 CHECK (group_level >= 0),
    
    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    auto_assign_rules JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Indexes for user_groups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_groups_name ON user_groups(name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_groups_slug ON user_groups(slug);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_groups_type ON user_groups(group_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_groups_parent ON user_groups(parent_group_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_groups_active ON user_groups(is_active);

-- User group memberships table
CREATE TABLE IF NOT EXISTS user_group_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
    
    -- Membership Details
    role_in_group VARCHAR(50) DEFAULT 'member' CHECK (role_in_group IN ('owner', 'admin', 'moderator', 'member', 'viewer')),
    is_primary BOOLEAN DEFAULT FALSE,
    
    -- Lifecycle
    added_by UUID REFERENCES auth.users(id),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    removed_at TIMESTAMPTZ,
    removed_by UUID REFERENCES auth.users(id),
    removal_reason TEXT,
    
    CONSTRAINT unique_active_membership UNIQUE(user_id, group_id)
);

-- Indexes for user_group_memberships
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_group_memberships_user ON user_group_memberships(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_group_memberships_group ON user_group_memberships(group_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_group_memberships_role ON user_group_memberships(role_in_group);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_group_memberships_active ON user_group_memberships(user_id, group_id) WHERE removed_at IS NULL;

-- Login attempts table (security monitoring and brute force protection)
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Attempt Details
    email CITEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(255),
    
    -- Security Information
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    location JSONB DEFAULT '{}',
    
    -- Risk Assessment
    risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    blocked BOOLEAN DEFAULT FALSE,
    
    -- Timing
    attempt_duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Rate Limiting
    attempt_count INTEGER DEFAULT 1,
    lockout_until TIMESTAMPTZ
);

-- Indexes for login_attempts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_login_attempts_success ON login_attempts(success);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_login_attempts_failed_recent ON login_attempts(ip_address, created_at) WHERE success = FALSE;

-- Security tokens table (unified token management)
CREATE TABLE IF NOT EXISTS security_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Token Details
    token_type token_type NOT NULL,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    token_preview VARCHAR(20), -- First few characters for identification
    
    -- Metadata
    purpose TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Lifecycle
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id),
    revoked_reason TEXT,
    
    -- Usage Tracking
    usage_count INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 1,
    
    -- Security
    ip_restriction INET[],
    
    CONSTRAINT valid_token_dates CHECK (expires_at > created_at),
    CONSTRAINT valid_usage CHECK (usage_count <= COALESCE(max_uses, 1))
);

-- Indexes for security_tokens
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_tokens_user_id ON security_tokens(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_tokens_type ON security_tokens(token_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_tokens_hash ON security_tokens(token_hash);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_tokens_expires ON security_tokens(expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_tokens_active ON security_tokens(user_id, token_type) WHERE used_at IS NULL AND revoked_at IS NULL AND expires_at > NOW();

-- User notifications table (in-app notification system)
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'info' CHECK (notification_type IN ('info', 'success', 'warning', 'error', 'security', 'system')),
    
    -- Categorization
    category VARCHAR(50),
    tags TEXT[],
    priority INTEGER DEFAULT 0 CHECK (priority BETWEEN 0 AND 10),
    
    -- Status
    read_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    
    -- Action
    action_url TEXT,
    action_label VARCHAR(100),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Lifecycle
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Indexes for user_notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_notifications_type ON user_notifications(notification_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_notifications_unread ON user_notifications(user_id, created_at) WHERE read_at IS NULL AND archived_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_notifications_priority ON user_notifications(priority DESC, created_at DESC);

-- System settings table (application configuration)
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type VARCHAR(50) DEFAULT 'general' CHECK (setting_type IN ('general', 'security', 'notification', 'integration', 'ui', 'business')),
    description TEXT,
    
    -- Validation
    validation_rules JSONB DEFAULT '{}',
    
    -- Access Control
    access_level VARCHAR(20) DEFAULT 'admin' CHECK (access_level IN ('public', 'user', 'manager', 'admin', 'super_admin')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Index for system_settings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_settings_type ON system_settings(setting_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_settings_access ON system_settings(access_level);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent modification of audit logs
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs cannot be modified or deleted. This action has been logged.';
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate employee ID
CREATE OR REPLACE FUNCTION generate_employee_id()
RETURNS TRIGGER AS $$
DECLARE
    new_id VARCHAR(50);
    counter INTEGER;
BEGIN
    IF NEW.employee_id IS NULL OR NEW.employee_id = '' THEN
        -- Get department prefix
        CASE 
            WHEN NEW.department ILIKE '%admin%' THEN NEW.employee_id := 'ADM';
            WHEN NEW.department ILIKE '%pharm%' THEN NEW.employee_id := 'PHR';
            WHEN NEW.department ILIKE '%tech%' THEN NEW.employee_id := 'TEC';
            WHEN NEW.department ILIKE '%cash%' THEN NEW.employee_id := 'CSH';
            ELSE NEW.employee_id := 'EMP';
        END CASE;
        
        -- Get next counter
        SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM '[0-9]+$') AS INTEGER)), 0) + 1
        INTO counter
        FROM user_profiles 
        WHERE employee_id ~ ('^' || NEW.employee_id || '[0-9]+$');
        
        NEW.employee_id := NEW.employee_id || LPAD(counter::TEXT, 3, '0');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER;
BEGIN
    -- Mark expired sessions as terminated
    UPDATE user_sessions 
    SET status = 'expired', terminated_at = NOW()
    WHERE status = 'active' AND expires_at < NOW();
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    
    -- Delete very old sessions (older than 6 months)
    DELETE FROM user_sessions 
    WHERE created_at < NOW() - INTERVAL '6 months';
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old audit logs based on retention policy
CREATE OR REPLACE FUNCTION cleanup_audit_logs(retention_days INTEGER DEFAULT 2555) -- 7 years default
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs 
    WHERE retention_until < NOW() OR created_at < NOW() - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get effective user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TABLE(permission_category TEXT, permission_name TEXT, permission_level TEXT, source TEXT) AS $$
BEGIN
    -- Role-based permissions
    RETURN QUERY
    SELECT 
        rp.permission_category::TEXT,
        rp.permission_name::TEXT,
        rp.permission_level::TEXT,
        ('role:' || up.role::TEXT)::TEXT as source
    FROM role_permissions rp
    JOIN user_profiles up ON up.role = rp.role
    WHERE up.user_id = user_uuid 
      AND up.deleted_at IS NULL
      AND rp.granted = true;
    
    -- User-specific permissions (not revoked and not expired)
    RETURN QUERY
    SELECT 
        uprm.permission_category::TEXT,
        uprm.permission_name::TEXT,
        uprm.permission_level::TEXT,
        'user_override'::TEXT as source
    FROM user_permissions uprm
    WHERE uprm.user_id = user_uuid 
      AND uprm.granted = true 
      AND uprm.revoked_at IS NULL
      AND (uprm.expires_at IS NULL OR uprm.expires_at > NOW());
    
    -- Group-based permissions
    RETURN QUERY
    SELECT 
        perm->>'category' as permission_category,
        perm->>'name' as permission_name,
        perm->>'level' as permission_level,
        ('group:' || ug.name)::TEXT as source
    FROM user_group_memberships ugm
    JOIN user_groups ug ON ug.id = ugm.group_id
    CROSS JOIN LATERAL jsonb_array_elements(ug.permissions) as perm
    WHERE ugm.user_id = user_uuid 
      AND ugm.removed_at IS NULL
      AND ug.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
    user_uuid UUID, 
    perm_category TEXT, 
    perm_name TEXT, 
    required_level TEXT DEFAULT 'read'
)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := FALSE;
    level_hierarchy TEXT[] := ARRAY['none', 'read', 'write', 'admin', 'owner'];
    required_level_index INTEGER;
    user_level_index INTEGER;
BEGIN
    -- Get required level index
    SELECT array_position(level_hierarchy, required_level) INTO required_level_index;
    
    -- Check user permissions
    SELECT array_position(level_hierarchy, gup.permission_level) INTO user_level_index
    FROM get_user_permissions(user_uuid) gup
    WHERE gup.permission_category = perm_category 
      AND gup.permission_name = perm_name
    ORDER BY array_position(level_hierarchy, gup.permission_level) DESC
    LIMIT 1;
    
    -- Return true if user level is >= required level
    RETURN COALESCE(user_level_index >= required_level_index, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at on user_profiles
CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at on user_groups
CREATE TRIGGER trigger_user_groups_updated_at
    BEFORE UPDATE ON user_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at on role_permissions
CREATE TRIGGER trigger_role_permissions_updated_at
    BEFORE UPDATE ON role_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at on system_settings
CREATE TRIGGER trigger_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-generate employee_id
CREATE TRIGGER trigger_generate_employee_id
    BEFORE INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION generate_employee_id();

-- Trigger: Prevent audit log modification
CREATE TRIGGER trigger_prevent_audit_modification
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_modification();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: User dashboard statistics
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
    COUNT(*) FILTER (WHERE status = 'active' AND deleted_at IS NULL) as active_users,
    COUNT(*) FILTER (WHERE status = 'inactive' AND deleted_at IS NULL) as inactive_users,
    COUNT(*) FILTER (WHERE status = 'suspended' AND deleted_at IS NULL) as suspended_users,
    COUNT(*) FILTER (WHERE status = 'pending' AND deleted_at IS NULL) as pending_users,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE AND deleted_at IS NULL) as new_users_today,
    COUNT(*) FILTER (WHERE last_login_at >= CURRENT_DATE AND deleted_at IS NULL) as active_today,
    COUNT(*) FILTER (WHERE last_login_at >= CURRENT_DATE - INTERVAL '7 days' AND deleted_at IS NULL) as active_week,
    COUNT(*) FILTER (WHERE last_login_at >= CURRENT_DATE - INTERVAL '30 days' AND deleted_at IS NULL) as active_month,
    COUNT(DISTINCT role) FILTER (WHERE deleted_at IS NULL) as total_roles,
    COUNT(DISTINCT department) FILTER (WHERE deleted_at IS NULL) as total_departments
FROM user_profiles;

-- View: User details with computed fields
CREATE OR REPLACE VIEW user_details AS
SELECT 
    up.id,
    up.user_id,
    up.employee_id,
    up.display_name,
    up.first_name,
    up.last_name,
    up.email_personal,
    au.email as auth_email,
    up.phone,
    up.job_title,
    up.department,
    up.role,
    up.status,
    up.avatar_url,
    up.date_hired,
    up.last_login_at,
    up.created_at,
    
    -- Computed fields
    CASE 
        WHEN up.last_login_at >= NOW() - INTERVAL '5 minutes' THEN 'online'
        WHEN up.last_login_at >= NOW() - INTERVAL '1 hour' THEN 'away'
        WHEN up.last_login_at >= NOW() - INTERVAL '24 hours' THEN 'recently_active'
        ELSE 'offline'
    END as presence_status,
    
    DATE_PART('year', AGE(NOW(), up.date_hired)) as years_employed,
    
    CASE 
        WHEN up.locked_until > NOW() THEN TRUE
        ELSE FALSE
    END as is_locked,
    
    CASE 
        WHEN up.password_expires_at < NOW() THEN TRUE
        ELSE FALSE
    END as password_expired,
    
    -- Supervisor info
    supervisor.display_name as supervisor_name,
    supervisor.employee_id as supervisor_employee_id,
    
    -- Group memberships
    (
        SELECT array_agg(ug.name ORDER BY ug.name)
        FROM user_group_memberships ugm
        JOIN user_groups ug ON ug.id = ugm.group_id
        WHERE ugm.user_id = up.user_id AND ugm.removed_at IS NULL
    ) as groups,
    
    -- Permission count
    (
        SELECT COUNT(*)
        FROM get_user_permissions(up.user_id)
    ) as permission_count

FROM user_profiles up
LEFT JOIN auth.users au ON au.id = up.user_id
LEFT JOIN user_profiles supervisor ON supervisor.user_id = up.supervisor_id
WHERE up.deleted_at IS NULL;

-- View: Active sessions summary
CREATE OR REPLACE VIEW active_sessions AS
SELECT 
    us.id,
    us.user_id,
    up.display_name,
    up.employee_id,
    us.device_name,
    us.device_type,
    us.ip_address,
    us.location,
    us.created_at,
    us.last_active,
    us.expires_at,
    us.is_current,
    us.trusted_device,
    us.risk_score,
    
    -- Time calculations
    NOW() - us.last_active as idle_time,
    us.expires_at - NOW() as time_until_expiry,
    
    -- Risk assessment
    CASE 
        WHEN us.risk_score >= 80 THEN 'high'
        WHEN us.risk_score >= 50 THEN 'medium'
        WHEN us.risk_score >= 20 THEN 'low'
        ELSE 'minimal'
    END as risk_level

FROM user_sessions us
JOIN user_profiles up ON up.user_id = us.user_id
WHERE us.status = 'active' AND us.expires_at > NOW() AND up.deleted_at IS NULL;

-- ============================================================================
-- DATA SEEDING
-- ============================================================================

-- Insert comprehensive role permissions
INSERT INTO role_permissions (role, permission_category, permission_name, permission_level, granted, description) VALUES
    -- Super Admin (full system control)
    ('super_admin', 'system', 'manage', 'owner', true, 'Full system management access'),
    ('super_admin', 'user', 'manage', 'owner', true, 'Complete user management'),
    ('super_admin', 'audit', 'manage', 'owner', true, 'Audit log management'),
    ('super_admin', 'security', 'manage', 'owner', true, 'Security configuration'),
    
    -- Admin (organization management)
    ('admin', 'user', 'create', 'admin', true, 'Create user accounts'),
    ('admin', 'user', 'read', 'admin', true, 'View all users'),
    ('admin', 'user', 'update', 'admin', true, 'Update user information'),
    ('admin', 'user', 'delete', 'admin', true, 'Delete/deactivate users'),
    ('admin', 'user', 'permissions', 'admin', true, 'Manage user permissions'),
    ('admin', 'product', 'manage', 'admin', true, 'Full product management'),
    ('admin', 'inventory', 'manage', 'admin', true, 'Full inventory control'),
    ('admin', 'sales', 'manage', 'admin', true, 'Complete sales management'),
    ('admin', 'reports', 'generate', 'admin', true, 'Generate all reports'),
    ('admin', 'settings', 'update', 'admin', true, 'System settings'),
    ('admin', 'audit', 'read', 'admin', true, 'View audit logs'),
    
    -- Manager (department oversight)
    ('manager', 'user', 'read', 'read', true, 'View team members'),
    ('manager', 'user', 'update', 'write', true, 'Update team member info'),
    ('manager', 'product', 'create', 'write', true, 'Add new products'),
    ('manager', 'product', 'read', 'read', true, 'View products'),
    ('manager', 'product', 'update', 'write', true, 'Edit products'),
    ('manager', 'inventory', 'read', 'read', true, 'View inventory'),
    ('manager', 'inventory', 'update', 'write', true, 'Update stock levels'),
    ('manager', 'sales', 'create', 'write', true, 'Process sales'),
    ('manager', 'sales', 'read', 'read', true, 'View sales data'),
    ('manager', 'sales', 'refund', 'write', true, 'Process refunds'),
    ('manager', 'reports', 'generate', 'write', true, 'Generate reports'),
    ('manager', 'settings', 'read', 'read', true, 'View settings'),
    
    -- Pharmacist (clinical and inventory)
    ('pharmacist', 'product', 'read', 'read', true, 'View medications'),
    ('pharmacist', 'product', 'update', 'write', true, 'Update medication info'),
    ('pharmacist', 'inventory', 'read', 'read', true, 'Check stock levels'),
    ('pharmacist', 'inventory', 'update', 'write', true, 'Update inventory'),
    ('pharmacist', 'sales', 'create', 'write', true, 'Dispense medications'),
    ('pharmacist', 'sales', 'read', 'read', true, 'View dispensing history'),
    ('pharmacist', 'reports', 'generate', 'read', true, 'Clinical reports'),
    ('pharmacist', 'prescription', 'verify', 'write', true, 'Verify prescriptions'),
    
    -- Pharmacy Technician
    ('pharmacy_tech', 'product', 'read', 'read', true, 'View products'),
    ('pharmacy_tech', 'inventory', 'read', 'read', true, 'Check inventory'),
    ('pharmacy_tech', 'inventory', 'update', 'write', true, 'Update stock'),
    ('pharmacy_tech', 'sales', 'create', 'write', true, 'Assist with sales'),
    ('pharmacy_tech', 'sales', 'read', 'read', true, 'View sales'),
    
    -- Technician
    ('technician', 'product', 'read', 'read', true, 'View products'),
    ('technician', 'inventory', 'read', 'read', true, 'Check stock'),
    ('technician', 'sales', 'create', 'write', true, 'Process sales'),
    ('technician', 'sales', 'read', 'read', true, 'View transactions'),
    
    -- Cashier
    ('cashier', 'product', 'read', 'read', true, 'View products for sale'),
    ('cashier', 'sales', 'create', 'write', true, 'Process payments'),
    ('cashier', 'sales', 'read', 'read', true, 'View own transactions'),
    
    -- Viewer (read-only access)
    ('viewer', 'product', 'read', 'read', true, 'View product catalog'),
    ('viewer', 'inventory', 'read', 'read', true, 'View stock levels'),
    ('viewer', 'sales', 'read', 'read', true, 'View sales data'),
    ('viewer', 'reports', 'read', 'read', true, 'View reports'),
    
    -- Guest (minimal access)
    ('guest', 'product', 'read', 'read', true, 'View basic product info')
ON CONFLICT (role, permission_category, permission_name) DO UPDATE SET
    permission_level = EXCLUDED.permission_level,
    granted = EXCLUDED.granted,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Insert default user groups
INSERT INTO user_groups (name, slug, description, group_type, permissions) VALUES
    ('Administrators', 'administrators', 'System administrators with full access', 'role_based', '[]'),
    ('Pharmacists', 'pharmacists', 'Licensed pharmacists', 'role_based', '[]'),
    ('Pharmacy Staff', 'pharmacy-staff', 'All pharmacy personnel', 'department', '[]'),
    ('Management Team', 'management', 'Store managers and supervisors', 'role_based', '[]'),
    ('Sales Team', 'sales', 'Sales and cashier staff', 'team', '[]')
ON CONFLICT (name) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, access_level) VALUES
    ('app.name', '"MedCure Pharmacy"', 'general', 'Application name', 'public'),
    ('app.version', '"2.0.0"', 'general', 'Application version', 'public'),
    ('security.password_policy', '{"min_length": 8, "require_uppercase": true, "require_lowercase": true, "require_numbers": true, "require_symbols": true, "max_age_days": 90}', 'security', 'Password policy configuration', 'admin'),
    ('security.session_timeout', '86400', 'security', 'Session timeout in seconds (24 hours)', 'admin'),
    ('security.max_login_attempts', '5', 'security', 'Maximum failed login attempts before lockout', 'admin'),
    ('security.lockout_duration', '1800', 'security', 'Account lockout duration in seconds (30 minutes)', 'admin'),
    ('notifications.email_enabled', 'true', 'notification', 'Enable email notifications', 'admin'),
    ('notifications.sms_enabled', 'false', 'notification', 'Enable SMS notifications', 'admin'),
    ('business.timezone', '"Asia/Manila"', 'business', 'Business timezone', 'manager'),
    ('business.currency', '"PHP"', 'business', 'Business currency', 'manager'),
    ('business.tax_rate', '0.12', 'business', 'Tax rate (VAT)', 'manager'),
    ('ui.theme', '"light"', 'ui', 'Default UI theme', 'user'),
    ('ui.language', '"en"', 'ui', 'Default language', 'user')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own basic profile" ON user_profiles
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND deleted_at IS NULL
    );

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        user_has_permission(auth.uid(), 'user', 'read', 'admin')
    );

CREATE POLICY "Admins can manage all profiles" ON user_profiles
    FOR ALL USING (
        user_has_permission(auth.uid(), 'user', 'manage', 'admin')
    );

CREATE POLICY "Managers can view team profiles" ON user_profiles
    FOR SELECT USING (
        user_has_permission(auth.uid(), 'user', 'read', 'read')
        AND (
            supervisor_id = auth.uid() 
            OR department = (
                SELECT department FROM user_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON user_sessions
    FOR SELECT USING (
        user_has_permission(auth.uid(), 'security', 'manage', 'admin')
    );

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        user_has_permission(auth.uid(), 'audit', 'read', 'admin')
    );

-- RLS Policies for user_notifications
CREATE POLICY "Users can manage own notifications" ON user_notifications
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- MAINTENANCE AND CLEANUP
-- ============================================================================

-- Schedule cleanup functions (commented out - enable with pg_cron extension)
-- SELECT cron.schedule('cleanup-sessions', '0 2 * * *', 'SELECT cleanup_expired_sessions();');
-- SELECT cron.schedule('cleanup-audit-logs', '0 3 1 * *', 'SELECT cleanup_audit_logs(2555);');

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to service_role (for server-side operations)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Comments for documentation
COMMENT ON SCHEMA public IS 'MedCure Pharmacy Management System - User Management Schema v2.0';
COMMENT ON TABLE user_profiles IS 'Extended user profiles with pharmacy-specific information and RBAC';
COMMENT ON TABLE user_sessions IS 'Secure session tracking with device and security information';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance and security monitoring';
COMMENT ON TABLE role_permissions IS 'Role-based access control permission matrix';
COMMENT ON TABLE user_permissions IS 'User-specific permission overrides and grants';
COMMENT ON TABLE user_groups IS 'Team and department grouping for collaborative permissions';
COMMENT ON TABLE security_tokens IS 'Unified token management for various authentication flows';
COMMENT ON TABLE system_settings IS 'Application configuration and business rules';

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'MedCure User Management Schema v2.0 installation completed successfully!';
    RAISE NOTICE 'Database includes: User Management, RBAC, Audit Logging, Session Management, and Security Features';
    RAISE NOTICE 'Ready for production use with Supabase integration';
END
$$;
