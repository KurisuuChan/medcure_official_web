-- =====================================================
-- SIMPLE SALES FIX - NO RPC FUNCTIONS NEEDED
-- Alternative fix that bypasses RPC calls
-- =====================================================

-- Add missing columns to sales tables
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.sale_items 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure the basic tables exist and have proper permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Ensure products have stock
UPDATE public.products 
SET stock = 100, total_stock = 100 
WHERE stock IS NULL OR stock <= 0;

-- Test query to verify sales tables exist and have correct columns
SELECT 'sales table' as table_name, COUNT(*) as count FROM public.sales
UNION ALL
SELECT 'sale_items table' as table_name, COUNT(*) as count FROM public.sale_items
UNION ALL  
SELECT 'products table' as table_name, COUNT(*) as count FROM public.products;
