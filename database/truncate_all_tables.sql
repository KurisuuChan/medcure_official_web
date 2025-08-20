-- =====================================================
-- Truncate All Tables Script
-- MedCure Pharmacy Management System
-- =====================================================

-- WARNING: This script will permanently delete ALL DATA from all tables.
-- Table structures will remain intact, but all records will be removed.
-- This action is IRREVERSIBLE. Make sure to backup your data first!

-- =====================================================
-- 1. BACKUP VERIFICATION
-- =====================================================

-- Check current record counts before truncation
SELECT 
    'BEFORE_TRUNCATION' as status,
    'products' as table_name, 
    COUNT(*) as record_count 
FROM products

UNION ALL

SELECT 
    'BEFORE_TRUNCATION' as status,
    'sales' as table_name, 
    COUNT(*) as record_count 
FROM sales

UNION ALL

SELECT 
    'BEFORE_TRUNCATION' as status,
    'sale_items' as table_name, 
    COUNT(*) as record_count 
FROM sale_items

UNION ALL

SELECT 
    'BEFORE_TRUNCATION' as status,
    'notifications' as table_name, 
    COUNT(*) as record_count 
FROM notifications

UNION ALL

SELECT 
    'BEFORE_TRUNCATION' as status,
    'app_settings' as table_name, 
    COUNT(*) as record_count 
FROM app_settings

UNION ALL

SELECT 
    'BEFORE_TRUNCATION' as status,
    'archive_logs' as table_name, 
    COUNT(*) as record_count 
FROM archive_logs
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'archive_logs')

UNION ALL

SELECT 
    'BEFORE_TRUNCATION' as status,
    'stock_audit_log' as table_name, 
    COUNT(*) as record_count 
FROM stock_audit_log
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_audit_log')

ORDER BY table_name;

-- =====================================================
-- 2. DISABLE FOREIGN KEY CONSTRAINTS TEMPORARILY
-- =====================================================

-- Disable triggers to prevent constraint violations during truncation
SET session_replication_role = replica;

-- =====================================================
-- 3. TRUNCATE TABLES IN CORRECT ORDER
-- =====================================================

-- Start with child tables (those with foreign keys) first
-- Then move to parent tables

-- 3.1 Truncate sale_items first (child of sales and products)
TRUNCATE TABLE sale_items RESTART IDENTITY CASCADE;

-- 3.2 Truncate sales (parent of sale_items, child of none)
TRUNCATE TABLE sales RESTART IDENTITY CASCADE;

-- 3.3 Truncate products (parent table, referenced by sale_items)
TRUNCATE TABLE products RESTART IDENTITY CASCADE;

-- 3.4 Truncate notifications (independent table)
TRUNCATE TABLE notifications RESTART IDENTITY CASCADE;

-- 3.5 Truncate app_settings (independent table)
TRUNCATE TABLE app_settings RESTART IDENTITY CASCADE;

-- 3.6 Truncate audit tables (if they exist)
TRUNCATE TABLE archive_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE stock_audit_log RESTART IDENTITY CASCADE;

-- 3.7 Truncate any remaining backup or utility tables
TRUNCATE TABLE products_backup_before_stock_fix RESTART IDENTITY CASCADE;
TRUNCATE TABLE inventory_adjustments RESTART IDENTITY CASCADE;

-- =====================================================
-- 4. RE-ENABLE FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- =====================================================
-- 5. RESET SEQUENCES (Auto-increment IDs)
-- =====================================================

-- Reset all sequences to start from 1
ALTER SEQUENCE products_id_seq RESTART WITH 1;
ALTER SEQUENCE sales_id_seq RESTART WITH 1;
ALTER SEQUENCE sale_items_id_seq RESTART WITH 1;
ALTER SEQUENCE notifications_id_seq RESTART WITH 1;

-- Reset audit log sequences if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'archive_logs_id_seq') THEN
        ALTER SEQUENCE archive_logs_id_seq RESTART WITH 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'stock_audit_log_id_seq') THEN
        ALTER SEQUENCE stock_audit_log_id_seq RESTART WITH 1;
    END IF;
END $$;

-- =====================================================
-- 6. VERIFICATION - Check Empty Tables
-- =====================================================

-- Verify all tables are now empty
SELECT 
    'AFTER_TRUNCATION' as status,
    'products' as table_name, 
    COUNT(*) as record_count 
FROM products

UNION ALL

SELECT 
    'AFTER_TRUNCATION' as status,
    'sales' as table_name, 
    COUNT(*) as record_count 
FROM sales

UNION ALL

SELECT 
    'AFTER_TRUNCATION' as status,
    'sale_items' as table_name, 
    COUNT(*) as record_count 
FROM sale_items

UNION ALL

SELECT 
    'AFTER_TRUNCATION' as status,
    'notifications' as table_name, 
    COUNT(*) as record_count 
FROM notifications

UNION ALL

SELECT 
    'AFTER_TRUNCATION' as status,
    'app_settings' as table_name, 
    COUNT(*) as record_count 
FROM app_settings

UNION ALL

SELECT 
    'AFTER_TRUNCATION' as status,
    'archive_logs' as table_name, 
    COUNT(*) as record_count 
FROM archive_logs
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'archive_logs')

UNION ALL

SELECT 
    'AFTER_TRUNCATION' as status,
    'stock_audit_log' as table_name, 
    COUNT(*) as record_count 
FROM stock_audit_log
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_audit_log')

ORDER BY table_name;

-- =====================================================
-- 7. SUMMARY REPORT
-- =====================================================

SELECT 
    'TRUNCATION_COMPLETE' as report_type,
    'All tables have been truncated successfully' as message,
    'Table structures preserved, all data removed' as status,
    'Sequences reset to start from 1' as sequence_status,
    NOW() as truncation_completed_at;

-- =====================================================
-- 8. POST-TRUNCATION NOTES
-- =====================================================

/*
🔥 TRUNCATION COMPLETED 🔥

WHAT WAS DONE:
✅ All table data deleted (structures preserved)
✅ Foreign key constraints handled properly
✅ Auto-increment sequences reset to 1
✅ All relationships maintained

TABLES TRUNCATED:
📋 products - All inventory data removed
📋 sales - All transaction records removed
📋 sale_items - All transaction items removed
📋 notifications - All alerts cleared
📋 app_settings - All settings cleared
📋 archive_logs - All archive history cleared
📋 stock_audit_log - All audit trails cleared

NEXT STEPS:
1. Import fresh data if needed
2. Configure app_settings for your business
3. Add initial product inventory
4. Set up notification preferences

⚠️  IMPORTANT: This action cannot be undone!
If you need the data back, restore from your backup.
*/
