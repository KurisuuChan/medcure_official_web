-- Fix Settings Storage Issues - Complete Migration
-- Run this in your Supabase SQL Editor to fix all settings storage problems

-- =====================================================
-- 1. DIAGNOSTIC: Check Current Settings Tables
-- =====================================================

-- Check if settings tables exist and their structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'business_settings', 'app_settings')
ORDER BY table_name, ordinal_position;

-- Check existing data
SELECT 'user_profiles' as table_name, user_id, full_name, avatar_url FROM user_profiles
UNION ALL
SELECT 'business_settings' as table_name, user_id, business_name, logo_url FROM business_settings;

-- =====================================================
-- 2. FIX SETTINGS TABLES - Drop and Recreate Properly
-- =====================================================

-- Drop existing tables to fix any structural issues
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS business_settings CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;

-- Recreate User Profiles Table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE, -- This ensures upsert works correctly
    full_name TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    email TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate Business Settings Table  
CREATE TABLE business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE, -- This ensures upsert works correctly
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate App Settings Table
CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE, -- This ensures upsert works correctly
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE UPDATE TRIGGERS
-- =====================================================

-- Create update trigger function
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

-- =====================================================
-- 4. CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_settings_user_id ON business_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_user_id ON app_settings(user_id);

-- =====================================================
-- 5. DISABLE RLS (For Development)
-- =====================================================

-- Disable RLS to prevent conflicts during development
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE STORAGE BUCKETS AND POLICIES
-- =====================================================

-- Create storage buckets for avatars and business assets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('business-assets', 'business-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Drop all existing storage policies to avoid conflicts
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete avatars" ON storage.objects;
DROP POLICY IF EXISTS "Business assets are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload business assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update business assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete business assets" ON storage.objects;

-- Create permissive storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can update avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can delete avatars" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars');

-- Create permissive storage policies for business-assets bucket
CREATE POLICY "Business assets are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'business-assets');

CREATE POLICY "Anyone can upload business assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'business-assets');

CREATE POLICY "Anyone can update business assets" ON storage.objects
  FOR UPDATE USING (bucket_id = 'business-assets');

CREATE POLICY "Anyone can delete business assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'business-assets');

-- Enable RLS on storage.objects (required for policies to work)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. INSERT DEFAULT DATA FOR CURRENT USER
-- =====================================================

-- Insert default settings for the current authenticated user (if any)
DO $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Try to get current user from auth context
    SELECT auth.uid() INTO current_user_id;
    
    -- If we have a current user, create default records
    IF current_user_id IS NOT NULL THEN
        -- Insert default user profile
        INSERT INTO user_profiles (user_id, full_name, avatar_url, phone, address, email)
        VALUES (current_user_id, '', '', '', '', '')
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Insert default business settings
        INSERT INTO business_settings (user_id, business_name, tagline, primary_color)
        VALUES (current_user_id, 'MedCure Pharmacy', 'Your Trusted Healthcare Partner', '#2563eb')
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Insert default app settings
        INSERT INTO app_settings (user_id)
        VALUES (current_user_id)
        ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE 'Default settings created for user: %', current_user_id;
    ELSE
        -- Insert demo user settings
        INSERT INTO user_profiles (user_id, full_name, avatar_url, phone, address, email)
        VALUES ('11111111-1111-1111-1111-111111111111', 'Demo User', '', '+63 900 000 0000', 'Manila, Philippines', 'demo@medcure.com')
        ON CONFLICT (user_id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            phone = EXCLUDED.phone,
            address = EXCLUDED.address,
            email = EXCLUDED.email,
            updated_at = NOW();
        
        INSERT INTO business_settings (user_id, business_name, tagline, primary_color, address, phone, email)
        VALUES ('11111111-1111-1111-1111-111111111111', 'MedCure Pharmacy', 'Your Trusted Healthcare Partner', '#2563eb', 'Manila, Philippines', '+63 900 000 0000', 'admin@medcure.com')
        ON CONFLICT (user_id) DO UPDATE SET
            business_name = EXCLUDED.business_name,
            tagline = EXCLUDED.tagline,
            primary_color = EXCLUDED.primary_color,
            address = EXCLUDED.address,
            phone = EXCLUDED.phone,
            email = EXCLUDED.email,
            updated_at = NOW();
        
        INSERT INTO app_settings (user_id)
        VALUES ('11111111-1111-1111-1111-111111111111')
        ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE 'Demo user settings created';
    END IF;
END $$;

-- =====================================================
-- 8. VERIFICATION
-- =====================================================

-- Verify tables were created correctly
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'business_settings', 'app_settings')
GROUP BY table_name
ORDER BY table_name;

-- Test upsert functionality
DO $$
DECLARE
    test_user_id UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
    -- Test upsert on user_profiles
    INSERT INTO user_profiles (user_id, full_name)
    VALUES (test_user_id, 'Test User')
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
    
    -- Test upsert again to verify conflict resolution
    INSERT INTO user_profiles (user_id, full_name)
    VALUES (test_user_id, 'Updated Test User')
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
    
    -- Clean up test data
    DELETE FROM user_profiles WHERE user_id = test_user_id;
    
    RAISE NOTICE 'Upsert functionality verified successfully ✅';
END $$;

-- Check storage buckets
SELECT 
    id,
    name,
    public,
    'Storage bucket created' as status
FROM storage.buckets 
WHERE id IN ('avatars', 'business-assets');

-- Check storage policies
SELECT 
    policyname,
    cmd,
    'Storage policy created' as status
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%avatar%' OR policyname LIKE '%business%'
ORDER BY policyname;

-- Final success message
SELECT 
    '🎉 Settings Storage Fixed!' as status,
    'All settings tables recreated with proper upsert support' as message,
    'Storage buckets and policies configured for file uploads' as storage_status,
    'Your settings should now persist properly to Supabase' as result;
