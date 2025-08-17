/**
 * MedCure Financial Management Service
 * Handles all financial operations, revenue tracking, cost management, and profitability analysis
 */

import { supabase, TABLES } from "../lib/supabase.js";
import { shouldUseMockAPI } from "./backendService.js";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from "date-fns";

// Mock financial data for fallback
const MOCK_FINANCIAL_DATA = {
  revenue: {
    today: 24500,
    week: 156800,
    month: 2450000,
    year: 18750000,
  },
  costs: {
    today: 16800,
    week: 107520,
    month: 1680000,
    year: 12850000,
  },
  profit: {
    today: 7700,
    week: 49280,
    month: 770000,
    year: 5900000,
  },
  profitMargin: 31.4,
  totalTransactions: 1248,
  averageOrderValue: 1963.14,
};

const MOCK_MONTHLY_DATA = [
  { month: "Jan", revenue: 1850000, costs: 1250000, profit: 600000 },
  { month: "Feb", revenue: 2050000, costs: 1400000, profit: 650000 },
  { month: "Mar", revenue: 1950000, costs: 1350000, profit: 600000 },
  { month: "Apr", revenue: 2200000, costs: 1500000, profit: 700000 },
  { month: "May", revenue: 2400000, costs: 1650000, profit: 750000 },
  { month: "Jun", revenue: 2300000, costs: 1600000, profit: 700000 },
  { month: "Jul", revenue: 2500000, costs: 1700000, profit: 800000 },
  { month: "Aug", revenue: 2650000, costs: 1800000, profit: 850000 },
  { month: "Sep", revenue: 2550000, costs: 1750000, profit: 800000 },
  { month: "Oct", revenue: 2700000, costs: 1850000, profit: 850000 },
  { month: "Nov", revenue: 2800000, costs: 1900000, profit: 900000 },
  { month: "Dec", revenue: 2900000, costs: 1950000, profit: 950000 },
];

const MOCK_TOP_PRODUCTS = [
  {
    name: "Amoxicillin 500mg",
    revenue: 145000,
    profit: 58000,
    margin: 40.0,
    sales: 580,
  },
  {
    name: "Paracetamol 500mg",
    revenue: 98000,
    profit: 39200,
    margin: 40.0,
    sales: 1960,
  },
  {
    name: "Vitamin C 1000mg",
    revenue: 87500,
    profit: 43750,
    margin: 50.0,
    sales: 1750,
  },
  {
    name: "Ibuprofen 200mg",
    revenue: 76000,
    profit: 30400,
    margin: 40.0,
    sales: 760,
  },
  {
    name: "Aspirin 81mg",
    revenue: 54000,
    profit: 27000,
    margin: 50.0,
    sales: 2700,
  },
];

/**
 * Get financial overview data
 * @param {string} period - Time period (today, week, month, year)
 * @returns {Promise<Object>} Financial overview data
 */
export async function getFinancialOverview(period = "month") {
  if (await shouldUseMockAPI()) {
    console.log("📊 Using mock financial overview data");
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      data: {
        ...MOCK_FINANCIAL_DATA,
        period,
        lastUpdated: new Date().toISOString(),
      },
      error: null,
    };
  }

  try {
    console.log("📊 Fetching financial overview from backend...");

    const today = new Date();
    let startDate, endDate;

    switch (period) {
      case "today":
        startDate = startOfDay(today);
        endDate = endOfDay(today);
        break;
      case "week":
        startDate = startOfWeek(today);
        endDate = endOfWeek(today);
        break;
      case "month":
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case "year":
        startDate = startOfYear(today);
        endDate = endOfYear(today);
        break;
      default:
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
    }

    // Get revenue data from sales transactions
    const { data: salesData, error: salesError } = await supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .select(
        `
        total_amount,
        discount_amount,
        created_at,
        sales_items (
          quantity,
          unit_price,
          line_total,
          products (
            cost_price,
            selling_price
          )
        )
      `
      )
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .eq("status", "completed");

    if (salesError) throw salesError;

    // Calculate financial metrics
    const revenue = salesData.reduce(
      (sum, transaction) => sum + transaction.total_amount,
      0
    );
    const totalDiscounts = salesData.reduce(
      (sum, transaction) => sum + (transaction.discount_amount || 0),
      0
    );
    const totalTransactions = salesData.length;

    // Calculate costs based on cost_price of sold items
    let totalCosts = 0;
    salesData.forEach((transaction) => {
      transaction.sales_items.forEach((item) => {
        if (item.products && item.products.cost_price) {
          totalCosts += item.quantity * item.products.cost_price;
        }
      });
    });

    const grossProfit = revenue - totalCosts;
    const profitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const averageOrderValue =
      totalTransactions > 0 ? revenue / totalTransactions : 0;

    return {
      data: {
        revenue: {
          total: revenue,
          discounts: totalDiscounts,
          net: revenue - totalDiscounts,
        },
        costs: {
          total: totalCosts,
        },
        profit: {
          gross: grossProfit,
          margin: profitMargin,
        },
        transactions: {
          count: totalTransactions,
          averageValue: averageOrderValue,
        },
        period,
        lastUpdated: new Date().toISOString(),
      },
      error: null,
    };
  } catch (error) {
    console.error("❌ Financial overview error:", error);
    return {
      data: null,
      error: error.message,
    };
  }
}

