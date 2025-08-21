# MedCure Database Migration Guide

This guide will help you set up your MedCure system on a new Supabase instance.

## 📁 Available Migration Files

### 1. `complete_medcure_migration.sql` (RECOMMENDED)

**Use this for full production setup**

- Complete database schema with all features
- Advanced analytics and reporting
- Archive system for deleted items
- Audit trail for all changes
- Enhanced search capabilities
- Full inventory management
- Settings and user profile system

### 2. `basic_medcure_setup.sql`

**Use this for quick testing or minimal setup**

- Essential tables only (products, sales, sale_items, settings)
- Basic functions for core operations
- Simplified permissions
- Sample data included

## 🚀 Migration Steps

### Step 1: Choose Your Migration File

- **For Production:** Use `complete_medcure_migration.sql`
- **For Testing:** Use `basic_medcure_setup.sql`

### Step 2: Access Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 3: Run the Migration

1. Copy the entire content of your chosen migration file
2. Paste it into the SQL Editor
3. Click **Run** to execute the script
4. Wait for the success message

### Step 4: Verify Installation

After running the script, you should see:

- ✅ Success message with feature list
- ✅ Tables created in the Database section
- ✅ Functions available in the Database > Functions

## 📊 What Gets Created

### Tables

- `products` - Main inventory table
- `sales` - Transaction records
- `sale_items` - Items in each transaction
- `archived_items` - Deleted/archived items (full version only)
- `product_audit_log` - Change tracking (full version only)
- `app_settings` - Business configuration
- `user_profiles` - User data (full version only)

### Functions

- `decrement_stock()` - Reduce product stock
- `process_sale_transaction()` - Atomic sales processing (full version)
- `get_sales_analytics()` - Sales reports (full version)
- `get_inventory_analytics()` - Inventory stats (full version)
- `get_app_settings()` - Retrieve settings
- `update_app_setting()` - Update settings

### Views (Full Version Only)

- `products_enhanced` - Products with calculated fields
- `archived_products` - Easy access to archived items

## 🔐 Security Setup

The migration automatically configures:

- Row Level Security (RLS) enabled
- Public access policies (suitable for single-user pharmacy)
- Proper permissions for anon and authenticated users

### For Production (More Secure)

If you need user authentication, modify the policies in the script:

```sql
-- Change from public access
CREATE POLICY "Public can manage products" ON public.products FOR ALL USING (true);

-- To authenticated access
CREATE POLICY "Authenticated can manage products" ON public.products FOR ALL USING (auth.role() = 'authenticated');
```

## 🎯 Default Configuration

After migration, your system includes:

- **Business Name:** "MedCure Pharmacy"
- **Tagline:** "Your Trusted Healthcare Partner"
- **Currency:** ₱ (Philippine Peso)
- **Primary Color:** #2563eb (Blue)
- **Sample Product:** Paracetamol 500mg

## 🔧 Customization

### Update Business Information

```sql
SELECT update_app_setting('business_name', 'Your Pharmacy Name');
SELECT update_app_setting('business_tagline', 'Your Custom Tagline');
SELECT update_app_setting('currency_symbol', '$'); -- Change currency
```

### Add Your Products

```sql
INSERT INTO products (name, category, price, selling_price, cost_price, stock, total_stock)
VALUES ('Product Name', 'Category', 10.00, 15.00, 8.00, 100, 100);
```

## 🔄 Updating from Basic to Full

If you started with basic setup and want to upgrade:

1. Backup your data first
2. Run the complete migration script
3. Your existing data will be preserved

## 🆘 Troubleshooting

### Common Issues:

**Error: "relation already exists"**

- Solution: The table already exists, this is normal for updates

**Error: "function already exists"**

- Solution: The script uses `CREATE OR REPLACE`, this is expected

**Error: "permission denied"**

- Solution: Make sure you're running as the project owner in Supabase

**Error: "insufficient privilege"**

- Solution: Check your Supabase project permissions

### Getting Help:

1. Check the Supabase logs in the dashboard
2. Verify your project has the necessary permissions
3. Try running the basic setup first if the full migration fails

## ✅ Verification Checklist

After migration, verify these work in your MedCure app:

- [ ] Products page loads and displays items
- [ ] Can add/edit/delete products
- [ ] POS system processes sales
- [ ] Transaction history shows real data
- [ ] Settings page allows customization
- [ ] Dashboard shows analytics (full version)
- [ ] Archive system works (full version)

## 📝 Notes

- **Single Transaction:** The entire script runs in a single transaction, so it either completes fully or rolls back completely
- **Safe to Re-run:** You can safely run the migration multiple times
- **Version Tracking:** The app_settings table tracks your database version
- **Backup Recommended:** Always backup existing data before migration

Your MedCure system will be ready to use immediately after running the migration! 🎉
