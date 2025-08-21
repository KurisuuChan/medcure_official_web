-- =====================================================
-- SUPABASE-COMPATIBLE SCHEMA SETUP - PART 3: FUNCTIONS
-- Run this after Part 2
-- =====================================================

-- Function to get sales analytics
CREATE OR REPLACE FUNCTION public.get_sales_analytics(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_sales', COALESCE(SUM(s.total), 0),
        'total_transactions', COUNT(s.id),
        'average_transaction', COALESCE(AVG(s.total), 0),
        'sales_by_day', COALESCE((
            SELECT json_agg(
                json_build_object(
                    'date', day_sales.sale_date,
                    'total', day_sales.daily_total,
                    'transactions', day_sales.transaction_count
                )
            )
            FROM (
                SELECT 
                    DATE(s2.created_at) as sale_date,
                    SUM(s2.total) as daily_total,
                    COUNT(s2.id) as transaction_count
                FROM public.sales s2
                WHERE DATE(s2.created_at) BETWEEN start_date AND end_date
                GROUP BY DATE(s2.created_at)
                ORDER BY DATE(s2.created_at)
            ) day_sales
        ), '[]'::json),
        'sales_by_category', COALESCE((
            SELECT json_agg(
                json_build_object(
                    'category', cat_sales.category,
                    'total', cat_sales.category_total,
                    'items_sold', cat_sales.items_count
                )
            )
            FROM (
                SELECT 
                    COALESCE(p.category, 'Uncategorized') as category,
                    SUM(si.subtotal) as category_total,
                    SUM(si.quantity) as items_count
                FROM public.sale_items si
                JOIN public.sales s3 ON si.sale_id = s3.id
                JOIN public.products p ON si.product_id = p.id
                WHERE DATE(s3.created_at) BETWEEN start_date AND end_date
                GROUP BY p.category
                ORDER BY category_total DESC
            ) cat_sales
        ), '[]'::json),
        'top_products', COALESCE((
            SELECT json_agg(
                json_build_object(
                    'product_id', top_products.product_id,
                    'product_name', top_products.product_name,
                    'quantity_sold', top_products.quantity_sold,
                    'revenue', top_products.revenue
                )
            )
            FROM (
                SELECT 
                    p.id as product_id,
                    p.name as product_name,
                    SUM(si.quantity) as quantity_sold,
                    SUM(si.subtotal) as revenue
                FROM public.sale_items si
                JOIN public.sales s4 ON si.sale_id = s4.id
                JOIN public.products p ON si.product_id = p.id
                WHERE DATE(s4.created_at) BETWEEN start_date AND end_date
                GROUP BY p.id, p.name
                ORDER BY quantity_sold DESC
                LIMIT 10
            ) top_products
        ), '[]'::json)
    ) INTO result
    FROM public.sales s
    WHERE DATE(s.created_at) BETWEEN start_date AND end_date;
    
    RETURN COALESCE(result, '{}'::json);
END;
$$;
