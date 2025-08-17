-- Supabase Storage Setup for MedCure
-- Run these commands in Supabase SQL Editor

-- 1. Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('logos', 'logos', true),
  ('avatars', 'avatars', true),
  ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up Row Level Security policies for storage

-- Allow public read access to logos
CREATE POLICY "Public read access for logos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'logos');

-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload logos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- Allow public read access to avatars
CREATE POLICY "Public read access for avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Allow public read access to product images
CREATE POLICY "Public read access for products" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'products');

-- Allow authenticated users to upload product images
CREATE POLICY "Authenticated users can upload products" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');
