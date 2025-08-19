import { getProducts, getLowStockProducts } from "./productService.js";
import {
  getSales,
  getSalesSummary,
  getSalesByCategory,
  getSalesByHour,
} from "./salesService.js";

/**
 * Report Service - Handles all report generation and data aggregation
 * This service provides comprehensive reporting capabilities for the MedCure system
 */

/**
 * Generate inventory report data
 * @param {Object} options - Report options
 * @param {boolean} options.includeLowStock - Include low stock analysis
 * @param {boolean} options.includeValuation - Include inventory valuation
 * @param {number} options.lowStockThreshold - Threshold for low stock (default: 10)
 * @returns {Promise<Object>} Inventory report data
 */
export async function generateInventoryReport(options = {}) {
  try {
    const {
      includeLowStock = true,
      includeValuation = true,
      lowStockThreshold = 10,
    } = options;

    console.log("📊 Generating inventory report...");

    // Get all products
    const products = await getProducts();

    // Calculate basic inventory metrics
    const totalProducts = products.length;
    const totalStockValue = products.reduce(
      (sum, product) =>
        sum + (product.total_stock || 0) * (product.cost_price || 0),
      0
    );
    const totalRetailValue = products.reduce(
      (sum, product) =>
        sum + (product.total_stock || 0) * (product.selling_price || 0),
      0
    );

    // Group products by category
    const categoryBreakdown = products.reduce((acc, product) => {
      const category = product.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          totalStock: 0,
          totalValue: 0,
          products: [],
        };
      }
      acc[category].count += 1;
      acc[category].totalStock += product.total_stock || 0;
      acc[category].totalValue +=
        (product.total_stock || 0) * (product.selling_price || 0);
      acc[category].products.push(product);
      return acc;
    }, {});

    let reportData = {
      summary: {
        totalProducts,
        totalStockValue,
        totalRetailValue,
        potentialProfit: totalRetailValue - totalStockValue,
        profitMargin:
          totalStockValue > 0
            ? ((totalRetailValue - totalStockValue) / totalStockValue) * 100
            : 0,
        lastUpdated: new Date().toISOString(),
      },
      categoryBreakdown: Object.entries(categoryBreakdown).map(
        ([category, data]) => ({
          category,
          ...data,
        })
      ),
      products,
    };

    // Add low stock analysis if requested
    if (includeLowStock) {
      const lowStockProducts = await getLowStockProducts(lowStockThreshold);
      reportData.lowStock = {
        threshold: lowStockThreshold,
        count: lowStockProducts.length,
        products: lowStockProducts,
        criticalProducts: lowStockProducts.filter(
          (p) => (p.total_stock || 0) === 0
        ),
      };
    }

    // Add inventory valuation details if requested
    if (includeValuation) {
      reportData.valuation = {
        byCategory: Object.entries(categoryBreakdown).map(
          ([category, data]) => ({
            category,
            stockValue: data.products.reduce(
              (sum, p) => sum + (p.total_stock || 0) * (p.cost_price || 0),
              0
            ),
            retailValue: data.totalValue,
            profitPotential:
              data.totalValue -
              data.products.reduce(
                (sum, p) => sum + (p.total_stock || 0) * (p.cost_price || 0),
                0
              ),
          })
        ),
        topValueProducts: products
          .map((p) => ({
            ...p,
            stockValue: (p.total_stock || 0) * (p.selling_price || 0),
          }))
          .sort((a, b) => b.stockValue - a.stockValue)
          .slice(0, 10),
      };
    }

    console.log("✅ Inventory report generated successfully");
    return reportData;
  } catch (error) {
    console.error("❌ Error generating inventory report:", error);
    throw new Error("Failed to generate inventory report");
  }
}

/**
 * Generate sales report data
 * @param {Object} options - Report options
 * @param {string} options.startDate - Start date (ISO string)
 * @param {string} options.endDate - End date (ISO string)
 * @param {boolean} options.includeHourlyData - Include hourly breakdown
 * @param {boolean} options.includeCategoryData - Include category breakdown
 * @param {boolean} options.includeTopProducts - Include top-selling products
 * @returns {Promise<Object>} Sales report data
 */
