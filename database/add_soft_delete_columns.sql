-- Add soft delete columns to products table for improved archiving
-- This eliminates the need for localStorage fallback and ensures data consistency

-- Add soft delete and archive tracking columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS archived_date TIMESTAMPTZ;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS archived_by VARCHAR(255);

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS archive_reason TEXT;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS restored_date TIMESTAMPTZ;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS restored_by VARCHAR(255);

-- Create indexes for better performance on archived items queries
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON public.products(is_archived);
CREATE INDEX IF NOT EXISTS idx_products_archived_date ON public.products(archived_date DESC) WHERE is_archived = TRUE;

-- Create archive_logs table for audit trail (optional but recommended)
CREATE TABLE IF NOT EXISTS public.archive_logs (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    item_id BIGINT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    reason TEXT,
    archived_by VARCHAR(255) NOT NULL,
    original_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for archive logs
CREATE INDEX IF NOT EXISTS idx_archive_logs_type ON public.archive_logs(type);
CREATE INDEX IF NOT EXISTS idx_archive_logs_item_id ON public.archive_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_archive_logs_created_at ON public.archive_logs(created_at DESC);

-- Enable RLS on archive_logs table
ALTER TABLE public.archive_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for archive_logs
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read archive logs" ON public.archive_logs
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert archive logs" ON public.archive_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.archive_logs TO authenticated;
GRANT ALL ON public.archive_logs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.archive_logs_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.archive_logs_id_seq TO service_role;

-- Create a view for easy access to archived products
CREATE OR REPLACE VIEW public.archived_products_view AS
SELECT 
    id,
    name,
    category,
    manufacturer,
    description,
    price,
    cost_price,
    stock,
    is_archived,
    archived_date,
    archived_by,
    archive_reason,
    restored_date,
    restored_by,
    created_at,
    updated_at
FROM public.products
WHERE is_archived = TRUE
ORDER BY archived_date DESC;

-- Grant permissions on the view
GRANT SELECT ON public.archived_products_view TO authenticated;
GRANT SELECT ON public.archived_products_view TO service_role;

-- Add comments for documentation
COMMENT ON COLUMN public.products.is_archived IS 'Soft delete flag - TRUE when product is archived';
COMMENT ON COLUMN public.products.archived_date IS 'Timestamp when product was archived';
COMMENT ON COLUMN public.products.archived_by IS 'User who archived the product';
COMMENT ON COLUMN public.products.archive_reason IS 'Reason for archiving the product';
COMMENT ON COLUMN public.products.restored_date IS 'Timestamp when product was restored from archive';
COMMENT ON COLUMN public.products.restored_by IS 'User who restored the product';

COMMENT ON TABLE public.archive_logs IS 'Audit trail for all archive/restore operations';
COMMENT ON VIEW public.archived_products_view IS 'View showing only archived products with archive metadata';