/**
 * Get monthly financial trends
 * @param {number} months - Number of months to analyze
 * @returns {Promise<Object>} Monthly financial data
 */
export async function getMonthlyFinancialTrends(months = 12) {
  if (await shouldUseMockAPI()) {
    console.log("📊 Using mock monthly financial trends");
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      data: MOCK_MONTHLY_DATA.slice(-months),
      error: null,
    };
  }

  try {
    console.log("📊 Fetching monthly financial trends...");

    const monthlyData = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const startDate = startOfMonth(monthDate);
      const endDate = endOfMonth(monthDate);

      const { data: salesData, error } = await supabase
        .from(TABLES.SALES_TRANSACTIONS)
        .select(
          `
          total_amount,
          sales_items (
            quantity,
            products (cost_price)
          )
        `
        )
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .eq("status", "completed");

      if (error) throw error;

      const revenue = salesData.reduce((sum, t) => sum + t.total_amount, 0);
      let costs = 0;

      salesData.forEach((transaction) => {
        transaction.sales_items.forEach((item) => {
          if (item.products?.cost_price) {
            costs += item.quantity * item.products.cost_price;
          }
        });
      });

      monthlyData.push({
        month: format(monthDate, "MMM"),
        revenue,
        costs,
        profit: revenue - costs,
        date: monthDate.toISOString(),
      });
    }

    return {
      data: monthlyData,
      error: null,
    };
  } catch (error) {
    console.error("❌ Monthly trends error:", error);
    return {
      data: null,
      error: error.message,
    };
  }
}

/**
 * Get top performing products by revenue
 * @param {number} limit - Number of products to return
 * @param {string} period - Time period for analysis
 * @returns {Promise<Object>} Top products financial data
 */
export async function getTopPerformingProducts(limit = 10, period = "month") {
  if (await shouldUseMockAPI()) {
    console.log("📊 Using mock top products data");
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      data: MOCK_TOP_PRODUCTS.slice(0, limit),
      error: null,
    };
  }

  try {
    console.log("📊 Fetching top performing products...");

    const today = new Date();
    let startDate, endDate;

    switch (period) {
      case "week":
        startDate = startOfWeek(today);
        endDate = endOfWeek(today);
        break;
      case "month":
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case "year":
        startDate = startOfYear(today);
        endDate = endOfYear(today);
        break;
      default:
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
    }

    const { data: salesItems, error } = await supabase
      .from(TABLES.SALES_ITEMS)
      .select(
        `
        quantity,
        unit_price,
        line_total,
        products (
          id,
          name,
          cost_price,
          selling_price
        ),
        sales_transactions!inner (
          created_at,
          status
        )
      `
      )
      .gte("sales_transactions.created_at", startDate.toISOString())
      .lte("sales_transactions.created_at", endDate.toISOString())
      .eq("sales_transactions.status", "completed");

    if (error) throw error;

    // Group by product and calculate metrics
    const productMap = new Map();

    salesItems.forEach((item) => {
      if (!item.products) return;

      const productId = item.products.id;
      const existing = productMap.get(productId);

      const revenue = item.line_total;
      const cost = item.quantity * (item.products.cost_price || 0);
      const profit = revenue - cost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      if (existing) {
        existing.revenue += revenue;
        existing.profit += profit;
        existing.sales += item.quantity;
        existing.margin =
          existing.revenue > 0 ? (existing.profit / existing.revenue) * 100 : 0;
      } else {
        productMap.set(productId, {
          name: item.products.name,
          revenue,
          profit,
          margin,
          sales: item.quantity,
        });
      }
    });

    // Convert to array and sort by revenue
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    return {
      data: topProducts,
      error: null,
    };
  } catch (error) {
    console.error("❌ Top products error:", error);
    return {
      data: null,
      error: error.message,
    };
  }
}

