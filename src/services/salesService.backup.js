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
    console.log("Creating sale with data:", saleData);

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

    if (saleError) {
      console.error("Sale creation error:", saleError);
      throw saleError;
    }

    // Prepare sale items for insertion
    const saleItems = saleData.items.map((item) => ({
      sale_id: sale.id,
      product_id: item.product_id,
      quantity: item.quantity, // Total pieces sold
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      variant_info: item.variant_info, // Store box/sheet/piece breakdown
    }));

    console.log("Inserting sale items:", saleItems);

    // Insert all sale items
    const { data: items, error: itemsError } = await supabase
      .from("sale_items")
      .insert(saleItems)
      .select();

    if (itemsError) {
      console.error("Sale items creation error:", itemsError);
      throw itemsError;
    }

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
 * Get recent sales for dashboard
 * @param {number} limit - Number of recent sales to fetch
 * @returns {Promise<Array>} Recent sales with product info
 */
export async function getRecentSales(limit = 10) {
  try {
    const { data, error } = await supabase
      .from("sales")
      .select(
        `
        id,
        total,
        created_at,
        sale_items (
          quantity,
          unit_price,
          subtotal,
          products (
            name
          )
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Transform the data to flatten for easier display
    const recentSales = [];
    data.forEach((sale) => {
      sale.sale_items.forEach((item) => {
        recentSales.push({
          id: `${sale.id}-${item.products.name}`,
          product: item.products.name,
          qty: item.quantity,
          price: item.unit_price,
          time: new Date(sale.created_at).toLocaleTimeString(),
          total: item.subtotal,
        });
      });
    });

    return recentSales.slice(0, limit);
  } catch (error) {
    console.error("Error fetching recent sales:", error);
    throw new Error("Failed to fetch recent sales");
  }
}

/**
 * Get best selling products
 * @param {number} limit - Number of top products to return
 * @param {Object} filters - Date filters
 * @returns {Promise<Array>} Best selling products
 */
export async function getBestSellers(limit = 5, filters = {}) {
  try {
    let query = supabase.from("sale_items").select(`
        quantity,
        products!inner (
          name,
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

    // Group by product and sum quantities
    const productSales = {};
    data.forEach((item) => {
      const productName = item.products.name;
      if (!productSales[productName]) {
        productSales[productName] = {
          name: productName,
          category: item.products.category,
          totalQuantity: 0,
        };
      }
      productSales[productName].totalQuantity += item.quantity;
    });

    // Sort by total quantity and return top products
    return Object.values(productSales)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit)
      .map((product) => ({
        name: product.name,
        category: product.category,
        quantity: product.totalQuantity,
      }));
  } catch (error) {
    console.error("Error fetching best sellers:", error);
    throw new Error("Failed to fetch best sellers");
  }
}

/**
 * Get sales data grouped by hour for charts
 * @param {Object} filters - Date filters
 * @returns {Promise<Array>} Sales data grouped by hour
 */
export async function getSalesByHour(filters = {}) {
  try {
    const now = new Date();
    const startDate =
      filters.startDate ||
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endDate =
      filters.endDate ||
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      ).toISOString();

    const { data, error } = await supabase
      .from("sales")
      .select("total, created_at")
      .gte("created_at", startDate)
      .lt("created_at", endDate)
      .order("created_at");

    if (error) throw error;

    // Group sales by hour
    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { hour: i, sales: 0, revenue: 0 };
    }

    data.forEach((sale) => {
      const hour = new Date(sale.created_at).getHours();
      hourlyData[hour].sales += 1;
      hourlyData[hour].revenue += sale.total;
    });

    return Object.values(hourlyData);
  } catch (error) {
    console.error("Error fetching sales by hour:", error);
    throw new Error("Failed to fetch sales by hour");
  }
}
