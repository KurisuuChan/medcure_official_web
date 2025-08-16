import { supabase, TABLES } from "../lib/supabase.js";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

/**
 * Reporting Service
 * Handles report generation and analytics
 */

// Get sales report for a date range
export async function getSalesReport(startDate, endDate, groupBy = "daily") {
  try {
    const { data, error } = await supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .select(
        `
        id,
        transaction_number,
        total_amount,
        discount_amount,
        pwd_senior_discount,
        status,
        created_at,
        sales_items (
          total_pieces,
          line_total,
          products (
            name,
            category
          )
        )
      `
      )
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Group data based on groupBy parameter
    const groupedData = groupSalesData(data, groupBy);

    // Calculate summary statistics
    const summary = calculateSalesSummary(data);

    return {
      data: {
        transactions: data,
        grouped: groupedData,
        summary,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error generating sales report:", error);
    return { data: null, error: error.message };
  }
}

// Get inventory report
export async function getInventoryReport() {
  try {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select(
        `
        *,
        stock_movements (
          movement_type,
          quantity_change,
          created_at
        )
      `
      )
      .eq("is_active", true)
      .order("name");

    if (error) throw error;

    // Calculate inventory metrics
    const metrics = calculateInventoryMetrics(data);

    return {
      data: {
        products: data,
        metrics,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error generating inventory report:", error);
    return { data: null, error: error.message };
  }
}

// Get low stock report
export async function getLowStockReport() {
  try {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select("*")
      .lte("total_stock", supabase.raw("critical_level"))
      .eq("is_active", true)
      .order("total_stock");

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error generating low stock report:", error);
    return { data: null, error: error.message };
  }
}

// Get expiring products report
export async function getExpiringProductsReport(daysAhead = 30) {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select("*")
      .lte("expiry_date", futureDate.toISOString().split("T")[0])
      .gte("expiry_date", new Date().toISOString().split("T")[0])
      .eq("is_active", true)
      .order("expiry_date");

    if (error) throw error;

    // Add days until expiry
    const enrichedData = data.map((product) => ({
      ...product,
      daysUntilExpiry: Math.ceil(
        (new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
      ),
    }));

    return { data: enrichedData, error: null };
  } catch (error) {
    console.error("Error generating expiring products report:", error);
    return { data: null, error: error.message };
  }
}

// Get product performance report
export async function getProductPerformanceReport(period = "month") {
  try {
    let startDate, endDate;
    const now = new Date();

    switch (period) {
      case "week":
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case "month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "quarter":
        startDate = new Date(
          now.getFullYear(),
          Math.floor(now.getMonth() / 3) * 3,
          1
        );
        endDate = new Date(
          now.getFullYear(),
          Math.floor(now.getMonth() / 3) * 3 + 3,
          0
        );
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
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
          category,
          cost_price,
          selling_price
        ),
        sales_transactions!inner (
          created_at,
          status
        )
      `
      )
      .eq("sales_transactions.status", "completed")
      .gte("sales_transactions.created_at", startDate.toISOString())
      .lte("sales_transactions.created_at", endDate.toISOString());

    if (error) throw error;

    // Aggregate by product
    const productPerformance = data.reduce((acc, item) => {
      const productId = item.products.id;
      if (!acc[productId]) {
        acc[productId] = {
          product: item.products,
          totalQuantitySold: 0,
          totalRevenue: 0,
          totalCost: 0,
          profit: 0,
          transactionCount: 0,
        };
      }

      acc[productId].totalQuantitySold += item.total_pieces;
      acc[productId].totalRevenue += item.line_total;
      acc[productId].totalCost += item.total_pieces * item.products.cost_price;
      acc[productId].profit +=
        item.line_total - item.total_pieces * item.products.cost_price;
      acc[productId].transactionCount += 1;

      return acc;
    }, {});

    const performanceArray = Object.values(productPerformance).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );

    return { data: performanceArray, error: null };
  } catch (error) {
    console.error("Error generating product performance report:", error);
    return { data: null, error: error.message };
  }
}

// Get customer sales summary (PWD/Senior discounts)
export async function getCustomerSalesReport(startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .select("*")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const summary = {
      total_transactions: data.length,
      regular_customers: data.filter((t) => !t.is_pwd_senior).length,
      pwd_senior_customers: data.filter((t) => t.is_pwd_senior).length,
      total_sales: data.reduce((sum, t) => sum + t.total_amount, 0),
      total_discounts: data.reduce(
        (sum, t) => sum + t.discount_amount + t.pwd_senior_discount,
        0
      ),
      pwd_senior_discounts: data.reduce(
        (sum, t) => sum + t.pwd_senior_discount,
        0
      ),
    };

    return {
      data: {
        transactions: data,
        summary,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error generating customer sales report:", error);
    return { data: null, error: error.message };
  }
}

// Get stock movement report
export async function getStockMovementReport(
  productId = null,
  startDate = null,
  endDate = null
) {
  try {
    let query = supabase
      .from(TABLES.STOCK_MOVEMENTS)
      .select(
        `
        *,
        products (
          name,
          category
        )
      `
      )
      .order("created_at", { ascending: false });

    if (productId) {
      query = query.eq("product_id", productId);
    }

    if (startDate) {
      query = query.gte("created_at", startDate.toISOString());
    }

    if (endDate) {
      query = query.lte("created_at", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error generating stock movement report:", error);
    return { data: null, error: error.message };
  }
}

// Helper functions
function groupSalesData(data, groupBy) {
  const grouped = {};

  data.forEach((transaction) => {
    let key;
    const date = new Date(transaction.created_at);

    switch (groupBy) {
      case "hourly":
        key = format(date, "yyyy-MM-dd HH:00");
        break;
      case "daily":
        key = format(date, "yyyy-MM-dd");
        break;
      case "weekly":
        key = format(startOfWeek(date), "yyyy-MM-dd");
        break;
      case "monthly":
        key = format(date, "yyyy-MM");
        break;
      default:
        key = format(date, "yyyy-MM-dd");
    }

    if (!grouped[key]) {
      grouped[key] = {
        period: key,
        transactions: 0,
        totalSales: 0,
        totalDiscounts: 0,
        itemsSold: 0,
      };
    }

    grouped[key].transactions += 1;
    grouped[key].totalSales += transaction.total_amount;
    grouped[key].totalDiscounts +=
      transaction.discount_amount + transaction.pwd_senior_discount;
    grouped[key].itemsSold +=
      transaction.sales_items?.reduce(
        (sum, item) => sum + item.total_pieces,
        0
      ) || 0;
  });

  return Object.values(grouped).sort((a, b) =>
    a.period.localeCompare(b.period)
  );
}

function calculateSalesSummary(data) {
  return {
    totalTransactions: data.length,
    totalSales: data.reduce((sum, t) => sum + t.total_amount, 0),
    totalDiscounts: data.reduce(
      (sum, t) => sum + t.discount_amount + t.pwd_senior_discount,
      0
    ),
    averageTransaction:
      data.length > 0
        ? data.reduce((sum, t) => sum + t.total_amount, 0) / data.length
        : 0,
    pwdSeniorTransactions: data.filter((t) => t.is_pwd_senior).length,
    pwdSeniorDiscounts: data.reduce((sum, t) => sum + t.pwd_senior_discount, 0),
  };
}

function calculateInventoryMetrics(products) {
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.total_stock, 0);
  const totalValue = products.reduce(
    (sum, p) => sum + p.total_stock * p.cost_price,
    0
  );
  const lowStockCount = products.filter(
    (p) => p.total_stock <= p.critical_level && p.total_stock > 0
  ).length;
  const outOfStockCount = products.filter((p) => p.total_stock === 0).length;

  const categoryCounts = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});

  return {
    totalProducts,
    totalStock,
    totalValue,
    lowStockCount,
    outOfStockCount,
    averageStockValue: totalProducts > 0 ? totalValue / totalProducts : 0,
    categoryCounts,
  };
}

// Export all report functions
export default {
  getSalesReport,
  getInventoryReport,
  getLowStockReport,
  getExpiringProductsReport,
  getProductPerformanceReport,
  getCustomerSalesReport,
  getStockMovementReport,
};
