# MedCure Backend Setup Guide

## 🚀 Quick Start

Your MedCure application now has a complete backend architecture! Here's what has been created and how to get started.

## 📁 New Backend Structure

```
src/
├── config/
│   └── supabase.js          # Supabase client configuration
├── services/
│   ├── productService.js    # Product database operations
│   └── salesService.js      # Sales and transaction operations
└── hooks/
    ├── useProducts.js       # Product data hooks (new)
    ├── useSales.js          # Sales data hooks (new)
    ├── useDashboardData.js  # Updated dashboard hooks
    └── useInventoryData.js  # Updated legacy hook
```

## 🗄️ Database Setup

1. **Create a Supabase Project**

   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Set up Database Schema**

   - Open your Supabase SQL editor
   - Copy and run the SQL commands from `DATABASE_SCHEMA.md`
   - This will create all required tables, functions, and indexes

3. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Replace the placeholder values with your actual Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key
   ```

## 🔄 Data Flow Architecture

### The Professional Pattern

**Database → Service → Hook → UI Component**

1. **Services** (`/services/`) - The data messengers

   - Only files that talk directly to Supabase
   - Handle all CRUD operations
   - Provide clean, typed interfaces

2. **Hooks** (`/hooks/`) - The state managers

   - Use React Query for caching and state management
   - Call services to fetch/mutate data
   - Handle loading states, errors, and optimizations

3. **Components** (`/pages/`, `/components/`) - The presenters
   - Use hooks to get data
   - Focus only on UI and user interactions
   - Stay clean and database-agnostic

## 🛠️ Available Hooks

### Product Management

```javascript
import {
  useProducts, // Get all products
  useAddProduct, // Add new product
  useUpdateProduct, // Update existing product
  useDeleteProduct, // Delete product
  useBulkAddProducts, // CSV import
  useLowStockProducts, // Get low stock items
  useSearchProducts, // Search products
} from "./hooks/useProducts";
```

### Sales Operations

```javascript
import {
  useCreateSale, // POS transactions
  useSales, // Get sales history
  useSalesSummary, // Dashboard metrics
  useSalesByCategory, // Analytics
  useSalesByHour, // Hourly sales data
} from "./hooks/useSales";
```

### Dashboard Data

```javascript
import { useDashboardData } from "./hooks/useDashboardData";
// Combines all dashboard metrics and analytics
```

## 🎯 Implementation Examples

### Product Management Page

```javascript
import { useProducts, useAddProduct } from "../hooks/useProducts";

function Management() {
  const { data: products, isLoading } = useProducts();
  const addProduct = useAddProduct();

  const handleAddProduct = (productData) => {
    addProduct.mutate(productData, {
      onSuccess: () => {
        console.log("Product added successfully!");
      },
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {products?.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### POS Transaction

```javascript
import { useCreateSale } from "../hooks/useSales";

function POS() {
  const createSale = useCreateSale();

  const handleCheckout = (cartItems, total) => {
    const saleData = {
      items: cartItems.map((item) => ({
        product_id: item.id,
        quantity: item.totalPieces,
        unit_price: item.price,
        subtotal: item.price * item.totalPieces,
        variant_info: {
          boxes: item.boxes,
          sheets: item.sheets,
          pieces: item.pieces,
        },
      })),
      total,
      payment_method: "cash",
    };

    createSale.mutate(saleData, {
      onSuccess: () => {
        console.log("Sale completed!");
        // Clear cart, show success message
      },
    });
  };
}
```

## 🔧 Next Steps

1. **Set up your Supabase database** using the schema in `DATABASE_SCHEMA.md`
2. **Add your credentials** to the `.env` file
3. **Test the connection** by running the app and checking browser console
4. **Start using the new hooks** in your existing components
5. **Remove mock data** dependencies as you integrate real data

## 🚨 Important Notes

- **React Query**: Already configured for caching and state management
- **Error Handling**: All services include proper error handling
- **Type Safety**: Services return predictable data structures
- **Performance**: Queries are optimized with stale times and caching
- **Real-time**: You can add Supabase real-time subscriptions later

## 🆘 Troubleshooting

- **Environment variables**: Make sure to restart your dev server after adding `.env`
- **CORS issues**: Ensure your domain is added to Supabase settings
- **RLS policies**: Check that Row Level Security policies allow your operations
- **Console errors**: Check browser dev tools for detailed error messages

Your backend is now ready! 🎉
