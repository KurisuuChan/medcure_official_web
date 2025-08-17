import { supabase, TABLES } from "../lib/supabase.js";
import { updateProductStock } from "./productService.js";
import {
  mockGetSalesTransactions,
  mockGetSalesSummary,
  mockGetHourlySales,
  mockGetTopSellingProducts,
  mockCreateSale,
  mockGetTransactionHistory,
  mockPrintReceipt,
  mockCancelTransaction,
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
  if (await isMockMode()) {
    console.log("🔧 createSale called - using mock mode");
    return await mockCreateSale(saleData);
  }

  console.log("🔄 createSale called - using backend mode");

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

    // Start transaction
    const transactionNumber = generateTransactionNumber();

    // Create sales transaction
    const { data: transaction, error: transactionError } = await supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .insert([
        {
          transaction_number: transactionNumber,
          subtotal,
          discount_percentage: discount || 0,
          discount_amount: discountAmount,
          pwd_senior_discount: pwdSeniorDiscount,
          total_amount: totalAmount,
          is_pwd_senior: isPwdSenior,
          customer_name: customerInfo.customerName || null,
          payment_method: customerInfo.paymentMethod || "cash",
          amount_paid: customerInfo.amountPaid || totalAmount,
          change_amount: customerInfo.changeAmount || 0,
          status: "completed",
        },
      ])
      .select()
      .single();

    if (transactionError) {
      console.error("❌ Error creating transaction:", transactionError);
      throw transactionError;
    }

    // Create sales items and update stock
    for (const item of cart) {
      // Create sales item
      const { error: itemError } = await supabase
        .from(TABLES.SALES_ITEMS)
        .insert([
          {
            transaction_id: transaction.id,
            product_id: item.id,
            total_pieces: item.quantity,
            unit_price: item.price,
            line_total: item.price * item.quantity,
          },
        ]);

      if (itemError) {
        console.error("❌ Error creating sales item:", itemError);
        throw itemError;
      }

      // Update product stock
      const stockResult = await updateProductStock(
        item.id,
        item.currentStock - item.quantity,
        "out",
        {
          reference_type: "sale",
          reference_id: transaction.id,
          notes: `Sale: ${transactionNumber}`,
        }
      );

      if (!stockResult.success) {
        console.error("❌ Error updating stock:", stockResult.error);
        throw new Error(stockResult.error);
      }
    }

    console.log("✅ Sale created in backend:", transaction);

    return {
      data: {
        transaction,
        transactionNumber,
        totalAmount,
        success: true,
      },
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Error in createSale:", error);
    return {
      data: null,
      error: error.message,
      success: false,
    };
  }
}

// Get sales transactions with filtering
export async function getSalesTransactions(filters = {}) {
  if (await isMockMode()) {
    console.log("🔧 getSalesTransactions called - using mock mode");
    return await mockGetSalesTransactions(filters);
  }

  console.log("🔄 getSalesTransactions called - using backend mode");

  try {
    let query = supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .select("*")
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

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error fetching sales transactions:", error);
      throw error;
    }

    console.log(
      "✅ Sales transactions fetched from backend:",
      data?.length || 0
    );

    return { data: data || [], error: null, success: true };
  } catch (error) {
    console.error("❌ Error in getSalesTransactions:", error);
    return { data: [], error: error.message, success: false };
  }
}

// Get sales summary for a period
export async function getSalesSummary(period = "today") {
  if (await isMockMode()) {
    console.log("🔧 getSalesSummary called - using mock mode");
    return await mockGetSalesSummary(period);
  }

  console.log("🔄 getSalesSummary called - using backend mode");

  try {
    let startDate, endDate;
    const now = new Date();

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    }

    const { data: transactions, error } = await supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .select("total_amount, discount_amount, pwd_senior_discount, created_at")
      .eq("status", "completed")
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString());

    if (error) {
      console.error("❌ Error fetching sales summary:", error);
      throw error;
    }

    const summary = transactions.reduce(
      (acc, transaction) => {
        acc.totalSales += 1;
        acc.totalRevenue += transaction.total_amount;
        acc.totalDiscounts +=
          transaction.discount_amount + transaction.pwd_senior_discount;
        return acc;
      },
      {
        totalSales: 0,
        totalRevenue: 0,
        totalDiscounts: 0,
        period,
      }
    );

    console.log("✅ Sales summary fetched from backend:", summary);

    return { data: summary, error: null, success: true };
  } catch (error) {
    console.error("❌ Error in getSalesSummary:", error);
    return { data: null, error: error.message, success: false };
  }
}

