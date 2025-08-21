# Database Schema Setup Guide

This guide will help you set up the complete MedCure database schema to resolve all the 404 and missing table errors.

## Prerequisites

1. Access to your Supabase dashboard
2. SQL Editor access in Supabase
3. The SQL files in the `database/` folder

## Setup Steps

### Step 1: Run the Main Database Setup

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Run the main setup file: `database/medcure_complete_setup.sql`
   - This creates the core tables (products, sales, sale_items, etc.)

### Step 2: Run the Missing Schema Setup

1. In the SQL Editor, run: `database/missing_schema_setup.sql`
   - This creates the missing views, functions, and tables that were causing 404 errors
   - Specifically creates:
     - `products_enhanced` view
     - `notifications` table and functions
     - `get_sales_analytics()` function
     - `get_user_notifications()` function
     - `get_notification_stats()` function

### Step 3: Set Up Storage (Optional)

1. Run: `database/storage_buckets_setup.sql`
   - Creates storage buckets for file uploads

### Step 4: Verify Setup

After running the scripts, verify the setup by checking:

1. **Tables created:**

   - `products`
   - `sales`
   - `sale_items`
   - `notifications`
   - `notification_stats`

2. **Views created:**

   - `products_enhanced`

3. **Functions created:**
   - `get_sales_analytics()`
   - `get_user_notifications()`
   - `get_notification_stats()`
   - `create_low_stock_notifications()`
   - `create_expiry_notifications()`

## Common Issues and Solutions

### Issue: "Could not find the table 'public.products_enhanced'"

**Solution:** Run the `missing_schema_setup.sql` script - it creates the `products_enhanced` view.

### Issue: "No matching export in productService.js"

**Solution:** This has been fixed in the codebase. The missing functions were added.

### Issue: RPC function not found (404 errors)

**Solution:** Run the `missing_schema_setup.sql` script - it creates all the missing RPC functions.

### Issue: Permission errors

**Solution:** The setup scripts include proper permission grants. If you still have issues, make sure you're using the service_role key for development.

## Testing the Setup

After running the scripts, your application should:

1. ✅ Load without build errors
2. ✅ Display the dashboard without 404 errors
3. ✅ Show product listings
4. ✅ Display notifications (if any)
5. ✅ Allow sales transactions

## Next Steps

1. **Add sample data:** Use the POS system to add some sample products
2. **Test functionality:** Try creating sales, managing inventory
3. **Set up notifications:** The system will automatically create low stock and expiry notifications

## SQL Execution Order

1. `medcure_complete_setup.sql` (Core schema)
2. `missing_schema_setup.sql` (Missing elements)
3. `storage_buckets_setup.sql` (Optional - for file uploads)

## Troubleshooting

If you encounter any issues:

1. Check the Supabase logs for detailed error messages
2. Verify that all tables were created successfully
3. Ensure proper permissions are set
4. Check that you're using the correct Supabase URL and keys

---

**Note:** The application is currently using the service_role key for development. Make sure to switch to the anon key for production deployment.