/**
 * Get cost breakdown analysis
 * @param {string} period - Time period for analysis
 * @returns {Promise<Object>} Cost breakdown data
 */
export async function getCostBreakdown(period = "month") {
  if (await shouldUseMockAPI()) {
    console.log("📊 Using mock cost breakdown data");
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      data: {
        productCosts: 1200000,
        operationalCosts: 350000,
        staffCosts: 130000,
        totalCosts: 1680000,
        breakdown: [
          { category: "Product Costs", amount: 1200000, percentage: 71.4 },
          { category: "Operational", amount: 350000, percentage: 20.8 },
          { category: "Staff", amount: 130000, percentage: 7.8 },
        ],
      },
      error: null,
    };
  }

  try {
    console.log("📊 Fetching cost breakdown...");

    // This would need to be expanded based on your cost tracking requirements
    const today = new Date();
    let startDate, endDate;

    switch (period) {
      case "week":
        startDate = startOfWeek(today);
        endDate = endOfWeek(today);
        break;
      case "month":
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case "year":
        startDate = startOfYear(today);
        endDate = endOfYear(today);
        break;
      default:
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
    }

    // Get product costs from sales
    const { data: salesData, error } = await supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .select(
        `
        sales_items (
          quantity,
          products (cost_price)
        )
      `
      )
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .eq("status", "completed");

    if (error) throw error;

    let productCosts = 0;
    salesData.forEach((transaction) => {
      transaction.sales_items.forEach((item) => {
        if (item.products?.cost_price) {
          productCosts += item.quantity * item.products.cost_price;
        }
      });
    });

    // For now, use estimates for other costs
    // These could be stored in a separate costs table
    const operationalCosts = productCosts * 0.15; // 15% of product costs
    const staffCosts = productCosts * 0.08; // 8% of product costs
    const totalCosts = productCosts + operationalCosts + staffCosts;

    return {
      data: {
        productCosts,
        operationalCosts,
        staffCosts,
        totalCosts,
        breakdown: [
          {
            category: "Product Costs",
            amount: productCosts,
            percentage: totalCosts > 0 ? (productCosts / totalCosts) * 100 : 0,
          },
          {
            category: "Operational",
            amount: operationalCosts,
            percentage:
              totalCosts > 0 ? (operationalCosts / totalCosts) * 100 : 0,
          },
          {
            category: "Staff",
            amount: staffCosts,
            percentage: totalCosts > 0 ? (staffCosts / totalCosts) * 100 : 0,
          },
        ],
      },
      error: null,
    };
  } catch (error) {
    console.error("❌ Cost breakdown error:", error);
    return {
      data: null,
      error: error.message,
    };
  }
}

/**
 * Export financial report
 * @param {string} period - Time period for export
 * @param {string} format - Export format (csv, json)
 * @returns {Promise<Object>} Export data
 */
export async function exportFinancialReport(period = "month") {
  try {
    console.log("📊 Exporting financial report...");

    const [overview, trends, topProducts, costs] = await Promise.all([
      getFinancialOverview(period),
      getMonthlyFinancialTrends(12),
      getTopPerformingProducts(20, period),
      getCostBreakdown(period),
    ]);

    const exportData = {
      overview: overview.data,
      trends: trends.data,
      topProducts: topProducts.data,
      costs: costs.data,
      exportedAt: new Date().toISOString(),
      period,
    };

    return {
      data: exportData,
      error: null,
    };
  } catch (error) {
    console.error("❌ Export financial report error:", error);
    return {
      data: null,
      error: error.message,
    };
  }
}

// Export all functions
export default {
  getFinancialOverview,
  getMonthlyFinancialTrends,
  getTopPerformingProducts,
  getCostBreakdown,
  exportFinancialReport,
};
