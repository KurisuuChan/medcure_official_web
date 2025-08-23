-- Test User Profiles System After Setup
-- Run this AFTER running setup_user_roles.sql and creating users

-- 1. Check if table exists and is properly configured
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check current user profiles (should show created users)
SELECT 
  id,
  email,
  role,
  full_name,
  created_at
FROM public.user_profiles
ORDER BY created_at;

-- 3. Test the get_user_role function
SELECT 
  'admin@medcure.com' as email,
  public.get_user_role('admin@medcure.com') as detected_role;

SELECT 
  'cashier@medcure.com' as email,
  public.get_user_role('cashier@medcure.com') as detected_role;

-- 4. Check policies are active
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 5. Check triggers are working
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 6. Final status check
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.user_profiles WHERE role = 'admin') 
    THEN '✅ Admin user exists'
    ELSE '❌ No admin user found - create admin@medcure.com in Supabase Dashboard'
  END as admin_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.user_profiles WHERE role IN ('employee', 'cashier')) 
    THEN '✅ Employee user exists'
    ELSE '❌ No employee user found - create cashier@medcure.com in Supabase Dashboard'
  END as employee_status,
  COUNT(*) as total_users
FROM public.user_profiles;
