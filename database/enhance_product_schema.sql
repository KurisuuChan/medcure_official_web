-- =====================================================
-- MedCure Database Schema Enhancements
-- Implementing suggestions for data integrity and performance
-- =====================================================

-- 1. ENFORCE STRICTER DATA VALIDATION
-- Add NOT NULL constraints and check constraints for data integrity

-- First, update existing NULL values with defaults before adding constraints
UPDATE products 
SET 
    price = 0 WHERE price IS NULL,
    cost_price = 0 WHERE cost_price IS NULL,
    stock = 0 WHERE stock IS NULL,
    total_stock = stock WHERE total_stock IS NULL,
    pieces_per_sheet = 1 WHERE pieces_per_sheet IS NULL OR pieces_per_sheet <= 0,
    sheets_per_box = 1 WHERE sheets_per_box IS NULL OR sheets_per_box <= 0,
    category = 'Uncategorized' WHERE category IS NULL OR category = '',
    selling_price = price WHERE selling_price IS NULL;

-- Add NOT NULL constraints for critical fields
ALTER TABLE products 
ALTER COLUMN price SET NOT NULL,
ALTER COLUMN cost_price SET NOT NULL,
ALTER COLUMN stock SET NOT NULL,
ALTER COLUMN total_stock SET NOT NULL,
ALTER COLUMN pieces_per_sheet SET NOT NULL,
ALTER COLUMN sheets_per_box SET NOT NULL,
ALTER COLUMN category SET NOT NULL;

-- Add CHECK constraints for data validation
ALTER TABLE products 
ADD CONSTRAINT chk_price_positive CHECK (price >= 0),
ADD CONSTRAINT chk_cost_price_positive CHECK (cost_price >= 0),
ADD CONSTRAINT chk_stock_non_negative CHECK (stock >= 0),
ADD CONSTRAINT chk_total_stock_non_negative CHECK (total_stock >= 0),
ADD CONSTRAINT chk_pieces_per_sheet_positive CHECK (pieces_per_sheet > 0),
ADD CONSTRAINT chk_sheets_per_box_positive CHECK (sheets_per_box > 0),
ADD CONSTRAINT chk_category_not_empty CHECK (length(trim(category)) > 0),
ADD CONSTRAINT chk_name_not_empty CHECK (length(trim(name)) > 0);

-- Ensure selling_price defaults to price if not set
ALTER TABLE products 
ADD CONSTRAINT chk_selling_price_positive CHECK (selling_price >= 0);

-- 2. CREATE GENERATED COLUMN FOR TOTAL_PIECES_PER_BOX
-- This offloads calculation to the database ensuring consistency
ALTER TABLE products 
ADD COLUMN total_pieces_per_box_generated INTEGER GENERATED ALWAYS AS (pieces_per_sheet * sheets_per_box) STORED;

-- 3. CREATE DATABASE VIEW FOR ENHANCED PRODUCT DATA
-- This provides consistent calculated fields without frontend manipulation
CREATE OR REPLACE VIEW products_enhanced AS
SELECT 
    p.*,
    p.pieces_per_sheet * p.sheets_per_box AS total_pieces_per_box_calc,
    CASE 
        WHEN p.total_stock <= 0 THEN 'Out of Stock'
        WHEN p.total_stock <= 10 THEN 'Low Stock'
        WHEN p.total_stock <= 50 then 'Medium Stock'
        ELSE 'In Stock'
    END AS stock_status,
    COALESCE(p.selling_price, p.price) AS effective_selling_price,
    CASE 
        WHEN p.selling_price > p.cost_price AND p.cost_price > 0 
        THEN ROUND(((p.selling_price - p.cost_price) / p.cost_price * 100)::numeric, 2)
        ELSE 0
    END AS profit_margin_percentage,
    p.selling_price - p.cost_price AS profit_per_unit,
    CASE 
        WHEN p.expiry_date IS NOT NULL THEN
            CASE 
                WHEN p.expiry_date < CURRENT_DATE THEN 'Expired'
                WHEN p.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring Soon'
                WHEN p.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'Expiring in 3 Months'
                ELSE 'Good'
            END
        ELSE 'No Expiry Data'
    END AS expiry_status,
    -- Full-text search vector for advanced searching
    to_tsvector('english', 
        COALESCE(p.name, '') || ' ' || 
        COALESCE(p.category, '') || ' ' || 
        COALESCE(p.manufacturer, '') || ' ' ||
        COALESCE(p.brand_name, '') || ' ' ||
        COALESCE(p.description, '')
    ) AS search_vector
FROM products p
WHERE p.is_archived = false;

