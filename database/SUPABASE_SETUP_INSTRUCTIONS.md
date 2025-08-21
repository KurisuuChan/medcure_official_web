# Supabase Setup Instructions

## Quick Setup (Recommended)

Run these SQL files **in order** in your Supabase SQL Editor:

### Step 1: Tables

```sql
-- Copy and paste contents of: supabase_setup_part1_tables.sql
```

### Step 2: Views

```sql
-- Copy and paste contents of: supabase_setup_part2_views.sql
```

### Step 3: Functions

```sql
-- Copy and paste contents of: supabase_setup_part3_functions.sql
```

### Step 4: Notifications

```sql
-- Copy and paste contents of: supabase_setup_part4_notifications.sql
```

### Step 5: Permissions

```sql
-- Copy and paste contents of: supabase_setup_part5_permissions.sql
```

## What Each Part Does

1. **Part 1**: Creates missing columns and notification tables
2. **Part 2**: Creates the `products_enhanced` view (fixes 404 errors)
3. **Part 3**: Creates `get_sales_analytics()` function
4. **Part 4**: Creates notification functions
5. **Part 5**: Sets up permissions and sample data

## Expected Results

After running all parts:

- ✅ No more "products_enhanced not found" errors
- ✅ No more RPC function 404 errors
- ✅ Management page will load products
- ✅ Dashboard will show analytics
- ✅ Notifications system will work

## Troubleshooting

If you get an error:

1. Check that you ran the previous parts first
2. Make sure your products table exists
3. Verify you have the right permissions in Supabase

The split approach ensures each section runs without errors in Supabase.
