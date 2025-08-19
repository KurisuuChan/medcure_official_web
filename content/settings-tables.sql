-- Settings Tables for MedCure System
-- This creates persistent storage for user profiles, business settings, and app preferences

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    currency TEXT DEFAULT 'PHP',
    timezone TEXT DEFAULT 'Asia/Manila',
    language TEXT DEFAULT 'en',
    notifications BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    auto_backup BOOLEAN DEFAULT true,
    low_stock_threshold INTEGER DEFAULT 10,
    expiry_warning_days INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Storage Buckets for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('avatars', 'avatars', true),
    ('business-assets', 'business-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Row Level Security Policies

-- User Profiles Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Business Settings Policies
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business settings" ON business_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business settings" ON business_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business settings" ON business_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- App Settings Policies
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own app settings" ON app_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own app settings" ON app_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own app settings" ON app_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Storage Policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Business assets are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'business-assets');

CREATE POLICY "Users can upload business assets" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'business-assets');

CREATE POLICY "Users can update business assets" ON storage.objects
    FOR UPDATE USING (bucket_id = 'business-assets');

CREATE POLICY "Users can delete business assets" ON storage.objects
    FOR DELETE USING (bucket_id = 'business-assets');

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update the updated_at column
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_settings_updated_at BEFORE UPDATE ON business_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'Stores user profile information including names, contact details, and avatar';
COMMENT ON TABLE business_settings IS 'Stores business/pharmacy information, branding, and contact details';
COMMENT ON TABLE app_settings IS 'Stores application preferences and configuration settings per user';
