-- =====================================================
-- Simple Settings System for MedCure
-- Profile picture, branding name, and logo management
-- =====================================================

-- 1. CREATE SIMPLE SETTINGS TABLE
-- Stores all app settings in a simple key-value format
CREATE TABLE IF NOT EXISTS app_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text',
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE USER PROFILES TABLE (SIMPLIFIED)
-- Just for profile pictures and basic info
CREATE TABLE IF NOT EXISTS user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. INSERT DEFAULT SETTINGS
INSERT INTO app_settings (setting_key, setting_value, setting_type, description) VALUES
('business_name', 'MedCure Pharmacy', 'text', 'Business name shown in sidebar'),
('business_tagline', 'Your Trusted Healthcare Partner', 'text', 'Business tagline'),
('logo_url', '', 'text', 'Logo URL for sidebar'),
('primary_color', '#2563eb', 'color', 'Primary brand color'),
('app_version', '2.1.0', 'text', 'Application version')
ON CONFLICT (setting_key) DO NOTHING;

-- 4. CREATE SIMPLE FUNCTIONS

-- Get all settings
CREATE OR REPLACE FUNCTION get_app_settings()
RETURNS TABLE(
    setting_key VARCHAR,
    setting_value TEXT,
    setting_type VARCHAR,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.setting_key,
        s.setting_value,
        s.setting_type,
        s.description
    FROM app_settings s
    ORDER BY s.setting_key;
END;
$$ LANGUAGE plpgsql;

-- Update setting
CREATE OR REPLACE FUNCTION update_app_setting(
    key_name VARCHAR,
    new_value TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE app_settings 
    SET setting_value = new_value, updated_at = NOW()
    WHERE setting_key = key_name;
    
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        INSERT INTO app_settings (setting_key, setting_value, updated_at)
        VALUES (key_name, new_value, NOW());
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Get user profile
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID)
RETURNS TABLE(
    id BIGINT,
    user_id UUID,
    full_name VARCHAR,
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.user_id,
        up.full_name,
        up.avatar_url
    FROM user_profiles up
    WHERE up.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
    user_uuid UUID,
    name VARCHAR DEFAULT NULL,
    avatar TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    existing_id BIGINT;
BEGIN
    SELECT id INTO existing_id
    FROM user_profiles 
    WHERE user_id = user_uuid;
    
    IF existing_id IS NOT NULL THEN
        UPDATE user_profiles SET
            full_name = COALESCE(name, full_name),
            avatar_url = COALESCE(avatar, avatar_url),
            updated_at = NOW()
        WHERE user_id = user_uuid;
    ELSE
        INSERT INTO user_profiles (user_id, full_name, avatar_url)
        VALUES (user_uuid, name, avatar);
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 5. CREATE SIMPLE TRIGGERS
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_app_settings_timestamp ON app_settings;
CREATE TRIGGER update_app_settings_timestamp
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_user_profiles_timestamp ON user_profiles;
CREATE TRIGGER update_user_profiles_timestamp
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 6. SIMPLE PERMISSIONS
GRANT ALL ON app_settings TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION get_app_settings TO authenticated;
GRANT EXECUTE ON FUNCTION update_app_setting TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_profile TO authenticated;

-- Enable RLS for user profiles only
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Simple settings system created successfully!';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '- Business name and logo management';
    RAISE NOTICE '- User profile pictures';
    RAISE NOTICE '- Simple key-value settings';
END $$;
