-- =====================================================
-- EMERGENCY FIX: ADD MISSING PRODUCT COLUMNS
-- Run this immediately to fix the batch_number error
-- =====================================================

-- Add all missing columns that the frontend is trying to use
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS generic_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS critical_level INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update existing records
UPDATE public.products SET is_active = TRUE WHERE is_active IS NULL;
UPDATE public.products SET critical_level = 10 WHERE critical_level IS NULL;
UPDATE public.products SET reorder_level = 10 WHERE reorder_level IS NULL;
