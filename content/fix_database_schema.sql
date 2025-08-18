-- Quick fix for database schema mismatch
-- This will ensure your database works with both old and new column names

-- Option 1: Update existing products to have consistent data
UPDATE products 
SET 
    price = COALESCE(selling_price, price, 0),
    selling_price = COALESCE(price, selling_price, 0),
    stock = COALESCE(total_stock, stock, 0),
    total_stock = COALESCE(stock, total_stock, 0)
WHERE price IS NULL OR selling_price IS NULL OR stock IS NULL OR total_stock IS NULL;

-- Option 2: Set default values to prevent null constraint violations
ALTER TABLE products ALTER COLUMN price SET DEFAULT 0;
ALTER TABLE products ALTER COLUMN category SET DEFAULT 'Uncategorized';

-- Option 3: If you want to remove the NOT NULL constraint from price (not recommended)
-- ALTER TABLE products ALTER COLUMN price DROP NOT NULL;
