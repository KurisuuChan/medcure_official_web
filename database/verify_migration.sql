-- Verification script to check if the soft delete migration was successful

-- Check if the new columns exist in the products table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
AND column_name IN ('is_archived', 'archived_date', 'archived_by', 'archive_reason', 'restored_date', 'restored_by')
ORDER BY column_name;

-- Check if the archive_logs table was created
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_name = 'archive_logs' 
AND table_schema = 'public';

-- Check if the archived_products_view was created
SELECT table_name, table_type
FROM information_schema.views 
WHERE table_name = 'archived_products_view' 
AND table_schema = 'public';

-- Check if indexes were created
SELECT indexname, tablename, indexdef
FROM pg_indexes 
WHERE tablename IN ('products', 'archive_logs')
AND indexname LIKE '%archived%' OR indexname LIKE '%archive%'
ORDER BY tablename, indexname;
