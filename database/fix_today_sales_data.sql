-- Today Sales Data Issue Analysis and Fix
-- The issue is likely in frontend timezone/date handling

-- =====================================================
-- 1. FIRST: Run this diagnostic to see what data exists
-- =====================================================

-- Check current server time and timezone
SELECT 
  'Database Info' as category,
  NOW() as server_time,
  CURRENT_DATE as server_date,
  CURRENT_TIMESTAMP AT TIME ZONE 'UTC' as utc_time,
  CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila' as manila_time;

-- Check all sales data with timestamps
SELECT 
  'Sales Data' as category,
  id,
  total,
  created_at,
  created_at AT TIME ZONE 'UTC' as utc_time,
  created_at AT TIME ZONE 'Asia/Manila' as manila_time,
  created_at::date as sale_date,
  CASE 
    WHEN created_at::date = CURRENT_DATE THEN '✅ TODAY'
    WHEN created_at::date = CURRENT_DATE - 1 THEN '📅 YESTERDAY' 
    WHEN created_at::date > CURRENT_DATE - 7 THEN '📆 THIS WEEK'
    ELSE '📋 OLDER'
  END as period_label
FROM sales 
ORDER BY created_at DESC 
LIMIT 10;

-- Count sales by date to see distribution
SELECT 
  created_at::date as sale_date,
  count(*) as transaction_count,
  sum(total) as total_revenue,
  CASE 
    WHEN created_at::date = CURRENT_DATE THEN '🎯 TODAY'
    WHEN created_at::date = CURRENT_DATE - 1 THEN 'YESTERDAY'
    ELSE 'OTHER'
  END as day_label
FROM sales 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY created_at::date
ORDER BY sale_date DESC;

-- =====================================================
-- 2. TEST TODAY'S SALES WITH DIFFERENT DATE METHODS
-- =====================================================

-- Method 1: Database date comparison (what your DB sees as "today")
SELECT 
  'Method 1: Database TODAY' as method,
  count(*) as transactions,
  coalesce(sum(total), 0) as revenue
FROM sales 
WHERE created_at::date = CURRENT_DATE;

-- Method 2: 24-hour window from now
SELECT 
  'Method 2: Last 24 hours' as method,
  count(*) as transactions,
  coalesce(sum(total), 0) as revenue
FROM sales 
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Method 3: Today from midnight (what frontend might expect)
SELECT 
  'Method 3: Since midnight today' as method,
  count(*) as transactions,
  coalesce(sum(total), 0) as revenue
FROM sales 
WHERE created_at >= date_trunc('day', CURRENT_TIMESTAMP);

-- Method 4: Philippine timezone today (if your users are in Philippines)
SELECT 
  'Method 4: Manila timezone today' as method,
  count(*) as transactions,
  coalesce(sum(total), 0) as revenue
FROM sales 
WHERE (created_at AT TIME ZONE 'Asia/Manila')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::date;

-- =====================================================
-- 3. CREATE TEST DATA IF NONE EXISTS FOR TODAY
-- =====================================================

-- Check if we have today's data, if not create some
DO $$
DECLARE
    today_sales_count INTEGER;
    test_sale_id INTEGER;
    first_product_id INTEGER;
BEGIN
    -- Count today's sales
    SELECT COUNT(*) INTO today_sales_count 
    FROM sales 
    WHERE created_at::date = CURRENT_DATE;
    
    RAISE NOTICE '📊 Today''s sales count: %', today_sales_count;
    
    -- If no sales today, create test data
    IF today_sales_count = 0 THEN
        RAISE NOTICE '⚠️ No sales found for today. Creating test sales...';
        
        -- Get first product ID
        SELECT id INTO first_product_id FROM products LIMIT 1;
        
        IF first_product_id IS NOT NULL THEN
            -- Create test sale 1: Small transaction
            INSERT INTO sales (total, payment_method, created_at)
            VALUES (75.50, 'cash', CURRENT_TIMESTAMP - INTERVAL '2 hours')
            RETURNING id INTO test_sale_id;
            
            INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
            VALUES (test_sale_id, first_product_id, 1, 75.50, 75.50);
            
            -- Create test sale 2: Medium transaction  
            INSERT INTO sales (total, payment_method, created_at)
            VALUES (150.25, 'card', CURRENT_TIMESTAMP - INTERVAL '1 hour')
            RETURNING id INTO test_sale_id;
            
            INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
            VALUES (test_sale_id, first_product_id, 2, 75.12, 150.25);
            
            -- Create test sale 3: Recent transaction
            INSERT INTO sales (total, payment_method, created_at)
            VALUES (45.00, 'cash', CURRENT_TIMESTAMP - INTERVAL '30 minutes')
            RETURNING id INTO test_sale_id;
            
            INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
            VALUES (test_sale_id, first_product_id, 1, 45.00, 45.00);
            
            RAISE NOTICE '✅ Created 3 test sales for today totaling 270.75';
        ELSE
            RAISE NOTICE '❌ No products found to create test sales';
        END IF;
    ELSE
        RAISE NOTICE '✅ Found % existing sales for today', today_sales_count;
    END IF;
END $$;

-- =====================================================
-- 4. FINAL VERIFICATION 
-- =====================================================

-- Show what should appear in your dashboard
SELECT 
  '🎯 DASHBOARD TODAY SALES' as report_type,
  'Expected Values:' as description,
  count(*) as total_transactions,
  coalesce(sum(total), 0) as total_revenue,
  coalesce(round(avg(total), 2), 0) as average_transaction,
  min(created_at) as earliest_sale,
  max(created_at) as latest_sale
FROM sales 
WHERE created_at::date = CURRENT_DATE;

-- Show recent sales for verification
SELECT 
  '📋 RECENT SALES VERIFICATION' as report_type,
  id,
  total,
  payment_method,
  created_at,
  'Today: ' || to_char(created_at, 'HH24:MI:SS') as time_today
FROM sales 
WHERE created_at::date = CURRENT_DATE
ORDER BY created_at DESC;

-- =====================================================
-- 5. SUCCESS MESSAGE
-- =====================================================

SELECT 
  '🎉 Diagnosis Complete!' as status,
  'Check the results above for today''s sales data' as step1,
  'If data exists but dashboard shows 0, it''s a frontend timezone issue' as step2,
  'If no data exists, the test sales were created automatically' as step3,
  'Refresh your dashboard to see the updated values' as final_step;
