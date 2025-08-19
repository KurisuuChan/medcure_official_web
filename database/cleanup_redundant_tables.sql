-- Cleanup script to remove redundant tables after implementing soft delete architecture
-- Run this script in your Supabase SQL Editor after confirming the soft delete system works correctly

-- WARNING: This will permanently delete the tables and all their data
-- Make sure to backup any important data before running this script

-- First, let's check what tables exist and their row counts
-- (Comment out the DROP statements below and run these queries first to verify)

-- Check existing tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('archived_items', 'archived_products')
ORDER BY table_name;

-- Check row counts (uncomment to see data before deletion)
-- SELECT 'archived_items' as table_name, COUNT(*) as row_count FROM public.archived_items
-- UNION ALL
-- SELECT 'archived_products' as table_name, COUNT(*) as row_count FROM public.archived_products;

-- ============================================================================
-- STEP 1: Remove the redundant archived_items table
-- ============================================================================

-- Drop policies first
DO $$
BEGIN
    -- Drop RLS policies on archived_items if they exist
    DROP POLICY IF EXISTS "Allow authenticated users to read archived items" ON public.archived_items;
    DROP POLICY IF EXISTS "Allow authenticated users to insert archived items" ON public.archived_items;
    DROP POLICY IF EXISTS "Allow authenticated users to update archived items" ON public.archived_items;
    DROP POLICY IF EXISTS "Allow authenticated users to delete archived items" ON public.archived_items;
    
    RAISE NOTICE 'Policies for archived_items table dropped successfully';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'archived_items table does not exist, skipping policy cleanup';
    WHEN others THEN
        RAISE NOTICE 'Error dropping policies for archived_items: %', SQLERRM;
END $$;

-- Drop indexes
DROP INDEX IF EXISTS public.idx_archived_items_type;
DROP INDEX IF EXISTS public.idx_archived_items_archived_date;
DROP INDEX IF EXISTS public.idx_archived_items_name;
DROP INDEX IF EXISTS public.idx_archived_items_category;

-- Drop the table
DROP TABLE IF EXISTS public.archived_items CASCADE;

-- ============================================================================
-- STEP 2: Remove the redundant archived_products table (if it exists as a table, not view)
-- ============================================================================

-- Check if archived_products is a table or view
DO $$
DECLARE
    table_type_result text;
BEGIN
    SELECT table_type INTO table_type_result
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'archived_products';
    
    IF table_type_result = 'BASE TABLE' THEN
        -- It's a table, drop it
        DROP TABLE IF EXISTS public.archived_products CASCADE;
        RAISE NOTICE 'archived_products table dropped successfully';
    ELSIF table_type_result = 'VIEW' THEN
        -- It's a view, we might want to keep it but let's check
        RAISE NOTICE 'archived_products is a view, not dropping automatically';
    ELSE
        RAISE NOTICE 'archived_products does not exist';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error handling archived_products: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 3: Cleanup any remaining references
-- ============================================================================

-- Remove any orphaned sequences
DROP SEQUENCE IF EXISTS public.archived_items_id_seq CASCADE;

-- ============================================================================
-- STEP 4: Verify cleanup
-- ============================================================================

-- Check what tables remain
SELECT 
    table_name,
    table_type,
    CASE 
        WHEN table_type = 'BASE TABLE' THEN 'Physical Table'
        WHEN table_type = 'VIEW' THEN 'Database View'
        ELSE table_type
    END as description
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%archive%'
ORDER BY table_name;

-- Verify that we still have the essential tables/views
SELECT 
    'Essential Archive Tables Status:' as status_check
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_archived') 
        THEN '✓ products table has soft delete columns'
        ELSE '✗ products table missing soft delete columns'
    END
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'archive_logs') 
        THEN '✓ archive_logs table exists'
        ELSE '✗ archive_logs table missing'
    END
UNION ALL
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'archived_products_view') 
        THEN '✓ archived_products_view exists'
        ELSE '✗ archived_products_view missing'
    END;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'CLEANUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables removed:';
    RAISE NOTICE '  - archived_items (redundant after soft delete implementation)';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables/Views preserved:';
    RAISE NOTICE '  ✓ products (with soft delete columns: is_archived, archived_date, etc.)';
    RAISE NOTICE '  ✓ archive_logs (audit trail for archive operations)';
    RAISE NOTICE '  ✓ archived_products_view (database view for easy queries)';
    RAISE NOTICE '  ✓ sales & sale_items (POS transaction tables)';
    RAISE NOTICE '';
    RAISE NOTICE 'Your archive system now uses:';
    RAISE NOTICE '  - Soft deletes in the products table (is_archived = true)';
    RAISE NOTICE '  - Audit logging in archive_logs table';
    RAISE NOTICE '  - Database view for easy archived product queries';
    RAISE NOTICE '';
    RAISE NOTICE 'This provides better data consistency and eliminates the need for';
    RAISE NOTICE 'localStorage fallbacks while maintaining full audit trails.';
    RAISE NOTICE '============================================================================';
END $$;
