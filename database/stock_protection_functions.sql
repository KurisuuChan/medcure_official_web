-- =====================================================
-- Database Functions for Stock Protection
-- MedCure Pharmacy Management System
-- =====================================================

-- 1. SAFE STOCK DEDUCTION FUNCTION
-- Atomically deducts stock while preventing negative values
CREATE OR REPLACE FUNCTION safe_stock_deduction(
    product_id INTEGER,
    quantity_to_deduct INTEGER
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    old_stock INTEGER,
    new_stock INTEGER,
    deducted INTEGER
) AS $$
DECLARE
    current_stock INTEGER;
    actual_deducted INTEGER;
BEGIN
    -- Get current stock with row lock
    SELECT total_stock INTO current_stock
    FROM products 
    WHERE id = product_id
    FOR UPDATE;
    
    -- Check if product exists
    IF current_stock IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Product not found', NULL::INTEGER, NULL::INTEGER, 0;
        RETURN;
    END IF;
    
    -- Check if already negative
    IF current_stock < 0 THEN
        RETURN QUERY SELECT FALSE, 'Product already has negative stock', current_stock, current_stock, 0;
        RETURN;
    END IF;
    
    -- Calculate actual deduction (prevent going negative)
    actual_deducted := LEAST(quantity_to_deduct, current_stock);
    
    -- Update stock
    UPDATE products 
    SET total_stock = current_stock - actual_deducted,
        updated_at = NOW()
    WHERE id = product_id;
    
    -- Return result
    RETURN QUERY SELECT 
        TRUE, 
        CASE 
            WHEN actual_deducted = quantity_to_deduct THEN 'Stock updated successfully'
            ELSE 'Partial deduction - insufficient stock'
        END,
        current_stock,
        current_stock - actual_deducted,
        actual_deducted;
END;
$$ LANGUAGE plpgsql;

-- 2. ENHANCED PROCESS SALE TRANSACTION WITH STOCK VALIDATION
CREATE OR REPLACE FUNCTION process_sale_transaction_safe(
    sale_total DECIMAL(10,2),
    payment_method TEXT,
    sale_items JSONB
)
RETURNS TABLE (
    sale_id INTEGER,
    sale_total_out DECIMAL(10,2),
    payment_method_out TEXT,
    created_at TIMESTAMP,
    items_processed INTEGER,
    inventory_updated BOOLEAN,
    validation_errors TEXT[]
) AS $$
DECLARE
    new_sale_id INTEGER;
    item JSONB;
    product_record RECORD;
    validation_errors TEXT[] := '{}';
    items_count INTEGER := 0;
    stock_deduction_result RECORD;