export async function generateSalesReport(options = {}) {
  try {
    const {
      startDate,
      endDate,
      includeHourlyData = true,
      includeCategoryData = true,
      includeTopProducts = true,
    } = options;

    console.log("📊 Generating sales report...");

    // Set default date range if not provided (last 30 days)
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const filters = {
      startDate: startDate || defaultStartDate.toISOString(),
      endDate: endDate || defaultEndDate.toISOString(),
    };

    // Get sales data
    const sales = await getSales(filters);

    // Calculate basic metrics
    const totalSales = sales.length;
    const totalRevenue = sales.reduce(
      (sum, sale) => sum + (sale.total || 0),
      0
    );
    const averageTransaction = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calculate daily breakdown
    const dailyBreakdown = {};
    sales.forEach((sale) => {
      const date = new Date(sale.created_at).toDateString();
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = {
          date,
          sales: 0,
          revenue: 0,
        };
      }
      dailyBreakdown[date].sales += 1;
      dailyBreakdown[date].revenue += sale.total || 0;
    });

    let reportData = {
      summary: {
        totalSales,
        totalRevenue,
        averageTransaction,
        period: {
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
        dailyAverage:
          totalSales > 0
            ? totalRevenue / Object.keys(dailyBreakdown).length
            : 0,
        lastUpdated: new Date().toISOString(),
      },
      dailyBreakdown: Object.values(dailyBreakdown).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      ),
      sales,
    };

    // Add hourly data if requested
    if (includeHourlyData && sales.length > 0) {
      // Get hourly data for the most recent day with sales
      const latestSaleDate = new Date(
        Math.max(...sales.map((s) => new Date(s.created_at)))
      );
      const hourlyData = await getSalesByHour(latestSaleDate.toISOString());
      reportData.hourlyData = {
        date: latestSaleDate.toDateString(),
        breakdown: hourlyData,
      };
    }

    // Add category breakdown if requested
    if (includeCategoryData) {
      const categoryData = await getSalesByCategory(filters);
      reportData.categoryBreakdown = categoryData;
    }

    // Add top products if requested
    if (includeTopProducts) {
      const productSales = {};
      sales.forEach((sale) => {
        sale.sale_items?.forEach((item) => {
          const productName =
            item.products?.name || `Product ${item.product_id}`;
          if (!productSales[productName]) {
            productSales[productName] = {
              name: productName,
              category: item.products?.category || "Unknown",
              quantitySold: 0,
              revenue: 0,
            };
          }
          productSales[productName].quantitySold += item.quantity || 0;
          productSales[productName].revenue += item.subtotal || 0;
        });
      });

      reportData.topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    }

    console.log("✅ Sales report generated successfully");
    return reportData;
  } catch (error) {
    console.error("❌ Error generating sales report:", error);
    throw new Error("Failed to generate sales report");
  }
}

/**
 * Generate financial summary report
 * @param {Object} options - Report options
 * @param {string} options.period - Time period ('today', 'week', 'month', 'year')
 * @returns {Promise<Object>} Financial report data
 */
export async function generateFinancialReport(options = {}) {
  try {
    const { period = "month" } = options;

    console.log("📊 Generating financial report...");

    // Get sales summary for the period
    const salesSummary = await getSalesSummary(period);

    // Get inventory valuation
    const inventoryReport = await generateInventoryReport({
      includeValuation: true,
      includeLowStock: false,
    });

    // Calculate financial metrics
    const cashFlow = salesSummary.totalRevenue;
    const inventoryValue = inventoryReport.summary.totalStockValue;
    const potentialRevenue = inventoryReport.summary.totalRetailValue;

    const reportData = {
      period: {
        type: period,
        generated: new Date().toISOString(),
      },
      sales: {
        revenue: salesSummary.totalRevenue,
        transactions: salesSummary.totalTransactions,
        averageTransaction: salesSummary.averageTransaction,
      },
      inventory: {
        stockValue: inventoryValue,
        retailValue: potentialRevenue,
        totalProducts: inventoryReport.summary.totalProducts,
      },
      profitability: {
        grossProfit: potentialRevenue - inventoryValue,
        marginPercentage:
          inventoryValue > 0
            ? ((potentialRevenue - inventoryValue) / inventoryValue) * 100
            : 0,
        turnoverRate: inventoryValue > 0 ? cashFlow / inventoryValue : 0,
      },
      cashFlow: {
        inflow: salesSummary.totalRevenue,
        currentAssets: inventoryValue,
        liquidAssets: cashFlow, // Assuming cash sales
      },
    };

    console.log("✅ Financial report generated successfully");
    return reportData;
  } catch (error) {
    console.error("❌ Error generating financial report:", error);
    throw new Error("Failed to generate financial report");
  }
}

