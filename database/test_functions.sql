-- =====================================================
-- MEDCURE - TEST DATABASE FUNCTIONS
-- Run this after the main fix script to verify everything works
-- =====================================================

-- Test 1: Check if all functions exist
SELECT 'Testing Functions' as test_section;

SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'decrement_stock', 
    'process_sale_transaction', 
    'get_sales_analytics', 
    'get_expiring_soon_products',
    'bulk_update_stock',
    'get_user_notifications',
    'get_notification_stats'
  )
ORDER BY routine_name;

-- Test 2: Test notification functions
SELECT 'Testing Notification Functions' as test_section;

-- Test get_user_notifications (should return empty result but no error)
SELECT COUNT(*) as notification_count 
FROM public.get_user_notifications();

-- Test get_notification_stats (should return zero counts but no error)
SELECT * FROM public.get_notification_stats();

-- Test 3: Check if products can be queried properly
SELECT 'Testing Product Queries' as test_section;

-- Count total products
SELECT COUNT(*) as total_products FROM public.products;

-- Count archived products
SELECT COUNT(*) as archived_products FROM public.products WHERE is_archived = true;

-- Count active products
SELECT COUNT(*) as active_products FROM public.products WHERE is_archived = false OR is_archived IS NULL;

-- Test 4: Check if views exist
SELECT 'Testing Views' as test_section;

SELECT table_name, table_type 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN ('products_enhanced', 'sales_with_items');

-- Test 5: Test products_enhanced view if it exists
SELECT 'Testing Products Enhanced View' as test_section;

DO $$
BEGIN
    -- Try to query the view
    PERFORM 1 FROM public.products_enhanced LIMIT 1;
    RAISE NOTICE 'products_enhanced view is working!';
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'products_enhanced view issue: %', SQLERRM;
END $$;

-- Final status
SELECT 
    '=== ALL TESTS COMPLETED ===' as status,
    NOW() as completed_at;
