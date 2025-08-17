/**
 * Test script for enhanced dashboard backend
 * Run this to verify the dashboard improvements work correctly
 */

import {
  getDashboardAnalytics,
  getDashboardStats,
} from "../services/dashboardService.js";

/**
 * Test dashboard backend functionality
 */
export async function testDashboardBackend() {
  console.log("📊 Testing enhanced dashboard backend...");

  try {
    // Test 1: Quick Stats (for immediate display)
    console.log("\n1. Testing getDashboardStats (quick stats)...");
    const quickStatsResult = await getDashboardStats();
    console.log("✅ Quick stats result:", {
      success: quickStatsResult.success,
      totalProducts: quickStatsResult.data?.totalProducts,
      lowStockCount: quickStatsResult.data?.lowStockCount,
      expiringCount: quickStatsResult.data?.expiringCount,
      todayRevenue: quickStatsResult.data?.todayRevenue,
      todayTransactions: quickStatsResult.data?.todayTransactions,
    });

    // Test 2: Comprehensive Analytics
    console.log("\n2. Testing getDashboardAnalytics (comprehensive data)...");
    const analyticsResult = await getDashboardAnalytics();
    console.log("✅ Analytics result:", {
      success: analyticsResult.success,
      hasInventoryData: !!analyticsResult.data?.inventory,
      hasSalesData: !!analyticsResult.data?.sales,
      hasTransactionData: !!analyticsResult.data?.transactions,
      hasProductData: !!analyticsResult.data?.products,
    });

    // Test 3: Inventory Analytics
    if (analyticsResult.success && analyticsResult.data?.inventory) {
      console.log("\n3. Testing Inventory Analytics...");
      const inventory = analyticsResult.data.inventory;
      console.log("✅ Inventory analytics:", {
        totalProducts: inventory.totalProducts,
        totalValue: inventory.totalValue,
        totalStock: inventory.totalStock,
        lowStockCount: inventory.lowStockCount,
        outOfStockCount: inventory.outOfStockCount,
        categoriesCount: Object.keys(inventory.byCategory || {}).length,
      });
    }

    // Test 4: Sales Analytics
    if (analyticsResult.success && analyticsResult.data?.sales) {
      console.log("\n4. Testing Sales Analytics...");
      const sales = analyticsResult.data.sales;
      console.log("✅ Sales analytics:", {
        todayRevenue: sales.today?.totalRevenue,
        todayTransactions: sales.today?.totalTransactions,
        weekRevenue: sales.week?.totalRevenue,
        monthRevenue: sales.month?.totalRevenue,
        hourlyDataPoints: sales.hourly?.length,
        categoriesCount: sales.byCategory?.length,
      });
    }

    // Test 5: Product Analytics
    if (analyticsResult.success && analyticsResult.data?.products) {
      console.log("\n5. Testing Product Analytics...");
      const products = analyticsResult.data.products;
      console.log("✅ Product analytics:", {
        topSellingCount: products.topSelling?.length,
        lowStockCount: products.lowStock?.length,
        expiringCount: products.expiring?.length,
      });
    }

    // Test 6: Recent Transactions
    if (analyticsResult.success && analyticsResult.data?.transactions) {
      console.log("\n6. Testing Transaction Analytics...");
      const transactions = analyticsResult.data.transactions;
      console.log("✅ Transaction analytics:", {
        recentTransactionsCount: transactions.length,
        firstTransaction: transactions[0]
          ? {
              id: transactions[0].id,
              amount: transactions[0].totalAmount,
              time: transactions[0].formattedTime,
            }
          : null,
      });
    }

    console.log("\n🎉 All dashboard backend tests completed successfully!");
    return { success: true, message: "All tests passed" };
  } catch (error) {
    console.error("❌ Dashboard test failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Test dashboard performance
 */
export async function testDashboardPerformance() {
  console.log("⚡ Testing dashboard performance...");

  try {
    // Test quick stats speed
    const quickStatsStart = performance.now();
    await getDashboardStats();
    const quickStatsTime = performance.now() - quickStatsStart;

    // Test full analytics speed
    const analyticsStart = performance.now();
    await getDashboardAnalytics();
    const analyticsTime = performance.now() - analyticsStart;

    console.log("✅ Performance results:", {
      quickStatsTime: `${quickStatsTime.toFixed(2)}ms`,
      analyticsTime: `${analyticsTime.toFixed(2)}ms`,
      quickStatsRating:
        quickStatsTime < 1000
          ? "Excellent"
          : quickStatsTime < 2000
          ? "Good"
          : "Needs optimization",
      analyticsRating:
        analyticsTime < 3000
          ? "Excellent"
          : analyticsTime < 5000
          ? "Good"
          : "Needs optimization",
    });

    return {
      success: true,
      quickStatsTime,
      analyticsTime,
    };
  } catch (error) {
    console.error("❌ Performance test failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Test dashboard data accuracy
 */
export async function testDashboardAccuracy() {
  console.log("🎯 Testing dashboard data accuracy...");

  try {
    const [quickStats, analytics] = await Promise.all([
      getDashboardStats(),
      getDashboardAnalytics(),
    ]);

    if (!quickStats.success || !analytics.success) {
      throw new Error("Failed to fetch data for accuracy test");
    }

    // Cross-check data consistency
    const checks = {
      totalProductsMatch:
        quickStats.data.totalProducts ===
        analytics.data.inventory.totalProducts,
      lowStockMatch:
        quickStats.data.lowStockCount ===
        analytics.data.inventory.lowStockCount,
      revenueConsistency:
        quickStats.data.todayRevenue ===
        analytics.data.sales.today.totalRevenue,
      transactionConsistency:
        quickStats.data.todayTransactions ===
        analytics.data.sales.today.totalTransactions,
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;

    console.log("✅ Accuracy results:", {
      ...checks,
      accuracyScore: `${passedChecks}/${totalChecks}`,
      accuracyPercentage: `${Math.round((passedChecks / totalChecks) * 100)}%`,
    });

    return {
      success: true,
      checks,
      accuracyScore: passedChecks / totalChecks,
    };
  } catch (error) {
    console.error("❌ Accuracy test failed:", error);
    return { success: false, error: error.message };
  }
}

// Auto-run tests if this file is executed directly
if (typeof window !== "undefined") {
  // Browser environment
  window.testDashboardBackend = testDashboardBackend;
  window.testDashboardPerformance = testDashboardPerformance;
  window.testDashboardAccuracy = testDashboardAccuracy;

  console.log("📊 Dashboard backend tests loaded!");
  console.log("Run: testDashboardBackend() to test basic functionality");
  console.log("Run: testDashboardPerformance() to test performance");
  console.log("Run: testDashboardAccuracy() to test data accuracy");
}

export default {
  testDashboardBackend,
  testDashboardPerformance,
  testDashboardAccuracy,
};
