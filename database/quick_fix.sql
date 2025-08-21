-- QUICK FIX: Dashboard Data Issue
-- Run this immediately in Supabase SQL Editor

-- 1. Add unique constraints to enable proper conflict resolution
ALTER TABLE public.products 
ADD CONSTRAINT unique_product_name UNIQUE (name);

ALTER TABLE public.sale_items 
ADD CONSTRAINT unique_sale_product UNIQUE (sale_id, product_id);

-- Optional: Add unique constraint to sales for better data integrity
ALTER TABLE public.sales 
ADD CONSTRAINT unique_sales_timestamp UNIQUE (created_at, total, payment_method);

-- 2. Add basic products with proper columns
INSERT INTO public.products (name, category, stock, total_stock, selling_price, cost_price, is_active)
VALUES 
  ('Medicine A', 'Medicines', 100, 100, 25.00, 15.00, true),
  ('Medicine B', 'Medicines', 5, 5, 30.00, 20.00, true),  -- Low stock
  ('Vitamin C', 'Vitamins', 75, 75, 12.00, 8.00, true),
  ('Supplies', 'Medical Supplies', 200, 200, 8.00, 5.00, true),
  ('Equipment', 'Equipment', 0, 0, 150.00, 100.00, true)  -- Out of stock
ON CONFLICT (name) DO NOTHING;

-- 3. Add today's sales
INSERT INTO public.sales (total, payment_method, created_at) 
VALUES 
  (75.00, 'cash', NOW()),
  (120.00, 'card', NOW() - INTERVAL '1 hour'),
  (45.00, 'gcash', NOW() - INTERVAL '2 hours')
ON CONFLICT (created_at, total, payment_method) DO NOTHING;

-- 4. Link sales to products with proper conflict handling
WITH latest_sales AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM public.sales 
  ORDER BY created_at DESC 
  LIMIT 3
),
latest_products AS (
  SELECT id, selling_price, ROW_NUMBER() OVER (ORDER BY id) as rn
  FROM public.products
  WHERE is_active = true
  LIMIT 3
)
INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, subtotal)
SELECT s.id, p.id, 1, p.selling_price, p.selling_price
FROM latest_sales s
JOIN latest_products p ON s.rn = p.rn
ON CONFLICT (sale_id, product_id) DO NOTHING;

-- 4. Verify results
SELECT 'Products' as table_name, COUNT(*) as count FROM public.products WHERE is_active = true
UNION ALL
SELECT 'Sales Today' as table_name, COUNT(*) as count FROM public.sales WHERE created_at >= CURRENT_DATE
UNION ALL
SELECT 'Sale Items' as table_name, COUNT(*) as count FROM public.sale_items;
