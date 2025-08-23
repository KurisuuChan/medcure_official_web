-- Fix Supabase Storage Authentication and Policies
-- Run this in your Supabase SQL Editor

-- 0. Enable anonymous authentication (if not already enabled via dashboard)
-- Note: This might fail if you don't have admin access - enable via Dashboard instead
-- UPDATE auth.config SET enable_anonymous_users = true;

-- 1. Ensure storage buckets exist with proper permissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 52428800, ARRAY['image/*']), -- 50MB limit
  ('business-assets', 'business-assets', true, 52428800, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Create permissive storage policies for development
-- Delete existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Public avatars upload" ON storage.objects;
DROP POLICY IF EXISTS "Public avatars read" ON storage.objects;
DROP POLICY IF EXISTS "Public business assets upload" ON storage.objects;
DROP POLICY IF EXISTS "Public business assets read" ON storage.objects;
DROP POLICY IF EXISTS "Public avatars delete" ON storage.objects;
DROP POLICY IF EXISTS "Public business assets delete" ON storage.objects;

-- Create new permissive policies for avatars bucket
CREATE POLICY "Public avatars upload" ON storage.objects
  FOR INSERT 
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Public avatars read" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'avatars');

CREATE POLICY "Public avatars delete" ON storage.objects
  FOR DELETE 
  USING (bucket_id = 'avatars');

-- Create new permissive policies for business-assets bucket
CREATE POLICY "Public business assets upload" ON storage.objects
  FOR INSERT 
  WITH CHECK (bucket_id = 'business-assets');

CREATE POLICY "Public business assets read" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'business-assets');

CREATE POLICY "Public business assets delete" ON storage.objects
  FOR DELETE 
  USING (bucket_id = 'business-assets');

-- 3. Enable RLS but with permissive policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Check if policies are created correctly
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- 5. Check bucket configuration
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('avatars', 'business-assets');

-- Success message
SELECT 'Storage policies configured successfully! ✅' as status;
