-- Test the user role system
-- Run this to verify everything is working

-- 1. Check if table exists and is configured
SELECT 
  'user_profiles table exists: ✅' as status,
  count(*) as total_profiles
FROM public.user_profiles;

-- 2. List all users and their roles
SELECT 
  email,
  role,
  full_name,
  created_at
FROM public.user_profiles
ORDER BY created_at;

-- 3. Test the get_user_role function
SELECT 
  'Testing role function:' as test,
  public.get_user_role('admin@medcure.com') as admin_role,
  public.get_user_role('cashier@medcure.com') as cashier_role,
  public.get_user_role('nonexistent@test.com') as default_role;

-- 4. Check policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 5. Check triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Success summary
SELECT 
  CASE 
    WHEN (SELECT count(*) FROM public.user_profiles WHERE role = 'admin') > 0 
    THEN '✅ Admin user found'
    ELSE '⚠️ No admin user - create admin@medcure.com in Supabase Dashboard'
  END as admin_status,
  
  CASE 
    WHEN (SELECT count(*) FROM public.user_profiles WHERE role IN ('employee', 'cashier')) > 0 
    THEN '✅ Employee user found'
    ELSE '⚠️ No employee user - create cashier@medcure.com in Supabase Dashboard'
  END as employee_status;