BEGIN
    -- Start transaction
    BEGIN
        -- Validate all items first
        FOR item IN SELECT * FROM jsonb_array_elements(sale_items)
        LOOP
            -- Get product info
            SELECT id, name, total_stock, archived_at
            INTO product_record
            FROM products 
            WHERE id = (item->>'product_id')::INTEGER;
            
            -- Validation checks
            IF product_record.id IS NULL THEN
                validation_errors := validation_errors || ARRAY['Product ID ' || (item->>'product_id') || ' not found'];
                CONTINUE;
            END IF;
            
            IF product_record.archived_at IS NOT NULL THEN
                validation_errors := validation_errors || ARRAY['Product ' || product_record.name || ' is archived'];
                CONTINUE;
            END IF;
            
            IF product_record.total_stock < 0 THEN
                validation_errors := validation_errors || ARRAY['Product ' || product_record.name || ' has negative stock'];
                CONTINUE;
            END IF;
            
            IF (item->>'quantity')::INTEGER > product_record.total_stock THEN
                validation_errors := validation_errors || ARRAY['Insufficient stock for ' || product_record.name || '. Requested: ' || (item->>'quantity') || ', Available: ' || product_record.total_stock];
                CONTINUE;
            END IF;
        END LOOP;
        
        -- If validation errors exist, return them
        IF array_length(validation_errors, 1) > 0 THEN
            RETURN QUERY SELECT 
                NULL::INTEGER,
                NULL::DECIMAL(10,2),
                NULL::TEXT,
                NULL::TIMESTAMP,
                0,
                FALSE,
                validation_errors;
            RETURN;
        END IF;
        
        -- Create the sale record
        INSERT INTO sales (total, payment_method, created_at)
        VALUES (sale_total, payment_method, NOW())
        RETURNING id INTO new_sale_id;
        
        -- Process each item with safe stock deduction
        FOR item IN SELECT * FROM jsonb_array_elements(sale_items)
        LOOP
            -- Use safe stock deduction
            SELECT * INTO stock_deduction_result
            FROM safe_stock_deduction(
                (item->>'product_id')::INTEGER,
                (item->>'quantity')::INTEGER
            );
            
            -- Check if deduction was successful
            IF NOT stock_deduction_result.success THEN
                RAISE EXCEPTION 'Stock deduction failed for product ID %: %', 
                    (item->>'product_id'), stock_deduction_result.message;
            END IF;
            
            -- Insert sale item
            INSERT INTO sale_items (
                sale_id,
                product_id,
                quantity,
                unit_price,
                subtotal,
                variant_info
            ) VALUES (
                new_sale_id,
                (item->>'product_id')::INTEGER,
                stock_deduction_result.deducted, -- Use actual deducted amount
                (item->>'unit_price')::DECIMAL(10,2),
                (item->>'subtotal')::DECIMAL(10,2),
                COALESCE(item->'variant_info', '{}'::JSONB)
            );
            
            items_count := items_count + 1;
        END LOOP;
        
        -- Return success result
        RETURN QUERY SELECT 
            new_sale_id,
            sale_total,
            payment_method,
            NOW(),
            items_count,
            TRUE,
            '{}'::TEXT[];
            
    EXCEPTION WHEN OTHERS THEN
        -- Rollback is automatic, return error
        RETURN QUERY SELECT 
            NULL::INTEGER,
            NULL::DECIMAL(10,2),
            NULL::TEXT,
            NULL::TIMESTAMP,
            0,
            FALSE,
            ARRAY['Transaction failed: ' || SQLERRM];
    END;
END;
$$ LANGUAGE plpgsql;

-- 3. STOCK RECONCILIATION FUNCTION
CREATE OR REPLACE FUNCTION reconcile_negative_stock()
RETURNS TABLE (
    product_id INTEGER,
    product_name TEXT,
    old_stock INTEGER,
    new_stock INTEGER,
    action_taken TEXT
) AS $$
DECLARE
    product_record RECORD;
    new_stock_value INTEGER;
BEGIN
    FOR product_record IN 
        SELECT id, name, total_stock, critical_level, selling_price
        FROM products 
        WHERE total_stock < 0
    LOOP
        -- Determine appropriate stock level
        new_stock_value := CASE 
            WHEN product_record.critical_level IS NOT NULL AND product_record.critical_level > 0 
                THEN product_record.critical_level
            WHEN product_record.selling_price > 50 THEN 5
            WHEN product_record.selling_price > 20 THEN 10
            ELSE 20
        END;
        
        -- Update the stock
        UPDATE products 
        SET total_stock = new_stock_value,
            updated_at = NOW()
        WHERE id = product_record.id;
        
        -- Log the reconciliation
        INSERT INTO stock_audit_log (
            product_id,
            old_stock,
            new_stock,
            change_reason,
            user_id
        ) VALUES (
            product_record.id,
            product_record.total_stock,
            new_stock_value,
            'AUTOMATED_RECONCILIATION',
            'system'
        );
        
        -- Return the result
        RETURN QUERY SELECT 
            product_record.id,
            product_record.name,
            product_record.total_stock,
            new_stock_value,
            'Stock reset to safe level';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. STOCK MONITORING VIEW WITH ALERTS
