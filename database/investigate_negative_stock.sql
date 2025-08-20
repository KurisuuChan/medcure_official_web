-- =====================================================
-- Investigation: How Stock Became Negative
-- MedCure Pharmacy Management System
-- =====================================================

-- This script investigates the root causes of negative stock values
-- and helps identify patterns to prevent future occurrences

-- =============================
-- 1. CURRENT NEGATIVE STOCK ANALYSIS
-- =============================

-- Find all products with negative stock and their details
SELECT 
    'NEGATIVE_STOCK_PRODUCTS' as investigation_type,
    p.id,
    p.name,
    p.category,
    p.total_stock,
    p.cost_price,
    p.selling_price,
    p.critical_level,
    p.created_at,
    p.updated_at,
    -- Calculate how long ago it was updated
    EXTRACT(DAY FROM (NOW() - p.updated_at)) as days_since_update
FROM products p
WHERE p.total_stock < 0
ORDER BY p.total_stock ASC, p.updated_at DESC;

-- =============================
-- 2. SALES TRANSACTION ANALYSIS
-- =============================

-- Check sales that might have caused overselling
WITH negative_products AS (
    SELECT id, name, total_stock FROM products WHERE total_stock < 0
),
suspect_sales AS (
    SELECT 
        s.id as sale_id,
        s.created_at as sale_date,
        s.total as sale_total,
        s.payment_method,
        si.product_id,
        si.quantity as sold_quantity,
        si.unit_price,
        p.name as product_name,
        p.total_stock as current_stock
    FROM sales s
    JOIN sale_items si ON s.id = si.sale_id
    JOIN negative_products p ON si.product_id = p.id
    WHERE s.created_at >= (NOW() - INTERVAL '30 days')
    ORDER BY s.created_at DESC
)
SELECT 
    'RECENT_SALES_ON_NEGATIVE_PRODUCTS' as investigation_type,
    *
FROM suspect_sales;

-- =============================
-- 3. SALES VOLUME VS STOCK ANALYSIS
-- =============================

-- Analyze total sales volume vs current stock for negative products
WITH negative_products AS (
    SELECT id, name, total_stock FROM products WHERE total_stock < 0
),
sales_analysis AS (
    SELECT 
        si.product_id,
        p.name,
        p.total_stock,
        SUM(si.quantity) as total_sold_all_time,
        COUNT(DISTINCT s.id) as total_transactions,
        SUM(CASE WHEN s.created_at >= (NOW() - INTERVAL '7 days') THEN si.quantity ELSE 0 END) as sold_last_7_days,
        SUM(CASE WHEN s.created_at >= (NOW() - INTERVAL '30 days') THEN si.quantity ELSE 0 END) as sold_last_30_days,
        MAX(s.created_at) as last_sale_date
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN negative_products p ON si.product_id = p.id
    GROUP BY si.product_id, p.name, p.total_stock
)
SELECT 
    'SALES_VOLUME_ANALYSIS' as investigation_type,
    *,
    -- Calculate theoretical stock if starting from 0
    (0 - total_sold_all_time) as theoretical_stock_if_started_zero,
    -- Flag products that might have inventory import issues
    CASE 
        WHEN total_sold_all_time < ABS(total_stock) THEN 'POSSIBLE_IMPORT_ISSUE'
        WHEN total_sold_all_time > ABS(total_stock) THEN 'OVERSELLING_ISSUE'
        ELSE 'EXACT_MATCH'
    END as likely_cause
FROM sales_analysis
ORDER BY total_sold_all_time DESC;

-- =============================
-- 4. BULK OPERATIONS ANALYSIS
-- =============================

-- Check if any bulk updates might have caused negative stock
-- (This requires checking application logs, but we can check for unusual patterns)

-- Look for products that went from positive to negative quickly
SELECT 
    'RAPID_STOCK_CHANGES' as investigation_type,
    p.id,
    p.name,
    p.total_stock,
    p.updated_at,
    -- Count sales in the last day
    (
        SELECT COUNT(*)
        FROM sale_items si 
        JOIN sales s ON si.sale_id = s.id
        WHERE si.product_id = p.id 
        AND s.created_at >= (p.updated_at - INTERVAL '1 day')
    ) as sales_near_update_time
FROM products p
WHERE p.total_stock < 0
AND p.updated_at >= (NOW() - INTERVAL '7 days');

-- =============================
-- 5. INVENTORY ADJUSTMENT TRACKING
-- =============================

