-- =====================================================
-- SIMPLE FIX FOR BULK DELETION
-- Clean, error-free solution for Supabase
-- =====================================================

-- Step 1: Fix the foreign key constraint
ALTER TABLE public.sale_items 
DROP CONSTRAINT IF EXISTS sale_items_product_id_fkey;

ALTER TABLE public.sale_items 
ADD CONSTRAINT sale_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) 
ON DELETE RESTRICT;

-- Step 2: Create a simple safe deletion function
CREATE OR REPLACE FUNCTION public.safe_delete_archived_products(product_ids BIGINT[])
RETURNS JSONB AS $$
DECLARE
    product_id BIGINT;
    deleted_count INTEGER := 0;
    skipped_count INTEGER := 0;
    skipped_list JSONB := '[]'::jsonb;
    product_record RECORD;
    has_sales BOOLEAN;
BEGIN
    -- Loop through each product ID
    FOREACH product_id IN ARRAY product_ids
    LOOP
        -- Check if product exists and is archived
        SELECT * INTO product_record 
        FROM public.products 
        WHERE id = product_id AND is_archived = true;
        
        IF NOT FOUND THEN
            skipped_count := skipped_count + 1;
            skipped_list := skipped_list || jsonb_build_object(
                'id', product_id,
                'reason', 'Product not found or not archived'
            );
            CONTINUE;
        END IF;
        
        -- Check if product has sales history
        SELECT EXISTS(
            SELECT 1 FROM public.sale_items 
            WHERE product_id = product_record.id
        ) INTO has_sales;
        
        IF has_sales THEN
            skipped_count := skipped_count + 1;
            skipped_list := skipped_list || jsonb_build_object(
                'id', product_record.id,
                'name', product_record.name,
                'reason', 'Has sales history'
            );
        ELSE
            -- Safe to delete
            DELETE FROM public.products WHERE id = product_record.id;
            deleted_count := deleted_count + 1;
        END IF;
    END LOOP;
    
    -- Return result as JSONB
    RETURN jsonb_build_object(
        'deleted_count', deleted_count,
        'skipped_count', skipped_count,
        'skipped_products', skipped_list,
        'success', (deleted_count > 0),
        'message', CASE 
            WHEN deleted_count > 0 AND skipped_count > 0 THEN 
                deleted_count || ' deleted, ' || skipped_count || ' skipped'
            WHEN deleted_count > 0 THEN 
                deleted_count || ' products deleted successfully'
            ELSE 
                skipped_count || ' products skipped (have sales history)'
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.safe_delete_archived_products(BIGINT[]) TO authenticated;

-- Success message
SELECT 'Safe deletion function created successfully!' as status;
