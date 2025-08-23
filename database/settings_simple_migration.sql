-- Simplified Settings Tables Migration for MedCure Pharmacy System
-- This version works without authentication dependencies
-- Updated to use UUID for compatibility with enhanced settings service

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clean slate - drop existing tables to avoid conflicts
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS business_settings CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;

-- User Profiles Table (No Auth Dependencies, but UUID compatible)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Using UUID for compatibility
    full_name TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Business Settings Table (No Auth Dependencies, but UUID compatible)
CREATE TABLE business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Using UUID for compatibility
    business_name TEXT DEFAULT 'MedCure Pharmacy',
    logo_url TEXT DEFAULT '',
    tagline TEXT DEFAULT 'Your Trusted Healthcare Partner',
    address TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    primary_color TEXT DEFAULT '#2563eb',
    website TEXT DEFAULT '',
    registration_number TEXT DEFAULT '',
    tax_id TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- App Settings Table (No Auth Dependencies, but UUID compatible)
CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Using UUID for compatibility
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    currency TEXT DEFAULT 'PHP',
    timezone TEXT DEFAULT 'Asia/Manila',
    language TEXT DEFAULT 'en',
    notifications BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    auto_backup BOOLEAN DEFAULT TRUE,
    low_stock_threshold INTEGER DEFAULT 10,
    expiry_warning_days INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_settings_updated_at
    BEFORE UPDATE ON business_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance (this was failing before)
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_business_settings_user_id ON business_settings(user_id);
CREATE INDEX idx_app_settings_user_id ON app_settings(user_id);

-- Insert default settings for demo user (using a proper UUID)
DO $$
DECLARE
    demo_user_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
    -- Insert demo user profile
    INSERT INTO user_profiles (user_id, full_name, avatar_url, phone, address)
    VALUES (demo_user_id, 'Demo User', '', '+63 900 000 0000', 'Manila, Philippines')
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        updated_at = NOW();

    -- Insert demo business settings
    INSERT INTO business_settings (user_id, business_name, tagline, primary_color, address, phone, email)
    VALUES (demo_user_id, 'MedCure Pharmacy', 'Your Trusted Healthcare Partner', '#2563eb', 'Manila, Philippines', '+63 900 000 0000', 'admin@medcure.com')
    ON CONFLICT (user_id) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        tagline = EXCLUDED.tagline,
        primary_color = EXCLUDED.primary_color,
        address = EXCLUDED.address,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        updated_at = NOW();

    -- Insert demo app settings
    INSERT INTO app_settings (user_id, theme, currency, timezone, language, notifications, sound_enabled, auto_backup, low_stock_threshold, expiry_warning_days)
    VALUES (demo_user_id, 'light', 'PHP', 'Asia/Manila', 'en', TRUE, TRUE, TRUE, 10, 30)
    ON CONFLICT (user_id) DO UPDATE SET
        theme = EXCLUDED.theme,
        currency = EXCLUDED.currency,
        timezone = EXCLUDED.timezone,
        language = EXCLUDED.language,
        notifications = EXCLUDED.notifications,
        sound_enabled = EXCLUDED.sound_enabled,
        auto_backup = EXCLUDED.auto_backup,
        low_stock_threshold = EXCLUDED.low_stock_threshold,
        expiry_warning_days = EXCLUDED.expiry_warning_days,
        updated_at = NOW();

    RAISE NOTICE 'Demo data inserted with user_id: %', demo_user_id;
END $$;

-- Add helpful comments
COMMENT ON TABLE user_profiles IS 'User profile information including personal details and avatar';
COMMENT ON TABLE business_settings IS 'Business-specific settings including branding and contact information';
COMMENT ON TABLE app_settings IS 'Application-specific user preferences and system settings';

-- Final verification
DO $$
DECLARE
    user_profiles_count integer;
    business_settings_count integer;
    app_settings_count integer;
BEGIN
    SELECT COUNT(*) INTO user_profiles_count FROM user_profiles;
    SELECT COUNT(*) INTO business_settings_count FROM business_settings;
    SELECT COUNT(*) INTO app_settings_count FROM app_settings;

    RAISE NOTICE 'Settings migration completed successfully!';
    RAISE NOTICE 'Tables created: user_profiles (% rows), business_settings (% rows), app_settings (% rows)', 
                 user_profiles_count, business_settings_count, app_settings_count;
    RAISE NOTICE 'All indexes created successfully';
    RAISE NOTICE 'Demo user UUID: 11111111-1111-1111-1111-111111111111';
    RAISE NOTICE 'Your settings should now persist properly!';
END $$;

-- Verification queries (uncomment to test)
/*
SELECT 'User Profiles' as table_name, count(*) as records FROM user_profiles
UNION ALL
SELECT 'Business Settings' as table_name, count(*) as records FROM business_settings
UNION ALL
SELECT 'App Settings' as table_name, count(*) as records FROM app_settings;

-- Test data verification
SELECT 'Demo user profile exists' as check_name, 
       CASE WHEN EXISTS(SELECT 1 FROM user_profiles WHERE user_id = '11111111-1111-1111-1111-111111111111') 
            THEN '✅ PASS' ELSE '❌ FAIL' END as status
UNION ALL
SELECT 'Demo business settings exist' as check_name,
       CASE WHEN EXISTS(SELECT 1 FROM business_settings WHERE user_id = '11111111-1111-1111-1111-111111111111') 
            THEN '✅ PASS' ELSE '❌ FAIL' END as status
UNION ALL
SELECT 'Demo app settings exist' as check_name,
       CASE WHEN EXISTS(SELECT 1 FROM app_settings WHERE user_id = '11111111-1111-1111-1111-111111111111') 
            THEN '✅ PASS' ELSE '❌ FAIL' END as status;
*/
