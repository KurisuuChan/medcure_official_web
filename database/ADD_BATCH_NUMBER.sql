-- =====================================================
-- ADD ALL MISSING COLUMNS TO PRODUCTS TABLE
-- Complete fix for current database schema
-- =====================================================

-- Add batch_number column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS batch_number CHARACTER VARYING;

-- Add critical_level column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS critical_level INTEGER DEFAULT 10;

-- Add other missing columns that might be referenced in frontend
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS generic_name CHARACTER VARYING;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 10;

-- Add expiry_date column (frontend uses both expiration_date and expiry_date)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_products_batch_number 
ON public.products(batch_number) 
WHERE batch_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_critical_level 
ON public.products(critical_level);

CREATE INDEX IF NOT EXISTS idx_products_generic_name 
ON public.products(generic_name) 
WHERE generic_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_expiry_date 
ON public.products(expiry_date) 
WHERE expiry_date IS NOT NULL;

-- Verify all columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public' 
AND column_name IN ('batch_number', 'critical_level', 'generic_name', 'reorder_level', 'expiry_date')
ORDER BY column_name;

SELECT 'All missing product columns added successfully!' as status;
