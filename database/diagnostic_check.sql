-- Diagnostic script to check current database state
-- Run this first to see what exists

-- Check if tables exist
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name IN ('user_profiles', 'business_settings', 'app_settings')
ORDER BY table_name;

-- Check if auth schema exists
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'auth';

-- Check if auth.users table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'auth' AND table_name = 'users';

-- Check existing columns in any existing settings tables
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('user_profiles', 'business_settings', 'app_settings')
ORDER BY table_name, ordinal_position;

-- Check if UUID extension is enabled
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'uuid-ossp';

-- Check storage buckets
SELECT name, id, public 
FROM storage.buckets 
WHERE name IN ('avatars', 'business-assets');
