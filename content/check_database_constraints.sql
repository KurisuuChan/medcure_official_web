-- Check and fix database constraints for products table

-- 1. Check current constraints on products table
SELECT 
    constraint_name, 
    constraint_type, 
    column_name,
    is_nullable
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
JOIN information_schema.columns c ON c.column_name = ccu.column_name AND c.table_name = tc.table_name
WHERE tc.table_name = 'products';

-- 2. Check column definitions
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- 3. If category should NOT be required, remove the NOT NULL constraint:
-- ALTER TABLE products ALTER COLUMN category DROP NOT NULL;

-- 4. If category SHOULD be required, make sure you always provide a value
-- (This is probably the better approach for a pharmacy system)

-- 5. Set default values for critical columns that might be missing:
UPDATE products SET category = 'Uncategorized' WHERE category IS NULL OR category = '';
UPDATE products SET generic_name = name WHERE generic_name IS NULL OR generic_name = '';

-- 6. Add default constraints to prevent future issues:
ALTER TABLE products ALTER COLUMN category SET DEFAULT 'Uncategorized';
ALTER TABLE products ALTER COLUMN cost_price SET DEFAULT 0;
ALTER TABLE products ALTER COLUMN selling_price SET DEFAULT 0;
ALTER TABLE products ALTER COLUMN total_stock SET DEFAULT 0;
ALTER TABLE products ALTER COLUMN critical_level SET DEFAULT 10;
ALTER TABLE products ALTER COLUMN pieces_per_sheet SET DEFAULT 1;
ALTER TABLE products ALTER COLUMN sheets_per_box SET DEFAULT 1;
