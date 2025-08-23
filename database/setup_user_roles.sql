-- Create Admin and Employee Users for MedCure
-- Run this in your Supabase SQL Editor (Error-Free Version)

-- 1. Drop table if exists to ensure clean setup
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 2. Create user profiles table for role management
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee', 'cashier')),
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- 3. Wait for table creation to complete, then create indexes
DO $$
BEGIN
  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
  CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
  
  RAISE NOTICE 'Indexes created successfully ✅';
END $$;

-- 4. Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create basic policies (safe approach)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.user_profiles;

-- Simple, safe policies that work immediately
CREATE POLICY "Enable read access for all users" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Enable update for users based on user_id" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 6. Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT := 'employee'; -- default role
BEGIN
  -- Determine role based on email
  IF NEW.email = 'admin@medcure.com' OR NEW.email ILIKE '%admin%' THEN
    user_role := 'admin';
  ELSIF NEW.email ILIKE '%cashier%' THEN
    user_role := 'cashier';
  ELSE
    user_role := 'employee';
  END IF;

  -- Insert into user_profiles
  INSERT INTO public.user_profiles (user_id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'MedCure User')
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE LOG 'Failed to create user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Utility function to get user role
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

-- 9. Success message
SELECT 'User profiles system ready! ✅' as status;
