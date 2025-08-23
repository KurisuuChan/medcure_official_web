-- MedCure Settings Tables Migration - Safe Version
-- This script handles cases where auth.users might not be accessible
-- and provides fallback options

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, let's check if we can access auth.users
DO $$
DECLARE
    auth_users_exists boolean := false;
BEGIN
    -- Check if we can access auth.users
    BEGIN
        PERFORM 1 FROM auth.users LIMIT 1;
        auth_users_exists := true;
        RAISE NOTICE 'auth.users is accessible - using full auth integration';
    EXCEPTION WHEN OTHERS THEN
        auth_users_exists := false;
        RAISE NOTICE 'auth.users not accessible - using simplified approach';
    END;
    
    -- Store the result for use in conditional statements
    -- We'll use a different approach based on this
END $$;

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS business_settings CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;

-- Method 1: Try with auth.users foreign key first
DO $$
BEGIN
    -- Try to create tables with auth.users foreign key
    BEGIN
        -- Create user_profiles table with auth integration
        CREATE TABLE user_profiles (
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

        -- Create business_settings table with auth integration
        CREATE TABLE business_settings (
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

        -- Create app_settings table with auth integration
        CREATE TABLE app_settings (
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

        RAISE NOTICE 'Successfully created tables with auth.users foreign keys';
        
    EXCEPTION WHEN OTHERS THEN
        -- If that fails, create without foreign key constraints
        RAISE NOTICE 'auth.users foreign key failed, creating tables without constraints: %', SQLERRM;
        
        -- Drop any partially created tables
        DROP TABLE IF EXISTS user_profiles CASCADE;
        DROP TABLE IF EXISTS business_settings CASCADE;
        DROP TABLE IF EXISTS app_settings CASCADE;
        
        -- Create user_profiles table without foreign key
        CREATE TABLE user_profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          full_name TEXT,
          avatar_url TEXT,
          phone TEXT,
          address TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );

        -- Create business_settings table without foreign key
        CREATE TABLE business_settings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
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

        -- Create app_settings table without foreign key
        CREATE TABLE app_settings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
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

        RAISE NOTICE 'Successfully created tables without foreign key constraints';
    END;
END $$;

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

-- Try to enable Row Level Security if possible
DO $$
BEGIN
    -- Enable RLS
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

    -- Try to create RLS policies (this will only work if auth functions are available)
    BEGIN
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

        RAISE NOTICE 'Successfully created RLS policies with auth functions';

    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create auth-based RLS policies: %', SQLERRM;
        RAISE NOTICE 'Tables created but without RLS policies - consider setting up authentication';
        
        -- Disable RLS if we can't create proper policies
        ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
        ALTER TABLE business_settings DISABLE ROW LEVEL SECURITY;
        ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;
    END;
END $$;

-- Try to create storage buckets
DO $$
BEGIN
    -- Create storage buckets for avatars and business assets
    INSERT INTO storage.buckets (id, name, public)
    VALUES 
      ('avatars', 'avatars', true),
      ('business-assets', 'business-assets', true)
    ON CONFLICT (id) DO NOTHING;

    -- Try to create storage policies
    BEGIN
        -- Storage policies for avatars bucket
        DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
        CREATE POLICY "Avatar images are publicly accessible."
          ON storage.objects FOR SELECT
          USING (bucket_id = 'avatars');

        DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
        CREATE POLICY "Anyone can upload an avatar."
          ON storage.objects FOR INSERT
          WITH CHECK (bucket_id = 'avatars');

        -- Storage policies for business-assets bucket
        DROP POLICY IF EXISTS "Business assets are publicly accessible." ON storage.objects;
        CREATE POLICY "Business assets are publicly accessible."
          ON storage.objects FOR SELECT
          USING (bucket_id = 'business-assets');

        DROP POLICY IF EXISTS "Anyone can upload business assets." ON storage.objects;
        CREATE POLICY "Anyone can upload business assets."
          ON storage.objects FOR INSERT
          WITH CHECK (bucket_id = 'business-assets');

        RAISE NOTICE 'Successfully created storage buckets and policies';

    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Storage policies creation failed: %', SQLERRM;
        RAISE NOTICE 'Storage buckets created but policies may need manual setup';
    END;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Storage setup failed: %', SQLERRM;
    RAISE NOTICE 'You may need to create storage buckets manually in Supabase dashboard';
END $$;

-- Insert demo data for testing (with a known UUID)
DO $$
DECLARE
    demo_user_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
    -- Insert demo user profile
    INSERT INTO user_profiles (user_id, full_name, phone, address)
    VALUES 
      (demo_user_id, 'Demo User', '+63 900 000 0000', 'Manila, Philippines')
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      address = EXCLUDED.address;

    -- Insert demo business settings
    INSERT INTO business_settings (user_id, business_name, tagline, address, phone, email)
    VALUES 
      (demo_user_id, 'MedCure Pharmacy', 'Your Trusted Healthcare Partner', 'Manila, Philippines', '+63 900 000 0000', 'admin@medcure.com')
    ON CONFLICT (user_id) DO UPDATE SET
      business_name = EXCLUDED.business_name,
      tagline = EXCLUDED.tagline,
      address = EXCLUDED.address,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email;

    -- Insert demo app settings
    INSERT INTO app_settings (user_id, theme, currency, timezone, language)
    VALUES 
      (demo_user_id, 'light', 'PHP', 'Asia/Manila', 'en')
    ON CONFLICT (user_id) DO UPDATE SET
      theme = EXCLUDED.theme,
      currency = EXCLUDED.currency,
      timezone = EXCLUDED.timezone,
      language = EXCLUDED.language;

    RAISE NOTICE 'Demo data inserted successfully with user_id: %', demo_user_id;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Demo data insertion failed: %', SQLERRM;
END $$;

-- Final verification
DO $$
DECLARE
    user_profiles_count integer;
    business_settings_count integer;
    app_settings_count integer;
BEGIN
    SELECT COUNT(*) INTO user_profiles_count FROM user_profiles;
    SELECT COUNT(*) INTO business_settings_count FROM business_settings;
    SELECT COUNT(*) INTO app_settings_count FROM app_settings;

    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Tables created: user_profiles (% rows), business_settings (% rows), app_settings (% rows)', 
                 user_profiles_count, business_settings_count, app_settings_count;
    RAISE NOTICE 'Indexes created for all user_id columns';
    RAISE NOTICE 'Updated_at triggers configured';
    RAISE NOTICE 'Demo user ID for testing: 11111111-1111-1111-1111-111111111111';
    RAISE NOTICE 'Your settings service should now work with both auth and localStorage fallbacks';
END $$;