-- 4. CREATE ADVANCED SEARCH FUNCTION
-- Utilizes full-text search for better performance and relevance
CREATE OR REPLACE FUNCTION search_products_advanced(
    search_term TEXT,
    category_filter TEXT DEFAULT NULL,
    stock_status_filter TEXT DEFAULT NULL,
    price_range_min DECIMAL DEFAULT NULL,
    price_range_max DECIMAL DEFAULT NULL,
    sort_by TEXT DEFAULT 'relevance',
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(
    id BIGINT,
    name VARCHAR,
    category VARCHAR,
    price DECIMAL,
    selling_price DECIMAL,
    cost_price DECIMAL,
    stock INTEGER,
    total_stock INTEGER,
    pieces_per_sheet INTEGER,
    sheets_per_box INTEGER,
    total_pieces_per_box INTEGER,
    stock_status TEXT,
    profit_margin_percentage NUMERIC,
    expiry_status TEXT,
    search_rank REAL
) AS $$
DECLARE
    search_query tsquery;
BEGIN
    -- Convert search term to tsquery for full-text search
    search_query := websearch_to_tsquery('english', search_term);
    
    RETURN QUERY
    SELECT 
        pe.id,
        pe.name,
        pe.category,
        pe.price,
        pe.effective_selling_price as selling_price,
        pe.cost_price,
        pe.stock,
        pe.total_stock,
        pe.pieces_per_sheet,
        pe.sheets_per_box,
        pe.total_pieces_per_box_calc as total_pieces_per_box,
        pe.stock_status,
        pe.profit_margin_percentage,
        pe.expiry_status,
        CASE 
            WHEN search_term IS NULL OR search_term = '' THEN 1.0
            ELSE ts_rank(pe.search_vector, search_query)
        END as search_rank
    FROM products_enhanced pe
    WHERE 
        -- Full-text search condition
        (search_term IS NULL OR search_term = '' OR pe.search_vector @@ search_query)
        -- Category filter
        AND (category_filter IS NULL OR pe.category ILIKE '%' || category_filter || '%')
        -- Stock status filter
        AND (stock_status_filter IS NULL OR pe.stock_status = stock_status_filter)
        -- Price range filters
        AND (price_range_min IS NULL OR pe.effective_selling_price >= price_range_min)
        AND (price_range_max IS NULL OR pe.effective_selling_price <= price_range_max)
    ORDER BY 
        CASE 
            WHEN sort_by = 'name' THEN NULL
            WHEN sort_by = 'price_asc' THEN NULL
            WHEN sort_by = 'price_desc' THEN NULL
            WHEN sort_by = 'stock' THEN NULL
            ELSE search_rank
        END DESC,
        CASE WHEN sort_by = 'name' THEN pe.name END ASC,
        CASE WHEN sort_by = 'price_asc' THEN pe.effective_selling_price END ASC,
        CASE WHEN sort_by = 'price_desc' THEN pe.effective_selling_price END DESC,
        CASE WHEN sort_by = 'stock' THEN pe.total_stock END DESC,
        pe.name ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 5. CREATE INVENTORY ANALYTICS FUNCTION
CREATE OR REPLACE FUNCTION get_inventory_analytics()
RETURNS TABLE(
    total_products BIGINT,
    total_value DECIMAL,
    low_stock_count BIGINT,
    expired_count BIGINT,
    expiring_soon_count BIGINT,
    out_of_stock_count BIGINT,
    avg_profit_margin DECIMAL,
    top_categories JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH analytics AS (
        SELECT 
            COUNT(*) as total_products,
            SUM(pe.effective_selling_price * pe.total_stock) as total_value,
            COUNT(*) FILTER (WHERE pe.stock_status = 'Low Stock') as low_stock_count,
            COUNT(*) FILTER (WHERE pe.expiry_status = 'Expired') as expired_count,
            COUNT(*) FILTER (WHERE pe.expiry_status = 'Expiring Soon') as expiring_soon_count,
            COUNT(*) FILTER (WHERE pe.stock_status = 'Out of Stock') as out_of_stock_count,
            AVG(pe.profit_margin_percentage) as avg_profit_margin
        FROM products_enhanced pe
    ),
    category_stats AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'category', category,
                'count', product_count,
                'total_value', total_value
            ) ORDER BY product_count DESC
        ) as top_categories
        FROM (
            SELECT 
                pe.category,
                COUNT(*) as product_count,
                SUM(pe.effective_selling_price * pe.total_stock) as total_value
            FROM products_enhanced pe
            GROUP BY pe.category
            LIMIT 10
        ) t
    )
    SELECT 
        a.total_products,
        ROUND(a.total_value::numeric, 2) as total_value,
        a.low_stock_count,
        a.expired_count,
        a.expiring_soon_count,
        a.out_of_stock_count,
        ROUND(a.avg_profit_margin::numeric, 2) as avg_profit_margin,
        cs.top_categories
    FROM analytics a, category_stats cs;
END;
$$ LANGUAGE plpgsql;

-- 6. ENHANCED INDEXES FOR PERFORMANCE
-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN(to_tsvector('english', 
    COALESCE(name, '') || ' ' || 
    COALESCE(category, '') || ' ' || 
    COALESCE(manufacturer, '') || ' ' ||
    COALESCE(brand_name, '') || ' ' ||
    COALESCE(description, '')
));

CREATE INDEX IF NOT EXISTS idx_products_category_stock ON products(category, total_stock) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_products_price_range ON products(selling_price, price) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON products(expiry_date) WHERE is_archived = false AND expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(total_stock) WHERE is_archived = false;

