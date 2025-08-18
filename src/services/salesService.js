import { supabase } from "../config/supabase.js";

/**
 * Sales Service - Handles all sales and transaction-related database operations
 * This service manages the complex transaction flow for POS operations
 */

/**
 * Create a new sale with multiple items and update inventory
 * This is the core transaction function used by the POS system
 * @param {Object} saleData - Sale data object
 * @param {Array} saleData.items - Array of sale items with product info and quantities
 * @param {number} saleData.total - Total sale amount
 * @param {string} saleData.payment_method - Payment method used
 * @returns {Promise<Object>} Created sale object with items
 */
export async function createSale(saleData) {
  try {
    // Start a transaction by creating the sale record first
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert([
        {
          total: saleData.total,
          payment_method: saleData.payment_method,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (saleError) throw saleError;

    // Prepare sale items for insertion
    const saleItems = saleData.items.map((item) => ({
      sale_id: sale.id,
      product_id: item.product_id,
      quantity: item.quantity, // Total pieces sold
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      variant_info: item.variant_info, // Store box/sheet/piece breakdown
    }));

    // Insert all sale items
    const { data: items, error: itemsError } = await supabase
      .from("sale_items")
      .insert(saleItems)
      .select();

    if (itemsError) throw itemsError;

    // Update inventory for each item sold
    for (const item of saleData.items) {
      await decrementStock(item.product_id, item.quantity);
    }

    return {
      ...sale,
      items,
    };
  } catch (error) {
    console.error("Error creating sale:", error);
    throw new Error("Failed to create sale");
  }
}

/**
 * Decrement product stock after a sale
 * @param {number} productId - Product ID
 * @param {number} quantity - Quantity to subtract (in individual pieces)
 * @returns {Promise<Object>} Updated product object
 */
export async function decrementStock(productId, quantity) {
  try {
    // Use Supabase RPC function for atomic stock update
    const { data, error } = await supabase.rpc("decrement_stock", {
      product_id: productId,
      decrement_amount: quantity,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error decrementing stock:", error);
    throw new Error("Failed to update inventory");
  }
}

/**
 * Get all sales with optional date filtering
 * @param {Object} filters - Filter options
 * @param {string} filters.startDate - Start date (ISO string)
 * @param {string} filters.endDate - End date (ISO string)
 * @returns {Promise<Array>} Array of sales with items
 */
export async function getSales(filters = {}) {
  try {
    let query = supabase
      .from("sales")
      .select(
        `
        *,
        sale_items (
          *,
          products (
            name,
            category
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching sales:", error);
    throw new Error("Failed to fetch sales");
  }
}

/**
 * Get sales summary data for dashboard
 * @param {string} period - Time period ('today', 'week', 'month', 'year')
 * @returns {Promise<Object>} Sales summary object
 */
export async function getSalesSummary(period = "today") {
  try {
    const now = new Date();
    let startDate;

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const { data, error } = await supabase
      .from("sales")
      .select("total, created_at")
      .gte("created_at", startDate.toISOString());

    if (error) throw error;

    const sales = data || [];
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactions = sales.length;

    return {
      totalRevenue,
      totalTransactions,
      averageTransaction:
        totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
      period,
    };
  } catch (error) {
    console.error("Error fetching sales summary:", error);
    throw new Error("Failed to fetch sales summary");
  }
}

/**
 * Get sales by category for analytics
 * @param {Object} filters - Date filters
 * @returns {Promise<Array>} Sales data grouped by category
 */
export async function getSalesByCategory(filters = {}) {
  try {
    let query = supabase.from("sale_items").select(`
        subtotal,
        products!inner (
          category
        ),
        sales!inner (
          created_at
        )
      `);

    if (filters.startDate) {
      query = query.gte("sales.created_at", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("sales.created_at", filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by category and sum revenue
    const categoryData = {};
    data.forEach((item) => {
      const category = item.products.category;
      if (!categoryData[category]) {
        categoryData[category] = 0;
      }
      categoryData[category] += item.subtotal;
    });

    return Object.entries(categoryData).map(([category, revenue]) => ({
      category,
      revenue,
    }));
  } catch (error) {
    console.error("Error fetching sales by category:", error);
    throw new Error("Failed to fetch sales by category");
  }
}

/**
 * Get hourly sales data for analytics
 * @param {string} date - Date to get hourly data for (ISO string)
 * @returns {Promise<Array>} Hourly sales data
 */
export async function getSalesByHour(date) {
  try {
    const startDate = new Date(date);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from("sales")
      .select("total, created_at")
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString());

    if (error) throw error;

    // Group by hour
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, "0")}:00`,
      sales: 0,
      revenue: 0,
    }));

    data.forEach((sale) => {
      const hour = new Date(sale.created_at).getHours();
      hourlyData[hour].sales += 1;
      hourlyData[hour].revenue += sale.total;
    });

    return hourlyData;
  } catch (error) {
    console.error("Error fetching sales by hour:", error);
    throw new Error("Failed to fetch hourly sales data");
  }
}
