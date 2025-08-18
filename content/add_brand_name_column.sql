-- Add all missing columns to products table
-- This script will add columns that are required by the ProductModal but missing from the database

-- Add brand_name column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS brand_name TEXT;

-- Add generic_name column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS generic_name TEXT;

-- Add critical_level column (minimum stock alert level)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS critical_level INTEGER DEFAULT 10;

-- Add pieces_per_sheet column (packaging information)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS pieces_per_sheet INTEGER DEFAULT 1;

-- Add sheets_per_box column (packaging information)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sheets_per_box INTEGER DEFAULT 1;

-- Add supplier column if missing
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS supplier TEXT;

-- Add cost_price column if missing
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0;

-- Add selling_price column if missing
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10,2) DEFAULT 0;

-- Add total_stock column if missing
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS total_stock INTEGER DEFAULT 0;

-- Add batch_number column if missing
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS batch_number TEXT;

-- Add expiry_date column if missing
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Add description column if missing
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comments to the columns
COMMENT ON COLUMN products.brand_name IS 'Brand name of the product';
COMMENT ON COLUMN products.generic_name IS 'Generic name of the product';
COMMENT ON COLUMN products.critical_level IS 'Minimum stock level before alert';
COMMENT ON COLUMN products.pieces_per_sheet IS 'Number of pieces per sheet (packaging)';
COMMENT ON COLUMN products.sheets_per_box IS 'Number of sheets per box (packaging)';
COMMENT ON COLUMN products.supplier IS 'Supplier name';
COMMENT ON COLUMN products.cost_price IS 'Cost price per unit';
COMMENT ON COLUMN products.selling_price IS 'Selling price per unit';
COMMENT ON COLUMN products.total_stock IS 'Total quantity in stock';
COMMENT ON COLUMN products.batch_number IS 'Product batch number';
COMMENT ON COLUMN products.expiry_date IS 'Product expiry date';
COMMENT ON COLUMN products.description IS 'Product description';
