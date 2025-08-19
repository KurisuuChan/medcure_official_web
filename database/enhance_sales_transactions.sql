-- =====================================================
-- Enhanced Sales Transaction Functions for MedCure
-- Implements atomic sales transactions with proper error handling
-- =====================================================

-- 1. CREATE ATOMIC SALES TRANSACTION FUNCTION
-- This ensures all operations succeed or fail together
CREATE OR REPLACE FUNCTION process_sale_transaction(
    sale_total DECIMAL(10,2),
    payment_method TEXT,
    sale_items JSONB
)
RETURNS TABLE(
    sale_id BIGINT,
    sale_total DECIMAL(10,2),
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    items_processed INTEGER,
    inventory_updated BOOLEAN
) AS $$
DECLARE
    new_sale_id BIGINT;
    item JSONB;
    product_record RECORD;
    items_count INTEGER := 0;
    current_stock INTEGER;
BEGIN
    -- Validate input
    IF sale_total <= 0 THEN
        RAISE EXCEPTION 'Sale total must be greater than 0';
    END IF;
    
    IF jsonb_array_length(sale_items) = 0 THEN
        RAISE EXCEPTION 'Sale must contain at least one item';
    END IF;
    
    -- Start transaction (this function itself runs in a transaction)
    -- 1. Create the sale record
    INSERT INTO sales (total, payment_method, created_at)
    VALUES (sale_total, payment_method, NOW())
    RETURNING id INTO new_sale_id;
    
    -- 2. Process each sale item
    FOR item IN SELECT * FROM jsonb_array_elements(sale_items)
    LOOP
        -- Validate item structure
        IF NOT (item ? 'product_id' AND item ? 'quantity' AND item ? 'unit_price' AND item ? 'subtotal') THEN
            RAISE EXCEPTION 'Invalid item structure. Missing required fields.';
        END IF;
        
        -- Get current product info and lock the row
        SELECT id, name, total_stock, is_archived 
        INTO product_record
        FROM products 
        WHERE id = (item->>'product_id')::BIGINT 
        AND is_archived = false
        FOR UPDATE;
        
        -- Check if product exists and is not archived
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product ID % not found or is archived', item->>'product_id';
        END IF;
        
        current_stock := product_record.total_stock;
        
        -- Validate stock availability
        IF current_stock < (item->>'quantity')::INTEGER THEN
            RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Required: %', 
                product_record.name, current_stock, (item->>'quantity')::INTEGER;
        END IF;
        
        -- Insert sale item
        INSERT INTO sale_items (
            sale_id, 
            product_id, 
            quantity, 
            unit_price, 
            subtotal,
            variant_info,
            created_at
        ) VALUES (
            new_sale_id,
            (item->>'product_id')::BIGINT,
            (item->>'quantity')::INTEGER,
            (item->>'unit_price')::DECIMAL(10,2),
            (item->>'subtotal')::DECIMAL(10,2),
            COALESCE(item->'variant_info', '{}'::jsonb),
            NOW()
        );
        
        -- Update product stock atomically
        UPDATE products 
        SET 
            total_stock = total_stock - (item->>'quantity')::INTEGER,
            stock = stock - (item->>'quantity')::INTEGER,
            updated_at = NOW()
        WHERE id = (item->>'product_id')::BIGINT;
        
        items_count := items_count + 1;
    END LOOP;
    
    -- Return successful transaction details
    RETURN QUERY
    SELECT 
        new_sale_id,
        sale_total,
        process_sale_transaction.payment_method,
        NOW(),
        items_count,
        true;
END;
$$ LANGUAGE plpgsql;

-- 2. CREATE SALE VALIDATION FUNCTION
-- Validates sale data before processing
CREATE OR REPLACE FUNCTION validate_sale_data(
    sale_items JSONB
)
RETURNS TABLE(
    is_valid BOOLEAN,
    error_message TEXT,
    validation_details JSONB
) AS $$
DECLARE
    item JSONB;
    product_record RECORD;
    validation_errors TEXT[] := '{}';
    total_items INTEGER := 0;
    calculated_total DECIMAL(10,2) := 0;
    stock_issues JSONB := '[]'::jsonb;
