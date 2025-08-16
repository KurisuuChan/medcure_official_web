# MedCure Pharmacy Management System - Backend Setup Guide

## Overview

This document provides step-by-step instructions to set up the backend for the MedCure Pharmacy Management System using Supabase as the database.

## Prerequisites

- Supabase account (free tier is sufficient)
- Node.js and npm installed
- Basic knowledge of SQL and React

## Step 1: Supabase Setup

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `medcure-pharmacy`
   - Database Password: (choose a strong password)
   - Region: (choose closest to your location)
5. Click "Create new project"

### 1.2 Get Project Credentials

1. In your Supabase dashboard, go to Settings → API
2. Copy the following values:
   - Project URL
   - Project API Key (anon/public)

### 1.3 Update Environment Variables

Create/Update the `.env` file in your project root with:

```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 2: Database Schema Setup

### 2.1 Run the SQL Schema

1. In your Supabase dashboard, go to SQL Editor
2. Create a new query
3. Copy the entire content from `database/schema.sql`
4. Run the query to create all tables, triggers, and sample data

### 2.2 Verify Tables Created

Check that the following tables were created:

- `products` - Main inventory table
- `sales_transactions` - Sales records
- `sales_items` - Individual items in each sale
- `stock_movements` - Stock change history
- `categories` - Product categories

## Step 3: Row Level Security (RLS) Configuration

For production use, you should enable RLS. Here are basic policies:

```sql
-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Basic policies (adjust based on your auth requirements)
-- For development/demo, you can use these permissive policies:

CREATE POLICY "Allow all operations on products" ON products
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on sales_transactions" ON sales_transactions
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on sales_items" ON sales_items
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on stock_movements" ON stock_movements
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on categories" ON categories
  FOR ALL USING (true);
```

## Step 4: Test the Setup

### 4.1 Install Dependencies

```bash
npm install
```

### 4.2 Start Development Server

```bash
npm run dev
```

### 4.3 Test Basic Functionality

1. **Management Page**:

   - View products list
   - Add a new product
   - Edit existing product
   - Import CSV data
   - Export data

2. **POS Page**:
   - Browse products
   - Add items to cart with different quantities (boxes, sheets, pieces)
   - Apply discounts
   - Complete a sale
   - Verify stock reduction

## Step 5: Data Flow Explanation

### Product Management Flow:

1. **Add Product** → `products` table → Creates initial `stock_movements` entry
2. **Import CSV** → Parses CSV → Validates data → Bulk insert to `products` table
3. **Edit Product** → Updates `products` table → Triggers update timestamp

### POS/Sales Flow:

1. **Add to Cart** → Temporary cart state (React)
2. **Complete Sale** → Creates `sales_transactions` record
3. **Sale Items** → Creates `sales_items` records for each cart item
4. **Stock Update** → Reduces `products.total_stock` → Creates `stock_movements` records
5. **Transaction Complete** → Returns transaction details

### Stock Movement Tracking:

- Every stock change is recorded in `stock_movements`
- Types: 'in' (receiving), 'out' (sales), 'adjustment' (manual), 'expired'
- Maintains audit trail for inventory management

## Step 6: CSV Import Format

The system supports CSV import with the following columns:

### Required Columns:

- `name` - Product name
- `category` - Product category
- `cost_price` - Cost price (decimal)
- `selling_price` - Selling price (decimal)
- `total_stock` - Total pieces in stock

### Optional Columns:

- `generic_name` - Generic medicine name
- `brand_name` - Brand name
- `barcode` - Product barcode
- `supplier` - Supplier name
- `critical_level` - Low stock threshold (default: 10)
- `pieces_per_sheet` - Pieces per sheet (default: 1)
- `sheets_per_box` - Sheets per box (default: 1)
- `expiry_date` - Expiry date (YYYY-MM-DD)
- `batch_number` - Batch number
- `description` - Product description

### Sample CSV:

```csv
name,category,cost_price,selling_price,total_stock,critical_level,pieces_per_sheet,sheets_per_box,supplier
"Paracetamol 500mg","Pain Relief",12.50,15.50,100,10,10,10,"PharmaCorp Inc."
"Amoxicillin 500mg","Antibiotics",18.75,25.00,80,20,8,5,"MediSupply Co."
```

## Step 7: Common Issues and Solutions

### Issue: Supabase Connection Error

- Verify `.env` file has correct URL and key
- Check if Supabase project is active
- Ensure network connectivity

### Issue: RLS Blocking Operations

- Check if Row Level Security policies are configured
- For development, use the permissive policies above
- For production, implement proper authentication

### Issue: CSV Import Failing

- Check CSV format matches expected columns
- Verify data types (numbers for prices, dates in YYYY-MM-DD format)
- Check for special characters in product names

### Issue: Stock Not Updating

- Verify `stock_movements` table has entries
- Check triggers are working properly
- Ensure transaction is completing successfully

## Step 8: Next Steps for Production

1. **Authentication**: Implement user authentication with Supabase Auth
2. **Role-based Access**: Set up different user roles (admin, cashier, etc.)
3. **Backup Strategy**: Configure automatic database backups
4. **Monitoring**: Set up error tracking and performance monitoring
5. **Security**: Review and tighten RLS policies
6. **Validation**: Add more client and server-side validation

## Database Schema Summary

### Tables:

1. **products** - Core inventory data with packaging info
2. **sales_transactions** - Header record for each sale
3. **sales_items** - Line items for each sale
4. **stock_movements** - Audit trail for all stock changes
5. **categories** - Product categories lookup

### Key Features:

- Automatic stock level calculation
- PWD/Senior citizen discount support
- Multi-unit packaging (boxes, sheets, pieces)
- Complete audit trail
- Automatic timestamp management
- Data validation and constraints

## Support

For issues or questions:

1. Check the Supabase documentation
2. Review the error logs in browser console
3. Check the network tab for API call failures
4. Verify data integrity in Supabase dashboard
