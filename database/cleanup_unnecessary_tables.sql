-- =====================================================
-- Database Cleanup: Remove Unnecessary Tables
-- MedCure Pharmacy Management System
-- =====================================================

-- WARNING: This script will permanently delete tables and data.
-- Run this only after confirming you want to remove these tables.

-- =====================================================
-- 1. BACKUP CHECK (Optional - for safety)
-- =====================================================

-- Check what data exists in tables we're about to remove
SELECT 'products_backup_before_stock_fix' as table_name, COUNT(*) as record_count
FROM products_backup_before_stock_fix
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products_backup_before_stock_fix')

UNION ALL

SELECT 'inventory_adjustments' as table_name, COUNT(*) as record_count  
FROM inventory_adjustments
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_adjustments');

-- =====================================================
-- 2. REMOVE TEMPORARY BACKUP TABLE
-- =====================================================

-- Remove the temporary backup table created during stock fixes
DROP TABLE IF EXISTS products_backup_before_stock_fix CASCADE;

-- =====================================================
-- 3. REMOVE UNUSED INVENTORY ADJUSTMENTS TABLE
-- =====================================================

-- This table is not used in the current codebase
-- If you want to keep historical data, export it first
DROP TABLE IF EXISTS inventory_adjustments CASCADE;

-- =====================================================
-- 4. VERIFY REMAINING ESSENTIAL TABLES
-- =====================================================

-- List all remaining tables to confirm cleanup
SELECT 
    table_name,
    table_type,
    CASE 
        WHEN table_name IN ('products', 'sales', 'sale_items') THEN 'CORE_BUSINESS'
        WHEN table_name IN ('notifications', 'app_settings') THEN 'CONFIGURATION'
        WHEN table_name IN ('archive_logs', 'stock_audit_log') THEN 'AUDIT_LOGGING'
        WHEN table_name LIKE '%view' THEN 'MONITORING_VIEW'
        ELSE 'OTHER'
    END as table_category
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_category, table_name;

-- =====================================================
-- 5. VERIFY VIEWS ARE STILL INTACT
-- =====================================================

-- Check that essential views still exist
SELECT 
    table_name as view_name,
    'VIEW' as object_type
FROM information_schema.views 
WHERE table_schema = 'public'
    AND table_name IN ('stock_monitoring_view', 'stock_health_view')
ORDER BY table_name;

-- =====================================================
-- 6. SUMMARY REPORT
-- =====================================================

SELECT 
    'CLEANUP_SUMMARY' as report_type,
    'Removed unnecessary backup and unused tables' as action_taken,
    'Essential business tables preserved' as status,
    NOW() as cleanup_completed_at;

-- =====================================================
-- 7. POST-CLEANUP RECOMMENDATIONS
-- =====================================================

/*
ESSENTIAL TABLES PRESERVED:
✅ products - Core inventory management
✅ sales - Transaction records  
✅ sale_items - Individual sale items
✅ notifications - Alert system
✅ app_settings - Business configuration
✅ archive_logs - Archive audit trail
✅ stock_audit_log - Stock change tracking

VIEWS PRESERVED:
✅ stock_monitoring_view - Real-time monitoring
✅ stock_health_view - Stock status classification

REMOVED TABLES:
❌ products_backup_before_stock_fix - Temporary backup
❌ inventory_adjustments - Unused feature

Your database is now optimized with only essential tables!
*/
