# MedCure Database Schema

This document outlines the database schema required for the MedCure pharmacy management system.

## Tables

### 1. products

Main inventory table for all pharmaceutical products.

```sql
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  stock INTEGER NOT NULL DEFAULT 0,
  pieces_per_sheet INTEGER DEFAULT 1,
  sheets_per_box INTEGER DEFAULT 1,
  barcode VARCHAR(100),
  description TEXT,
  manufacturer VARCHAR(255),
  expiration_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. sales

Records of completed transactions.

```sql
CREATE TABLE sales (
  id BIGSERIAL PRIMARY KEY,
  total DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. sale_items

Individual items within each sale transaction.

```sql
CREATE TABLE sale_items (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT REFERENCES sales(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id),
  quantity INTEGER NOT NULL, -- Total pieces sold
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  variant_info JSONB, -- Stores box/sheet/piece breakdown
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Required Functions

### 1. decrement_stock

Function to safely update product stock after sales.

```sql
CREATE OR REPLACE FUNCTION decrement_stock(
  product_id BIGINT,
  decrement_amount INTEGER
)
RETURNS products AS $$
DECLARE
  updated_product products;
BEGIN
  UPDATE products
  SET
    stock = stock - decrement_amount,
    updated_at = NOW()
  WHERE id = product_id AND stock >= decrement_amount
  RETURNING * INTO updated_product;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product ID %', product_id;
  END IF;

  RETURN updated_product;
END;
$$ LANGUAGE plpgsql;
```

### 2. get_low_stock_products

Function to get products below a certain stock threshold.

```sql
CREATE OR REPLACE FUNCTION get_low_stock_products(threshold INTEGER DEFAULT 10)
RETURNS TABLE(
  id BIGINT,
  name VARCHAR(255),
  category VARCHAR(100),
  stock INTEGER,
  price DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.category, p.stock, p.price
  FROM products p
  WHERE p.stock < threshold
  ORDER BY p.stock ASC;
END;
$$ LANGUAGE plpgsql;
```

## Indexes

Create these indexes for better performance:

```sql
-- Products indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_stock ON products(stock);
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('english', name));

-- Sales indexes
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);
```

## Row Level Security (RLS)

Enable RLS for secure access:

```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all operations for authenticated users" ON products
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON sales
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON sale_items
  FOR ALL USING (auth.role() = 'authenticated');
```

## Sample Data

```sql
-- Insert sample products
INSERT INTO products (name, category, price, cost_price, stock, pieces_per_sheet, sheets_per_box) VALUES
('Paracetamol 500mg', 'Analgesic', 2.50, 1.50, 120, 10, 10),
('Amoxicillin 500mg', 'Antibiotic', 8.75, 6.00, 80, 8, 5),
('Vitamin C 1000mg', 'Supplement', 15.00, 10.00, 60, 1, 30),
('Ibuprofen 200mg', 'Anti-inflammatory', 3.25, 2.00, 150, 10, 10),
('Cetirizine 10mg', 'Antihistamine', 4.50, 3.00, 90, 10, 6);
```

## Setup Instructions

1. Create a new Supabase project
2. Run the table creation scripts in the SQL editor
3. Create the functions and indexes
4. Enable RLS and create policies
5. Insert sample data (optional)
6. Copy your project URL and anon key to your `.env` file
