-- Create archived_items table for storing archived products and other items
-- This table will store all archived items with their metadata and original data

CREATE TABLE IF NOT EXISTS public.archived_items (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL DEFAULT 'product', -- Type of item (product, transaction, etc.)
    name VARCHAR(255) NOT NULL, -- Name of the archived item
    description TEXT, -- Description of the archived item
    original_data JSONB NOT NULL, -- Complete original data as JSON
    archived_date TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- When it was archived
    archived_by VARCHAR(255) NOT NULL DEFAULT 'System', -- Who archived it
    reason TEXT, -- Reason for archiving
    category VARCHAR(100), -- Category of the item (for products)
    original_stock INTEGER DEFAULT 0, -- Original stock level (for products)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_archived_items_type ON public.archived_items(type);
CREATE INDEX IF NOT EXISTS idx_archived_items_archived_date ON public.archived_items(archived_date DESC);
CREATE INDEX IF NOT EXISTS idx_archived_items_name ON public.archived_items(name);
CREATE INDEX IF NOT EXISTS idx_archived_items_category ON public.archived_items(category);
CREATE INDEX IF NOT EXISTS idx_archived_items_archived_by ON public.archived_items(archived_by);

-- Enable Row Level Security (RLS)
ALTER TABLE public.archived_items ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (adjust based on your authentication setup)
-- Allow authenticated users to read all archived items
CREATE POLICY "Allow authenticated users to read archived items" ON public.archived_items
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert archived items
CREATE POLICY "Allow authenticated users to insert archived items" ON public.archived_items
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update archived items
CREATE POLICY "Allow authenticated users to update archived items" ON public.archived_items
    FOR UPDATE
    TO authenticated
    USING (true);

-- Allow authenticated users to delete archived items
CREATE POLICY "Allow authenticated users to delete archived items" ON public.archived_items
    FOR DELETE
    TO authenticated
    USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_archived_items_updated_at
    BEFORE UPDATE ON public.archived_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert some sample archived data (optional)
INSERT INTO public.archived_items (
    type,
    name,
    description,
    original_data,
    archived_by,
    reason,
    category,
    original_stock
) VALUES 
(
    'product',
    'Sample Archived Medicine',
    'Paracetamol 500mg tablets - archived for testing',
    '{"id": 999, "name": "Sample Archived Medicine", "category": "Pain Relief", "cost_price": 10.00, "selling_price": 15.00, "total_stock": 0, "description": "Paracetamol 500mg tablets", "supplier": "Sample Supplier"}',
    'System',
    'Sample data for testing archive functionality',
    'Pain Relief',
    50
),
(
    'product',
    'Expired Vitamins',
    'Vitamin C tablets - expired batch',
    '{"id": 998, "name": "Expired Vitamins", "category": "Supplements", "cost_price": 8.00, "selling_price": 12.00, "total_stock": 0, "description": "Vitamin C 1000mg tablets", "supplier": "Health Corp"}',
    'Admin User',
    'Expired product - removed from inventory',
    'Supplements',
    25
)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions (adjust role names based on your setup)
GRANT ALL ON public.archived_items TO authenticated;
GRANT ALL ON public.archived_items TO service_role;

-- Allow usage of the sequence
GRANT USAGE, SELECT ON SEQUENCE public.archived_items_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.archived_items_id_seq TO service_role;

-- Create a view for easier querying of product archives
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

-- Grant permissions on the view
GRANT SELECT ON public.archived_products TO authenticated;
GRANT SELECT ON public.archived_products TO service_role;

-- Add comment to document the table
COMMENT ON TABLE public.archived_items IS 'Stores archived items including products, transactions, and other entities with their complete original data and archival metadata';
COMMENT ON COLUMN public.archived_items.original_data IS 'Complete original data stored as JSONB for full restoration capability';
COMMENT ON COLUMN public.archived_items.type IS 'Type of archived item (product, transaction, user, etc.)';
COMMENT ON COLUMN public.archived_items.reason IS 'Human-readable reason for archiving this item';
