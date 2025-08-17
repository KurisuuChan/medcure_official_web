/**
 * Enhanced Dashboard Backend Service
 * Provides comprehensive and accurate dashboard data from the backend
 */

import { supabase, TABLES } from "../lib/supabase.js";
import {
  format,
  isAfter,
  differenceInDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

/**
 * Get comprehensive dashboard analytics data
 * Returns real-time accurate data from the backend
 */
export async function getDashboardAnalytics() {
  try {
    console.log("📊 Fetching comprehensive dashboard analytics...");

    const today = new Date();
    const startToday = startOfDay(today);
    const endToday = endOfDay(today);
    const startWeek = startOfWeek(today);
    const endWeek = endOfWeek(today);
    const startMonth = startOfMonth(today);
    const endMonth = endOfMonth(today);

    // Parallel fetch for better performance
    const [
      inventoryData,
      todaySalesData,
      weekSalesData,
      monthSalesData,
      hourlySalesData,
      recentTransactionsData,
      topProductsData,
      lowStockData,
      expiringData,
      categorySalesData,
    ] = await Promise.all([
      getInventoryAnalytics(),
      getSalesAnalytics(startToday, endToday, "today"),
      getSalesAnalytics(startWeek, endWeek, "week"),
      getSalesAnalytics(startMonth, endMonth, "month"),
      getHourlySalesAnalytics(today),
      getRecentTransactionsAnalytics(),
      getTopSellingProductsAnalytics(),
      getLowStockAnalytics(),
      getExpiringProductsAnalytics(),
      getCategorySalesAnalytics(startToday, endToday),
    ]);

    console.log("✅ Dashboard analytics data fetched successfully");

    return {
      success: true,
      data: {
        inventory: inventoryData,
        sales: {
          today: todaySalesData,
          week: weekSalesData,
          month: monthSalesData,
          hourly: hourlySalesData,
          byCategory: categorySalesData,
        },
        transactions: recentTransactionsData,
        products: {
          topSelling: topProductsData,
          lowStock: lowStockData,
          expiring: expiringData,
        },
      },
    };
  } catch (error) {
    console.error("❌ Error fetching dashboard analytics:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}

/**
 * Get inventory analytics
 */
async function getInventoryAnalytics() {
  try {
    const { data: products, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select(
        `
        id,
        name,
        total_stock,
        cost_price,
        selling_price,
        critical_level,
        expiry_date,
        category,
        is_active
      `
      )
      .eq("is_active", true);

    if (error) throw error;

    const analytics = products.reduce(
      (acc, product) => {
        acc.totalProducts += 1;
        acc.totalValue += product.total_stock * product.cost_price;
        acc.totalRetailValue += product.total_stock * product.selling_price;
        acc.totalStock += product.total_stock;

        if (
          product.total_stock <= product.critical_level &&
          product.total_stock > 0
        ) {
          acc.lowStockCount += 1;
        }

        if (product.total_stock === 0) {
          acc.outOfStockCount += 1;
        }

        // Category breakdown
        if (!acc.byCategory[product.category]) {
          acc.byCategory[product.category] = {
            count: 0,
            value: 0,
            stock: 0,
          };
        }
        acc.byCategory[product.category].count += 1;
        acc.byCategory[product.category].value +=
          product.total_stock * product.cost_price;
        acc.byCategory[product.category].stock += product.total_stock;

        return acc;
      },
      {
        totalProducts: 0,
        totalValue: 0,
        totalRetailValue: 0,
        totalStock: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        byCategory: {},
      }
    );

    return analytics;
  } catch (error) {
    console.error("❌ Error fetching inventory analytics:", error);
    throw error;
  }
}

/**
 * Get sales analytics for a period
 */
async function getSalesAnalytics(startDate, endDate, period) {
  try {
    const { data: transactions, error } = await supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .select(
        `
        id,
        total_amount,
        subtotal,
        discount_amount,
        pwd_senior_discount,
        created_at,
        status,
        payment_method,
        sales_items(
          total_pieces,
          unit_price,
          line_total,
          products(name, category)
        )
      `
      )
      .eq("status", "completed")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    const analytics = transactions.reduce(
      (acc, transaction) => {
        acc.totalTransactions += 1;
        acc.totalRevenue += transaction.total_amount;
        acc.totalSubtotal += transaction.subtotal;
        acc.totalDiscounts +=
          (transaction.discount_amount || 0) +
          (transaction.pwd_senior_discount || 0);

        // Calculate total items sold
        const itemsInTransaction =
          transaction.sales_items?.reduce(
            (sum, item) => sum + item.total_pieces,
            0
          ) || 0;
        acc.totalItemsSold += itemsInTransaction;

        // Payment method breakdown
        const paymentMethod = transaction.payment_method || "cash";
        acc.paymentMethods[paymentMethod] =
          (acc.paymentMethods[paymentMethod] || 0) + 1;

        return acc;
      },
      {
        totalTransactions: 0,
        totalRevenue: 0,
        totalSubtotal: 0,
        totalDiscounts: 0,
        totalItemsSold: 0,
        averageTransactionValue: 0,
        averageItemsPerTransaction: 0,
        paymentMethods: {},
        period,
      }
    );

    // Calculate averages
    if (analytics.totalTransactions > 0) {
      analytics.averageTransactionValue =
        analytics.totalRevenue / analytics.totalTransactions;
      analytics.averageItemsPerTransaction =
        analytics.totalItemsSold / analytics.totalTransactions;
    }

    return analytics;
  } catch (error) {
    console.error("❌ Error fetching sales analytics:", error);
    throw error;
  }
}

/**
 * Get hourly sales analytics for a specific day
 */
async function getHourlySalesAnalytics(date) {
  try {
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    const { data: transactions, error } = await supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .select("total_amount, created_at")
      .eq("status", "completed")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (error) throw error;

    // Initialize hourly data
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: hour.toString().padStart(2, "0") + ":00",
      sales: 0,
      revenue: 0,
      transactions: 0,
    }));

    // Group sales by hour
    transactions.forEach((transaction) => {
      const transactionHour = new Date(transaction.created_at).getHours();
      hourlyData[transactionHour].sales += transaction.total_amount;
      hourlyData[transactionHour].revenue += transaction.total_amount;
      hourlyData[transactionHour].transactions += 1;
    });

    return hourlyData;
  } catch (error) {
    console.error("❌ Error fetching hourly sales analytics:", error);
    throw error;
  }
}

/**
 * Get recent transactions analytics
 */
async function getRecentTransactionsAnalytics(limit = 10) {
  try {
    const { data: transactions, error } = await supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .select(
        `
        id,
        transaction_number,
        total_amount,
        created_at,
        customer_name,
        payment_method,
        sales_items(
          total_pieces,
          unit_price,
          line_total,
          products(name, category)
        )
      `
      )
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return transactions.map((transaction) => ({
      id: transaction.id,
      transactionNumber: transaction.transaction_number,
      totalAmount: transaction.total_amount,
      createdAt: transaction.created_at,
      customerName: transaction.customer_name,
      paymentMethod: transaction.payment_method,
      itemCount: transaction.sales_items?.length || 0,
      totalPieces:
        transaction.sales_items?.reduce(
          (sum, item) => sum + item.total_pieces,
          0
        ) || 0,
      mainProduct:
        transaction.sales_items?.[0]?.products?.name || "Unknown Product",
      formattedTime: formatRelativeTime(transaction.created_at),
    }));
  } catch (error) {
    console.error("❌ Error fetching recent transactions analytics:", error);
    throw error;
  }
}

/**
 * Get top selling products analytics
 */
async function getTopSellingProductsAnalytics(limit = 10, days = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: salesItems, error } = await supabase
      .from(TABLES.SALES_ITEMS)
      .select(
        `
        total_pieces,
        line_total,
        unit_price,
        products(
          id,
          name,
          category,
          selling_price
        ),
        sales_transactions!inner(
          status,
          created_at
        )
      `
      )
      .eq("sales_transactions.status", "completed")
      .gte("sales_transactions.created_at", startDate.toISOString());

    if (error) throw error;

    // Group by product
    const productMap = {};
    salesItems.forEach((item) => {
      const productId = item.products.id;
      if (!productMap[productId]) {
        productMap[productId] = {
          id: productId,
          name: item.products.name,
          category: item.products.category,
          totalQuantity: 0,
          totalRevenue: 0,
          transactionCount: 0,
          averagePrice: item.unit_price,
        };
      }
      productMap[productId].totalQuantity += item.total_pieces;
      productMap[productId].totalRevenue += item.line_total;
      productMap[productId].transactionCount += 1;
    });

    // Convert to array and sort by quantity
    return Object.values(productMap)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit);
  } catch (error) {
    console.error("❌ Error fetching top selling products analytics:", error);
    throw error;
  }
}

