-- =====================================================
-- FIX ARCHIVED_BY COLUMN TYPE - Force TEXT Type
-- This script fixes the archived_by column to be TEXT instead of UUID
-- =====================================================

-- First, drop the column if it exists with wrong type
DO $$ 
BEGIN
    -- Check if archived_by exists and drop it if it's UUID type
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'archived_by'
        AND table_schema = 'public'
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.products DROP COLUMN archived_by;
        RAISE NOTICE 'Dropped existing UUID archived_by column';
    END IF;
END $$;

-- Add all archiving columns with correct types
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS archive_reason TEXT,
ADD COLUMN IF NOT EXISTS archived_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_by TEXT,
ADD COLUMN IF NOT EXISTS restored_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- Create optional archive_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.archive_logs (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    item_id BIGINT,
    item_name VARCHAR(255),
    reason TEXT,
    archived_by TEXT,
    original_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_archive_logs_created_at ON public.archive_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_archive_logs_type ON public.archive_logs(type);

-- Grant permissions
GRANT ALL ON public.archive_logs TO anon, authenticated;
GRANT ALL ON SEQUENCE public.archive_logs_id_seq TO anon, authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'ARCHIVED_BY COLUMN TYPE FIXED!';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Fixed:';
    RAISE NOTICE '✓ Ensured archived_by is TEXT type (not UUID)';
    RAISE NOTICE '✓ Added all required archiving columns';
    RAISE NOTICE '✓ Created archive_logs table';
    RAISE NOTICE '';
    RAISE NOTICE 'Archiving should now work with "Admin User" string!';
    RAISE NOTICE '=================================================';
END $$;
