-- =====================================================
-- FIX USER_PROFILES TABLE - ADD MISSING ROLE COLUMN
-- Run this to fix the missing role column error
-- =====================================================

-- 1. First, check what columns exist in the table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Drop the table completely and recreate it properly
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 3. Create the table again with all columns
CREATE TABLE public.user_profiles (
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

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- 5. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Create policy
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.user_profiles;
CREATE POLICY "Enable all access for authenticated users" ON public.user_profiles
  FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 7. Create functions
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

-- 8. Verify the table structure
SELECT 
  'Table recreated successfully ✅' as status,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Now you can insert user profiles
-- REPLACE 'YOUR_USER_ID_HERE' with your actual user ID from auth.users
-- First run: SELECT id, email FROM auth.users; to get your user ID

/*
INSERT INTO public.user_profiles (user_id, email, role, full_name)
VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with actual UUID
  'admin@medcure.com',
  'admin',
  'Admin User'
);

INSERT INTO public.user_profiles (user_id, email, role, full_name)
VALUES (
  'YOUR_CASHIER_USER_ID_HERE',  -- Replace with actual UUID
  'cashier@medcure.com',
  'cashier',
  'Cashier User'
);
*/

-- 10. Final verification (run after inserting profiles)
-- SELECT email, role, full_name, created_at FROM public.user_profiles ORDER BY role;
