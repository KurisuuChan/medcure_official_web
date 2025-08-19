import { supabase } from "../config/supabase.js";

/**
 * Enhanced Sales Service - Implements atomic transactions for data integrity
 * Uses database functions to ensure all-or-nothing transaction processing
 */

/**
 * Create a new sale with atomic transaction processing
 * This ensures all operations succeed or fail together
 * @param {Object} saleData - Sale data object
 * @param {Array} saleData.items - Array of sale items with product info and quantities
 * @param {number} saleData.total - Total sale amount
 * @param {string} saleData.payment_method - Payment method used
 * @returns {Promise<Object>} Created sale object with transaction details
 */
export async function createSale(saleData) {
  try {
    console.log("Processing atomic sale transaction:", saleData);

    // Validate sale data first using database function
    const validationResult = await validateSaleData(saleData.items);

    if (!validationResult.is_valid) {
      throw new Error(
        `Sale validation failed: ${validationResult.error_message}`
      );
    }

    // Process the sale atomically using database function
    const { data, error } = await supabase.rpc("process_sale_transaction", {
      sale_total: saleData.total,
      payment_method: saleData.payment_method,
      sale_items: saleData.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        variant_info: item.variant_info || {},
      })),
    });

    if (error) {
      console.error("Atomic sale transaction error:", error);
      throw error;
    }

    console.log("Sale transaction completed successfully:", data[0]);

    // Return the sale details
    return {
      id: data[0].sale_id,
      total: data[0].sale_total,
      payment_method: data[0].payment_method,
      created_at: data[0].created_at,
      items_processed: data[0].items_processed,
      inventory_updated: data[0].inventory_updated,
    };
  } catch (error) {
    console.error("Error in atomic sale creation:", error);

    // Provide more specific error messages
    if (error.message.includes("Insufficient stock")) {
      throw new Error(`Transaction failed: ${error.message}`);
    } else if (error.message.includes("not found")) {
      throw new Error(`Transaction failed: ${error.message}`);
    } else if (error.message.includes("archived")) {
      throw new Error(`Transaction failed: ${error.message}`);
    }

    throw new Error(`Sale transaction failed: ${error.message}`);
  }
}

/**
 * Validate sale data before processing
 * @param {Array} items - Array of sale items to validate
 * @returns {Promise<Object>} Validation result with details
 */
export async function validateSaleData(items) {
  try {
    const { data, error } = await supabase.rpc("validate_sale_data", {
      sale_items: items,
    });

    if (error) throw error;

    return data[0];
  } catch (error) {
    console.error("Error validating sale data:", error);
    throw new Error("Failed to validate sale data");
  }
}

/**
 * Reverse/cancel a sale transaction
 * @param {number} saleId - Sale ID to reverse
 * @param {string} reason - Reason for reversal
 * @returns {Promise<Object>} Reversal result
 */
export async function reverseSale(saleId, reason = "Sale cancellation") {
  try {
    const { data, error } = await supabase.rpc("reverse_sale_transaction", {
      sale_id_to_reverse: saleId,
      reversal_reason: reason,
    });

    if (error) throw error;

    const result = data[0];
    if (!result.success) {
      throw new Error(result.message);
    }

    return result;
  } catch (error) {
    console.error("Error reversing sale:", error);
    throw new Error(`Failed to reverse sale: ${error.message}`);
  }
}

/**
 * Get all sales with optional date filtering
 * @param {Object} filters - Filter options
 * @param {string} filters.startDate - Start date (ISO string)
 * @param {string} filters.endDate - End date (ISO string)
 * @param {boolean} filters.includeReversed - Include reversed sales
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
            category,
            brand_name
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    // Filter out reversed sales unless specifically requested
    if (!filters.includeReversed) {
      query = query.gt("total", 0);
    }

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
 * Get comprehensive sales analytics using enhanced database function
 * @param {Object} options - Analytics options
 * @param {string} options.startDate - Start date (ISO string)
 * @param {string} options.endDate - End date (ISO string)
 * @param {string} options.groupBy - Group by period ('day', 'week', 'month')
 * @returns {Promise<Object>} Comprehensive analytics object
 */
export async function getSalesAnalytics(options = {}) {
  try {
    const { data, error } = await supabase.rpc("get_sales_analytics", {
      start_date: options.startDate || null,
      end_date: options.endDate || null,
      group_by_period: options.groupBy || "day",
    });

    if (error) throw error;

    const analytics = data[0];
    if (!analytics) {
      return {
        period_start: options.startDate,
        period_end: options.endDate,
        total_sales: 0,
        total_revenue: 0,
        total_items_sold: 0,
        average_transaction: 0,
        top_selling_categories: [],
        hourly_distribution: {},
      };
    }

    return analytics;
  } catch (error) {
    console.error("Error fetching sales analytics:", error);
    throw new Error("Failed to fetch sales analytics");
  }
}

