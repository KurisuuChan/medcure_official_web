-- Supabase Setup Script for MedCure Products Table
-- Run this in your Supabase SQL Editor

-- 1. Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for public access (since this is a pharmacy catalog)
-- Allow anyone to read products
CREATE POLICY "Public can view products" ON products
    FOR SELECT USING (true);

-- Allow anyone to insert products (for demo/management)
CREATE POLICY "Public can insert products" ON products
    FOR INSERT WITH CHECK (true);

-- Allow anyone to update products
CREATE POLICY "Public can update products" ON products
    FOR UPDATE USING (true);

-- Allow anyone to delete products
CREATE POLICY "Public can delete products" ON products
    FOR DELETE USING (true);

-- 3. Grant additional permissions to anon role
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- 4. Verify the setup
SELECT 
    schemaname, 
    tablename, 
    hasinserts, 
    hasselects, 
    hasupdates, 
    hasdeletes 
FROM pg_tables 
LEFT JOIN pg_class ON pg_class.relname = pg_tables.tablename 
LEFT JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace 
WHERE tablename = 'products';

-- 5. Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'products';
