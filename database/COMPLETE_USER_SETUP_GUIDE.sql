-- =====================================================
-- COMPLETE USER ROLES SETUP FOR MEDCURE
-- Run these scripts in ORDER in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: Create user_profiles table and setup
-- =====================================================

-- Drop table if exists to ensure clean setup
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create user profiles table for role management
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Create Policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Basic read access for authenticated users
CREATE POLICY "Enable read access for authenticated users" ON public.user_profiles
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Insert policy for new users
CREATE POLICY "Enable insert for authenticated users only" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Update policy - users can update their own profile
CREATE POLICY "Enable update for own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Admin policy - admins can manage all profiles
CREATE POLICY "Admins can manage all profiles" ON public.user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    ) OR auth.role() = 'service_role'
  );

-- =====================================================
-- STEP 3: Create Functions
-- =====================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT := 'employee'; -- default role
  user_name TEXT;
BEGIN
  -- Determine role based on email
  IF NEW.email = 'admin@medcure.com' OR NEW.email ILIKE '%admin%' THEN
    user_role := 'admin';
  ELSIF NEW.email ILIKE '%cashier%' THEN
    user_role := 'cashier';
  ELSE
    user_role := 'employee';
  END IF;

  -- Extract name from metadata or use default
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    CASE 
      WHEN user_role = 'admin' THEN 'Admin User'
      WHEN user_role = 'cashier' THEN 'Cashier User'
      ELSE 'MedCure Employee'
    END
  );

  -- Insert into user_profiles
  INSERT INTO public.user_profiles (user_id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    user_name
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE LOG 'Failed to create user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
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

-- Function to get current user profile
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

-- =====================================================
-- STEP 4: Create Triggers
-- =====================================================

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_user_profiles_updated_at();

-- =====================================================
-- STEP 5: Create Test Users (Optional)
-- =====================================================

-- NOTE: These will create actual auth users, so use carefully!
-- You can skip this section if you want to create users manually

-- Create admin user (uncomment to use)
/*
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@medcure.com',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Admin User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Create cashier user (uncomment to use)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'cashier@medcure.com',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Cashier User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);
*/

-- =====================================================
-- STEP 6: Manual User Profile Creation (Alternative)
-- =====================================================

-- If you already have users in auth.users, create profiles manually:
-- Replace the UUIDs and emails with your actual user data

/*
-- For existing admin user
INSERT INTO public.user_profiles (user_id, email, role, full_name)
VALUES (
  'YOUR_ADMIN_USER_UUID_HERE',
  'admin@medcure.com',
  'admin',
  'Admin User'
) ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name;

-- For existing cashier user
INSERT INTO public.user_profiles (user_id, email, role, full_name)
VALUES (
  'YOUR_CASHIER_USER_UUID_HERE',
  'cashier@medcure.com',
  'cashier',
  'Cashier User'
) ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name;
*/

-- =====================================================
-- STEP 7: Verification
-- =====================================================

-- Check if everything is set up correctly
DO $$
DECLARE
  table_exists BOOLEAN;
  profile_count INTEGER;
  admin_count INTEGER;
BEGIN
  -- Check if user_profiles table exists
  SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'user_profiles'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE EXCEPTION 'user_profiles table was not created!';
  END IF;
  
  -- Count profiles
  SELECT COUNT(*) INTO profile_count FROM public.user_profiles;
  SELECT COUNT(*) INTO admin_count FROM public.user_profiles WHERE role = 'admin';
  
  RAISE NOTICE '=== USER SETUP VERIFICATION ===';
  RAISE NOTICE 'user_profiles table: ✅ Created';
  RAISE NOTICE 'Total user profiles: %', profile_count;
  RAISE NOTICE 'Admin users: %', admin_count;
  
  IF admin_count = 0 THEN
    RAISE NOTICE 'WARNING: No admin users found. Create an admin user to access admin features!';
  END IF;
  
  RAISE NOTICE 'Setup completed successfully! ✅';
END $$;

-- Show current user profiles
SELECT 
  email,
  role,
  full_name,
  created_at,
  'Profile ready ✅' as status
FROM public.user_profiles
ORDER BY role, email;

-- =====================================================
-- INSTRUCTIONS FOR USE:
-- =====================================================

/*
1. Run this entire script in your Supabase SQL Editor
2. If you want to create test users, uncomment the INSERT statements in STEP 5
3. If you already have users, use STEP 6 to create profiles manually
4. Your frontend can now use the user_profiles table for role-based authentication

FRONTEND USAGE:
- Use roleAuthService.js functions: signIn(), signOut(), getCurrentUser()
- Check user roles with usePermissions() hook
- Implement admin-only features using isAdmin() function

DATABASE FUNCTIONS AVAILABLE:
- get_user_role(email) - Get role by email
- get_current_user_profile() - Get current user's profile
- Automatic profile creation for new users via trigger
*/
