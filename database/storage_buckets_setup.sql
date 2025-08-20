-- =====================================================
-- Storage Buckets Setup for Settings
-- MedCure Pharmacy Management System
-- =====================================================

-- This script creates the necessary storage buckets and policies
-- for user avatars and business assets used in the settings system.

-- =====================================================
-- 1. CREATE STORAGE BUCKETS
-- =====================================================

-- Create avatars bucket for user profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create business-assets bucket for business logos and documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'business-assets',
    'business-assets',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. STORAGE POLICIES FOR AVATARS BUCKET
-- =====================================================

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to view all avatars (for public display)
CREATE POLICY "Avatars are publicly viewable" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================
-- 3. STORAGE POLICIES FOR BUSINESS-ASSETS BUCKET
-- =====================================================

-- Allow authenticated users to upload business assets
CREATE POLICY "Authenticated users can upload business assets" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'business-assets');

-- Allow public viewing of business assets (for logos, etc.)
CREATE POLICY "Business assets are publicly viewable" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'business-assets');

-- Allow authenticated users to update business assets
CREATE POLICY "Authenticated users can update business assets" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'business-assets')
    WITH CHECK (bucket_id = 'business-assets');

-- Allow authenticated users to delete business assets
CREATE POLICY "Authenticated users can delete business assets" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'business-assets');

-- =====================================================
-- 4. ADDITIONAL TABLES FOR SETTINGS (If Not Exists)
-- =====================================================

-- User profiles table (referenced in settingsService.js)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one profile per user
    CONSTRAINT unique_user_profile UNIQUE(user_id)
);

-- Business settings table (referenced in settingsService.js)
CREATE TABLE IF NOT EXISTS public.business_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) DEFAULT 'MedCure Pharmacy',
    logo_url TEXT,
    tagline VARCHAR(500) DEFAULT 'Your Trusted Healthcare Partner',
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    primary_color VARCHAR(7) DEFAULT '#2563eb',
    website VARCHAR(255),
    registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one business setting per user
    CONSTRAINT unique_business_settings UNIQUE(user_id)
);

-- =====================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on user profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view and edit their own profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify their own profile" ON public.user_profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Enable RLS on business settings
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Users can view and edit their own business settings
CREATE POLICY "Users can view their own business settings" ON public.business_settings
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own business settings" ON public.business_settings
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business settings" ON public.business_settings
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for user profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Indexes for business settings
CREATE INDEX IF NOT EXISTS idx_business_settings_user_id ON public.business_settings(user_id);

-- =====================================================
-- 7. FUNCTIONS FOR SETTINGS MANAGEMENT
-- =====================================================

-- Function to get user profile with defaults
CREATE OR REPLACE FUNCTION public.get_user_profile_with_defaults(p_user_id UUID)
RETURNS TABLE (
    id BIGINT,
    user_id UUID,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(50),
    address TEXT,
    email VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(up.id, 0) as id,
        p_user_id as user_id,
        COALESCE(up.full_name, '') as full_name,
        COALESCE(up.avatar_url, '') as avatar_url,
        COALESCE(up.phone, '') as phone,
        COALESCE(up.address, '') as address,
        COALESCE(au.email, 'admin@medcure.com') as email
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON au.id = up.user_id
    WHERE au.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get business settings with defaults
CREATE OR REPLACE FUNCTION public.get_business_settings_with_defaults(p_user_id UUID)
RETURNS TABLE (
    business_name VARCHAR(255),
    logo_url TEXT,
    tagline VARCHAR(500),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    primary_color VARCHAR(7),
    website VARCHAR(255),
    registration_number VARCHAR(100),
    tax_id VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(bs.business_name, 'MedCure Pharmacy') as business_name,
        COALESCE(bs.logo_url, '') as logo_url,
        COALESCE(bs.tagline, 'Your Trusted Healthcare Partner') as tagline,
        COALESCE(bs.address, '') as address,
        COALESCE(bs.phone, '') as phone,
        COALESCE(bs.email, '') as email,
        COALESCE(bs.primary_color, '#2563eb') as primary_color,
        COALESCE(bs.website, '') as website,
        COALESCE(bs.registration_number, '') as registration_number,
        COALESCE(bs.tax_id, '') as tax_id
    FROM public.business_settings bs
    WHERE bs.user_id = p_user_id
    
    UNION ALL
    
    SELECT 
        'MedCure Pharmacy' as business_name,
        '' as logo_url,
        'Your Trusted Healthcare Partner' as tagline,
        '' as address,
        '' as phone,
        '' as email,
        '#2563eb' as primary_color,
        '' as website,
        '' as registration_number,
        '' as tax_id
    WHERE NOT EXISTS (
        SELECT 1 FROM public.business_settings WHERE user_id = p_user_id
    )
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions for settings functions
GRANT EXECUTE ON FUNCTION public.get_user_profile_with_defaults(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_settings_with_defaults(UUID) TO authenticated;

-- =====================================================
-- 9. VERIFICATION QUERIES
-- =====================================================

-- Check if buckets were created successfully
SELECT 
    'STORAGE_BUCKETS' as check_type,
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id IN ('avatars', 'business-assets');

-- Check if policies were created
SELECT 
    'STORAGE_POLICIES' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%avatar%' OR policyname LIKE '%business%';

-- =====================================================
-- 10. SUMMARY REPORT
-- =====================================================

SELECT 
    'STORAGE_SETUP_COMPLETE' as report_type,
    'Storage buckets and policies created successfully' as message,
    'User profiles and business settings tables ready' as tables_status,
    NOW() as setup_completed_at;

/*
🔐 STORAGE BUCKETS SETUP COMPLETED 🔐

BUCKETS CREATED:
✅ avatars - For user profile pictures (5MB limit)
✅ business-assets - For business logos/documents (10MB limit)

POLICIES CREATED:
✅ Avatar upload/view/update/delete policies
✅ Business asset management policies
✅ Row Level Security for user data

TABLES READY:
✅ user_profiles - User profile information
✅ business_settings - Business configuration

FUNCTIONS AVAILABLE:
✅ get_user_profile_with_defaults()
✅ get_business_settings_with_defaults()

Your settings system storage is now fully configured!
*/
