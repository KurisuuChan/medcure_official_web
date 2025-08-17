-- MedCure Pharmacy Database Schema
-- This file contains the SQL statements to set up the database tables

-- 1. Products Table - Main inventory management
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    brand_name VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    description TEXT,
    barcode VARCHAR(50) UNIQUE,
    supplier VARCHAR(255),
    
    -- Pricing
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- Stock Management
    total_stock INTEGER NOT NULL DEFAULT 0,
    critical_level INTEGER DEFAULT 10,
    
    -- Packaging Information
    pieces_per_sheet INTEGER DEFAULT 1,
    sheets_per_box INTEGER DEFAULT 1,
    total_pieces_per_box INTEGER DEFAULT 1,
    
    -- Product Status
    is_active BOOLEAN DEFAULT true,
    expiry_date DATE,
    batch_number VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sales Transactions Table
CREATE TABLE IF NOT EXISTS sales_transactions (
    id SERIAL PRIMARY KEY,
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Totals
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    pwd_senior_discount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- Customer Information
    is_pwd_senior BOOLEAN DEFAULT false,
    customer_name VARCHAR(255),
    
    -- Payment
    payment_method VARCHAR(50) DEFAULT 'cash',
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    change_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed', -- completed, cancelled, refunded
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Sales Items Table - Individual items in each sale
CREATE TABLE IF NOT EXISTS sales_items (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES sales_transactions(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    
    -- Quantity breakdown
    boxes_sold INTEGER DEFAULT 0,
    sheets_sold INTEGER DEFAULT 0,
    pieces_sold INTEGER DEFAULT 0,
    total_pieces INTEGER NOT NULL,
    
    -- Pricing at time of sale
    unit_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(10,2) NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Stock Movements Table - Track all stock changes
CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    
    -- Movement details
    movement_type VARCHAR(20) NOT NULL, -- 'in', 'out', 'adjustment', 'expired'
    quantity_change INTEGER NOT NULL, -- positive for in, negative for out
    remaining_stock INTEGER NOT NULL,
    
    -- Reference information
    reference_type VARCHAR(50), -- 'sale', 'purchase', 'adjustment', 'import'
    reference_id INTEGER, -- ID of the related transaction
    
    -- Additional info
    notes TEXT,
    batch_number VARCHAR(100),
    expiry_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Categories Table (Optional - for better category management)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Settings Table - Application configuration and preferences
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL, -- Store all settings as JSON for flexibility
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Notifications Table - System notifications and alerts
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    
    -- Notification content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    category VARCHAR(50) DEFAULT 'System', -- 'Inventory', 'Sales', 'System', 'Reports'
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    
    -- Reference information (for related entities)
    reference_type VARCHAR(50), -- 'product', 'transaction', 'stock_movement', 'system'
    reference_id INTEGER, -- ID of the related entity
    
    -- Metadata
    priority INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high, 4=critical
    expires_at TIMESTAMP WITH TIME ZONE, -- For temporary notifications
    
    -- Tracking
    created_by VARCHAR(100) DEFAULT 'system', -- user ID or 'system'
    read_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (name, description) VALUES 
('Pain Relief', 'Analgesics and pain management medications'),
('Antibiotics', 'Antimicrobial medications'),
('Vitamins', 'Vitamin and mineral supplements'),
('Supplements', 'Nutritional supplements'),
('Cough & Cold', 'Respiratory and cold medications'),
('First Aid', 'Emergency and wound care supplies'),
('Medical Devices', 'Medical equipment and devices'),
('Cardiovascular', 'Heart and circulation medications'),
('Digestive', 'Gastrointestinal medications'),
('Dermatology', 'Skin care and topical medications')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_date ON sales_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_transactions_number ON sales_transactions(transaction_number);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON notifications(reference_type, reference_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to products and sales_transactions tables
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_transactions_updated_at BEFORE UPDATE ON sales_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update total_pieces_per_box when packaging info changes
CREATE OR REPLACE FUNCTION update_total_pieces_per_box()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_pieces_per_box = NEW.pieces_per_sheet * NEW.sheets_per_box;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to automatically calculate total pieces per box
CREATE TRIGGER calculate_total_pieces_per_box BEFORE INSERT OR UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_total_pieces_per_box();

-- Insert sample data for testing
INSERT INTO products (
    name, generic_name, category, barcode, supplier,
    cost_price, selling_price, total_stock,
    pieces_per_sheet, sheets_per_box, critical_level,
    expiry_date, batch_number
) VALUES 
(
    'Paracetamol 500mg', 'Paracetamol', 'Pain Relief', '8901030825556', 'PharmaCorp Inc.',
    12.50, 15.50, 1500,
    10, 10, 50,
    '2025-12-31', 'PARA001'
),
(
    'Amoxicillin 500mg', 'Amoxicillin', 'Antibiotics', '8901030825557', 'MediSupply Co.',
    18.75, 25.00, 800,
    8, 5, 40,
    '2025-08-15', 'AMOX001'
),
(
    'Vitamin C 1000mg', 'Ascorbic Acid', 'Vitamins', '8901030825558', 'HealthMax Ltd.',
    120.00, 180.00, 432,
    12, 6, 30,
    '2026-03-20', 'VITC001'
),
(
    'Cough Syrup 100ml', 'Dextromethorphan', 'Cough & Cold', '8901030825559', 'CoughCare Ltd.',
    80.00, 120.00, 144,
    1, 12, 20,
    '2025-10-15', 'COUGH001'
),
(
    'Aspirin 81mg', 'Acetylsalicylic Acid', 'Cardiovascular', '8901030825560', 'CardioMed Supply',
    6.25, 8.75, 2000,
    20, 5, 100,
    '2025-11-30', 'ASP001'
),
(
    'Multivitamins', 'Mixed Vitamins', 'Supplements', '8901030825561', 'HealthMax Ltd.',
    250.00, 350.00, 240,
    15, 4, 25,
    '2026-01-15', 'MULTI001'
),
(
    'Bandages Pack', 'Adhesive Bandages', 'First Aid', '8901030825562', 'FirstAid Corp.',
    30.00, 45.00, 100,
    10, 1, 15,
    '2027-06-30', 'BAND001'
),
(
    'Digital Thermometer', 'Electronic Thermometer', 'Medical Devices', '8901030825563', 'MedTech Ltd.',
    180.00, 250.00, 15,
    1, 1, 5,
    '2027-12-31', 'THERM001'
)
ON CONFLICT (barcode) DO NOTHING;

-- Insert sample notifications for testing
INSERT INTO notifications (
    title, message, type, category, priority,
    reference_type, reference_id, is_read
) VALUES 
(
    'Low Stock Alert', 
    'Paracetamol 500mg is running low. Only 8 units remaining.',
    'warning', 'Inventory', 3,
    'product', 1, false
),
(
    'Out of Stock',
    'Vitamin C 1000mg is now out of stock. Please reorder immediately.',
    'error', 'Inventory', 4,
    'product', 3, false
),
(
    'New Product Added',
    'Aspirin 81mg has been successfully added to inventory.',
    'info', 'System', 1,
    'product', 5, true
),
(
    'Sale Completed',
    'Transaction #1248 completed successfully. Total: ₱1,250.00',
    'success', 'Sales', 2,
    'transaction', 1, true
),
(
    'Expiry Alert',
    'Amoxicillin 500mg expires in 30 days. Consider promotional pricing.',
    'warning', 'Inventory', 3,
    'product', 2, true
),
(
    'Daily Report',
    'Your daily sales report is now available for download.',
    'info', 'Reports', 1,
    'system', null, true
),
(
    'Payment Failed',
    'Payment processing failed for transaction #1247. Manual review required.',
    'error', 'Sales', 4,
    'transaction', 2, false
),
(
    'Backup Completed',
    'Daily database backup completed successfully.',
    'success', 'System', 1,
    'system', null, true
),
(
    'Critical Stock Level',
    'Multiple products have reached critical stock levels.',
    'error', 'Inventory', 4,
    'system', null, false
),
(
    'Monthly Report Ready',
    'August 2025 monthly report has been generated and is ready for review.',
    'success', 'Reports', 2,
    'system', null, true
);
