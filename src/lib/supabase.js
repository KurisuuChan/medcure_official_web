import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database table names as constants
export const TABLES = {
  PRODUCTS: "products",
  SALES_TRANSACTIONS: "sales_transactions",
  SALES_ITEMS: "sales_items",
  STOCK_MOVEMENTS: "stock_movements",
  CATEGORIES: "categories",
};
