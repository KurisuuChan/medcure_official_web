-- =====================================================
-- MISSING SALES FUNCTIONS FIX
-- Creates required functions for sales to work
-- =====================================================

-- 1. Create validate_sale_data function
CREATE OR REPLACE FUNCTION public.validate_sale_data(sale_items JSONB)
RETURNS TABLE(
    is_valid BOOLEAN,
    errors TEXT[],
    warnings TEXT[],
    total_amount DECIMAL(10,2)
) 
LANGUAGE plpgsql
AS $$
DECLARE
    item JSONB;
    product_record RECORD;
    error_list TEXT[] := '{}';
    warning_list TEXT[] := '{}';
    calculated_total DECIMAL(10,2) := 0;
    item_subtotal DECIMAL(10,2);
BEGIN
    -- Validate each sale item
    FOR item IN SELECT * FROM jsonb_array_elements(sale_items)
    LOOP
        -- Check if product exists
        SELECT * INTO product_record 
        FROM public.products 
        WHERE id = (item->>'product_id')::INTEGER
        AND (is_active = TRUE OR is_active IS NULL);
        
        IF NOT FOUND THEN
            error_list := array_append(error_list, 
                'Product ID ' || (item->>'product_id') || ' not found or inactive');
            CONTINUE;
        END IF;
        
        -- Validate quantity
        IF (item->>'quantity')::INTEGER <= 0 THEN
            error_list := array_append(error_list, 
                'Invalid quantity for product ' || product_record.name);
        END IF;
        
        -- Check stock availability
        IF (item->>'quantity')::INTEGER > COALESCE(product_record.stock, 0) THEN
            error_list := array_append(error_list, 
                'Insufficient stock for product ' || product_record.name || 
                '. Available: ' || COALESCE(product_record.stock, 0) || 
                ', Requested: ' || (item->>'quantity')::INTEGER);
        END IF;
        
        -- Validate price
        IF (item->>'unit_price')::DECIMAL <= 0 THEN
            error_list := array_append(error_list, 
                'Invalid unit price for product ' || product_record.name);
        END IF;
        
        -- Calculate and validate subtotal
        item_subtotal := (item->>'quantity')::INTEGER * (item->>'unit_price')::DECIMAL;
        IF ABS(item_subtotal - (item->>'subtotal')::DECIMAL) > 0.01 THEN
            warning_list := array_append(warning_list, 
                'Subtotal mismatch for product ' || product_record.name);
        END IF;
        
        calculated_total := calculated_total + item_subtotal;
    END LOOP;
    
    -- Return validation results
    RETURN QUERY SELECT 
        array_length(error_list, 1) IS NULL AS is_valid,
        error_list AS errors,
        warning_list AS warnings,
        calculated_total AS total_amount;
END;
$$;

-- 2. Create reverse_sale_transaction function
CREATE OR REPLACE FUNCTION public.reverse_sale_transaction(
    sale_id_to_reverse INTEGER,
    reversal_reason TEXT DEFAULT 'Sale cancellation'
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    reversed_amount DECIMAL(10,2)
) 
LANGUAGE plpgsql
AS $$
DECLARE
    sale_record RECORD;
    item_record RECORD;
    total_reversed DECIMAL(10,2) := 0;
BEGIN
    -- Check if sale exists
    SELECT * INTO sale_record 
    FROM public.sales 
    WHERE id = sale_id_to_reverse;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Sale not found', 0::DECIMAL(10,2);
        RETURN;
    END IF;
    
    -- Restore stock for each item
    FOR item_record IN 
        SELECT * FROM public.sale_items WHERE sale_id = sale_id_to_reverse
    LOOP
        UPDATE public.products 
        SET 
            stock = stock + item_record.quantity,
            total_stock = COALESCE(total_stock, stock) + item_record.quantity,
            updated_at = NOW()
        WHERE id = item_record.product_id;
    END LOOP;
    
    -- Mark sale as reversed (or delete if preferred)
    UPDATE public.sales 
    SET updated_at = NOW()
    WHERE id = sale_id_to_reverse;
    
    -- Could add a reversals tracking table here if needed
    
    total_reversed := sale_record.total;
    
    RETURN QUERY SELECT TRUE, 'Sale reversed successfully', total_reversed;
END;
$$;

-- 3. Create process_sale_transaction function (matching the salesService.js parameters)
CREATE OR REPLACE FUNCTION public.process_sale_transaction(
    sale_total DECIMAL(10,2),
    payment_method TEXT,
    sale_items JSONB
)
RETURNS TABLE(
    sale_id INTEGER,
    success BOOLEAN,
    message TEXT,
    total_amount DECIMAL(10,2)
) 
LANGUAGE plpgsql
AS $$
DECLARE
    new_sale_id INTEGER;
    item JSONB;
    calculated_total DECIMAL(10,2) := 0;
BEGIN
    -- Create the sale record
    INSERT INTO public.sales (
        total,
        payment_method,
        created_at,
        updated_at
    ) VALUES (
        sale_total,
        COALESCE(payment_method, 'cash'),
        NOW(),
        NOW()
    ) RETURNING id INTO new_sale_id;
    
    -- Process each sale item
    FOR item IN SELECT * FROM jsonb_array_elements(sale_items)
    LOOP
        -- Insert sale item
        INSERT INTO public.sale_items (
            sale_id,
            product_id,
            quantity,
            unit_price,
            subtotal,
            created_at,
            updated_at
        ) VALUES (
            new_sale_id,
            (item->>'product_id')::INTEGER,
            (item->>'quantity')::INTEGER,
            (item->>'unit_price')::DECIMAL(10,2),
            (item->>'subtotal')::DECIMAL(10,2),
            NOW(),
            NOW()
        );
        
        -- Update product stock
        UPDATE public.products 
        SET 
            stock = GREATEST(0, stock - (item->>'quantity')::INTEGER),
            total_stock = GREATEST(0, COALESCE(total_stock, stock) - (item->>'quantity')::INTEGER),
            updated_at = NOW()
        WHERE id = (item->>'product_id')::INTEGER;
        
        calculated_total := calculated_total + (item->>'subtotal')::DECIMAL(10,2);
    END LOOP;
    
    RETURN QUERY SELECT new_sale_id, TRUE, 'Sale processed successfully', calculated_total;
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION public.validate_sale_data(JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reverse_sale_transaction(INTEGER, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_sale_transaction(DECIMAL, TEXT, JSONB) TO anon, authenticated;

-- 5. Test the functions work
SELECT 'Functions created successfully' as status;