/**
 * Get sales summary data for dashboard (backward compatibility)
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

    const analytics = await getSalesAnalytics({
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    });

    return {
      totalRevenue: analytics.total_revenue || 0,
      totalTransactions: analytics.total_sales || 0,
      averageTransaction: analytics.average_transaction || 0,
      totalItemsSold: analytics.total_items_sold || 0,
      period,
      topCategories: analytics.top_selling_categories || [],
      hourlyDistribution: analytics.hourly_distribution || {},
    };
  } catch (error) {
    console.error("Error fetching sales summary:", error);
    throw new Error("Failed to fetch sales summary");
  }
}

/**
 * Get sales by category for analytics (enhanced version)
 * @param {Object} filters - Date filters
 * @returns {Promise<Array>} Sales data grouped by category
 */
export async function getSalesByCategory(filters = {}) {
  try {
    const analytics = await getSalesAnalytics({
      startDate: filters.startDate,
      endDate: filters.endDate,
    });

    return analytics.top_selling_categories || [];
  } catch (error) {
    console.error("Error fetching sales by category:", error);
    throw new Error("Failed to fetch sales by category");
  }
}

/**
 * Get hourly sales data for analytics (enhanced version)
 * @param {string} date - Date to get hourly data for (ISO string)
 * @returns {Promise<Array>} Hourly sales data
 */
export async function getSalesByHour(date) {
  try {
    const startDate = new Date(date);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    const analytics = await getSalesAnalytics({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const hourlyData = analytics.hourly_distribution || {};

    // Convert to array format for backward compatibility
    return Array.from({ length: 24 }, (_, hour) => {
      const hourKey = hour.toString();
      const hourData = hourlyData[hourKey] || { sales_count: 0, revenue: 0 };

      return {
        hour: `${hour.toString().padStart(2, "0")}:00`,
        sales: hourData.sales_count || 0,
        revenue: hourData.revenue || 0,
      };
    });
  } catch (error) {
    console.error("Error fetching sales by hour:", error);
    throw new Error("Failed to fetch hourly sales data");
  }
}

/**
 * Get detailed sale information by ID
 * @param {number} saleId - Sale ID
 * @returns {Promise<Object>} Detailed sale object
 */
export async function getSaleById(saleId) {
  try {
    const { data, error } = await supabase
      .from("sales")
      .select(
        `
        *,
        sale_items (
          *,
          products (
            name,
            category,
            brand_name,
            pieces_per_sheet,
            sheets_per_box
          )
        )
      `
      )
      .eq("id", saleId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching sale by ID:", error);
    throw new Error("Failed to fetch sale details");
  }
}

/**
 * Check inventory availability before sale
 * @param {Array} items - Array of items to check
 * @returns {Promise<Object>} Availability check result
 */
export async function checkInventoryAvailability(items) {
  try {
    const validation = await validateSaleData(items);

    return {
      available: validation.is_valid,
      issues: validation.validation_details?.stock_issues || [],
      message: validation.error_message || "All items available",
    };
  } catch (error) {
    console.error("Error checking inventory availability:", error);
    throw new Error("Failed to check inventory availability");
  }
}

// Export utility functions and constants
export const PAYMENT_METHODS = {
  CASH: "cash",
  CARD: "card",
  GCASH: "gcash",
  BANK_TRANSFER: "bank_transfer",
};

export const SALE_STATUS = {
  COMPLETED: "completed",
  REVERSED: "reversed",
  PENDING: "pending",
};

/**
 * Utility function to calculate sale totals
 * @param {Array} items - Sale items
 * @returns {Object} Calculated totals
 */
export function calculateSaleTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalItems,
    averageItemPrice:
      totalItems > 0 ? Math.round((subtotal / totalItems) * 100) / 100 : 0,
  };
}

/**
 * Validate sale item structure
 * @param {Object} item - Sale item to validate
 * @returns {Object} Validation result
 */
export function validateSaleItem(item) {
  const errors = [];

  if (!item.product_id) errors.push("Product ID is required");
  if (!item.quantity || item.quantity <= 0)
    errors.push("Valid quantity is required");
  if (!item.unit_price || item.unit_price < 0)
    errors.push("Valid unit price is required");
  if (!item.subtotal || item.subtotal <= 0)
    errors.push("Valid subtotal is required");

  return {
    isValid: errors.length === 0,
    errors,
  };
}
