-- =====================================================
-- Test Archive Delete Functionality
-- MedCure Pharmacy Management System
-- =====================================================

-- 1. SETUP: Create test archived products
INSERT INTO products (
    name, category, cost_price, selling_price, total_stock, 
    is_archived, archived_date, archived_by, archive_reason
) VALUES 
    ('Test Product 1', 'Test Category', 10.00, 15.00, 0, true, NOW(), 'Test User', 'Test deletion'),
    ('Test Product 2', 'Test Category', 20.00, 25.00, 0, true, NOW(), 'Test User', 'Test deletion'),
    ('Test Product 3', 'Test Category', 30.00, 35.00, 0, true, NOW(), 'Test User', 'Test deletion')
ON CONFLICT (name) DO NOTHING;

-- 2. VERIFY: Check archived products exist
SELECT 
    'ARCHIVED_PRODUCTS_CHECK' as test_name,
    id, name, is_archived, archived_date
FROM products 
WHERE name LIKE 'Test Product%' 
AND (is_archived = true OR archived_at IS NOT NULL)
ORDER BY name;

-- 3. TEST: Individual delete simulation
-- Get a test product ID
SELECT 
    'INDIVIDUAL_DELETE_TEST' as test_name,
    id as product_id_to_delete,
    name
FROM products 
WHERE name = 'Test Product 1'
AND (is_archived = true OR archived_at IS NOT NULL);

-- 4. TEST: Bulk delete simulation
-- Get test product IDs for bulk delete
SELECT 
    'BULK_DELETE_TEST' as test_name,
    array_agg(id) as product_ids_to_delete,
    count(*) as product_count
FROM products 
WHERE name LIKE 'Test Product%'
AND (is_archived = true OR archived_at IS NOT NULL);

-- 5. VALIDATION: Check archive log functionality
-- Verify archive_logs table exists
SELECT 
    'ARCHIVE_LOG_TABLE_CHECK' as test_name,
    EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'archive_logs'
    ) as archive_logs_table_exists;

-- If archive_logs table doesn't exist, let's create it
CREATE TABLE IF NOT EXISTS archive_logs (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    item_id INTEGER,
    item_name TEXT,
    reason TEXT,
    archived_by TEXT,
    original_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. TEST: Verify delete constraints
-- Check if any foreign key constraints would prevent deletion
SELECT 
    'FOREIGN_KEY_CONSTRAINTS_CHECK' as test_name,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND (tc.table_name = 'products' OR ccu.table_name = 'products')
ORDER BY tc.table_name, tc.constraint_name;

-- 7. TEST: Check for dependent data
-- Check if test products have any sales or other dependencies
SELECT 
    'PRODUCT_DEPENDENCIES_CHECK' as test_name,
    p.id as product_id,
    p.name,
    COUNT(si.id) as sale_items_count
FROM products p
LEFT JOIN sale_items si ON p.id = si.product_id
WHERE p.name LIKE 'Test Product%'
GROUP BY p.id, p.name
ORDER BY p.name;

-- 8. PERFORMANCE TEST: Simulate bulk operations
-- Test bulk delete performance with EXPLAIN
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id FROM products 
WHERE name LIKE 'Test Product%'
AND (is_archived = true OR archived_at IS NOT NULL);

-- 9. CLEANUP: Remove test products (uncomment when ready to clean up)
/*
DELETE FROM products 
WHERE name LIKE 'Test Product%';
*/

-- 10. FINAL VALIDATION
SELECT 
    'ARCHIVE_FUNCTIONALITY_SUMMARY' as test_name,
    COUNT(*) FILTER (WHERE is_archived = true OR archived_at IS NOT NULL) as archived_products_count,
    COUNT(*) FILTER (WHERE is_archived = false AND archived_at IS NULL) as active_products_count,
    COUNT(*) as total_products
FROM products;

-- Test Results Summary
SELECT 
    'TEST_SUMMARY' as section,
    'Archive delete functionality tests completed' as message,
    NOW() as test_completed_at;
