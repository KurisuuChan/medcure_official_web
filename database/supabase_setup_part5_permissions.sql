-- =====================================================
-- SUPABASE-COMPATIBLE SCHEMA SETUP - PART 5: PERMISSIONS & SAMPLE DATA
-- Run this last
-- =====================================================

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT SELECT ON public.products_enhanced TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO anon, authenticated;
GRANT SELECT, UPDATE ON public.notification_stats TO anon, authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_sales_analytics(DATE, DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_notifications(UUID, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_notification_stats(UUID) TO anon, authenticated;

-- Create welcome notification if none exist
INSERT INTO public.notifications (title, message, type, priority) 
SELECT 
    'Welcome to MedCure!',
    'Your pharmacy management system is ready to use. Check the dashboard for an overview of your inventory and sales.',
    'info',
    'normal'
WHERE NOT EXISTS (SELECT 1 FROM public.notifications LIMIT 1);

-- Update notification stats
SELECT public.get_notification_stats();
