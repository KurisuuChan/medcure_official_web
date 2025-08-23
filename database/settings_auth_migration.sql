-- MedCure Settings Tables Migration with Auth Integration
-- This script creates the necessary tables for user profiles, business settings, and app settings
-- with proper UUID foreign key references to auth.users

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create business_settings table
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT DEFAULT 'MedCure Pharmacy',
  logo_url TEXT,
  tagline TEXT DEFAULT 'Your Trusted Healthcare Partner',
  address TEXT,
  phone TEXT,
  email TEXT,
  primary_color TEXT DEFAULT '#2563eb',
  website TEXT,
  registration_number TEXT,
  tax_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  currency TEXT DEFAULT 'PHP',
  timezone TEXT DEFAULT 'Asia/Manila',
  language TEXT DEFAULT 'en',
  notifications BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  auto_backup BOOLEAN DEFAULT true,
  low_stock_threshold INTEGER DEFAULT 10,
  expiry_warning_days INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_settings_updated_at ON business_settings;
CREATE TRIGGER update_business_settings_updated_at 
  BEFORE UPDATE ON business_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at 
  BEFORE UPDATE ON app_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_settings_user_id ON business_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_user_id ON app_settings(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for business_settings
DROP POLICY IF EXISTS "Users can view own business settings" ON business_settings;
CREATE POLICY "Users can view own business settings" ON business_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own business settings" ON business_settings;
CREATE POLICY "Users can insert own business settings" ON business_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own business settings" ON business_settings;
CREATE POLICY "Users can update own business settings" ON business_settings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own business settings" ON business_settings;
CREATE POLICY "Users can delete own business settings" ON business_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for app_settings
DROP POLICY IF EXISTS "Users can view own app settings" ON app_settings;
CREATE POLICY "Users can view own app settings" ON app_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own app settings" ON app_settings;
CREATE POLICY "Users can insert own app settings" ON app_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own app settings" ON app_settings;
CREATE POLICY "Users can update own app settings" ON app_settings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own app settings" ON app_settings;
CREATE POLICY "Users can delete own app settings" ON app_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage buckets for avatars and business assets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('business-assets', 'business-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
CREATE POLICY "Anyone can upload an avatar."
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can update their own avatar." ON storage.objects;
CREATE POLICY "Users can update their own avatar."
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatar." ON storage.objects;
CREATE POLICY "Users can delete their own avatar."
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for business-assets bucket
DROP POLICY IF EXISTS "Business assets are publicly accessible." ON storage.objects;
CREATE POLICY "Business assets are publicly accessible."
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-assets');

DROP POLICY IF EXISTS "Anyone can upload business assets." ON storage.objects;
CREATE POLICY "Anyone can upload business assets."
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'business-assets');

DROP POLICY IF EXISTS "Authenticated users can update business assets." ON storage.objects;
CREATE POLICY "Authenticated users can update business assets."
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'business-assets' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete business assets." ON storage.objects;
CREATE POLICY "Authenticated users can delete business assets."
  ON storage.objects FOR DELETE
  USING (bucket_id = 'business-assets' AND auth.role() = 'authenticated');

-- Insert example/default data (optional)
-- Note: This will only work after users are created through Supabase auth
-- You can uncomment these after setting up authentication

/*
-- Example user profile (replace with actual user UUID)
INSERT INTO user_profiles (user_id, full_name, phone, address)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Admin User', '+63 900 000 0000', 'Manila, Philippines')
ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address;

-- Example business settings
INSERT INTO business_settings (user_id, business_name, tagline, address, phone, email)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'MedCure Pharmacy', 'Your Trusted Healthcare Partner', 'Manila, Philippines', '+63 900 000 0000', 'admin@medcure.com')
ON CONFLICT (user_id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  tagline = EXCLUDED.tagline,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email;

-- Example app settings
INSERT INTO app_settings (user_id, theme, currency, timezone, language)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'light', 'PHP', 'Asia/Manila', 'en')
ON CONFLICT (user_id) DO UPDATE SET
  theme = EXCLUDED.theme,
  currency = EXCLUDED.currency,
  timezone = EXCLUDED.timezone,
  language = EXCLUDED.language;
*/

-- Verify table creation
DO $$
BEGIN
  RAISE NOTICE 'Settings tables migration completed successfully!';
  RAISE NOTICE 'Created tables: user_profiles, business_settings, app_settings';
  RAISE NOTICE 'Created storage buckets: avatars, business-assets';
  RAISE NOTICE 'Applied Row Level Security policies';
  RAISE NOTICE 'Next steps: Set up authentication and create users';
END $$;
