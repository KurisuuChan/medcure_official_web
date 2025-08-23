-- Debug Storage Issues - Run this in Supabase SQL Editor
-- This will help us understand why files aren't uploading

-- 1. Check if storage buckets exist
SELECT 
    'Storage Buckets' as check_type,
    name as bucket_name,
    public as is_public,
    created_at
FROM storage.buckets 
WHERE name IN ('avatars', 'business-assets')
ORDER BY name;

-- 2. Check storage policies
SELECT 
    'Storage Policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- 3. Check auth settings
SELECT 
    'Auth Settings' as check_type,
    'auth.users table' as item,
    COUNT(*) as count
FROM auth.users;

-- 4. Check if RLS is enabled on storage.objects
SELECT 
    'RLS Status' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 5. Test bucket access (this should work if buckets are properly set up)
SELECT 
    'Bucket Access Test' as check_type,
    name,
    CASE 
        WHEN public THEN 'Public access enabled'
        ELSE 'Private bucket'
    END as access_type
FROM storage.buckets 
WHERE name IN ('avatars', 'business-assets');
