-- Settings Tables Migration for MedCure Pharmacy System
-- Creates necessary tables for user profiles, business settings, and app settings

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Made nullable and removed foreign key constraint for demo mode
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Business Settings Table
CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Made nullable and removed foreign key constraint for demo mode
    business_name TEXT DEFAULT 'MedCure Pharmacy',
    logo_url TEXT,
    tagline TEXT DEFAULT 'Your Trusted Healthcare Partner',
    address TEXT,
    phone TEXT,
    email TEXT,
    primary_color TEXT DEFAULT '#2563eb',
    website TEXT,
    registration_number TEXT,
    tax_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- App Settings Table
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Made nullable and removed foreign key constraint for demo mode
    theme TEXT DEFAULT 'light',
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
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_settings_updated_at ON business_settings;
CREATE TRIGGER update_business_settings_updated_at
    BEFORE UPDATE ON business_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies (Optional - only enable if using Supabase Auth)
-- Comment out these policies if running without authentication
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies (Optional - uncomment if using Supabase Auth)
-- CREATE POLICY "Users can view own profile" ON user_profiles
--     FOR SELECT USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert own profile" ON user_profiles
--     FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can update own profile" ON user_profiles
--     FOR UPDATE USING (auth.uid() = user_id);

-- Business Settings Policies (Optional - uncomment if using Supabase Auth)
-- CREATE POLICY "Users can view own business settings" ON business_settings
--     FOR SELECT USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert own business settings" ON business_settings
--     FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can update own business settings" ON business_settings
--     FOR UPDATE USING (auth.uid() = user_id);

-- App Settings Policies (Optional - uncomment if using Supabase Auth)
-- CREATE POLICY "Users can view own app settings" ON app_settings
--     FOR SELECT USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert own app settings" ON app_settings
--     FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can update own app settings" ON app_settings
--     FOR UPDATE USING (auth.uid() = user_id);

-- Storage buckets for avatars and business assets (Optional - only for Supabase Storage)
-- Comment out if not using Supabase Storage
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES 
--     ('avatars', 'avatars', true),
--     ('business-assets', 'business-assets', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket (Optional - uncomment if using Supabase Storage)
-- CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
--     FOR SELECT USING (bucket_id = 'avatars');

-- CREATE POLICY "Users can upload own avatar" ON storage.objects
--     FOR INSERT WITH CHECK (
--         bucket_id = 'avatars' 
--         AND auth.uid()::text = (storage.foldername(name))[1]
--     );

-- CREATE POLICY "Users can update own avatar" ON storage.objects
--     FOR UPDATE USING (
--         bucket_id = 'avatars' 
--         AND auth.uid()::text = (storage.foldername(name))[1]
--     );

-- CREATE POLICY "Users can delete own avatar" ON storage.objects
--     FOR DELETE USING (
--         bucket_id = 'avatars' 
--         AND auth.uid()::text = (storage.foldername(name))[1]
--     );

-- Storage policies for business-assets bucket (Optional - uncomment if using Supabase Storage)
-- CREATE POLICY "Business assets are publicly accessible" ON storage.objects
--     FOR SELECT USING (bucket_id = 'business-assets');

-- CREATE POLICY "Users can upload business assets" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'business-assets' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "Users can update business assets" ON storage.objects
--     FOR UPDATE USING (bucket_id = 'business-assets' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "Users can delete business assets" ON storage.objects
--     FOR DELETE USING (bucket_id = 'business-assets' AND auth.uid() IS NOT NULL);

-- Insert default settings for demo user (since no auth users exist)
-- This creates a default demo user configuration
DO $$
BEGIN
    -- Insert default user profile for demo user
    INSERT INTO user_profiles (user_id, full_name, avatar_url, phone, address)
    VALUES ('00000000-0000-0000-0000-000000000000', 'Demo User', '', '', '')
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert default business settings for demo user
    INSERT INTO business_settings (user_id, business_name, tagline, primary_color)
    VALUES ('00000000-0000-0000-0000-000000000000', 'MedCure Pharmacy', 'Your Trusted Healthcare Partner', '#2563eb')
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert default app settings for demo user
    INSERT INTO app_settings (user_id)
    VALUES ('00000000-0000-0000-0000-000000000000')
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Also allow NULL user_id for localStorage-only mode
    INSERT INTO user_profiles (user_id, full_name, avatar_url, phone, address)
    VALUES (NULL, 'Local User', '', '', '')
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO business_settings (user_id, business_name, tagline, primary_color)
    VALUES (NULL, 'MedCure Pharmacy', 'Your Trusted Healthcare Partner', '#2563eb')
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO app_settings (user_id)
    VALUES (NULL)
    ON CONFLICT (user_id) DO NOTHING;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_settings_user_id ON business_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_user_id ON app_settings(user_id);

COMMENT ON TABLE user_profiles IS 'User profile information including personal details and avatar';
COMMENT ON TABLE business_settings IS 'Business-specific settings including branding and contact information';
COMMENT ON TABLE app_settings IS 'Application-specific user preferences and system settings';