-- 7. CREATE FUNCTION FOR SAFE STOCK UPDATES
-- This ensures atomic stock updates and prevents negative stock
CREATE OR REPLACE FUNCTION update_product_stock(
    product_id BIGINT,
    quantity_change INTEGER,
    operation_type TEXT DEFAULT 'subtract'
)
RETURNS products AS $$
DECLARE
    updated_product products;
    current_stock INTEGER;
BEGIN
    -- Lock the row for update to prevent race conditions
    SELECT total_stock INTO current_stock
    FROM products 
    WHERE id = product_id 
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % not found', product_id;
    END IF;
    
    -- Validate the operation
    IF operation_type = 'subtract' AND (current_stock - quantity_change) < 0 THEN
        RAISE EXCEPTION 'Insufficient stock. Current stock: %, Requested: %', current_stock, quantity_change;
    END IF;
    
    -- Perform the update
    UPDATE products
    SET 
        total_stock = CASE 
            WHEN operation_type = 'add' THEN total_stock + quantity_change
            WHEN operation_type = 'subtract' THEN total_stock - quantity_change
            WHEN operation_type = 'set' THEN quantity_change
            ELSE total_stock
        END,
        stock = CASE 
            WHEN operation_type = 'add' THEN stock + quantity_change
            WHEN operation_type = 'subtract' THEN stock - quantity_change
            WHEN operation_type = 'set' THEN quantity_change
            ELSE stock
        END,
        updated_at = NOW()
    WHERE id = product_id
    RETURNING * INTO updated_product;
    
    RETURN updated_product;
END;
$$ LANGUAGE plpgsql;

-- 8. CREATE TRIGGER TO SYNC STOCK FIELDS
-- Ensures total_stock and stock remain in sync
CREATE OR REPLACE FUNCTION sync_stock_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure total_stock is updated when stock changes
    IF NEW.stock IS DISTINCT FROM OLD.stock THEN
        NEW.total_stock := NEW.stock;
    ELSIF NEW.total_stock IS DISTINCT FROM OLD.total_stock THEN
        NEW.stock := NEW.total_stock;
    END IF;
    
    -- Update selling_price if not explicitly set
    IF NEW.selling_price IS NULL THEN
        NEW.selling_price := NEW.price;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and create new one
DROP TRIGGER IF EXISTS trigger_sync_stock_fields ON products;
CREATE TRIGGER trigger_sync_stock_fields
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION sync_stock_fields();

-- 9. CREATE AUDIT LOG FOR CRITICAL OPERATIONS
CREATE TABLE IF NOT EXISTS product_audit_log (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id),
    operation_type VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_product_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO product_audit_log (product_id, operation_type, new_values)
        VALUES (NEW.id, 'INSERT', row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only log if important fields changed
        IF (OLD.name, OLD.price, OLD.selling_price, OLD.cost_price, OLD.stock, OLD.total_stock, OLD.is_archived) 
           IS DISTINCT FROM 
           (NEW.name, NEW.price, NEW.selling_price, NEW.cost_price, NEW.stock, NEW.total_stock, NEW.is_archived) THEN
            INSERT INTO product_audit_log (product_id, operation_type, old_values, new_values)
            VALUES (NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO product_audit_log (product_id, operation_type, old_values)
        VALUES (OLD.id, 'DELETE', row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger
DROP TRIGGER IF EXISTS trigger_audit_products ON products;
CREATE TRIGGER trigger_audit_products
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION audit_product_changes();

-- 10. GRANT NECESSARY PERMISSIONS
-- Grant permissions for the enhanced functions and views
GRANT SELECT ON products_enhanced TO authenticated;
GRANT EXECUTE ON FUNCTION search_products_advanced TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION update_product_stock TO authenticated;
GRANT SELECT ON product_audit_log TO authenticated;

-- Create helpful comments
COMMENT ON VIEW products_enhanced IS 'Enhanced product view with calculated fields and full-text search vector';
COMMENT ON FUNCTION search_products_advanced IS 'Advanced product search with full-text search, filtering, and sorting';
COMMENT ON FUNCTION get_inventory_analytics IS 'Returns comprehensive inventory analytics and statistics';
COMMENT ON FUNCTION update_product_stock IS 'Safely updates product stock with validation and locking';
COMMENT ON TABLE product_audit_log IS 'Audit trail for product changes';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database schema enhancements completed successfully!';
    RAISE NOTICE 'New features added:';
    RAISE NOTICE '- Strict data validation with constraints';
    RAISE NOTICE '- Generated column for total_pieces_per_box';
    RAISE NOTICE '- Enhanced products view with calculated fields';
    RAISE NOTICE '- Advanced search function with full-text search';
    RAISE NOTICE '- Inventory analytics function';
    RAISE NOTICE '- Safe stock update function';
    RAISE NOTICE '- Audit logging for product changes';
    RAISE NOTICE '- Performance indexes';
END $$;
