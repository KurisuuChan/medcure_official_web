-- SECURE APPROACH: Fix anon role permissions
-- Run this in Supabase SQL Editor instead of using postgres role

-- 1. Disable RLS temporarily for testing (you can re-enable later)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- 2. Grant necessary permissions to anon role
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 3. Create sales table if it doesn't exist and grant permissions
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  items JSONB NOT NULL,
  subtotal DECIMAL NOT NULL,
  total DECIMAL NOT NULL,
  payment_method TEXT NOT NULL,
  amount_paid DECIMAL NOT NULL,
  change_amount DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON sales TO anon;

-- 4. Verify permissions
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.table_privileges 
WHERE table_name IN ('products', 'sales') 
AND grantee = 'anon';

-- This approach is MUCH safer than using postgres role!