-- If you have inventory adjustment logs, check those
-- (Create this table if it doesn't exist for future tracking)
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    old_stock INTEGER,
    new_stock INTEGER,
    adjustment_type VARCHAR(50), -- 'SALE', 'RESTOCK', 'ADJUSTMENT', 'CORRECTION'
    adjustment_reason TEXT,
    user_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Check recent adjustments that might explain negative stock
SELECT 
    'INVENTORY_ADJUSTMENTS' as investigation_type,
    ia.*,
    p.name as product_name,
    p.total_stock as current_stock
FROM inventory_adjustments ia
JOIN products p ON ia.product_id = p.id
WHERE p.total_stock < 0
ORDER BY ia.created_at DESC;

-- =============================
-- 6. CONCURRENT TRANSACTION ANALYSIS
-- =============================

-- Look for simultaneous sales that might have caused race conditions
WITH concurrent_sales AS (
    SELECT 
        si1.product_id,
        p.name,
        s1.created_at as sale1_time,
        s2.created_at as sale2_time,
        si1.quantity as sale1_qty,
        si2.quantity as sale2_qty,
        ABS(EXTRACT(SECONDS FROM (s1.created_at - s2.created_at))) as seconds_apart
    FROM sale_items si1
    JOIN sales s1 ON si1.sale_id = s1.id
    JOIN sale_items si2 ON si1.product_id = si2.product_id AND si1.sale_id != si2.sale_id
    JOIN sales s2 ON si2.sale_id = s2.id
    JOIN products p ON si1.product_id = p.id
    WHERE p.total_stock < 0
    AND ABS(EXTRACT(SECONDS FROM (s1.created_at - s2.created_at))) < 10 -- Within 10 seconds
)
SELECT 
    'CONCURRENT_SALES' as investigation_type,
    product_id,
    name,
    sale1_time,
    sale2_time,
    sale1_qty,
    sale2_qty,
    seconds_apart,
    (sale1_qty + sale2_qty) as total_qty_sold_concurrently
FROM concurrent_sales
ORDER BY seconds_apart ASC;

-- =============================
-- 7. PATTERN ANALYSIS
-- =============================

-- Identify patterns in negative stock occurrences
SELECT 
    'PATTERN_ANALYSIS' as investigation_type,
    
    -- By category
    COUNT(*) FILTER (WHERE total_stock < 0) as negative_count,
    COUNT(*) as total_products,
    ROUND(
        (COUNT(*) FILTER (WHERE total_stock < 0) * 100.0 / COUNT(*)), 2
    ) as negative_percentage,
    
    -- By price range
    CASE 
        WHEN selling_price < 10 THEN 'LOW_PRICE'
        WHEN selling_price < 50 THEN 'MEDIUM_PRICE'
        ELSE 'HIGH_PRICE'
    END as price_category,
    
    category
    
FROM products
GROUP BY 
    CASE 
        WHEN selling_price < 10 THEN 'LOW_PRICE'
        WHEN selling_price < 50 THEN 'MEDIUM_PRICE'
        ELSE 'HIGH_PRICE'
    END,
    category
ORDER BY negative_percentage DESC;

-- =============================
-- 8. SYSTEM INTEGRITY CHECKS
-- =============================

-- Check for orphaned sale items (sales without valid products)
SELECT 
    'ORPHANED_SALES' as investigation_type,
    si.id as sale_item_id,
    si.sale_id,
    si.product_id,
    si.quantity,
    s.created_at as sale_date
FROM sale_items si
JOIN sales s ON si.sale_id = s.id
LEFT JOIN products p ON si.product_id = p.id
WHERE p.id IS NULL;

-- Check for negative quantities in sale_items
SELECT 
    'NEGATIVE_SALE_QUANTITIES' as investigation_type,
    si.*,
    s.created_at as sale_date,
    p.name as product_name
FROM sale_items si
JOIN sales s ON si.sale_id = s.id
LEFT JOIN products p ON si.product_id = p.id
WHERE si.quantity < 0;

-- =============================
-- 9. RECOMMENDATIONS
-- =============================

SELECT 
    'RECOMMENDATIONS' as section,
    'Based on this investigation, consider implementing:' as recommendation,
    CASE 
        WHEN EXISTS(SELECT 1 FROM products WHERE total_stock < 0) THEN
            ARRAY[
                '1. Add database constraints to prevent negative stock',
                '2. Implement proper inventory locking during transactions',
                '3. Add audit logging for all stock changes',
                '4. Regular stock reconciliation processes',
                '5. Real-time stock validation in POS system',
                '6. Backup/restore procedures for inventory data'
            ]
        ELSE 
            ARRAY['No negative stock found - system appears healthy']
    END as action_items;

-- =============================
-- 10. SUMMARY REPORT
-- =============================

SELECT 
    'SUMMARY_REPORT' as report_type,
    (SELECT COUNT(*) FROM products WHERE total_stock < 0) as products_with_negative_stock,
    (SELECT COUNT(*) FROM products) as total_products,
    (SELECT SUM(ABS(total_stock)) FROM products WHERE total_stock < 0) as total_deficit_pieces,
    (SELECT MAX(ABS(total_stock)) FROM products WHERE total_stock < 0) as worst_deficit,
    NOW() as investigation_completed_at;
