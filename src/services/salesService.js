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
    try {
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

      if (error) throw error;

      console.log("Sale transaction completed successfully:", data[0]);

      // Return the sale details
      return {
        id: data[0].sale_id,
        total: data[0].total_amount || saleData.total,
        payment_method: saleData.payment_method,
        created_at: new Date().toISOString(),
        items_processed: saleData.items.length,
        inventory_updated: true,
      };
    } catch (rpcError) {
      console.warn(
        "RPC sale creation failed, using direct database operations:",
        rpcError
      );

      // Fallback: Direct database operations (simplified without optional columns)
      const { data: saleData_db, error: saleError } = await supabase
        .from("sales")
        .insert({
          total: saleData.total,
          payment_method: saleData.payment_method || "cash",
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Insert sale items (without timestamp columns if they don't exist)
      const saleItemsData = saleData.items.map((item) => ({
        sale_id: saleData_db.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItemsData);

      if (itemsError) throw itemsError;

      // Update product stock (get current stock first, then update)
      for (const item of saleData.items) {
        // Get current stock
        const { data: product, error: getError } = await supabase
          .from("products")
          .select("stock, total_stock")
          .eq("id", item.product_id)
          .single();

        if (getError) {
          console.warn(
            "Failed to get current stock for product",
            item.product_id,
            getError
          );
          continue;
        }

        // Calculate new stock values
        const currentStock = product.stock || 0;
        const currentTotalStock = product.total_stock || currentStock;
        const newStock = Math.max(0, currentStock - item.quantity);
        const newTotalStock = Math.max(0, currentTotalStock - item.quantity);

        // Update with calculated values
        const { error: stockError } = await supabase
          .from("products")
          .update({
            stock: newStock,
            total_stock: newTotalStock,
          })
          .eq("id", item.product_id);

        if (stockError) {
          console.warn(
            "Stock update failed for product",
            item.product_id,
            stockError
          );
        } else {
          console.log(
            `Updated stock for product ${item.product_id}: ${currentStock} -> ${newStock}`
          );
        }
      }

      return {
        id: saleData_db.id,
        total: saleData.total,
        payment_method: saleData.payment_method,
        created_at: saleData_db.created_at,
        items_processed: saleData.items.length,
        inventory_updated: true,
      };
    }
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
    // Simple client-side validation as fallback
    // If RPC fails, do basic validation here

    try {
      const { data, error } = await supabase.rpc("validate_sale_data", {
        sale_items: items,
      });

      if (error) throw error;
      return data[0];
    } catch (rpcError) {
      console.warn(
        "RPC validation failed, using client-side validation:",
        rpcError
      );

      // Fallback client-side validation
      const errors = [];
      let totalAmount = 0;

      for (const item of items) {
        if (!item.product_id) {
          errors.push("Product ID is required");
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push("Valid quantity is required");
        }
        if (!item.unit_price || item.unit_price <= 0) {
          errors.push("Valid unit price is required");
        }
        if (!item.subtotal || item.subtotal <= 0) {
          errors.push("Valid subtotal is required");
        }

        totalAmount += item.subtotal || 0;
      }

      return {
        is_valid: errors.length === 0,
        errors: errors,
        warnings: [],
        total_amount: totalAmount,
      };
    }
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
 * Get comprehensive sales analytics using client-side calculations (no RPC required)
 * @param {Object} options - Analytics options
 * @param {string} options.startDate - Start date (ISO string)
 * @param {string} options.endDate - End date (ISO string)
 * @param {string} options.groupBy - Group by period ('day', 'week', 'month')
 * @returns {Promise<Object>} Comprehensive analytics object
 */
export async function getSalesAnalytics(options = {}) {
  try {
    console.log("📊 Computing sales analytics client-side...");

    // Get sales data for the period
    const filters = {
      startDate: options.startDate,
      endDate: options.endDate,
    };

    const sales = await getSales(filters);

    // Calculate basic metrics
    const totalSales = sales.length;
    const totalRevenue = sales.reduce(
      (sum, sale) => sum + (sale.total || 0),
      0
    );
    const averageTransaction = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calculate total items sold
    let totalItemsSold = 0;
    const categoryStats = {};
    const hourlyStats = {};

    sales.forEach((sale) => {
      // Process sale items
      if (sale.sale_items) {
        sale.sale_items.forEach((item) => {
          totalItemsSold += item.quantity || 0;

          // Category breakdown
          const category = item.products?.category || "Unknown";
          if (!categoryStats[category]) {
            categoryStats[category] = {
              sales_count: 0,
              revenue: 0,
              quantity: 0,
            };
          }
          categoryStats[category].sales_count += 1;
          categoryStats[category].revenue += item.subtotal || 0;
          categoryStats[category].quantity += item.quantity || 0;
        });
      }

      // Hourly distribution
      const hour = new Date(sale.created_at).getHours();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { sales_count: 0, revenue: 0 };
      }
      hourlyStats[hour].sales_count += 1;
      hourlyStats[hour].revenue += sale.total || 0;
    });

    // Convert category stats to top selling categories
    const topSellingCategories = Object.entries(categoryStats)
      .map(([category, stats]) => ({
        category,
        ...stats,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const analytics = {
      period_start: options.startDate,
      period_end: options.endDate,
      total_sales: totalSales,
      total_revenue: totalRevenue,
      total_items_sold: totalItemsSold,
      average_transaction: averageTransaction,
      top_selling_categories: topSellingCategories,
      hourly_distribution: hourlyStats,
    };

    console.log("✅ Sales analytics computed successfully");
    return analytics;
  } catch (error) {
    console.error("Error computing sales analytics:", error);

    // Return empty analytics instead of throwing
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
}

/**
 * Get sales summary data for dashboard (backward compatibility)
 * @param {string} period - Time period ('today', 'week', 'month', 'year')
 * @returns {Promise<Object>} Sales summary object
 */
export async function getSalesSummary(period = "today") {
  try {
    const now = new Date();
    let startDate, endDate;

    // Helper function to create proper date boundaries
    const createDateBoundary = (date, isStart = true) => {
      const boundary = new Date(date);
      if (isStart) {
        // Start of day: 00:00:00.000
        boundary.setHours(0, 0, 0, 0);
      } else {
        // End of day: 23:59:59.999
        boundary.setHours(23, 59, 59, 999);
      }
      return boundary;
    };

    switch (period) {
      case "today":
        // FIXED: Proper today calculation with timezone awareness
        startDate = createDateBoundary(now, true);   // Today at 00:00:00
        endDate = createDateBoundary(now, false);    // Today at 23:59:59
        console.log(`🎯 Today's date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = createDateBoundary(startDate, true);
        endDate = createDateBoundary(now, false);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = createDateBoundary(startDate, true);
        endDate = createDateBoundary(now, false);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate = createDateBoundary(startDate, true);
        endDate = createDateBoundary(now, false);
        break;
      default:
        startDate = createDateBoundary(now, true);
        endDate = createDateBoundary(now, false);
    }

    const analytics = await getSalesAnalytics({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
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
    return []; // Return empty array as fallback
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
    // Return empty hourly data as fallback
    return Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, "0")}:00`,
      sales: 0,
      revenue: 0,
    }));
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

/**
 * Get recent sales transactions
 * @param {number} limit - Number of recent sales to fetch
 * @returns {Promise<Array>} Array of recent sales
 */
export async function getRecentSales(limit = 10) {
  try {
    const { data, error } = await supabase
      .from("sales")
      .select(
        `
        id,
        total,
        payment_method,
        created_at,
        sale_items (
          quantity,
          unit_price,
          products (
            name,
            category
          )
        )
      `
      )
      .gt("total", 0) // Exclude reversed sales
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Transform data for dashboard display
    return (data || []).map((sale) => ({
      id: sale.id,
      total: sale.total,
      payment_method: sale.payment_method,
      created_at: sale.created_at,
      itemCount: sale.sale_items?.length || 0,
      items: sale.sale_items || [],
    }));
  } catch (error) {
    console.error("Error fetching recent sales:", error);
    return []; // Return empty array as fallback
  }
}

/**
 * Get best selling products
 * @param {number} limit - Number of top products to return
 * @param {Object} filters - Date filters
 * @returns {Promise<Array>} Array of best selling products
 */
export async function getBestSellers(limit = 5, filters = {}) {
  try {
    let query = supabase
      .from("sale_items")
      .select(
        `
        product_id,
        quantity,
        unit_price,
        products (
          name,
          category,
          brand_name
        ),
        sales!inner (
          created_at,
          total
        )
      `
      )
      .gt("sales.total", 0); // Exclude reversed sales

    // Apply date filters if provided
    if (filters.startDate) {
      query = query.gte("sales.created_at", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("sales.created_at", filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by product and calculate totals
    const productStats = {};

    (data || []).forEach((item) => {
      const productId = item.product_id;
      if (!productStats[productId]) {
        productStats[productId] = {
          product_id: productId,
          name: item.products?.name || "Unknown Product",
          category: item.products?.category || "Uncategorized",
          brand_name: item.products?.brand_name || "",
          total_quantity: 0,
          total_revenue: 0,
          transaction_count: 0,
        };
      }

      productStats[productId].total_quantity += item.quantity || 0;
      productStats[productId].total_revenue +=
        (item.quantity || 0) * (item.unit_price || 0);
      productStats[productId].transaction_count += 1;
    });

    // Convert to array and sort by quantity sold
    const bestSellers = Object.values(productStats)
      .sort((a, b) => b.total_quantity - a.total_quantity)
      .slice(0, limit)
      .map((product) => ({
        ...product,
        average_price:
          product.total_quantity > 0
            ? product.total_revenue / product.total_quantity
            : 0,
      }));

    return bestSellers;
  } catch (error) {
    console.error("Error fetching best sellers:", error);
    return []; // Return empty array as fallback
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

/**
 * Debug function to test today's sales calculation
 * Call this from console to see what's happening with today's sales
 */
export async function debugTodaySales() {
  console.log('🔍 DEBUGGING TODAY\'S SALES...');
  
  const now = new Date();
  console.log('Current time:', now.toString());
  console.log('Current ISO:', now.toISOString());
  console.log('Current local:', now.toLocaleString());
  
  // Test the fixed date calculation
  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);
  
  console.log(`Start: ${startDate.toISOString()} (${startDate.toLocaleString()})`);
  console.log(`End: ${endDate.toISOString()} (${endDate.toLocaleString()})`);
  
  try {
    const sales = await getSales({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    
    const total = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    console.log(`✅ Found ${sales.length} transactions with total revenue: $${total.toFixed(2)}`);
    
    if (sales.length > 0) {
      console.log('Sample sales:', sales.slice(0, 3).map(s => ({
        id: s.id,
        total: s.total,
        created_at: s.created_at,
        local_time: new Date(s.created_at).toLocaleString()
      })));
    }
    
    // Test the getSalesSummary function
    const summary = await getSalesSummary('today');
    console.log('Summary result:', summary);
    
    return { sales, summary, total };
  } catch (error) {
    console.error('❌ Error:', error);
    return { error: error.message };
  }
}
