-- Add Admin Policy (Run AFTER creating users)
-- This script should be run after you've created the admin user

-- Add admin policy for user_profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Verify the admin user exists and has the right role
SELECT 
  'Admin policy added successfully! ✅' as status,
  up.email,
  up.role,
  up.full_name
FROM public.user_profiles up
WHERE up.role = 'admin';
