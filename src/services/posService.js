import {
  mockCreateSale,
  mockGetTransactionHistory,
  mockPrintReceipt,
  mockCancelTransaction,
} from "../utils/mockApi.js";

/**
 * POS (Point of Sale) Service
 * Handles all POS-specific operations including sales, transactions, and receipts
 */

// Process a sale through POS
export async function processPOSSale(saleData) {
  try {
    console.log("🛒 Processing POS sale:", {
      items: saleData.cart?.length || 0,
      isPwdSenior: saleData.isPwdSenior,
      discount: saleData.discount,
    });

    const result = await mockCreateSale(saleData);

    if (result.error) {
      throw new Error(result.error);
    }

    console.log("✅ POS sale processed successfully:", result.data.summary);

    return {
      success: true,
      data: result.data,
      error: null,
    };
  } catch (error) {
    console.error("❌ POS sale processing failed:", error);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
}

// Get POS transaction history
export async function getPOSTransactionHistory(filters = {}) {
  try {
    console.log("📋 Fetching POS transaction history:", filters);

    const result = await mockGetTransactionHistory(filters);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      success: true,
      data: result.data,
      error: null,
    };
  } catch (error) {
    console.error("❌ Failed to fetch transaction history:", error);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
}

// Print receipt for a transaction
export async function printPOSReceipt(transactionId) {
  try {
    console.log("🖨️ Printing receipt for transaction:", transactionId);

    const result = await mockPrintReceipt(transactionId);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      success: true,
      data: result.data,
      error: null,
    };
  } catch (error) {
    console.error("❌ Failed to print receipt:", error);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
}

// Cancel/void a POS transaction
export async function cancelPOSTransaction(transactionId, reason = "") {
  try {
    console.log(
      "🚫 Cancelling POS transaction:",
      transactionId,
      "Reason:",
      reason
    );

    const result = await mockCancelTransaction(transactionId, reason);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      success: true,
      data: result.data,
      error: null,
    };
  } catch (error) {
    console.error("❌ Failed to cancel transaction:", error);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
}

// Validate cart before processing
export function validatePOSCart(cart) {
  const errors = [];

  if (!cart || cart.length === 0) {
    errors.push("Cart is empty");
    return { isValid: false, errors };
  }

  let hasStockIssues = false;

  cart.forEach((item) => {
    if (!item.id) {
      errors.push(`Invalid product: ${item.name || "Unknown"}`);
    }

    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Invalid quantity for ${item.name}`);
    }

    if (item.quantity > item.total_stock) {
      errors.push(
        `Insufficient stock for ${item.name}. Available: ${item.total_stock}, Requested: ${item.quantity}`
      );
      hasStockIssues = true;
    }

    if (!item.selling_price || item.selling_price <= 0) {
      errors.push(`Invalid price for ${item.name}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    hasStockIssues,
  };
}

// Calculate POS totals (utility function)
export function calculatePOSTotals(cart, discount = 0, isPwdSenior = false) {
  if (!cart || cart.length === 0) {
    return {
      subtotal: 0,
      regularDiscountAmount: 0,
      pwdSeniorDiscount: 0,
      totalDiscount: 0,
      total: 0,
      itemCount: 0,
    };
  }

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + (item.selling_price || item.price || 0) * (item.quantity || 0),
    0
  );

  const regularDiscountAmount = (subtotal * (discount || 0)) / 100;
  const pwdSeniorDiscount = isPwdSenior ? subtotal * 0.2 : 0;
  const totalDiscount = regularDiscountAmount + pwdSeniorDiscount;
  const total = Math.max(0, subtotal - totalDiscount);
  const itemCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    regularDiscountAmount: Math.round(regularDiscountAmount * 100) / 100,
    pwdSeniorDiscount: Math.round(pwdSeniorDiscount * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    total: Math.round(total * 100) / 100,
    itemCount,
  };
}

// Format receipt for printing/display
export function formatReceiptData(transaction, items = []) {
  if (!transaction) return null;

  const receiptDate = new Date(transaction.created_at || Date.now());

  return {
    header: {
      storeName: "MedCure Pharmacy",
      address: "123 Medical Street, Health City",
      phone: "123-456-7890",
      transactionNumber: transaction.transaction_number,
      date: receiptDate.toLocaleDateString(),
      time: receiptDate.toLocaleTimeString(),
      cashier: "POS System",
    },
    customer: {
      name: transaction.customer_name || "Walk-in Customer",
      isPwdSenior: transaction.is_pwd_senior,
    },
    items: items.map((item) => ({
      name: item.name || "Unknown Item",
      quantity: item.quantity || item.total_pieces || 0,
      unitPrice: item.unit_price || item.selling_price || 0,
      lineTotal: item.line_total || item.quantity * item.unit_price || 0,
      packaging: item.packaging || {},
    })),
    totals: {
      subtotal: transaction.subtotal || 0,
      discountPercentage: transaction.discount_percentage || 0,
      discountAmount: transaction.discount_amount || 0,
      pwdSeniorDiscount: transaction.pwd_senior_discount || 0,
      totalAmount: transaction.total_amount || 0,
      amountPaid: transaction.amount_paid || 0,
      changeAmount: transaction.change_amount || 0,
      paymentMethod: transaction.payment_method || "cash",
    },
    footer: {
      thankYouMessage: "Thank you for your business!",
      disclaimer: "Please keep this receipt for your records.",
      returnPolicy: "Returns accepted within 7 days with receipt.",
    },
  };
}

// Get daily sales summary for POS
export function getDailySalesSummary(transactions = []) {
  const today = new Date();
  const todayStr = today.toDateString();

  const todaysTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.created_at);
    return (
      transactionDate.toDateString() === todayStr && t.status === "completed"
    );
  });

  const summary = todaysTransactions.reduce(
    (acc, transaction) => {
      acc.totalSales += transaction.total_amount || 0;
      acc.totalTransactions += 1;
      acc.totalDiscounts +=
        (transaction.discount_amount || 0) +
        (transaction.pwd_senior_discount || 0);
      acc.totalItems +=
        transaction.sales_items?.reduce(
          (sum, item) => sum + (item.total_pieces || 0),
          0
        ) || 0;

      if (transaction.is_pwd_senior) {
        acc.pwdSeniorTransactions += 1;
      }

      return acc;
    },
    {
      totalSales: 0,
      totalTransactions: 0,
      totalDiscounts: 0,
      totalItems: 0,
      pwdSeniorTransactions: 0,
      averageSale: 0,
    }
  );

  summary.averageSale =
    summary.totalTransactions > 0
      ? summary.totalSales / summary.totalTransactions
      : 0;

  return {
    ...summary,
    date: todayStr,
    totalSales: Math.round(summary.totalSales * 100) / 100,
    totalDiscounts: Math.round(summary.totalDiscounts * 100) / 100,
    averageSale: Math.round(summary.averageSale * 100) / 100,
  };
}

// POS system status check
export function getPOSSystemStatus() {
  return {
    isOnline: true,
    mode: "mock",
    lastSyncTime: new Date().toISOString(),
    version: "1.0.0",
    features: {
      salesProcessing: true,
      receiptPrinting: true,
      stockManagement: true,
      discounts: true,
      pwdSeniorDiscount: true,
      transactionHistory: true,
      refunds: true,
    },
  };
}

export default {
  processPOSSale,
  getPOSTransactionHistory,
  printPOSReceipt,
  cancelPOSTransaction,
  validatePOSCart,
  calculatePOSTotals,
  formatReceiptData,
  getDailySalesSummary,
  getPOSSystemStatus,
};
