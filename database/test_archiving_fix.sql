-- =====================================================
-- TEST ARCHIVING FUNCTIONALITY
-- Run this in Supabase SQL Editor to verify archiving works
-- =====================================================

-- 1. Check current product statuses
SELECT 
    'Current Products' as test_type,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE is_archived = true) as archived_count,
    COUNT(*) FILTER (WHERE is_archived = false OR is_archived IS NULL) as active_count
FROM public.products;

-- 2. Show sample of each type
SELECT 
    'ACTIVE PRODUCTS' as category,
    id, name, is_archived, archived_date, archive_reason
FROM public.products 
WHERE is_archived = false OR is_archived IS NULL
ORDER BY name
LIMIT 5;

SELECT 
    'ARCHIVED PRODUCTS' as category,
    id, name, is_archived, archived_date, archive_reason
FROM public.products 
WHERE is_archived = true
ORDER BY archived_date DESC
LIMIT 5;

-- 3. Test what Management page will see (non-archived products)
SELECT 
    'MANAGEMENT PAGE VIEW' as test_type,
    COUNT(*) as visible_products
FROM public.products 
WHERE is_archived = false OR is_archived IS NULL;

-- 4. Test what Archived page will see (archived products)
SELECT 
    'ARCHIVED PAGE VIEW' as test_type,
    COUNT(*) as visible_products  
FROM public.products 
WHERE is_archived = true;

-- 5. Test the enhanced view (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'products_enhanced') THEN
        RAISE NOTICE 'Testing products_enhanced view...';
        PERFORM COUNT(*) FROM public.products_enhanced;
        RAISE NOTICE 'products_enhanced view works correctly';
    ELSE
        RAISE NOTICE 'products_enhanced view does not exist yet - run the fix script first';
    END IF;
END $$;

-- 6. If you want to test archiving a product manually:
-- UPDATE public.products 
-- SET 
--     is_archived = true,
--     archived_date = NOW(),
--     archived_by = 'Test User',
--     archive_reason = 'Testing archiving functionality',
--     updated_at = NOW()
-- WHERE id = 1; -- Replace 1 with actual product ID

-- 7. Check archive logs (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'archive_logs') THEN
        RAISE NOTICE 'Archive logs table exists';
        PERFORM COUNT(*) FROM public.archive_logs;
    ELSE
        RAISE NOTICE 'Archive logs table does not exist';
    END IF;
END $$;
