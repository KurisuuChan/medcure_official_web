import { supabase, TABLES } from "../lib/supabase.js";
import { updateProductStock } from "./productService.js";
import {
  mockGetSalesTransactions,
  mockGetSalesSummary,
  mockGetHourlySales,
  mockGetTopSellingProducts,
  isMockMode,
} from "../utils/mockApi.js";

/**
 * Sales Management API Service
 * Handles all sales-related database operations
 */

// Generate unique transaction number
function generateTransactionNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `TXN${timestamp}${random}`;
}

// Create a new sale transaction
export async function createSale(saleData) {
  try {
    const { cart, discount, isPwdSenior, customerInfo = {} } = saleData;

    if (!cart || cart.length === 0) {
      throw new Error("Cart is empty");
    }

    // Calculate totals
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const discountAmount = (subtotal * (discount || 0)) / 100;
    const pwdSeniorDiscount = isPwdSenior ? subtotal * 0.2 : 0;
    const totalDiscountAmount = discountAmount + pwdSeniorDiscount;
    const totalAmount = subtotal - totalDiscountAmount;

    // Generate transaction number
    const transactionNumber = generateTransactionNumber();

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .insert([
        {
          transaction_number: transactionNumber,
          subtotal: subtotal,
          discount_percentage: discount || 0,
          discount_amount: discountAmount,
          pwd_senior_discount: pwdSeniorDiscount,
          total_amount: totalAmount,
          is_pwd_senior: isPwdSenior,
          customer_name: customerInfo.name || null,
          payment_method: customerInfo.paymentMethod || "cash",
          amount_paid: customerInfo.amountPaid || totalAmount,
          change_amount: customerInfo.changeAmount || 0,
          status: "completed",
        },
      ])
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Create sales items and update stock
    const saleItems = [];

    for (const item of cart) {
      // Create sales item record
      const { data: saleItem, error: itemError } = await supabase
        .from(TABLES.SALES_ITEMS)
        .insert([
          {
            transaction_id: transaction.id,
            product_id: item.id,
            boxes_sold: item.packaging?.boxes_sold || 0,
            sheets_sold: item.packaging?.sheets_sold || 0,
            pieces_sold: item.packaging?.pieces_sold || 0,
            total_pieces: item.quantity,
            unit_price: item.price,
            line_total: item.price * item.quantity,
          },
        ])
        .select()
        .single();

      if (itemError) throw itemError;
      saleItems.push(saleItem);

      // Update product stock
      const { error: stockError } = await updateProductStock(
        item.id,
        item.stock - item.quantity, // new stock = current stock - sold quantity
        "sale",
        {
          type: "sale",
          id: transaction.id,
          notes: `Sale transaction ${transactionNumber}`,
        }
      );

      if (stockError)
        throw new Error(
          `Failed to update stock for ${item.name}: ${stockError}`
        );
    }

    return {
      data: {
        transaction,
        items: saleItems,
        summary: {
          transactionNumber,
          subtotal,
          discountAmount,
          pwdSeniorDiscount,
          totalAmount,
          itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
        },
      },
      error: null,
    };
  } catch (error) {
    console.error("Error creating sale:", error);
    return { data: null, error: error.message };
  }
}

// Get sale transactions with optional filtering
export async function getSalesTransactions(filters = {}) {
  // Force mock API for testing
  console.log("🔧 getSalesTransactions called - forcing mock mode");
  return await mockGetSalesTransactions(filters);

  /* Original Supabase code - temporarily disabled
  // Use mock API if enabled
  if (isMockMode()) {
    return await mockGetSalesTransactions(filters);
  }

  try {
    let query = supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .select(
        `
        *,
        sales_items (
          *,
          products (
            name,
            generic_name
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.transactionNumber) {
      query = query.ilike(
        "transaction_number",
        `%${filters.transactionNumber}%`
      );
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching sales transactions:", error);
    return { data: null, error: error.message };
  }
  */
}

