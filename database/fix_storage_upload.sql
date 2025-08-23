-- Fix Storage Upload Issues
-- This script ensures proper storage setup for file uploads

-- Recreate storage buckets with proper settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']),
  ('business-assets', 'business-assets', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Remove all existing storage policies to start fresh
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar." ON storage.objects;
DROP POLICY IF EXISTS "Business assets are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload business assets." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update business assets." ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete business assets." ON storage.objects;

-- Create permissive storage policies for development/demo mode
-- These policies allow uploads without strict authentication

-- Avatars bucket - Allow public read and upload
CREATE POLICY "Public avatar access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Public avatar upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Public avatar update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars');

CREATE POLICY "Public avatar delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars');

-- Business assets bucket - Allow public read and upload
CREATE POLICY "Public business assets access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-assets');

CREATE POLICY "Public business assets upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'business-assets');

CREATE POLICY "Public business assets update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'business-assets');

CREATE POLICY "Public business assets delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'business-assets');

-- Verify the setup
SELECT 
    'Storage Setup Complete' as status,
    'Buckets: ' || STRING_AGG(name, ', ') as buckets_created
FROM storage.buckets 
WHERE name IN ('avatars', 'business-assets');

-- Show policies
SELECT 
    'Storage Policies' as type,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has conditions'
        ELSE 'No conditions'
    END as conditions
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%avatar%' OR policyname LIKE '%business%'
ORDER BY policyname;
