-- Branding System Setup for Supabase
-- This file contains the SQL statements to set up storage buckets and policies for the branding system

-- 1. Create storage buckets for logos and avatars
-- Note: These need to be run in the Supabase dashboard or via SQL editor

-- Create logos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket  
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up Row Level Security (RLS) policies for storage

-- Allow public read access to logos
CREATE POLICY "Public read access for logos" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');

-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload logos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their logos
CREATE POLICY "Authenticated users can update logos" ON storage.objects
FOR UPDATE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete logos
CREATE POLICY "Authenticated users can delete logos" ON storage.objects
FOR DELETE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- Allow public read access to avatars
CREATE POLICY "Public read access for avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their avatars
CREATE POLICY "Authenticated users can update avatars" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete avatars
CREATE POLICY "Authenticated users can delete avatars" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- 3. Insert default branding settings if none exist
INSERT INTO settings (data) 
SELECT jsonb_build_object(
    'branding', jsonb_build_object(
        'brandingName', 'MedCure',
        'logoUrl', null,
        'primaryColor', '#3B82F6',
        'secondaryColor', '#10B981',
        'accentColor', '#F59E0B',
        'systemDescription', 'Pharmacy Management System'
    ),
    'profile', jsonb_build_object(
        'firstName', 'Admin',
        'lastName', 'User',
        'email', 'admin@medcure.com',
        'jobTitle', 'System Administrator',
        'profileAvatar', null
    )
) 
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- 4. Create helper functions for branding management

-- Function to get branding settings
CREATE OR REPLACE FUNCTION get_branding_settings()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COALESCE(data->'branding', '{}'::jsonb) 
    FROM settings 
    ORDER BY id DESC 
    LIMIT 1;
$$;

-- Function to get profile settings
CREATE OR REPLACE FUNCTION get_profile_settings()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COALESCE(data->'profile', '{}'::jsonb) 
    FROM settings 
    ORDER BY id DESC 
    LIMIT 1;
$$;

-- Function to update branding settings
CREATE OR REPLACE FUNCTION update_branding_settings(branding_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update existing settings or create new ones
    INSERT INTO settings (data) 
    VALUES (jsonb_build_object('branding', branding_data))
    ON CONFLICT (id) DO UPDATE SET 
        data = jsonb_set(
            COALESCE(settings.data, '{}'::jsonb), 
            '{branding}', 
            branding_data
        ),
        updated_at = CURRENT_TIMESTAMP;
        
    -- If no conflict, we need to handle the case where settings table is empty
    IF NOT FOUND THEN
        UPDATE settings 
        SET data = jsonb_set(
            COALESCE(data, '{}'::jsonb), 
            '{branding}', 
            branding_data
        ),
        updated_at = CURRENT_TIMESTAMP;
    END IF;
END;
$$;

-- Function to update profile settings
CREATE OR REPLACE FUNCTION update_profile_settings(profile_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update existing settings or create new ones
    INSERT INTO settings (data) 
    VALUES (jsonb_build_object('profile', profile_data))
    ON CONFLICT (id) DO UPDATE SET 
        data = jsonb_set(
            COALESCE(settings.data, '{}'::jsonb), 
            '{profile}', 
            profile_data
        ),
        updated_at = CURRENT_TIMESTAMP;
        
    -- If no conflict, we need to handle the case where settings table is empty
    IF NOT FOUND THEN
        UPDATE settings 
        SET data = jsonb_set(
            COALESCE(data, '{}'::jsonb), 
            '{profile}', 
            profile_data
        ),
        updated_at = CURRENT_TIMESTAMP;
    END IF;
END;
$$;
