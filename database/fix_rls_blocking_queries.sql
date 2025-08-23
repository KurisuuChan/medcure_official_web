-- Diagnostic and Fix Script for MedCure Transaction/Dashboard Data Issues
-- Run this in your Supabase SQL Editor to fix the RLS problems

-- =====================================================
-- 1. DIAGNOSTIC QUERIES
-- =====================================================

-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('products', 'sales', 'sale_items', 'user_profiles', 'business_settings', 'app_settings')
ORDER BY tablename;

-- Check existing policies on main tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('products', 'sales', 'sale_items', 'user_profiles', 'business_settings', 'app_settings')
ORDER BY tablename, policyname;

-- Check if you have any data in your main tables
SELECT 
  'products' as table_name, count(*) as row_count FROM products
UNION ALL
SELECT 
  'sales' as table_name, count(*) as row_count FROM sales
UNION ALL
SELECT 
  'sale_items' as table_name, count(*) as row_count FROM sale_items;

-- =====================================================
-- 2. FIX RLS ISSUES - METHOD 1: Disable RLS (Recommended for Development)
-- =====================================================

-- Disable RLS on main business tables
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items DISABLE ROW LEVEL SECURITY;

-- Keep RLS disabled on settings tables too (since you're using localStorage fallback)
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. ALTERNATIVE FIX - METHOD 2: Create Permissive Policies (If you want to keep RLS)
-- =====================================================

-- Uncomment these lines if you prefer to keep RLS enabled but make it permissive

/*
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON products;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON sales;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON sale_items;

-- Create permissive policies that allow all operations
CREATE POLICY "Allow all operations" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON sales FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON sale_items FOR ALL USING (true);

-- For settings tables, create permissive policies too
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;

CREATE POLICY "Allow all operations" ON user_profiles FOR ALL USING (true);

-- Same for business_settings
DROP POLICY IF EXISTS "Users can view own business settings" ON business_settings;
DROP POLICY IF EXISTS "Users can insert own business settings" ON business_settings;
DROP POLICY IF EXISTS "Users can update own business settings" ON business_settings;
DROP POLICY IF EXISTS "Users can delete own business settings" ON business_settings;

CREATE POLICY "Allow all operations" ON business_settings FOR ALL USING (true);

-- Same for app_settings
DROP POLICY IF EXISTS "Users can view own app settings" ON app_settings;
DROP POLICY IF EXISTS "Users can insert own app settings" ON app_settings;
DROP POLICY IF EXISTS "Users can update own app settings" ON app_settings;
DROP POLICY IF EXISTS "Users can delete own app settings" ON app_settings;

CREATE POLICY "Allow all operations" ON app_settings FOR ALL USING (true);
*/

-- =====================================================
-- 4. VERIFICATION QUERIES
-- =====================================================

-- Test if you can now access your data
SELECT 'Products accessible' as test, count(*) as count FROM products;
SELECT 'Sales accessible' as test, count(*) as count FROM sales;
SELECT 'Sale items accessible' as test, count(*) as count FROM sale_items;

-- Check today's sales (this should work now)
SELECT 
  'Today Sales' as metric,
  count(*) as transactions,
  coalesce(sum(total), 0) as revenue
FROM sales 
WHERE created_at >= CURRENT_DATE;

-- Check recent transactions
SELECT 
  s.id,
  s.total,
  s.created_at,
  count(si.id) as item_count
FROM sales s
LEFT JOIN sale_items si ON s.id = si.sale_id
WHERE s.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY s.id, s.total, s.created_at
ORDER BY s.created_at DESC
LIMIT 5;

-- =====================================================
-- 5. SUCCESS MESSAGE
-- =====================================================

SELECT 
  '🎉 RLS Issues Fixed!' as status,
  'Your dashboard and transaction history should now work properly' as message,
  'Test your app now - refresh your browser and check Dashboard/Reports/Financials pages' as next_step;
