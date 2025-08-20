import { supabase } from "../config/supabase.js";

/**
 * Transaction Service - Handles transaction history and analytics
 * This service provides comprehensive transaction data with all related information
 */

/**
 * Get transaction history with complete sale data
 * @param {Object} filters - Filter options
 * @param {string} filters.status - Filter by status ('completed', 'cancelled', 'all')
 * @param {string} filters.startDate - Start date filter (ISO string)
 * @param {string} filters.endDate - End date filter (ISO string)
 * @param {string} filters.searchTerm - Search term for transaction number or product names
 * @param {number} filters.limit - Limit number of results (default: 50)
 * @returns {Promise<Object>} Complete transaction data with items and products
 */
export async function getTransactionHistory(filters = {}) {
  try {
    let query = supabase
      .from("sales")
      .select(
        `
        id,
        total,
        payment_method,
        created_at,
        sale_items (
          id,
          quantity,
          unit_price,
          subtotal,
          variant_info,
          products (
            id,
            name,
            category,
            manufacturer,
            brand_name
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    // Apply date filters
    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate);
    }

    // Apply limit
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    // Transform the data to match expected transaction format
    const transactions = (data || []).map((sale) => {
      // Calculate totals from sale items
      const salesItems = sale.sale_items || [];
      const subtotal = salesItems.reduce(
        (sum, item) => sum + (item.subtotal || 0),
        0
      );
      const totalItems = salesItems.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );

      // Generate transaction number if not present
      const transactionNumber = `TXN-${sale.id.toString().padStart(6, "0")}`;

      // Transform sale items to match expected format
      const transformedItems = salesItems.map((item) => ({
        id: item.id,
        product_id: item.products?.id,
        product: {
          name: item.products?.name || "Unknown Product",
          category: item.products?.category || "Unknown",
          manufacturer: item.products?.manufacturer || "",
          brand_name: item.products?.brand_name || "",
        },
        total_pieces: item.quantity || 0,
        unit_price: item.unit_price || 0,
        line_total: item.subtotal || 0,
        variant_info: item.variant_info || {},
      }));

      return {
        id: sale.id,
        transaction_number: transactionNumber,
        total_amount: sale.total || 0,
        payment_method: sale.payment_method || "cash",
        status: "completed", // Assuming all saved sales are completed
        is_pwd_senior: false, // This would need to be added to your sales table if needed
        created_at: sale.created_at,
        sales_items: transformedItems,
        subtotal: subtotal,
        discount_amount: 0, // Add these fields to sales table if needed
        pwd_senior_discount: 0,
        amount_paid: sale.total || 0, // Assuming full payment for now
        change_amount: 0, // Would need to calculate based on actual payment data
        total_items: totalItems,
      };
    });

    // Apply search filter if provided (filter by transaction number or product names)
    let filteredTransactions = transactions;
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredTransactions = transactions.filter(
        (transaction) =>
          transaction.transaction_number.toLowerCase().includes(searchLower) ||
          transaction.sales_items.some((item) =>
            item.product.name.toLowerCase().includes(searchLower)
          )
      );
    }

    return {
      success: true,
      data: filteredTransactions,
      total: filteredTransactions.length,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return {
      success: false,
      data: [],
      total: 0,
      error: error.message || "Failed to fetch transaction history",
    };
  }
}

/**
 * Get a single transaction with complete details
 * @param {number} transactionId - Transaction ID (sale ID)
 * @returns {Promise<Object>} Complete transaction details
 */
export async function getTransactionDetails(transactionId) {
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
          id,
          quantity,
          unit_price,
          subtotal,
          variant_info,
          products (
            id,
            name,
            category,
            manufacturer,
            brand_name,
            price,
            pieces_per_sheet,
            sheets_per_box
          )
        )
      `
      )
      .eq("id", transactionId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    if (!data) {
      throw new Error("Transaction not found");
    }

    // Transform to expected format (same as in getTransactionHistory)
    const salesItems = data.sale_items || [];
    const subtotal = salesItems.reduce(
      (sum, item) => sum + (item.subtotal || 0),
      0
    );
    const transactionNumber = `TXN-${data.id.toString().padStart(6, "0")}`;

    const transformedItems = salesItems.map((item) => ({
      id: item.id,
      product_id: item.products?.id,
      product: {
        name: item.products?.name || "Unknown Product",
        category: item.products?.category || "Unknown",
        manufacturer: item.products?.manufacturer || "",
        brand_name: item.products?.brand_name || "",
        price: item.products?.price || 0,
        pieces_per_sheet: item.products?.pieces_per_sheet || 1,
        sheets_per_box: item.products?.sheets_per_box || 1,
      },
      total_pieces: item.quantity || 0,
      unit_price: item.unit_price || 0,
      line_total: item.subtotal || 0,
      variant_info: item.variant_info || {},
    }));

    const transaction = {
      id: data.id,
      transaction_number: transactionNumber,
      total_amount: data.total || 0,
      payment_method: data.payment_method || "cash",
      status: "completed",
      is_pwd_senior: false,
      created_at: data.created_at,
      sales_items: transformedItems,
      subtotal: subtotal,
      discount_amount: 0,
      pwd_senior_discount: 0,
      amount_paid: data.total || 0,
      change_amount: 0,
    };

    return {
      success: true,
      data: transaction,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    return {
      success: false,
      data: null,
      error: error.message || "Failed to fetch transaction details",
    };
  }
}

/**
 * Get transaction statistics for dashboard
 * @param {Object} filters - Date filters
 * @returns {Promise<Object>} Transaction statistics
 */
export async function getTransactionStats(filters = {}) {
  try {
    let query = supabase
      .from("sales")
      .select("id, total, created_at, payment_method");

    // Apply date filters
    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const transactions = data || [];
    const totalRevenue = transactions.reduce(
      (sum, t) => sum + (t.total || 0),
      0
    );
    const totalTransactions = transactions.length;

    // Group by payment method
    const paymentMethods = transactions.reduce((acc, t) => {
      const method = t.payment_method || "cash";
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    return {
      success: true,
      data: {
        totalRevenue,
        totalTransactions,
        averageTransaction:
          totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        paymentMethods,
        transactions,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching transaction stats:", error);
    return {
      success: false,
      data: {
        totalRevenue: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        paymentMethods: {},
        transactions: [],
      },
      error: error.message || "Failed to fetch transaction statistics",
    };
  }
}

/**
 * Search transactions by various criteria
 * @param {string} searchTerm - Search term
 * @param {Object} filters - Additional filters
 * @returns {Promise<Object>} Search results
 */
export async function searchTransactions(searchTerm, filters = {}) {
  try {
    // For now, use the main getTransactionHistory function with search
    const result = await getTransactionHistory({
      ...filters,
      searchTerm,
      limit: filters.limit || 100,
    });

    return result;
  } catch (error) {
    console.error("Error searching transactions:", error);
    return {
      success: false,
      data: [],
      total: 0,
      error: error.message || "Failed to search transactions",
    };
  }
}

/**
 * Mock function for printing receipts (to be implemented)
 * @param {number} transactionId - Transaction ID
 * @returns {Promise<Object>} Print result
 */
export async function printReceipt(transactionId) {
  try {
    // This would integrate with your actual receipt printer
    // For now, just log the action
    console.log(`🖨️ Printing receipt for transaction ${transactionId}`);

    // Simulate printing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      success: true,
      message: "Receipt printed successfully",
      error: null,
    };
  } catch (error) {
    console.error("Error printing receipt:", error);
    return {
      success: false,
      message: "Failed to print receipt",
      error: error.message,
    };
  }
}

/**
 * Export transactions to CSV format
 * @param {Array} transactions - Transactions to export
 * @param {string} filename - Output filename
 * @returns {Promise<Object>} Export result
 */
export async function exportTransactionsToCSV(
  transactions,
  filename = "transactions"
) {
  try {
    if (!transactions || transactions.length === 0) {
      throw new Error("No transactions to export");
    }

    // Prepare CSV headers
    const headers = [
      "Transaction Number",
      "Date",
      "Time",
      "Total Amount",
      "Payment Method",
      "Status",
      "Items Count",
      "Product Names",
    ];

    // Prepare CSV rows
    const rows = transactions.map((transaction) => {
      const date = new Date(transaction.created_at);
      const productNames =
        transaction.sales_items?.map((item) => item.product.name).join("; ") ||
        "";

      return [
        transaction.transaction_number,
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        `₱${transaction.total_amount.toFixed(2)}`,
        transaction.payment_method,
        transaction.status,
        transaction.sales_items?.length || 0,
        `"${productNames}"`,
      ];
    });

    // Create CSV content
    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      message: "Transactions exported successfully",
      error: null,
    };
  } catch (error) {
    console.error("Error exporting transactions:", error);
    return {
      success: false,
      message: "Failed to export transactions",
      error: error.message,
    };
  }
}