/**
 * Generate low stock alert report
 * @param {Object} options - Report options
 * @param {number} options.threshold - Stock threshold (default: 10)
 * @param {boolean} options.includeRecommendations - Include reorder recommendations
 * @returns {Promise<Object>} Low stock report data
 */
export async function generateLowStockReport(options = {}) {
  try {
    const { threshold = 10, includeRecommendations = true } = options;

    console.log("📊 Generating low stock report...");

    const lowStockProducts = await getLowStockProducts(threshold);

    // Categorize by urgency
    const outOfStock = lowStockProducts.filter(
      (p) => (p.total_stock || 0) === 0
    );
    const criticallyLow = lowStockProducts.filter(
      (p) => (p.total_stock || 0) > 0 && (p.total_stock || 0) <= 3
    );
    const low = lowStockProducts.filter(
      (p) => (p.total_stock || 0) > 3 && (p.total_stock || 0) <= threshold
    );

    let reportData = {
      summary: {
        totalLowStock: lowStockProducts.length,
        outOfStock: outOfStock.length,
        criticallyLow: criticallyLow.length,
        low: low.length,
        threshold,
        lastUpdated: new Date().toISOString(),
      },
      products: {
        outOfStock,
        criticallyLow,
        low,
        all: lowStockProducts,
      },
    };

    // Add reorder recommendations if requested
    if (includeRecommendations) {
      reportData.recommendations = lowStockProducts.map((product) => {
        const avgMonthlySales = 30; // This could be calculated from sales history
        const leadTime = 7; // Days
        const safetyStock = 10; // Minimum stock to maintain

        const reorderPoint = (avgMonthlySales / 30) * leadTime + safetyStock;
        const recommendedOrderQuantity = Math.max(
          reorderPoint - (product.total_stock || 0),
          safetyStock
        );

        return {
          productId: product.id,
          productName: product.name,
          currentStock: product.total_stock || 0,
          reorderPoint,
          recommendedOrderQuantity,
          urgency:
            (product.total_stock || 0) === 0
              ? "Critical"
              : (product.total_stock || 0) <= 3
              ? "High"
              : "Medium",
          estimatedCost: recommendedOrderQuantity * (product.cost_price || 0),
        };
      });
    }

    console.log("✅ Low stock report generated successfully");
    return reportData;
  } catch (error) {
    console.error("❌ Error generating low stock report:", error);
    throw new Error("Failed to generate low stock report");
  }
}

/**
 * Generate product performance report
 * @param {Object} options - Report options
 * @param {string} options.startDate - Start date (ISO string)
 * @param {string} options.endDate - End date (ISO string)
 * @param {number} options.topCount - Number of top products to include (default: 20)
 * @returns {Promise<Object>} Product performance report data
 */