BEGIN
    -- Check if items array is valid
    IF sale_items IS NULL OR jsonb_array_length(sale_items) = 0 THEN
        RETURN QUERY SELECT false, 'No items provided', '{}'::jsonb;
        RETURN;
    END IF;
    
    -- Validate each item
    FOR item IN SELECT * FROM jsonb_array_elements(sale_items)
    LOOP
        total_items := total_items + 1;
        
        -- Check required fields
        IF NOT (item ? 'product_id' AND item ? 'quantity' AND item ? 'unit_price' AND item ? 'subtotal') THEN
            validation_errors := array_append(validation_errors, 
                format('Item %s: Missing required fields', total_items));
            CONTINUE;
        END IF;
        
        -- Validate quantity
        IF (item->>'quantity')::INTEGER <= 0 THEN
            validation_errors := array_append(validation_errors,
                format('Item %s: Quantity must be greater than 0', total_items));
        END IF;
        
        -- Validate prices
        IF (item->>'unit_price')::DECIMAL(10,2) < 0 THEN
            validation_errors := array_append(validation_errors,
                format('Item %s: Unit price cannot be negative', total_items));
        END IF;
        
        IF (item->>'subtotal')::DECIMAL(10,2) <= 0 THEN
            validation_errors := array_append(validation_errors,
                format('Item %s: Subtotal must be greater than 0', total_items));
        END IF;
        
        -- Check if product exists and get stock info
        SELECT id, name, total_stock, selling_price, is_archived
        INTO product_record
        FROM products 
        WHERE id = (item->>'product_id')::BIGINT;
        
        IF NOT FOUND THEN
            validation_errors := array_append(validation_errors,
                format('Product ID %s not found', item->>'product_id'));
            CONTINUE;
        END IF;
        
        IF product_record.is_archived THEN
            validation_errors := array_append(validation_errors,
                format('Product "%s" is archived', product_record.name));
            CONTINUE;
        END IF;
        
        -- Check stock availability
        IF product_record.total_stock < (item->>'quantity')::INTEGER THEN
            stock_issues := stock_issues || jsonb_build_object(
                'product_id', item->>'product_id',
                'product_name', product_record.name,
                'available_stock', product_record.total_stock,
                'requested_quantity', (item->>'quantity')::INTEGER
            );
        END IF;
        
        calculated_total := calculated_total + (item->>'subtotal')::DECIMAL(10,2);
    END LOOP;
    
    -- Return validation results
    RETURN QUERY SELECT 
        (array_length(validation_errors, 1) IS NULL AND jsonb_array_length(stock_issues) = 0),
        CASE 
            WHEN array_length(validation_errors, 1) > 0 THEN array_to_string(validation_errors, '; ')
            WHEN jsonb_array_length(stock_issues) > 0 THEN 'Insufficient stock for some items'
            ELSE 'Valid'
        END,
        jsonb_build_object(
            'total_items', total_items,
            'calculated_total', calculated_total,
            'validation_errors', to_jsonb(validation_errors),
            'stock_issues', stock_issues
        );
END;
$$ LANGUAGE plpgsql;

-- 3. CREATE SALE REVERSAL FUNCTION
-- For handling sale cancellations/returns
CREATE OR REPLACE FUNCTION reverse_sale_transaction(
    sale_id_to_reverse BIGINT,
    reversal_reason TEXT DEFAULT 'Sale reversal'
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    items_reversed INTEGER
) AS $$
DECLARE
    sale_record RECORD;
    item_record RECORD;
    items_count INTEGER := 0;
