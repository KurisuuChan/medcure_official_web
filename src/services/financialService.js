import { supabase } from "@/config/supabase";

/**
 * Financial Service
 * Handles all financial calculations and analytics from Supabase database
 */

/**
 * Get revenue data for a specific period
 * @param {string} period - 'today', 'week', 'month', 'year', or custom date range
 * @param {string} startDate - Start date for custom range (YYYY-MM-DD)
 * @param {string} endDate - End date for custom range (YYYY-MM-DD)
 */
export const getRevenueSummary = async (
  period = "month",
  startDate = null,
  endDate = null
) => {
  try {
    let dateFilter = "";
    const now = new Date();

    switch (period) {
      case "today": {
        dateFilter = `created_at >= '${now.toISOString().split("T")[0]}'`;
        break;
      }
      case "week": {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = `created_at >= '${weekAgo.toISOString()}'`;
        break;
      }
      case "month": {
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = `created_at >= '${monthAgo.toISOString()}'`;
        break;
      }
      case "year": {
        const yearAgo = new Date(now.getFullYear(), 0, 1);
        dateFilter = `created_at >= '${yearAgo.toISOString()}'`;
        break;
      }
      case "custom": {
        if (startDate && endDate) {
          dateFilter = `created_at >= '${startDate}' AND created_at <= '${endDate}'`;
        }
        break;
      }
    }

    // Get total revenue
    const { data: salesData, error: salesError } = await supabase
      .from("sales")
      .select("total, created_at")
      .order("created_at", { ascending: false });

    if (salesError) throw salesError;

    // Filter by date if needed
    let filteredSales = salesData;
    if (dateFilter) {
      const { data: filteredData, error: filterError } = await supabase
        .from("sales")
        .select("total, created_at")
        .filter("created_at", "gte", getFilterDate(period, startDate))
        .order("created_at", { ascending: false });

      if (filterError) throw filterError;
      filteredSales = filteredData;
    }

    const totalRevenue = filteredSales.reduce(
      (sum, sale) => sum + (sale.total || 0),
      0
    );
    const salesCount = filteredSales.length;
    const averageOrderValue = salesCount > 0 ? totalRevenue / salesCount : 0;

    return {
      totalRevenue,
      salesCount,
      averageOrderValue,
      period,
      salesData: filteredSales,
    };
  } catch (error) {
    console.error("Error fetching revenue summary:", error);
    throw error;
  }
};

/**
 * Get cost analysis and profit calculations
 */
export const getCostAnalysis = async (
  period = "month",
  startDate = null,
  endDate = null
) => {
  try {
    // Get all sale items with product cost information
    const { data: saleItemsData, error: saleItemsError } = await supabase.from(
      "sale_items"
    ).select(`
        quantity,
        unit_price,
        subtotal,
        sales!inner(created_at),
        products!inner(cost_price, price)
      `);

    if (saleItemsError) throw saleItemsError;

    // Filter by date period
    const filteredItems = filterByPeriod(
      saleItemsData,
      period,
      startDate,
      endDate
    );

    let totalCosts = 0;
    let totalRevenue = 0;

    filteredItems.forEach((item) => {
      const costPrice = item.products.cost_price || 0;
      const itemCost = costPrice * item.quantity;
      totalCosts += itemCost;
      totalRevenue += item.subtotal || 0;
    });

    const grossProfit = totalRevenue - totalCosts;
    const profitMargin =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCosts,
      grossProfit,
      profitMargin,
      period,
    };
  } catch (error) {
    console.error("Error fetching cost analysis:", error);
    throw error;
  }
};

/**
 * Get top selling products with profit analysis
 */
export const getTopSellingProducts = async (limit = 10, period = "month") => {
  try {
    const { data: saleItemsData, error } = await supabase.from("sale_items")
      .select(`
        product_id,
        quantity,
        unit_price,
        subtotal,
        sales!inner(created_at),
        products!inner(name, cost_price, price, category)
      `);

    if (error) throw error;

    // Filter by period
    const filteredItems = filterByPeriod(saleItemsData, period);

    // Group by product and calculate metrics
    const productMetrics = {};

    filteredItems.forEach((item) => {
      const productId = item.product_id;
      const product = item.products;

      if (!productMetrics[productId]) {
        productMetrics[productId] = {
          id: productId,
          name: product.name,
          category: product.category,
          unitPrice: product.price,
          costPrice: product.cost_price || 0,
          totalQuantity: 0,
          totalRevenue: 0,
          totalCost: 0,
        };
      }

      productMetrics[productId].totalQuantity += item.quantity;
      productMetrics[productId].totalRevenue += item.subtotal || 0;
      productMetrics[productId].totalCost +=
        (product.cost_price || 0) * item.quantity;
    });

    // Calculate profit for each product and sort
    const topProducts = Object.values(productMetrics)
      .map((product) => ({
        ...product,
        profit: product.totalRevenue - product.totalCost,
        profitMargin:
          product.totalRevenue > 0
            ? ((product.totalRevenue - product.totalCost) /
                product.totalRevenue) *
              100
            : 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return topProducts;
  } catch (error) {
    console.error("Error fetching top selling products:", error);
    throw error;
  }
};

/**
 * Get monthly revenue and profit trends for charts
 */
export const getMonthlyTrends = async (months = 12) => {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data: salesData, error: salesError } = await supabase
      .from("sales")
      .select("total, created_at")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (salesError) throw salesError;

    const { data: saleItemsData, error: itemsError } = await supabase
      .from("sale_items")
      .select(
        `
        quantity,
        subtotal,
        sales!inner(created_at),
        products!inner(cost_price)
      `
      )
      .gte("sales.created_at", startDate.toISOString());

    if (itemsError) throw itemsError;

    // Group by month
    const monthlyData = {};

    // Initialize months
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      monthlyData[monthKey] = {
        month: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        revenue: 0,
        costs: 0,
        profit: 0,
        salesCount: 0,
      };
    }

    // Add revenue data
    salesData.forEach((sale) => {
      const date = new Date(sale.created_at);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (monthlyData[monthKey]) {
        monthlyData[monthKey].revenue += sale.total || 0;
        monthlyData[monthKey].salesCount += 1;
      }
    });

    // Add cost data
    saleItemsData.forEach((item) => {
      const date = new Date(item.sales.created_at);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (monthlyData[monthKey]) {
        const itemCost = (item.products.cost_price || 0) * item.quantity;
        monthlyData[monthKey].costs += itemCost;
      }
    });

    // Calculate profit
    Object.values(monthlyData).forEach((month) => {
      month.profit = month.revenue - month.costs;
    });

    return Object.values(monthlyData).sort(
      (a, b) => new Date(a.month) - new Date(b.month)
    );
  } catch (error) {
    console.error("Error fetching monthly trends:", error);
    throw error;
  }
};