/**
 * Get low stock analytics
 */
async function getLowStockAnalytics() {
  try {
    const { data: products, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select("id, name, total_stock, critical_level, category, selling_price")
      .eq("is_active", true)
      .order("total_stock", { ascending: true });

    if (error) throw error;

    // Filter low stock products in JavaScript since Supabase doesn't support column comparison
    const lowStockProducts = products.filter(
      (product) =>
        product.total_stock <= product.critical_level && product.total_stock > 0
    );

    return lowStockProducts.map((product) => ({
      id: product.id,
      name: product.name,
      currentStock: product.total_stock,
      criticalLevel: product.critical_level,
      category: product.category,
      sellingPrice: product.selling_price,
      urgency: product.total_stock / product.critical_level, // Lower is more urgent
      status: product.total_stock === 0 ? "out_of_stock" : "low_stock",
    }));
  } catch (error) {
    console.error("❌ Error fetching low stock analytics:", error);
    throw error;
  }
}

/**
 * Get expiring products analytics
 */
async function getExpiringProductsAnalytics(daysAhead = 30) {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    const { data: products, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select("id, name, expiry_date, total_stock, category, cost_price")
      .eq("is_active", true)
      .not("expiry_date", "is", null)
      .gte("expiry_date", today.toISOString())
      .lte("expiry_date", futureDate.toISOString())
      .order("expiry_date", { ascending: true });

    if (error) throw error;

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      expiryDate: product.expiry_date,
      totalStock: product.total_stock,
      category: product.category,
      costPrice: product.cost_price,
      daysUntilExpiry: differenceInDays(new Date(product.expiry_date), today),
      potentialLoss: product.total_stock * product.cost_price,
      urgency:
        differenceInDays(new Date(product.expiry_date), today) <= 7
          ? "critical"
          : differenceInDays(new Date(product.expiry_date), today) <= 14
          ? "warning"
          : "watch",
    }));
  } catch (error) {
    console.error("❌ Error fetching expiring products analytics:", error);
    throw error;
  }
}

