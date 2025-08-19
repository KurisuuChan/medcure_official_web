-- Storage Buckets Setup for MedCure Settings
-- Run this in your Supabase SQL editor to ensure storage buckets exist

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
    ('avatars', 'avatars', true, 5242880, ARRAY['image/*']),
    ('business-assets', 'business-assets', true, 5242880, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies for avatars bucket
-- Delete existing policies if they exist
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create new policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage Policies for business-assets bucket
-- Delete existing policies if they exist
DROP POLICY IF EXISTS "Business assets are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload business assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update business assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete business assets" ON storage.objects;

-- Create new policies for business assets
CREATE POLICY "Business assets are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'business-assets');

CREATE POLICY "Users can upload business assets" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'business-assets');

CREATE POLICY "Users can update business assets" ON storage.objects
    FOR UPDATE USING (bucket_id = 'business-assets');

CREATE POLICY "Users can delete business assets" ON storage.objects
    FOR DELETE USING (bucket_id = 'business-assets');

-- Verify buckets were created
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('avatars', 'business-assets');

-- Verify policies were created
SELECT policyname, tablename, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%avatar%' OR policyname LIKE '%business%';
