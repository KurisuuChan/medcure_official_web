-- =====================================================
-- Bulk Stock Update Function
-- Function to update multiple products' stock at once
-- =====================================================

CREATE OR REPLACE FUNCTION public.bulk_update_stock(
    updates JSONB
) RETURNS TABLE(
    success_count INTEGER,
    error_count INTEGER,
    errors JSONB
) AS $$
DECLARE
    update_record JSONB;
    product_id INTEGER;
    new_stock INTEGER;
    old_stock INTEGER;
    success_counter INTEGER := 0;
    error_counter INTEGER := 0;
    error_list JSONB := '[]'::JSONB;
    error_message TEXT;
BEGIN
    -- Loop through each update in the array
    FOR update_record IN SELECT * FROM jsonb_array_elements(updates)
    LOOP
        BEGIN
            -- Extract values
            product_id := (update_record->>'id')::INTEGER;
            new_stock := (update_record->>'total_stock')::INTEGER;
            
            -- Get current stock
            SELECT total_stock INTO old_stock 
            FROM public.products 
            WHERE id = product_id AND is_archived = false;
            
            IF NOT FOUND THEN
                error_counter := error_counter + 1;
                error_list := error_list || jsonb_build_object(
                    'id', product_id,
                    'error', 'Product not found or archived'
                );
                CONTINUE;
            END IF;
            
            -- Validate new stock
            IF new_stock < 0 THEN
                error_counter := error_counter + 1;
                error_list := error_list || jsonb_build_object(
                    'id', product_id,
                    'error', 'Stock cannot be negative'
                );
                CONTINUE;
            END IF;
            
            -- Update the product
            UPDATE public.products 
            SET 
                total_stock = new_stock,
                stock = new_stock, -- Also update the stock field
                updated_at = NOW()
            WHERE id = product_id;
            
            -- Create audit log entry
            INSERT INTO public.product_audit_log (
                product_id, action, old_data, new_data, change_reason
            ) VALUES (
                product_id,
                'stock_update',
                jsonb_build_object('total_stock', old_stock),
                jsonb_build_object('total_stock', new_stock),
                'Bulk stock update'
            );
            
            success_counter := success_counter + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_counter := error_counter + 1;
            error_message := SQLERRM;
            error_list := error_list || jsonb_build_object(
                'id', product_id,
                'error', error_message
            );
        END;
    END LOOP;
    
    -- Return results
    RETURN QUERY SELECT success_counter, error_counter, error_list;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.bulk_update_stock(JSONB) TO anon, authenticated;

-- Example usage:
-- SELECT * FROM public.bulk_update_stock('[
--   {"id": 1, "total_stock": 100},
--   {"id": 2, "total_stock": 50},
--   {"id": 3, "total_stock": 25}
-- ]'::JSONB);

COMMENT ON FUNCTION public.bulk_update_stock(JSONB) IS 'Update stock levels for multiple products in a single transaction';