export async function generateProductPerformanceReport(options = {}) {
  try {
    const { startDate, endDate, topCount = 20 } = options;

    console.log("📊 Generating product performance report...");

    // Set default date range if not provided (last 30 days)
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const filters = {
      startDate: startDate || defaultStartDate.toISOString(),
      endDate: endDate || defaultEndDate.toISOString(),
    };

    // Get sales data with product details
    const sales = await getSales(filters);
    const products = await getProducts();

    // Calculate product performance metrics
    const productMetrics = {};

    // Initialize metrics for all products
    products.forEach((product) => {
      productMetrics[product.id] = {
        id: product.id,
        name: product.name,
        category: product.category,
        currentStock: product.total_stock || 0,
        sellingPrice: product.selling_price || 0,
        costPrice: product.cost_price || 0,
        quantitySold: 0,
        revenue: 0,
        profit: 0,
        transactionCount: 0,
        averagePerTransaction: 0,
      };
    });

    // Aggregate sales data
    sales.forEach((sale) => {
      sale.sale_items?.forEach((item) => {
        const productId = item.product_id;
        if (productMetrics[productId]) {
          productMetrics[productId].quantitySold += item.quantity || 0;
          productMetrics[productId].revenue += item.subtotal || 0;
          productMetrics[productId].profit +=
            (item.subtotal || 0) -
            (item.quantity || 0) * (productMetrics[productId].costPrice || 0);
          productMetrics[productId].transactionCount += 1;
        }
      });
    });

    // Calculate averages and additional metrics
    Object.values(productMetrics).forEach((metric) => {
      if (metric.transactionCount > 0) {
        metric.averagePerTransaction =
          metric.quantitySold / metric.transactionCount;
      }
      metric.profitMargin =
        metric.revenue > 0 ? (metric.profit / metric.revenue) * 100 : 0;
      metric.turnoverRate =
        metric.currentStock > 0 ? metric.quantitySold / metric.currentStock : 0;
    });

    const allProducts = Object.values(productMetrics);

    const reportData = {
      summary: {
        totalProducts: allProducts.length,
        productsWithSales: allProducts.filter((p) => p.quantitySold > 0).length,
        totalRevenue: allProducts.reduce((sum, p) => sum + p.revenue, 0),
        totalProfit: allProducts.reduce((sum, p) => sum + p.profit, 0),
        period: filters,
        lastUpdated: new Date().toISOString(),
      },
      topPerformers: {
        byRevenue: allProducts
          .filter((p) => p.revenue > 0)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, topCount),
        byQuantity: allProducts
          .filter((p) => p.quantitySold > 0)
          .sort((a, b) => b.quantitySold - a.quantitySold)
          .slice(0, topCount),
        byProfit: allProducts
          .filter((p) => p.profit > 0)
          .sort((a, b) => b.profit - a.profit)
          .slice(0, topCount),
      },
      underPerformers: allProducts
        .filter((p) => p.quantitySold === 0 || p.turnoverRate < 0.1)
        .sort((a, b) => a.turnoverRate - b.turnoverRate)
        .slice(0, 10),
      categoryPerformance: {},
    };

    // Group performance by category
    const categoryGroups = {};
    allProducts.forEach((product) => {
      const category = product.category || "Uncategorized";
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(product);
    });

    reportData.categoryPerformance = Object.entries(categoryGroups).map(
      ([category, products]) => ({
        category,
        totalProducts: products.length,
        totalRevenue: products.reduce((sum, p) => sum + p.revenue, 0),
        totalProfit: products.reduce((sum, p) => sum + p.profit, 0),
        averageTurnover:
          products.reduce((sum, p) => sum + p.turnoverRate, 0) /
          products.length,
        topProduct: products.sort((a, b) => b.revenue - a.revenue)[0],
      })
    );

    console.log("✅ Product performance report generated successfully");
    return reportData;
  } catch (error) {
    console.error("❌ Error generating product performance report:", error);
    throw new Error("Failed to generate product performance report");
  }
}

/**
 * Generate comprehensive business dashboard report
 * @returns {Promise<Object>} Dashboard report data
 */
export async function generateDashboardReport() {
  try {
    console.log("📊 Generating dashboard report...");

    // Get multiple report types for dashboard
    const [
      todaySales,
      weeklySales,
      monthlySales,
      inventoryData,
      lowStockData,
      categoryData,
    ] = await Promise.all([
      getSalesSummary("today"),
      getSalesSummary("week"),
      getSalesSummary("month"),
      generateInventoryReport({
        includeLowStock: false,
        includeValuation: true,
      }),
      generateLowStockReport({ threshold: 10 }),
      getSalesByCategory(),
    ]);

    const reportData = {
      sales: {
        today: todaySales,
        week: weeklySales,
        month: monthlySales,
      },
      inventory: {
        totalProducts: inventoryData.summary.totalProducts,
        totalValue: inventoryData.summary.totalRetailValue,
        lowStockCount: lowStockData.summary.totalLowStock,
        outOfStockCount: lowStockData.summary.outOfStock,
      },
      alerts: {
        lowStock: lowStockData.summary.totalLowStock,
        outOfStock: lowStockData.summary.outOfStock,
        criticalStock: lowStockData.summary.criticallyLow,
      },
      categories: categoryData,
      lastUpdated: new Date().toISOString(),
    };

    console.log("✅ Dashboard report generated successfully");
    return reportData;
  } catch (error) {
    console.error("❌ Error generating dashboard report:", error);
    throw new Error("Failed to generate dashboard report");
  }
}

// Export all report functions
export default {
  generateInventoryReport,
  generateSalesReport,
  generateFinancialReport,
  generateLowStockReport,
  generateProductPerformanceReport,
  generateDashboardReport,
};
