-- Essential Database Functions for MedCure
-- Run this in your Supabase SQL Editor to ensure all required functions exist

-- 1. Create the decrement_stock function (required for sales)
CREATE OR REPLACE FUNCTION decrement_stock(
  product_id BIGINT,
  decrement_amount INTEGER
)
RETURNS products AS $$
DECLARE
  updated_product products;
BEGIN
  UPDATE products
  SET
    stock = stock - decrement_amount,
    total_stock = total_stock - decrement_amount,
    updated_at = NOW()
  WHERE id = product_id AND stock >= decrement_amount
  RETURNING * INTO updated_product;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product ID %', product_id;
  END IF;

  RETURN updated_product;
END;
$$ LANGUAGE plpgsql;

-- 2. Add missing columns if they don't exist
DO $$
BEGIN
  -- Add is_archived column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_archived') THEN
    ALTER TABLE products ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add total_stock column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'total_stock') THEN
    ALTER TABLE products ADD COLUMN total_stock INTEGER;
    -- Sync total_stock with stock for existing records
    UPDATE products SET total_stock = stock WHERE total_stock IS NULL;
  END IF;

  -- Add selling_price column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'selling_price') THEN
    ALTER TABLE products ADD COLUMN selling_price DECIMAL(10,2);
    -- Set selling_price to price for existing records
    UPDATE products SET selling_price = price WHERE selling_price IS NULL;
  END IF;

  -- Add cost_price column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'cost_price') THEN
    ALTER TABLE products ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0;
  END IF;

  -- Add expiration_date column if it doesn't exist (renamed from expiry_date)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'expiration_date') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'expiry_date') THEN
      -- Rename expiry_date to expiration_date
      ALTER TABLE products RENAME COLUMN expiry_date TO expiration_date;
    ELSE
      -- Add new expiration_date column
      ALTER TABLE products ADD COLUMN expiration_date DATE;
    END IF;
  END IF;

  -- Add pieces_per_sheet column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'pieces_per_sheet') THEN
    ALTER TABLE products ADD COLUMN pieces_per_sheet INTEGER DEFAULT 10;
  END IF;

  -- Add sheets_per_box column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sheets_per_box') THEN
    ALTER TABLE products ADD COLUMN sheets_per_box INTEGER DEFAULT 10;
  END IF;

  -- Add brand_name column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'brand_name') THEN
    ALTER TABLE products ADD COLUMN brand_name VARCHAR(255);
  END IF;

END $$;

-- 3. Update default values for existing NULL records
UPDATE products 
SET 
    pieces_per_sheet = 10 WHERE pieces_per_sheet IS NULL,
    sheets_per_box = 10 WHERE sheets_per_box IS NULL,
    cost_price = 0 WHERE cost_price IS NULL,
    is_archived = FALSE WHERE is_archived IS NULL;

-- 4. Ensure RLS is enabled and policies exist
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Public can view products" ON products;
DROP POLICY IF EXISTS "Public can insert products" ON products;
DROP POLICY IF EXISTS "Public can update products" ON products;
DROP POLICY IF EXISTS "Public can delete products" ON products;

DROP POLICY IF EXISTS "Public can view sales" ON sales;
DROP POLICY IF EXISTS "Public can insert sales" ON sales;
DROP POLICY IF EXISTS "Public can update sales" ON sales;
DROP POLICY IF EXISTS "Public can delete sales" ON sales;

DROP POLICY IF EXISTS "Public can view sale_items" ON sale_items;
DROP POLICY IF EXISTS "Public can insert sale_items" ON sale_items;
DROP POLICY IF EXISTS "Public can update sale_items" ON sale_items;
DROP POLICY IF EXISTS "Public can delete sale_items" ON sale_items;

-- Create new policies for public access
CREATE POLICY "Public can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Public can insert products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update products" ON products FOR UPDATE USING (true);
CREATE POLICY "Public can delete products" ON products FOR DELETE USING (true);

CREATE POLICY "Public can view sales" ON sales FOR SELECT USING (true);
CREATE POLICY "Public can insert sales" ON sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update sales" ON sales FOR UPDATE USING (true);
CREATE POLICY "Public can delete sales" ON sales FOR DELETE USING (true);

CREATE POLICY "Public can view sale_items" ON sale_items FOR SELECT USING (true);
CREATE POLICY "Public can insert sale_items" ON sale_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update sale_items" ON sale_items FOR UPDATE USING (true);
CREATE POLICY "Public can delete sale_items" ON sale_items FOR DELETE USING (true);

-- 5. Grant permissions to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON products(is_archived);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Essential database setup completed successfully!';
    RAISE NOTICE 'Functions created: decrement_stock';
    RAISE NOTICE 'Missing columns added to products table';
    RAISE NOTICE 'RLS policies updated for public access';
    RAISE NOTICE 'Performance indexes created';
END $$;