// Get single sale transaction
export async function getSaleTransaction(id) {
  try {
    const { data, error } = await supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .select(
        `
        *,
        sales_items (
          *,
          products (
            name,
            generic_name,
            category
          )
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching sale transaction:", error);
    return { data: null, error: error.message };
  }
}

// Get sales summary/statistics
export async function getSalesSummary(period = "today") {
  // Force mock API for testing
  console.log("🔧 getSalesSummary called - forcing mock mode");
  return await mockGetSalesSummary(period);

  /* Original Supabase code - temporarily disabled
  // Use mock API if enabled
  if (isMockMode()) {
    return await mockGetSalesSummary(period);
  }

  try {
    let startDate, endDate;
    const now = new Date();

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1
        );
        break;
      case "week": {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = new Date(
          weekStart.getFullYear(),
          weekStart.getMonth(),
          weekStart.getDate()
        );
        endDate = new Date();
        break;
      }
      case "month": {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      }
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1
        );
    }

    const { data: transactions, error } = await supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .select("total_amount, discount_amount, pwd_senior_discount, created_at")
      .eq("status", "completed")
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString());

    if (error) throw error;

    const summary = transactions.reduce(
      (acc, transaction) => {
        acc.totalSales += transaction.total_amount;
        acc.totalTransactions += 1;
        acc.totalDiscounts +=
          transaction.discount_amount + transaction.pwd_senior_discount;
        return acc;
      },
      {
        totalSales: 0,
        totalTransactions: 0,
        totalDiscounts: 0,
        averageSale: 0,
      }
    );

    summary.averageSale =
      summary.totalTransactions > 0
        ? summary.totalSales / summary.totalTransactions
        : 0;

    return { data: summary, error: null };
  } catch (error) {
    console.error("Error getting sales summary:", error);
    return { data: null, error: error.message };
  }
  */
}

// Cancel/void a transaction
export async function cancelTransaction(transactionId, reason = "") {
  try {
    // Get transaction with items
    const { data: transaction, error: getError } = await getSaleTransaction(
      transactionId
    );
    if (getError) throw new Error(getError);

    if (transaction.status !== "completed") {
      throw new Error("Only completed transactions can be cancelled");
    }

    // Restore stock for each item
    for (const item of transaction.sales_items) {
      const { error: stockError } = await updateProductStock(
        item.product_id,
        item.products.total_stock + item.total_pieces, // restore the sold quantity
        "adjustment",
        {
          type: "cancellation",
          id: transactionId,
          notes: `Transaction cancellation: ${reason}`,
        }
      );

      if (stockError) throw new Error(`Failed to restore stock: ${stockError}`);
    }

    // Update transaction status
    const { data: updatedTransaction, error: updateError } = await supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .update({
        status: "cancelled",
        notes: reason,
      })
      .eq("id", transactionId)
      .select()
      .single();

    if (updateError) throw updateError;

    return { data: updatedTransaction, error: null };
  } catch (error) {
    console.error("Error cancelling transaction:", error);
    return { data: null, error: error.message };
  }
}

// Get top selling products
export async function getTopSellingProducts(limit = 10, period = "month") {
  // Force mock API for testing
  console.log("🔧 getTopSellingProducts called - forcing mock mode");
  return await mockGetTopSellingProducts(limit, period);

  /* Original Supabase code - temporarily disabled
  // Use mock API if enabled
  if (isMockMode()) {
    return await mockGetTopSellingProducts(limit, period);
  }

  try {
    let startDate;
    const now = new Date();

    switch (period) {
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
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const { data, error } = await supabase
      .from(TABLES.SALES_ITEMS)
      .select(
        `
        total_pieces,
        line_total,
        products (
          id,
          name,
          category
        ),
        sales_transactions!inner (
          created_at,
          status
        )
      `
      )
      .eq("sales_transactions.status", "completed")
      .gte("sales_transactions.created_at", startDate.toISOString());

    if (error) throw error;

    // Aggregate by product
    const productSales = data.reduce((acc, item) => {
      const productId = item.products.id;
      if (!acc[productId]) {
        acc[productId] = {
          product: item.products,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }
      acc[productId].totalQuantity += item.total_pieces;
      acc[productId].totalRevenue += item.line_total;
      return acc;
    }, {});

    // Convert to array and sort
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit);

    return { data: topProducts, error: null };
  } catch (error) {
    console.error("Error getting top selling products:", error);
    return { data: null, error: error.message };
  }
  */
}

// Get hourly sales data for charts
export async function getHourlySales(date = new Date()) {
  // Force mock API for testing
  console.log("🔧 getHourlySales called - forcing mock mode");
  return await mockGetHourlySales(date);

  /* Original Supabase code - temporarily disabled
  // Use mock API if enabled
  if (isMockMode()) {
    return await mockGetHourlySales(date);
  }

  try {
    const startDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const endDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1
    );

    const { data, error } = await supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .select("total_amount, created_at")
      .eq("status", "completed")
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString())
      .order("created_at");

    if (error) throw error;

    // Group by hour
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, "0")}:00`,
      sales: 0,
      transactions: 0,
    }));

    data.forEach((transaction) => {
      const hour = new Date(transaction.created_at).getHours();
      hourlyData[hour].sales += transaction.total_amount;
      hourlyData[hour].transactions += 1;
    });

    return { data: hourlyData, error: null };
  } catch (error) {
    console.error("Error getting hourly sales:", error);
    return { data: null, error: error.message };
  }
  */
}