/**
 * Get payment method breakdown
 */
export const getPaymentMethodBreakdown = async (period = "month") => {
  try {
    const dateFilter = getFilterDate(period);

    const { data: salesData, error } = await supabase
      .from("sales")
      .select("payment_method, total")
      .gte("created_at", dateFilter)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const breakdown = {};
    let totalAmount = 0;

    salesData.forEach((sale) => {
      const method = sale.payment_method || "Unknown";
      const amount = sale.total || 0;

      if (!breakdown[method]) {
        breakdown[method] = {
          method,
          amount: 0,
          count: 0,
          percentage: 0,
        };
      }

      breakdown[method].amount += amount;
      breakdown[method].count += 1;
      totalAmount += amount;
    });

    // Calculate percentages
    Object.values(breakdown).forEach((item) => {
      item.percentage = totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0;
    });

    return {
      breakdown: Object.values(breakdown),
      totalAmount,
      totalTransactions: salesData.length,
    };
  } catch (error) {
    console.error("Error fetching payment method breakdown:", error);
    throw error;
  }
};

/**
 * Get category performance analysis
 */
export const getCategoryPerformance = async (period = "month") => {
  try {
    const { data: saleItemsData, error } = await supabase.from("sale_items")
      .select(`
        quantity,
        subtotal,
        sales!inner(created_at),
        products!inner(category, cost_price)
      `);

    if (error) throw error;

    const filteredItems = filterByPeriod(saleItemsData, period);
    const categoryData = {};

    filteredItems.forEach((item) => {
      const category = item.products.category || "Uncategorized";
      const revenue = item.subtotal || 0;
      const cost = (item.products.cost_price || 0) * item.quantity;

      if (!categoryData[category]) {
        categoryData[category] = {
          category,
          revenue: 0,
          cost: 0,
          profit: 0,
          quantity: 0,
          profitMargin: 0,
        };
      }

      categoryData[category].revenue += revenue;
      categoryData[category].cost += cost;
      categoryData[category].quantity += item.quantity;
    });

    // Calculate profit and margin
    const categories = Object.values(categoryData).map((cat) => ({
      ...cat,
      profit: cat.revenue - cat.cost,
      profitMargin:
        cat.revenue > 0 ? ((cat.revenue - cat.cost) / cat.revenue) * 100 : 0,
    }));

    return categories.sort((a, b) => b.revenue - a.revenue);
  } catch (error) {
    console.error("Error fetching category performance:", error);
    throw error;
  }
};

/**
 * Get comprehensive financial dashboard data
 */
export const getFinancialDashboard = async (period = "month") => {
  try {
    const [
      revenueSummary,
      costAnalysis,
      topProducts,
      monthlyTrends,
      paymentBreakdown,
      categoryPerformance,
    ] = await Promise.all([
      getRevenueSummary(period),
      getCostAnalysis(period),
      getTopSellingProducts(5, period),
      getMonthlyTrends(6),
      getPaymentMethodBreakdown(period),
      getCategoryPerformance(period),
    ]);

    return {
      revenueSummary,
      costAnalysis,
      topProducts,
      monthlyTrends,
      paymentBreakdown,
      categoryPerformance,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching financial dashboard:", error);
    throw error;
  }
};

// Helper functions

/**
 * Get filter date based on period
 */
const getFilterDate = (period, customStart = null) => {
  const now = new Date();

  switch (period) {
    case "today": {
      return now.toISOString().split("T")[0];
    }
    case "week": {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return weekAgo.toISOString();
    }
    case "month": {
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
      return monthAgo.toISOString();
    }
    case "year": {
      const yearAgo = new Date(now.getFullYear(), 0, 1);
      return yearAgo.toISOString();
    }
    case "custom": {
      return customStart || now.toISOString();
    }
    default: {
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
  }
};

/**
 * Filter data by period
 */
const filterByPeriod = (data, period, startDate = null, endDate = null) => {
  if (period === "all") return data;

  const filterDate = getFilterDate(period, startDate);
  const endFilterDate = endDate ? new Date(endDate) : new Date();

  return data.filter((item) => {
    const itemDate = new Date(item.sales.created_at);
    return itemDate >= new Date(filterDate) && itemDate <= endFilterDate;
  });
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format percentage for display
 */
export const formatPercentage = (value, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};
