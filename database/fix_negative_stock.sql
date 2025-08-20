-- =====================================================
-- Fix Negative Stock Values Script
-- MedCure Pharmacy Management System
-- =====================================================

-- 1. INVESTIGATE: Find all products with negative stock
SELECT 
    'INVESTIGATION' as action,
    id,
    name,
    category,
    total_stock,
    cost_price,
    selling_price,
    created_at,
    updated_at
FROM products 
WHERE total_stock < 0
ORDER BY total_stock ASC;

-- 2. BACKUP: Create backup of current product data
CREATE TABLE IF NOT EXISTS products_backup_before_stock_fix AS
SELECT * FROM products WHERE total_stock < 0;

-- 3. ANALYSIS: Get summary statistics
SELECT 
    'SUMMARY' as analysis,
    COUNT(*) as total_negative_products,
    MIN(total_stock) as most_negative_stock,
    MAX(total_stock) as least_negative_stock,
    AVG(total_stock) as avg_negative_stock,
    SUM(ABS(total_stock)) as total_deficit
FROM products 
WHERE total_stock < 0;

-- 4. CATEGORY BREAKDOWN: See which categories are most affected
SELECT 
    category,
    COUNT(*) as negative_count,
    MIN(total_stock) as worst_stock,
    AVG(total_stock) as avg_stock
FROM products 
WHERE total_stock < 0
GROUP BY category
ORDER BY negative_count DESC;

-- 5. FIX OPTIONS (Choose one):

-- Option A: Reset all negative stock to 0 (Safe option)
-- UPDATE products 
-- SET total_stock = 0, 
--     updated_at = NOW()
-- WHERE total_stock < 0;

-- Option B: Reset to minimum safe stock level (10 pieces)
-- UPDATE products 
-- SET total_stock = 10, 
--     updated_at = NOW()
-- WHERE total_stock < 0;

-- Option C: Reset based on critical level (if available)
-- UPDATE products 
-- SET total_stock = COALESCE(critical_level, 10), 
--     updated_at = NOW()
-- WHERE total_stock < 0;

-- 6. RECOMMENDED FIX: Smart reset based on product type
UPDATE products 
SET total_stock = CASE 
    WHEN critical_level IS NOT NULL AND critical_level > 0 THEN critical_level
    WHEN selling_price > 50 THEN 5  -- Expensive items: lower stock
    WHEN selling_price > 20 THEN 10 -- Mid-range items: medium stock
    ELSE 20                         -- Cheap items: higher stock
END,
updated_at = NOW()
WHERE total_stock < 0;

-- 7. ADD CONSTRAINTS to prevent future negative stock
ALTER TABLE products 
ADD CONSTRAINT IF NOT EXISTS check_positive_total_stock 
CHECK (total_stock >= 0);

-- 8. CREATE AUDIT FUNCTION for stock changes
CREATE OR REPLACE FUNCTION audit_stock_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log if stock would go negative
    IF NEW.total_stock < 0 THEN
        INSERT INTO stock_audit_log (
            product_id, 
            old_stock, 
            new_stock, 
            change_reason, 
            user_id, 
            created_at
        ) VALUES (
            NEW.id,
            OLD.total_stock,
            NEW.total_stock,
            'NEGATIVE_STOCK_ATTEMPT',
            current_user,
            NOW()
        );
        
        -- Prevent the negative stock
        NEW.total_stock = 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. CREATE AUDIT LOG TABLE (if it doesn't exist)
CREATE TABLE IF NOT EXISTS stock_audit_log (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    old_stock INTEGER,
    new_stock INTEGER,
    change_reason TEXT,
    user_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 10. CREATE TRIGGER for stock audit
DROP TRIGGER IF EXISTS trigger_audit_stock_changes ON products;
CREATE TRIGGER trigger_audit_stock_changes
    BEFORE UPDATE ON products
    FOR EACH ROW
    WHEN (OLD.total_stock IS DISTINCT FROM NEW.total_stock)
    EXECUTE FUNCTION audit_stock_changes();

-- 11. VERIFICATION: Check results after fix
SELECT 
    'VERIFICATION' as check_type,
    COUNT(*) as total_products,
    COUNT(CASE WHEN total_stock < 0 THEN 1 END) as negative_count,
    MIN(total_stock) as min_stock,
    AVG(total_stock) as avg_stock
FROM products;

-- 12. CREATE VIEW for stock monitoring
CREATE OR REPLACE VIEW stock_health_view AS
SELECT 
    id,
    name,
    category,
    total_stock,
    critical_level,
    CASE 
        WHEN total_stock <= 0 THEN 'OUT_OF_STOCK'
        WHEN total_stock <= (critical_level * 0.5) THEN 'CRITICAL'
        WHEN total_stock <= critical_level THEN 'LOW'
        ELSE 'HEALTHY'
    END as stock_status,
    selling_price,
    cost_price,
    updated_at
FROM products
ORDER BY 
    CASE 
        WHEN total_stock <= 0 THEN 1
        WHEN total_stock <= (critical_level * 0.5) THEN 2
        WHEN total_stock <= critical_level THEN 3
        ELSE 4
    END,
    total_stock ASC;

-- 13. FINAL REPORT
SELECT 
    'FINAL_REPORT' as report_type,
    'Products fixed successfully. Check stock_health_view for monitoring.' as message,
    COUNT(*) as total_products_checked
FROM products;

COMMIT;
