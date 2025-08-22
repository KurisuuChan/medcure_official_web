-- =====================================================
-- FIX BULK DELETION - COMPREHENSIVE SOLUTION
-- This will allow safe deletion of archived products
-- =====================================================

-- Solution: Create a safe deletion function that handles products with sales history
-- We'll keep the NOT NULL constraint but prevent deletion of products with sales

-- First, let's revert the constraint back to the original (in case it was changed)
ALTER TABLE public.sale_items 
DROP CONSTRAINT IF EXISTS sale_items_product_id_fkey;

-- Recreate the original constraint (CASCADE deletion is not safe for sales data)
ALTER TABLE public.sale_items 
ADD CONSTRAINT sale_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) 
ON DELETE RESTRICT;

-- Create a comprehensive safe deletion function
CREATE OR REPLACE FUNCTION public.safe_delete_archived_products(product_ids BIGINT[])
RETURNS TABLE(
    deleted_count INTEGER,
    skipped_count INTEGER,
    skipped_products JSONB,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    product_id BIGINT;
    deleted_products INTEGER := 0;
    skipped_products INTEGER := 0;
    skipped_list JSONB := '[]'::jsonb;
    product_info RECORD;
    has_sales BOOLEAN;
    total_requested INTEGER;
BEGIN
    total_requested := array_length(product_ids, 1);
    
    -- Validate input
    IF total_requested IS NULL OR total_requested = 0 THEN
        RETURN QUERY SELECT 0, 0, '[]'::jsonb, false, 'No product IDs provided'::text;
        RETURN;
    END IF;
    
    -- Loop through each product ID
    FOREACH product_id IN ARRAY product_ids
    LOOP
        -- Check if product exists and is archived
        SELECT * INTO product_info 
        FROM public.products 
        WHERE id = product_id AND is_archived = TRUE;
        
        IF NOT FOUND THEN
            -- Skip non-existent or non-archived products
            skipped_products := skipped_products + 1;
            skipped_list := skipped_list || jsonb_build_object(
                'id', product_id,
                'name', 'Unknown',
                'reason', 'Product not found or not archived'
            );
            CONTINUE;
        END IF;
        
        -- Check if product has sales history
        SELECT EXISTS(
            SELECT 1 FROM public.sale_items 
            WHERE product_id = product_info.id
        ) INTO has_sales;
        
        IF has_sales THEN
            -- Skip products with sales history and add to skipped list
            skipped_products := skipped_products + 1;
            skipped_list := skipped_list || jsonb_build_object(
                'id', product_info.id,
                'name', product_info.name,
                'reason', 'Product has sales history - cannot be permanently deleted for data integrity'
            );
        ELSE
            -- Safe to delete - no sales history
            BEGIN
                DELETE FROM public.products WHERE id = product_info.id;
                deleted_products := deleted_products + 1;
            EXCEPTION WHEN OTHERS THEN
                -- If deletion fails for any reason, skip and log
                skipped_products := skipped_products + 1;
                skipped_list := skipped_list || jsonb_build_object(
                    'id', product_info.id,
                    'name', product_info.name,
                    'reason', 'Deletion failed: ' || SQLERRM
                );
            END;
        END IF;
    END LOOP;
    
    -- Prepare success message
    DECLARE
        result_message TEXT;
    BEGIN
        IF deleted_products = total_requested THEN
            result_message := format('All %s products deleted successfully', deleted_products);
        ELSIF deleted_products > 0 THEN
            result_message := format('%s products deleted, %s skipped (have sales history or other issues)', 
                                   deleted_products, skipped_products);
        ELSE
            result_message := format('No products could be deleted. %s skipped (have sales history or not found)', 
                                   skipped_products);
        END IF;
    END;
    
    -- Return results
    RETURN QUERY SELECT 
        deleted_products, 
        skipped_products, 
        skipped_list,
        (deleted_products > 0)::BOOLEAN,
        result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to use the function
GRANT EXECUTE ON FUNCTION public.safe_delete_archived_products(BIGINT[]) TO authenticated;

-- Create a simpler function for single product deletion
CREATE OR REPLACE FUNCTION public.safe_delete_single_product(product_id BIGINT)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    product_name TEXT
) AS $$
DECLARE
    product_info RECORD;
    has_sales BOOLEAN;
BEGIN
    -- Check if product exists and is archived
    SELECT * INTO product_info 
    FROM public.products 
    WHERE id = product_id AND is_archived = TRUE;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Product not found or not archived'::text, 'Unknown'::text;
        RETURN;
    END IF;
    
    -- Check if product has sales history
    SELECT EXISTS(
        SELECT 1 FROM public.sale_items 
        WHERE product_id = product_info.id
    ) INTO has_sales;
    
    IF has_sales THEN
        RETURN QUERY SELECT 
            false, 
            'Cannot delete product with sales history'::text,
            product_info.name::text;
        RETURN;
    END IF;
    
    -- Safe to delete
    BEGIN
        DELETE FROM public.products WHERE id = product_info.id;
        RETURN QUERY SELECT 
            true, 
            'Product deleted successfully'::text,
            product_info.name::text;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            false, 
            ('Deletion failed: ' || SQLERRM)::text,
            product_info.name::text;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission for single product deletion
GRANT EXECUTE ON FUNCTION public.safe_delete_single_product(BIGINT) TO authenticated;

-- Test the functions
SELECT 'Safe deletion functions created successfully!' as status;
SELECT 'Products with sales history will be preserved for data integrity!' as info;
