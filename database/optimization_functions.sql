-- SQL Functions for MedCure Optimization
-- Add these to your database for better performance

-- 1. Optimized Dashboard Analytics Function
CREATE OR REPLACE FUNCTION get_dashboard_analytics(
  include_sales_today BOOLEAN DEFAULT true,
  include_inventory_stats BOOLEAN DEFAULT true,
  include_low_stock BOOLEAN DEFAULT true,
  include_recent_activity BOOLEAN DEFAULT true
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  today_date DATE := CURRENT_DATE;
BEGIN
  WITH dashboard_data AS (
    SELECT 
      -- Product Stats
      CASE WHEN include_inventory_stats THEN 
        (SELECT COUNT(*) FROM products WHERE is_archived = false)
      ELSE NULL END as total_products,
      
      CASE WHEN include_inventory_stats THEN 
        (SELECT COALESCE(SUM(stock * selling_price), 0) FROM products WHERE is_archived = false)
      ELSE NULL END as total_inventory_value,
      
      -- Low Stock Products
      CASE WHEN include_low_stock THEN 
        (SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', id,
            'name', name,
            'stock', stock,
            'category', category
          )
        ) FROM products WHERE is_archived = false AND stock <= 10)
      ELSE NULL END as low_stock_products,
      
      -- Today's Sales
      CASE WHEN include_sales_today THEN 
        (SELECT COALESCE(SUM(total), 0) FROM sales WHERE DATE(created_at) = today_date)
      ELSE NULL END as today_revenue,
      
      CASE WHEN include_sales_today THEN 
        (SELECT COUNT(*) FROM sales WHERE DATE(created_at) = today_date)
      ELSE NULL END as today_transactions,
      
      -- Recent Activity
      CASE WHEN include_recent_activity THEN 
        (SELECT JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', id,
            'total', total,
            'payment_method', payment_method,
            'created_at', created_at
          ) ORDER BY created_at DESC
        ) FROM sales WHERE created_at >= NOW() - INTERVAL '24 hours' LIMIT 5)
      ELSE NULL END as recent_sales
  )
  SELECT JSON_BUILD_OBJECT(
    'total_products', total_products,
    'total_inventory_value', total_inventory_value,
    'low_stock_products', COALESCE(low_stock_products, '[]'::JSON),
    'today_revenue', today_revenue,
    'today_transactions', today_transactions,
    'recent_sales', COALESCE(recent_sales, '[]'::JSON),
    'generated_at', NOW()
  ) INTO result
  FROM dashboard_data;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. Advanced Product Search Function
