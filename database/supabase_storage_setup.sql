-- Supabase Storage Buckets Setup for Branding System
-- Run these commands in your Supabase SQL editor

-- 1. Create storage buckets for logos and avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('logos', 'logos', true, 5242880, '{"image/jpeg","image/jpg","image/png","image/gif","image/webp"}'),
  ('avatars', 'avatars', true, 2097152, '{"image/jpeg","image/jpg","image/png","image/gif","image/webp"}')
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Create RLS policies for storage buckets (allow public access for now)
-- Logos bucket policies
CREATE POLICY "Allow public uploads to logos bucket" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Allow public reads from logos bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Allow public updates to logos bucket" ON storage.objects
  FOR UPDATE USING (bucket_id = 'logos');

CREATE POLICY "Allow public deletes from logos bucket" ON storage.objects
  FOR DELETE USING (bucket_id = 'logos');

-- Avatars bucket policies
CREATE POLICY "Allow public uploads to avatars bucket" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow public reads from avatars bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Allow public updates to avatars bucket" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars');

CREATE POLICY "Allow public deletes from avatars bucket" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars');

-- 3. Ensure settings table exists and has proper structure
-- (This should already exist from schema.sql but let's make sure)
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Insert default settings if none exist
INSERT INTO settings (data, created_at, updated_at)
SELECT 
  '{
    "businessName": "MedCure Pharmacy",
    "businessAddress": "123 Health Street, Medical District, City",
    "businessPhone": "+63 912 345 6789",
    "businessEmail": "contact@medcure.com",
    "primaryColor": "#2563eb",
    "timezone": "Asia/Manila",
    "currency": "PHP",
    "language": "en",
    "brandingName": "MedCure",
    "companyLogo": "",
    "logoUrl": "",
    "brandColor": "#2563eb",
    "accentColor": "#3b82f6",
    "headerStyle": "modern",
    "sidebarStyle": "minimal",
    "profileName": "Admin User",
    "profileEmail": "admin@medcure.com",
    "profileRole": "Administrator",
    "profileAvatar": "",
    "profileBio": "System Administrator",
    "profilePhone": "+63 912 345 6789",
    "profileDepartment": "IT Administration",
    "displayName": "Admin",
    "userInitials": "AU",
    "lowStockThreshold": 10,
    "criticalStockThreshold": 5,
    "expiryAlertDays": 30,
    "emailNotifications": true,
    "smsNotifications": false,
    "pushNotifications": true,
    "dailyReports": true,
    "weeklyReports": true,
    "twoFactorAuth": false,
    "sessionTimeout": 30,
    "passwordExpiry": 90,
    "autoBackup": true,
    "backupFrequency": "daily",
    "backupRetention": 30,
    "cloudBackup": false
  }'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

-- 5. Update trigger for settings table
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at 
  BEFORE UPDATE ON settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_settings_updated_at();

-- 6. Create a view for easy settings access (optional)
CREATE OR REPLACE VIEW current_settings AS
SELECT data FROM settings ORDER BY updated_at DESC LIMIT 1;