CREATE OR REPLACE VIEW stock_monitoring_view AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.total_stock,
    p.critical_level,
    p.selling_price,
    p.updated_at,
    
    -- Stock status classification
    CASE 
        WHEN p.total_stock < 0 THEN 'NEGATIVE'
        WHEN p.total_stock = 0 THEN 'OUT_OF_STOCK'
        WHEN p.total_stock <= (p.critical_level * 0.5) THEN 'CRITICAL'
        WHEN p.total_stock <= p.critical_level THEN 'LOW'
        WHEN p.total_stock <= (p.critical_level * 2) THEN 'ADEQUATE'
        ELSE 'HEALTHY'
    END as stock_status,
    
    -- Alert priority
    CASE 
        WHEN p.total_stock < 0 THEN 1
        WHEN p.total_stock = 0 THEN 2
        WHEN p.total_stock <= (p.critical_level * 0.5) THEN 3
        WHEN p.total_stock <= p.critical_level THEN 4
        ELSE 5
    END as alert_priority,
    
    -- Recent sales activity
    (
        SELECT COALESCE(SUM(si.quantity), 0)
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE si.product_id = p.id
        AND s.created_at >= (NOW() - INTERVAL '7 days')
    ) as sold_last_7_days,
    
    -- Days since last sale
    (
        SELECT EXTRACT(DAY FROM (NOW() - MAX(s.created_at)))
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE si.product_id = p.id
    ) as days_since_last_sale

FROM products p
WHERE p.archived_at IS NULL
ORDER BY alert_priority ASC, p.total_stock ASC;

-- 5. AUTOMATIC STOCK ALERT FUNCTION
CREATE OR REPLACE FUNCTION generate_stock_alerts()
RETURNS TABLE (
    alert_type TEXT,
    product_id INTEGER,
    product_name TEXT,
    current_stock INTEGER,
    recommended_action TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN total_stock < 0 THEN 'NEGATIVE_STOCK'
            WHEN total_stock = 0 THEN 'OUT_OF_STOCK'
            WHEN total_stock <= (critical_level * 0.5) THEN 'CRITICAL_LOW'
            WHEN total_stock <= critical_level THEN 'LOW_STOCK'
        END as alert_type,
        id as product_id,
        name as product_name,
        total_stock as current_stock,
        CASE 
            WHEN total_stock < 0 THEN 'URGENT: Fix negative stock immediately'
            WHEN total_stock = 0 THEN 'URGENT: Restock immediately'
            WHEN total_stock <= (critical_level * 0.5) THEN 'HIGH: Order stock soon'
            WHEN total_stock <= critical_level THEN 'MEDIUM: Plan restock'
        END as recommended_action
    FROM products
    WHERE archived_at IS NULL
    AND (
        total_stock < 0 OR
        total_stock = 0 OR
        total_stock <= critical_level
    )
    ORDER BY 
        CASE 
            WHEN total_stock < 0 THEN 1
            WHEN total_stock = 0 THEN 2
            WHEN total_stock <= (critical_level * 0.5) THEN 3
            ELSE 4
        END,
        total_stock ASC;
END;
$$ LANGUAGE plpgsql;

-- 6. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(total_stock) WHERE total_stock <= 0;
CREATE INDEX IF NOT EXISTS idx_products_critical_stock ON products(total_stock, critical_level) WHERE total_stock <= critical_level;
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_date ON sale_items(product_id, sale_id);

-- Grant permissions
GRANT EXECUTE ON FUNCTION safe_stock_deduction TO anon, authenticated;
GRANT EXECUTE ON FUNCTION process_sale_transaction_safe TO anon, authenticated;
GRANT EXECUTE ON FUNCTION reconcile_negative_stock TO authenticated;
GRANT EXECUTE ON FUNCTION generate_stock_alerts TO anon, authenticated;
GRANT SELECT ON stock_monitoring_view TO anon, authenticated;
