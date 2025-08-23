-- =====================================================
-- DIRECT SQL FOR USER ROLES - MINIMAL VERSION
-- Copy and paste this directly into Supabase SQL Editor
-- =====================================================

-- 1. Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee', 'cashier')),
  full_name TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- 2. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create basic policy
CREATE POLICY "Enable all access for authenticated users" ON public.user_profiles
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 4. Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE email = user_email
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'employee');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'employee';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to get current user profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(
  id UUID,
  user_id UUID,
  email TEXT,
  role TEXT,
  full_name TEXT,
  profile_image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.user_id,
    up.email,
    up.role,
    up.full_name,
    up.profile_image_url
  FROM public.user_profiles up
  WHERE up.user_id = auth.uid()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create admin user profile (REPLACE WITH YOUR ACTUAL USER ID)
-- First, find your user ID by running: SELECT id, email FROM auth.users;
-- Then replace 'YOUR_USER_ID_HERE' with your actual UUID

INSERT INTO public.user_profiles (user_id, email, role, full_name)
VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with actual UUID from auth.users
  'admin@medcure.com',
  'admin',
  'Admin User'
) ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name;

-- 7. Create cashier user profile (OPTIONAL)
INSERT INTO public.user_profiles (user_id, email, role, full_name)
VALUES (
  'YOUR_CASHIER_USER_ID_HERE',  -- Replace with actual UUID from auth.users
  'cashier@medcure.com',
  'cashier', 
  'Cashier User'
) ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name;

-- 8. Verify setup
SELECT 
  'Setup Complete ✅' as status,
  email,
  role,
  full_name
FROM public.user_profiles
ORDER BY role;