/**
 * Get category sales analytics
 */
async function getCategorySalesAnalytics(startDate, endDate) {
  try {
    const { data: salesItems, error } = await supabase
      .from(TABLES.SALES_ITEMS)
      .select(
        `
        line_total,
        total_pieces,
        products(category),
        sales_transactions!inner(
          status,
          created_at
        )
      `
      )
      .eq("sales_transactions.status", "completed")
      .gte("sales_transactions.created_at", startDate.toISOString())
      .lte("sales_transactions.created_at", endDate.toISOString());

    if (error) throw error;

    const categoryMap = {};
    salesItems.forEach((item) => {
      const category = item.products?.category || "Uncategorized";
      if (!categoryMap[category]) {
        categoryMap[category] = {
          category,
          revenue: 0,
          quantity: 0,
          transactions: 0,
        };
      }
      categoryMap[category].revenue += item.line_total;
      categoryMap[category].quantity += item.total_pieces;
      categoryMap[category].transactions += 1;
    });

    return Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);
  } catch (error) {
    console.error("❌ Error fetching category sales analytics:", error);
    throw error;
  }
}

/**
 * Format relative time for display
 */
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return format(date, "MMM d, HH:mm");
}

/**
 * Get real-time dashboard stats
 * Optimized for quick loading and real-time updates
 */
export async function getDashboardStats() {
  try {
    console.log("⚡ Fetching real-time dashboard stats...");

    const today = new Date();
    const startToday = startOfDay(today);
    const endToday = endOfDay(today);

    // Quick parallel queries for essential stats
    const [
      { count: totalProducts },
      allProductsForLowStock,
      { count: expiringCount },
      todaySalesResult,
    ] = await Promise.all([
      // Total products count
      supabase
        .from(TABLES.PRODUCTS)
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),

      // Get all products to filter low stock in JS (since supabase doesn't support column comparison)
      supabase
        .from(TABLES.PRODUCTS)
        .select("total_stock, critical_level")
        .eq("is_active", true)
        .gt("total_stock", 0),

      // Expiring soon count
      supabase
        .from(TABLES.PRODUCTS)
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .not("expiry_date", "is", null)
        .gte("expiry_date", today.toISOString())
        .lte(
          "expiry_date",
          new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        ),

      // Today's sales
      supabase
        .from(TABLES.SALES_TRANSACTIONS)
        .select("total_amount")
        .eq("status", "completed")
        .gte("created_at", startToday.toISOString())
        .lte("created_at", endToday.toISOString()),
    ]);

    const todayRevenue =
      todaySalesResult.data?.reduce((sum, t) => sum + t.total_amount, 0) || 0;

    // Calculate low stock count from the fetched products
    const lowStockCount =
      allProductsForLowStock.data?.filter(
        (p) => p.total_stock <= p.critical_level
      ).length || 0;

    console.log("✅ Real-time dashboard stats fetched successfully");

    return {
      success: true,
      data: {
        totalProducts: totalProducts || 0,
        lowStockCount: lowStockCount || 0,
        expiringCount: expiringCount || 0,
        todayRevenue,
        todayTransactions: todaySalesResult.data?.length || 0,
      },
    };
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error);
    return {
      success: false,
      error: error.message,
      data: {
        totalProducts: 0,
        lowStockCount: 0,
        expiringCount: 0,
        todayRevenue: 0,
        todayTransactions: 0,
      },
    };
  }
}

export default {
  getDashboardAnalytics,
  getDashboardStats,
};
