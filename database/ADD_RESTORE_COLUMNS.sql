-- =====================================================
-- ADD RESTORE COLUMNS TO PRODUCTS TABLE
-- Fix for archive restore functionality
-- =====================================================

-- Add restored_date column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS restored_date TIMESTAMP WITH TIME ZONE;

-- Add restored_by column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS restored_by VARCHAR;

-- Create indexes for the new columns (optional but recommended for performance)
CREATE INDEX IF NOT EXISTS idx_products_restored_date 
ON public.products(restored_date) 
WHERE restored_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_restored_by 
ON public.products(restored_by) 
WHERE restored_by IS NOT NULL;

-- Success message
SELECT 'Restore columns added successfully to products table!' as status;