CREATE OR REPLACE FUNCTION search_products_optimized(
  search_query TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  price_min DECIMAL DEFAULT NULL,
  price_max DECIMAL DEFAULT NULL,
  stock_status_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(
  id INTEGER,
  name TEXT,
  category TEXT,
  brand_name TEXT,
  stock INTEGER,
  selling_price DECIMAL,
  stock_status TEXT,
  search_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.category,
    p.brand_name,
    p.stock,
    p.selling_price,
    CASE 
      WHEN p.stock <= 0 THEN 'Out of Stock'
      WHEN p.stock <= COALESCE(p.reorder_level, 10) THEN 'Low Stock'
      ELSE 'In Stock'
    END as stock_status,
    CASE 
      WHEN search_query IS NOT NULL THEN
        ts_rank(
          to_tsvector('english', COALESCE(p.name, '') || ' ' || COALESCE(p.brand_name, '') || ' ' || COALESCE(p.category, '')),
          plainto_tsquery('english', search_query)
        )
      ELSE 1.0
    END as search_rank
  FROM products p
  WHERE p.is_archived = false
    AND (search_query IS NULL OR (
      to_tsvector('english', COALESCE(p.name, '') || ' ' || COALESCE(p.brand_name, '') || ' ' || COALESCE(p.category, ''))
      @@ plainto_tsquery('english', search_query)
    ))
    AND (category_filter IS NULL OR p.category ILIKE '%' || category_filter || '%')
    AND (price_min IS NULL OR p.selling_price >= price_min)
    AND (price_max IS NULL OR p.selling_price <= price_max)
    AND (stock_status_filter IS NULL OR 
      CASE 
        WHEN p.stock <= 0 THEN 'Out of Stock'
        WHEN p.stock <= COALESCE(p.reorder_level, 10) THEN 'Low Stock'
        ELSE 'In Stock'
      END = stock_status_filter
    )
  ORDER BY search_rank DESC, p.name
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 3. Sales Analytics Aggregation Function
CREATE OR REPLACE FUNCTION get_sales_analytics(
  start_date TIMESTAMP DEFAULT NULL,
  end_date TIMESTAMP DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  default_start_date TIMESTAMP := COALESCE(start_date, CURRENT_DATE - INTERVAL '30 days');
  default_end_date TIMESTAMP := COALESCE(end_date, NOW());
BEGIN
  WITH sales_data AS (
    SELECT 
      s.id,
      s.total,
      s.payment_method,
      s.created_at,
      si.quantity,
      si.unit_price,
      si.subtotal,
      p.category,
      p.name as product_name
    FROM sales s
    LEFT JOIN sale_items si ON s.id = si.sale_id
    LEFT JOIN products p ON si.product_id = p.id
    WHERE s.created_at BETWEEN default_start_date AND default_end_date
      AND s.total > 0 -- Exclude reversed sales
  ),
  aggregated_stats AS (
    SELECT 
      COUNT(DISTINCT id) as total_sales,
      COALESCE(SUM(total), 0) as total_revenue,
      COALESCE(AVG(total), 0) as avg_transaction,
      COALESCE(SUM(quantity), 0) as total_items_sold,
      
      -- Category breakdown
      JSON_AGG(DISTINCT 
        JSON_BUILD_OBJECT(
          'category', category,
          'revenue', category_revenue,
          'quantity', category_quantity
        )
      ) FILTER (WHERE category IS NOT NULL) as category_stats,
      
      -- Hourly distribution
      JSON_OBJECT_AGG(
        hour_of_day,
        JSON_BUILD_OBJECT(
          'sales_count', hourly_sales,
          'revenue', hourly_revenue
        )
      ) as hourly_stats
      
    FROM (
      SELECT DISTINCT
        id, total, quantity, category,
        SUM(subtotal) OVER (PARTITION BY category) as category_revenue,
        SUM(quantity) OVER (PARTITION BY category) as category_quantity,
        EXTRACT(HOUR FROM created_at) as hour_of_day,
        COUNT(*) OVER (PARTITION BY EXTRACT(HOUR FROM created_at)) as hourly_sales,
        SUM(total) OVER (PARTITION BY EXTRACT(HOUR FROM created_at)) as hourly_revenue
      FROM sales_data
    ) subq
  )
  SELECT JSON_BUILD_OBJECT(
    'period_start', default_start_date,
    'period_end', default_end_date,
    'total_sales', total_sales,
    'total_revenue', total_revenue,
    'average_transaction', avg_transaction,
    'total_items_sold', total_items_sold,
    'category_breakdown', COALESCE(category_stats, '[]'::JSON),
    'hourly_distribution', COALESCE(hourly_stats, '{}'::JSON),
    'generated_at', NOW()
  ) INTO result
  FROM aggregated_stats;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 4. Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search 
ON products USING GIN (to_tsvector('english', name || ' ' || COALESCE(brand_name, '') || ' ' || COALESCE(category, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category 
ON products (category) WHERE is_archived = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_stock_status 
ON products (stock, reorder_level) WHERE is_archived = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_created_at 
ON sales (created_at, total) WHERE total > 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sale_items_product_created 
ON sale_items (product_id, created_at);

-- 5. Notification System Functions
CREATE OR REPLACE FUNCTION get_user_notifications(
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_unread_only BOOLEAN DEFAULT false,
  p_include_archived BOOLEAN DEFAULT false
)
RETURNS TABLE(
  id INTEGER,
  title TEXT,
  message TEXT,
  type TEXT,
  category TEXT,
  priority INTEGER,
  user_id UUID,
  related_entity_type TEXT,
  related_entity_id INTEGER,
  metadata JSONB,
  is_read BOOLEAN,
  is_archived BOOLEAN,
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.message,
    n.type,
    n.category,
    n.priority,
    n.user_id,
    n.related_entity_type,
    n.related_entity_id,
    n.metadata,
    n.is_read,
    n.is_archived,
    n.read_at,
    n.expires_at,
    n.created_at,
    n.updated_at
  FROM notifications n
  WHERE (p_user_id IS NULL OR n.user_id = p_user_id OR n.user_id IS NULL)
    AND (p_category IS NULL OR n.category = p_category)
    AND (p_type IS NULL OR n.type = p_type)
    AND (NOT p_unread_only OR n.is_read = false)
    AND (p_include_archived OR n.is_archived = false)
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_notification_stats(
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
  total_count BIGINT,
  unread_count BIGINT,
  archived_count BIGINT,
  critical_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE is_read = false AND is_archived = false) as unread_count,
    COUNT(*) FILTER (WHERE is_archived = true) as archived_count,
    COUNT(*) FILTER (WHERE priority >= 3 AND is_read = false) as critical_count
  FROM notifications n
  WHERE (p_user_id IS NULL OR n.user_id = p_user_id OR n.user_id IS NULL)
    AND (n.expires_at IS NULL OR n.expires_at > NOW());
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mark_notifications_read(
  notification_ids INTEGER[] DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  mark_all BOOLEAN DEFAULT false
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF mark_all THEN
    UPDATE notifications 
    SET is_read = true, 
        read_at = NOW(),
        updated_at = NOW()
    WHERE (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL)
      AND is_read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  ELSIF notification_ids IS NOT NULL THEN
    UPDATE notifications 
    SET is_read = true,
        read_at = NOW(),
        updated_at = NOW()
    WHERE id = ANY(notification_ids);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  ELSE
    updated_count := 0;
  END IF;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION archive_notifications(
  notification_ids INTEGER[] DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  archive_all_read BOOLEAN DEFAULT false
)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  IF archive_all_read THEN
    UPDATE notifications 
    SET is_archived = true,
        updated_at = NOW()
    WHERE (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL)
      AND is_read = true
      AND is_archived = false;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
  ELSIF notification_ids IS NOT NULL THEN
    UPDATE notifications 
    SET is_archived = true,
        updated_at = NOW()
    WHERE id = ANY(notification_ids);
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
  ELSE
    archived_count := 0;
  END IF;
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;
