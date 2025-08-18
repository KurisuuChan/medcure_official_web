-- Migration script for Archive functionality
-- Run this in Supabase SQL Editor

-- Step 1: Create the archived_items table
DO $$
BEGIN
    -- Check if table exists before creating
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'archived_items') THEN
        EXECUTE '
        CREATE TABLE public.archived_items (
            id BIGSERIAL PRIMARY KEY,
            type VARCHAR(50) NOT NULL DEFAULT ''product'',
            name VARCHAR(255) NOT NULL,
            description TEXT,
            original_data JSONB NOT NULL,
            archived_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            archived_by VARCHAR(255) NOT NULL DEFAULT ''System'',
            reason TEXT,
            category VARCHAR(100),
            original_stock INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )';
        
        RAISE NOTICE 'Table archived_items created successfully';
    ELSE
        RAISE NOTICE 'Table archived_items already exists';
    END IF;
END
$$;

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_archived_items_type ON public.archived_items(type);
CREATE INDEX IF NOT EXISTS idx_archived_items_archived_date ON public.archived_items(archived_date DESC);
CREATE INDEX IF NOT EXISTS idx_archived_items_name ON public.archived_items(name);
CREATE INDEX IF NOT EXISTS idx_archived_items_category ON public.archived_items(category);

-- Step 3: Enable RLS
ALTER TABLE public.archived_items ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow authenticated users to read archived items" ON public.archived_items;
    DROP POLICY IF EXISTS "Allow authenticated users to insert archived items" ON public.archived_items;
    DROP POLICY IF EXISTS "Allow authenticated users to update archived items" ON public.archived_items;
    DROP POLICY IF EXISTS "Allow authenticated users to delete archived items" ON public.archived_items;
    
    -- Create new policies
    CREATE POLICY "Allow authenticated users to read archived items" ON public.archived_items
        FOR SELECT TO authenticated USING (true);
    
    CREATE POLICY "Allow authenticated users to insert archived items" ON public.archived_items
        FOR INSERT TO authenticated WITH CHECK (true);
    
    CREATE POLICY "Allow authenticated users to update archived items" ON public.archived_items
        FOR UPDATE TO authenticated USING (true);
    
    CREATE POLICY "Allow authenticated users to delete archived items" ON public.archived_items
        FOR DELETE TO authenticated USING (true);
    
    RAISE NOTICE 'RLS policies created successfully';
END
$$;

-- Step 5: Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger
DROP TRIGGER IF EXISTS trigger_archived_items_updated_at ON public.archived_items;
CREATE TRIGGER trigger_archived_items_updated_at
    BEFORE UPDATE ON public.archived_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Step 7: Grant permissions
GRANT ALL ON public.archived_items TO authenticated;
GRANT ALL ON public.archived_items TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.archived_items_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.archived_items_id_seq TO service_role;

-- Step 8: Create helper view
CREATE OR REPLACE VIEW public.archived_products AS
SELECT 
    id,
    name,
    description,
    (original_data->>'category') as category,
    (original_data->>'cost_price')::numeric as cost_price,
    (original_data->>'selling_price')::numeric as selling_price,
    original_stock,
    archived_date,
    archived_by,
    reason,
    original_data
FROM public.archived_items
WHERE type = 'product'
ORDER BY archived_date DESC;

GRANT SELECT ON public.archived_products TO authenticated;
GRANT SELECT ON public.archived_products TO service_role;

-- Verification query - Run this to confirm everything is set up correctly
SELECT 
    'archived_items' as table_name,
    COUNT(*) as row_count,
    'Table created and ready' as status
FROM public.archived_items
UNION ALL
SELECT 
    'archived_products_view' as table_name,
    COUNT(*) as row_count,
    'View created and ready' as status
FROM public.archived_products;

-- Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'archived_items'
ORDER BY ordinal_position;
