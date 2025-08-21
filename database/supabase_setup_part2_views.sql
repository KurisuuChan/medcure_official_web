-- =====================================================
-- SUPABASE-COMPATIBLE SCHEMA SETUP - PART 2: VIEWS
-- Run this after Part 1
-- =====================================================

-- Create products_enhanced view
DROP VIEW IF EXISTS public.products_enhanced;
CREATE VIEW public.products_enhanced AS
SELECT 
    p.*,
    CASE 
        WHEN p.stock <= 0 THEN 'Out of Stock'
        WHEN p.stock <= COALESCE(p.reorder_level, 10) THEN 'Low Stock'
        ELSE 'In Stock'
    END as stock_status,
    p.stock as current_stock,
    p.stock as total_stock,
    CASE 
        WHEN p.expiry_date IS NULL THEN 'No Expiry Data'
        WHEN p.expiry_date <= CURRENT_DATE THEN 'Expired'
        WHEN p.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring Soon'
        ELSE 'Good'
    END as expiry_status
FROM public.products p
WHERE (p.is_archived = FALSE OR p.is_archived IS NULL);

-- Grant permissions on the view
GRANT SELECT ON public.products_enhanced TO anon, authenticated;
