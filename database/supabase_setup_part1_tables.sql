-- =====================================================
-- SUPABASE-COMPATIBLE SCHEMA SETUP - PART 1: TABLES
-- Run this first in Supabase SQL Editor
-- =====================================================

-- Add missing columns to products table if they don't exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS generic_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS critical_level INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255),
ADD COLUMN IF NOT EXISTS supplier VARCHAR(255);

-- Update existing records to have is_active = true if null
UPDATE public.products SET is_active = TRUE WHERE is_active IS NULL;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    priority VARCHAR(20) DEFAULT 'normal',
    is_read BOOLEAN DEFAULT FALSE,
    user_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_stats table for caching
CREATE TABLE IF NOT EXISTS public.notification_stats (
    id BIGSERIAL PRIMARY KEY,
    total_notifications INTEGER DEFAULT 0,
    unread_notifications INTEGER DEFAULT 0,
    high_priority_unread INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial stats record
INSERT INTO public.notification_stats (total_notifications, unread_notifications, high_priority_unread)
SELECT 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM public.notification_stats LIMIT 1);