BEGIN
    -- Get sale information
    SELECT id, total, payment_method, created_at
    INTO sale_record
    FROM sales 
    WHERE id = sale_id_to_reverse;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Sale not found', 0;
        RETURN;
    END IF;
    
    -- Process each sale item for reversal
    FOR item_record IN 
        SELECT si.product_id, si.quantity, p.name as product_name
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = sale_id_to_reverse
    LOOP
        -- Restore stock
        UPDATE products 
        SET 
            total_stock = total_stock + item_record.quantity,
            stock = stock + item_record.quantity,
            updated_at = NOW()
        WHERE id = item_record.product_id;
        
        items_count := items_count + 1;
    END LOOP;
    
    -- Mark sale as reversed (don't delete for audit purposes)
    UPDATE sales 
    SET 
        total = -total,  -- Negative total indicates reversal
        payment_method = payment_method || ' (REVERSED)',
        updated_at = NOW()
    WHERE id = sale_id_to_reverse;
    
    -- Log the reversal
    INSERT INTO product_audit_log (
        product_id, 
        operation_type, 
        new_values, 
        changed_at
    ) VALUES (
        NULL,  -- This is a sale-level operation
        'SALE_REVERSAL',
        jsonb_build_object(
            'sale_id', sale_id_to_reverse,
            'reason', reversal_reason,
            'items_reversed', items_count
        ),
        NOW()
    );
    
    RETURN QUERY SELECT true, format('Sale %s reversed successfully', sale_id_to_reverse), items_count;
END;
$$ LANGUAGE plpgsql;

-- 4. CREATE SALES ANALYTICS FUNCTION
-- Enhanced analytics with better performance
CREATE OR REPLACE FUNCTION get_sales_analytics(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    group_by_period TEXT DEFAULT 'day'
)
RETURNS TABLE(
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    total_sales BIGINT,
    total_revenue DECIMAL(10,2),
    total_items_sold BIGINT,
    average_transaction DECIMAL(10,2),
    top_selling_categories JSONB,
    hourly_distribution JSONB
) AS $$
DECLARE
    actual_start_date TIMESTAMP WITH TIME ZONE;
    actual_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Set default date range if not provided
    actual_start_date := COALESCE(start_date, CURRENT_DATE - INTERVAL '30 days');
    actual_end_date := COALESCE(end_date, CURRENT_DATE + INTERVAL '1 day');
    
    RETURN QUERY
    WITH sales_data AS (
        SELECT 
            s.id,
            s.total,
            s.created_at,
            si.quantity,
            si.subtotal,
            p.category
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        JOIN products p ON si.product_id = p.id
        WHERE s.created_at >= actual_start_date 
        AND s.created_at < actual_end_date
        AND s.total > 0  -- Exclude reversed sales
    ),
    category_stats AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'category', category,
                'revenue', total_revenue,
                'items_sold', total_items
            ) ORDER BY total_revenue DESC
        ) as top_categories
        FROM (
            SELECT 
                category,
                SUM(subtotal) as total_revenue,
                SUM(quantity) as total_items
            FROM sales_data
            GROUP BY category
            LIMIT 10
        ) cat_data
    ),
    hourly_stats AS (
        SELECT jsonb_object_agg(
            hour_of_day::text,
            jsonb_build_object(
                'sales_count', sales_count,
                'revenue', total_revenue
            )
        ) as hourly_data
        FROM (
            SELECT 
                EXTRACT(hour FROM created_at) as hour_of_day,
                COUNT(DISTINCT id) as sales_count,
                SUM(total) as total_revenue
            FROM sales_data
            GROUP BY EXTRACT(hour FROM created_at)
        ) hourly_data
    )
    SELECT 
        actual_start_date,
        actual_end_date,
        COUNT(DISTINCT sd.id)::BIGINT,
        SUM(DISTINCT sd.total)::DECIMAL(10,2),
        SUM(sd.quantity)::BIGINT,
        (SUM(DISTINCT sd.total) / NULLIF(COUNT(DISTINCT sd.id), 0))::DECIMAL(10,2),
        cs.top_categories,
        hs.hourly_data
    FROM sales_data sd, category_stats cs, hourly_stats hs
    GROUP BY cs.top_categories, hs.hourly_data;
END;
$$ LANGUAGE plpgsql;

-- 5. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION process_sale_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION validate_sale_data TO authenticated;
GRANT EXECUTE ON FUNCTION reverse_sale_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION get_sales_analytics TO authenticated;

-- 6. CREATE INDEXES FOR BETTER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_sales_created_at_total ON sales(created_at, total) WHERE total > 0;
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_product ON sale_items(sale_id, product_id);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);

-- Add helpful comments
COMMENT ON FUNCTION process_sale_transaction IS 'Atomic sale processing with inventory updates and validation';
COMMENT ON FUNCTION validate_sale_data IS 'Validates sale data before processing to prevent errors';
COMMENT ON FUNCTION reverse_sale_transaction IS 'Safely reverses a sale and restores inventory';
COMMENT ON FUNCTION get_sales_analytics IS 'Comprehensive sales analytics with category and time-based insights';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Enhanced sales transaction functions created successfully!';
    RAISE NOTICE 'New atomic functions:';
    RAISE NOTICE '- process_sale_transaction: Atomic sale processing';
    RAISE NOTICE '- validate_sale_data: Pre-transaction validation';
    RAISE NOTICE '- reverse_sale_transaction: Safe sale reversals';
    RAISE NOTICE '- get_sales_analytics: Enhanced analytics';
END $$;
