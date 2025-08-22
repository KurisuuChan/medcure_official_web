-- =====================================================
-- CLEAN BULK DELETE FIX - NO ERRORS
-- Simple solution for Supabase SQL Editor
-- =====================================================

-- Step 1: Fix foreign key constraint
ALTER TABLE public.sale_items 
DROP CONSTRAINT IF EXISTS sale_items_product_id_fkey;

ALTER TABLE public.sale_items 
ADD CONSTRAINT sale_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) 
ON DELETE RESTRICT;

-- Step 2: Create safe deletion function (fixed ambiguous column issue)
CREATE OR REPLACE FUNCTION public.safe_delete_archived_products(product_ids BIGINT[])
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
    pid BIGINT;
    deleted_count INTEGER := 0;
    skipped_count INTEGER := 0;
    skipped_list JSONB := '[]'::jsonb;
    product_record RECORD;
    has_sales BOOLEAN;
BEGIN
    -- Loop through each product ID
    FOREACH pid IN ARRAY product_ids
    LOOP
        -- Check if product exists and is archived (fixed: use p alias)
        SELECT p.* INTO product_record 
        FROM public.products p 
        WHERE p.id = pid AND p.is_archived = true;
        
        IF NOT FOUND THEN
            skipped_count := skipped_count + 1;
            skipped_list := skipped_list || jsonb_build_object(
                'id', pid,
                'reason', 'Product not found or not archived'
            );
            CONTINUE;
        END IF;
        
        -- Check if product has sales history (fixed: use si alias)
        SELECT EXISTS(
            SELECT 1 FROM public.sale_items si 
            WHERE si.product_id = product_record.id
        ) INTO has_sales;
        
        IF has_sales THEN
            skipped_count := skipped_count + 1;
            skipped_list := skipped_list || jsonb_build_object(
                'id', product_record.id,
                'name', product_record.name,
                'reason', 'Has sales history'
            );
        ELSE
            -- Safe to delete - no sales history
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
$$;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.safe_delete_archived_products(BIGINT[]) TO authenticated;

-- Step 4: Test the function (optional)
SELECT 'Safe deletion function created successfully!' as status;