// Get hourly sales data
export async function getHourlySales(date = new Date()) {
  if (await isMockMode()) {
    console.log("🔧 getHourlySales called - using mock mode");
    return await mockGetHourlySales(date);
  }

  console.log("🔄 getHourlySales called - using backend mode");

  try {
    const startDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

    const { data: transactions, error } = await supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .select("total_amount, created_at")
      .eq("status", "completed")
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString());

    if (error) {
      console.error("❌ Error fetching hourly sales:", error);
      throw error;
    }

    // Group by hour
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, "0")}:00`,
      sales: 0,
      revenue: 0,
    }));

    transactions.forEach((transaction) => {
      const hour = new Date(transaction.created_at).getHours();
      hourlyData[hour].sales += 1;
      hourlyData[hour].revenue += transaction.total_amount;
    });

    console.log("✅ Hourly sales fetched from backend");

    return { data: hourlyData, error: null, success: true };
  } catch (error) {
    console.error("❌ Error in getHourlySales:", error);
    return { data: [], error: error.message, success: false };
  }
}

// Get top selling products
export async function getTopSellingProducts(limit = 10, period = "month") {
  if (await isMockMode()) {
    console.log("🔧 getTopSellingProducts called - using mock mode");
    return await mockGetTopSellingProducts(limit, period);
  }

  console.log("🔄 getTopSellingProducts called - using backend mode");

  try {
    let startDate;
    const now = new Date();

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
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const { data: salesItems, error } = await supabase
      .from(TABLES.SALES_ITEMS)
      .select(
        `
        product_id,
        total_pieces,
        line_total,
        products:product_id (
          name,
          generic_name,
          category
        ),
        sales_transactions:transaction_id (
          created_at,
          status
        )
      `
      )
      .gte("sales_transactions.created_at", startDate.toISOString())
      .eq("sales_transactions.status", "completed");

    if (error) {
      console.error("❌ Error fetching top selling products:", error);
      throw error;
    }

    // Group by product and calculate totals
    const productSales = {};

    salesItems.forEach((item) => {
      const productId = item.product_id;
      if (!productSales[productId]) {
        productSales[productId] = {
          product: item.products,
          totalQuantity: 0,
          totalRevenue: 0,
          salesCount: 0,
        };
      }

      productSales[productId].totalQuantity += item.total_pieces;
      productSales[productId].totalRevenue += item.line_total;
      productSales[productId].salesCount += 1;
    });

    // Convert to array and sort by quantity
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit);

    console.log(
      "✅ Top selling products fetched from backend:",
      topProducts.length
    );

    return { data: topProducts, error: null, success: true };
  } catch (error) {
    console.error("❌ Error in getTopSellingProducts:", error);
    return { data: [], error: error.message, success: false };
  }
}

// Cancel a transaction
export async function cancelTransaction(
  transactionId,
  reason = "Cancelled by user"
) {
  if (await isMockMode()) {
    console.log("🔧 cancelTransaction called - using mock mode");
    return await mockCancelTransaction(transactionId, reason);
  }

  console.log("🔄 cancelTransaction called - using backend mode");

  try {
    // Update transaction status
    const { data: transaction, error: transactionError } = await supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId)
      .select()
      .single();

    if (transactionError) {
      console.error("❌ Error cancelling transaction:", transactionError);
      throw transactionError;
    }

    // Get sales items to restore stock
    const { data: salesItems, error: itemsError } = await supabase
      .from(TABLES.SALES_ITEMS)
      .select("product_id, total_pieces")
      .eq("transaction_id", transactionId);

    if (itemsError) {
      console.error("❌ Error fetching sales items:", itemsError);
      throw itemsError;
    }

    // Restore stock for each item
    for (const item of salesItems) {
      // Get current product stock
      const { data: product, error: productError } = await supabase
        .from(TABLES.PRODUCTS)
        .select("total_stock")
        .eq("id", item.product_id)
        .single();

      if (productError) {
        console.error("❌ Error fetching product:", productError);
        continue; // Don't fail the whole operation
      }

      // Restore stock
      await updateProductStock(
        item.product_id,
        product.total_stock + item.total_pieces,
        "in",
        {
          reference_type: "cancellation",
          reference_id: transactionId,
          notes: `Cancelled transaction: ${transaction.transaction_number}`,
        }
      );
    }

    console.log("✅ Transaction cancelled in backend:", transaction);

    return { data: transaction, error: null, success: true };
  } catch (error) {
    console.error("❌ Error in cancelTransaction:", error);
    return { data: null, error: error.message, success: false };
  }
}

// Print receipt (placeholder for backend integration)
export async function printReceipt(transactionId) {
  if (await isMockMode()) {
    console.log("🔧 printReceipt called - using mock mode");
    return await mockPrintReceipt(transactionId);
  }

  console.log("🔄 printReceipt called - using backend mode");

  try {
    // Get transaction details
    const { data: transaction, error } = await supabase
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
      .eq("id", transactionId)
      .single();

    if (error) {
      console.error("❌ Error fetching transaction for receipt:", error);
      throw error;
    }

    console.log("✅ Receipt data fetched from backend");

    return { data: transaction, error: null, success: true };
  } catch (error) {
    console.error("❌ Error in printReceipt:", error);
    return { data: null, error: error.message, success: false };
  }
}

// Get transaction history
export async function getTransactionHistory(filters = {}) {
  if (await isMockMode()) {
    console.log("🔧 getTransactionHistory called - using mock mode");
    return await mockGetTransactionHistory(filters);
  }

  console.log("🔄 getTransactionHistory called - using backend mode");

  return await getSalesTransactions(filters);
}

export default {
  createSale,
  getSalesTransactions,
  getSalesSummary,
  getHourlySales,
  getTopSellingProducts,
  cancelTransaction,
  printReceipt,
  getTransactionHistory,
};
