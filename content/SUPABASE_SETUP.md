# Supabase Setup Guide for MedCure Branding System

## Prerequisites

- Supabase account and project created
- Database connection configured in `src/lib/supabase.js`

## Step 1: Run Database Schema

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Run the main schema file: `database/schema.sql`
4. Run the branding setup: `database/branding-setup.sql`

## Step 2: Configure Storage Buckets

Since storage bucket creation via SQL might not work in all cases, you can also create them manually:

### Option A: Manual Setup (Recommended)

1. Go to **Storage** in your Supabase dashboard
2. Create two new buckets:

   - **Bucket name**: `logos`

     - **Public bucket**: ✅ Enable
     - **File size limit**: 5MB
     - **Allowed MIME types**: `image/jpeg,image/png,image/webp,image/svg+xml`

   - **Bucket name**: `avatars`
     - **Public bucket**: ✅ Enable
     - **File size limit**: 2MB
     - **Allowed MIME types**: `image/jpeg,image/png,image/webp`

### Option B: SQL Setup

If manual setup doesn't work, run these SQL commands in the SQL Editor:

```sql
-- Enable storage if not already enabled
CREATE EXTENSION IF NOT EXISTS "storage";

-- Create logos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'logos',
    'logos',
    true,
    5242880, -- 5MB in bytes
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    2097152, -- 2MB in bytes
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;
```

## Step 3: Set Up Row Level Security Policies

In the SQL Editor, run:

```sql
-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for logos bucket
CREATE POLICY "Public read access for logos" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can upload logos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Authenticated users can update logos" ON storage.objects
FOR UPDATE USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can delete logos" ON storage.objects
FOR DELETE USING (bucket_id = 'logos');

-- Create policies for avatars bucket
CREATE POLICY "Public read access for avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can update avatars" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can delete avatars" ON storage.objects
FOR DELETE USING (bucket_id = 'avatars');
```

## Step 4: Configure Environment Variables

Make sure your `.env` file has the correct Supabase configuration:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 5: Test the Setup

1. Start your development server: `npm run dev`
2. Go to Settings → Branding tab
3. Try uploading a logo
4. Go to Settings → Profile tab
5. Try uploading a profile picture
6. Check if changes appear in header and sidebar

## Troubleshooting

### If uploads fail:

1. Check browser console for errors
2. Verify bucket names are exactly: `logos` and `avatars`
3. Ensure buckets are marked as public
4. Check file size limits (5MB for logos, 2MB for avatars)
5. Verify MIME types are allowed

### If settings don't persist:

1. Check if the `settings` table exists
2. Verify the functions were created successfully
3. Check browser console for Supabase errors

### If changes don't appear in UI:

1. Verify the BrandingProvider is wrapping the app
2. Check that components are using the useBranding hook
3. Refresh the page to see if data loads

## Backend Service Functions

The following functions should work with this setup:

- `uploadLogo()` - Uploads logos to Supabase storage
- `uploadAvatar()` - Uploads avatars to Supabase storage
- `updateBranding()` - Saves branding settings to database
- `updateProfile()` - Saves profile settings to database
- `getBrandingSettings()` - Retrieves branding data
- `getProfileSettings()` - Retrieves profile data

All functions have mock mode fallbacks for development.
