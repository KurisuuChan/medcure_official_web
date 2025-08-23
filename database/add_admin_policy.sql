-- Add Admin Policy (Run AFTER creating users and user_profiles table)
-- This script should be run after you've created the admin user and user_profiles table

-- 1. First, check if user_profiles table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
    RAISE EXCEPTION 'user_profiles table does not exist. Please run setup_user_roles.sql first!';
  END IF;
  
  RAISE NOTICE 'user_profiles table found ✅';
END $$;

-- 2. Add admin policy for user_profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Verify the admin user exists and has the right role
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM public.user_profiles
  WHERE role = 'admin';
  
  IF admin_count = 0 THEN
    RAISE NOTICE 'No admin users found. Please create an admin user first.';
  ELSE
    RAISE NOTICE 'Found % admin user(s) ✅', admin_count;
  END IF;
END $$;

-- 4. Show admin users if they exist
SELECT 
  'Admin policy added successfully! ✅' as status,
  up.email,
  up.role,
  up.full_name,
  up.created_at
FROM public.user_profiles up
WHERE up.role = 'admin';
