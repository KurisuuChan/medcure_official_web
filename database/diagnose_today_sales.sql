-- Dashboard Today Sales Diagnostic and Fix Script
-- Run this in your Supabase SQL Editor to diagnose and fix today's sales data

-- =====================================================
-- 1. DETAILED DIAGNOSTICS FOR TODAY'S SALES
-- =====================================================

-- Check current date and timezone
SELECT 
  'Current Database Time' as info,
  NOW() as db_time,
  CURRENT_DATE as db_date,
  CURRENT_TIMESTAMP as db_timestamp;

-- Check timezone settings
SELECT 
  'Database Timezone' as info,
  SHOW timezone as timezone;

-- Check all sales data with detailed timestamps
SELECT 
  'All Sales Data' as info,
  id,
  total,
  created_at,
  created_at::date as sale_date,
  CASE 
    WHEN created_at::date = CURRENT_DATE THEN 'TODAY'
    WHEN created_at::date = CURRENT_DATE - 1 THEN 'YESTERDAY'
    ELSE 'OLDER'
  END as period
FROM sales 
ORDER BY created_at DESC
LIMIT 20;

-- Check today's sales specifically (multiple timezone approaches)
SELECT 
  'Today Sales (CURRENT_DATE)' as method,
  count(*) as transactions,
  coalesce(sum(total), 0) as revenue
FROM sales 
WHERE created_at::date = CURRENT_DATE;

SELECT 
  'Today Sales (>= CURRENT_DATE)' as method,
  count(*) as transactions,
  coalesce(sum(total), 0) as revenue
FROM sales 
WHERE created_at >= CURRENT_DATE;

SELECT 
  'Today Sales (>= today start)' as method,
  count(*) as transactions,
  coalesce(sum(total), 0) as revenue
FROM sales 
WHERE created_at >= date_trunc('day', CURRENT_TIMESTAMP);

-- Check for any sales in the last 24 hours
SELECT 
  'Last 24 Hours' as method,
  count(*) as transactions,
  coalesce(sum(total), 0) as revenue
FROM sales 
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Check for any sales this week
SELECT 
  'This Week' as method,
  count(*) as transactions,
  coalesce(sum(total), 0) as revenue
FROM sales 
WHERE created_at >= date_trunc('week', CURRENT_TIMESTAMP);

-- =====================================================
-- 2. CHECK SALE_ITEMS DATA
-- =====================================================

-- Check if sale_items exist for recent sales
SELECT 
  s.id as sale_id,
  s.total as sale_total,
  s.created_at,
  count(si.id) as item_count,
  coalesce(sum(si.subtotal), 0) as items_total
FROM sales s
LEFT JOIN sale_items si ON s.id = si.sale_id
WHERE s.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY s.id, s.total, s.created_at
ORDER BY s.created_at DESC
LIMIT 10;

-- =====================================================
-- 3. CHECK TIMEZONE ISSUES
-- =====================================================

-- Create test data with different timezone approaches (if no data exists)
-- Only run this if you have no sales data for today

-- First check if we have any recent sales at all
DO $$
DECLARE
    recent_sales_count INTEGER;
    test_sale_id INTEGER;
BEGIN
    -- Count recent sales
    SELECT COUNT(*) INTO recent_sales_count 
    FROM sales 
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
    
    RAISE NOTICE 'Recent sales count (last 7 days): %', recent_sales_count;
    
    -- If no recent sales, create a test sale for today
    IF recent_sales_count = 0 THEN
        RAISE NOTICE 'No recent sales found. Creating test sale for today...';
        
        -- Insert a test sale for today
        INSERT INTO sales (total, payment_method, created_at)
        VALUES (100.00, 'cash', CURRENT_TIMESTAMP)
        RETURNING id INTO test_sale_id;
        
        -- Insert test sale items
        INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
        SELECT 
            test_sale_id,
            p.id,
            1,
            50.00,
            50.00
        FROM products p 
        LIMIT 2;
        
        RAISE NOTICE 'Test sale created with ID: %', test_sale_id;
    ELSE
        RAISE NOTICE 'Recent sales exist, no test data needed';
    END IF;
END $$;

-- =====================================================
-- 4. CHECK FRONTEND DATE HANDLING
-- =====================================================

-- Test different date formats that your frontend might be using
SELECT 
  'Date Format Test' as test,
  CURRENT_DATE as current_date,
  CURRENT_DATE::text as date_string,
  to_char(CURRENT_DATE, 'YYYY-MM-DD') as iso_date,
  extract(epoch from CURRENT_DATE) as epoch_start,
  extract(epoch from CURRENT_DATE + INTERVAL '1 day') as epoch_end;

-- Check sales with different date comparison methods your frontend might use
SELECT 
  'Frontend Date Methods' as test_type,
  'Method 1: created_at::date = CURRENT_DATE' as method,
  count(*) as count,
  sum(total) as revenue
FROM sales 
WHERE created_at::date = CURRENT_DATE
UNION ALL
SELECT 
  'Frontend Date Methods' as test_type,
  'Method 2: created_at >= today AND < tomorrow' as method,
  count(*) as count,
  sum(total) as revenue
FROM sales 
WHERE created_at >= CURRENT_DATE 
  AND created_at < CURRENT_DATE + INTERVAL '1 day'
UNION ALL
SELECT 
  'Frontend Date Methods' as test_type,
  'Method 3: DATE(created_at) = CURRENT_DATE' as method,
  count(*) as count,
  sum(total) as revenue
FROM sales 
WHERE DATE(created_at) = CURRENT_DATE;

-- =====================================================
-- 5. VERIFICATION AND RECOMMENDATIONS
-- =====================================================

-- Final verification of today's data
SELECT 
  '=== TODAY\'S SALES SUMMARY ===' as summary,
  CURRENT_DATE as date,
  count(*) as total_transactions,
  coalesce(sum(total), 0) as total_revenue,
  coalesce(avg(total), 0) as average_transaction,
  min(created_at) as first_sale_today,
  max(created_at) as last_sale_today
FROM sales 
WHERE created_at::date = CURRENT_DATE;

-- Show what your dashboard service should return
SELECT 
  'EXPECTED DASHBOARD DATA' as label,
  json_build_object(
    'totalRevenue', coalesce(sum(total), 0),
    'totalTransactions', count(*),
    'averageTransaction', CASE WHEN count(*) > 0 THEN sum(total)/count(*) ELSE 0 END,
    'date', CURRENT_DATE,
    'period', 'today'
  ) as dashboard_data
FROM sales 
WHERE created_at::date = CURRENT_DATE;

-- =====================================================
-- 6. SUCCESS MESSAGE AND NEXT STEPS
-- =====================================================

SELECT 
  '🔍 Diagnosis Complete!' as status,
  'Check the results above to see if today''s sales data exists' as step1,
  'If data exists but dashboard shows wrong values, it''s a frontend timezone issue' as step2,
  'If no data exists, create some test sales through your POS system' as step3;
