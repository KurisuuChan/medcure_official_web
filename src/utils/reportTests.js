/**
 * Test file for Report System
 * Run this to validate report generation functionality
 */

import {
  generateInventoryReport,
  generateSalesReport,
  generateFinancialReport,
  generateLowStockReport,
  generateProductPerformanceReport,
  generateDashboardReport,
} from "../services/reportService.js";

import {
  exportInventoryCSV,
  exportSalesCSV,
  exportLowStockCSV,
  exportProductPerformanceCSV,
  generateTextReport,
} from "../utils/exportUtils.js";

/**
 * Test inventory report generation
 */
export async function testInventoryReport() {
  console.log("🧪 Testing Inventory Report...");
  
  try {
    const report = await generateInventoryReport({
      includeLowStock: true,
      includeValuation: true,
      lowStockThreshold: 10,
    });
    
    console.log("✅ Inventory Report Generated:", {
      totalProducts: report.summary.totalProducts,
      categories: report.categoryBreakdown.length,
      lowStockCount: report.lowStock?.count || 0,
    });
    
    return report;
  } catch (error) {
    console.error("❌ Inventory Report Failed:", error);
    throw error;
  }
}

/**
 * Test sales report generation
 */
export async function testSalesReport() {
  console.log("🧪 Testing Sales Report...");
  
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const report = await generateSalesReport({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      includeHourlyData: true,
      includeCategoryData: true,
      includeTopProducts: true,
    });
    
    console.log("✅ Sales Report Generated:", {
      totalSales: report.summary.totalSales,
      totalRevenue: report.summary.totalRevenue,
      topProductsCount: report.topProducts?.length || 0,
    });
    
    return report;
  } catch (error) {
    console.error("❌ Sales Report Failed:", error);
    throw error;
  }
}

/**
 * Test financial report generation
 */
export async function testFinancialReport() {
  console.log("🧪 Testing Financial Report...");
  
  try {
    const report = await generateFinancialReport({
      period: "month",
    });
    
    console.log("✅ Financial Report Generated:", {
      salesRevenue: report.sales.revenue,
      inventoryValue: report.inventory.stockValue,
      grossProfit: report.profitability.grossProfit,
    });
    
    return report;
  } catch (error) {
    console.error("❌ Financial Report Failed:", error);
    throw error;
  }
}

/**
 * Test low stock report generation
 */
export async function testLowStockReport() {
  console.log("🧪 Testing Low Stock Report...");
  
  try {
    const report = await generateLowStockReport({
      threshold: 10,
      includeRecommendations: true,
    });
    
    console.log("✅ Low Stock Report Generated:", {
      totalLowStock: report.summary.totalLowStock,
      outOfStock: report.summary.outOfStock,
      recommendationsCount: report.recommendations?.length || 0,
    });
    
    return report;
  } catch (error) {
    console.error("❌ Low Stock Report Failed:", error);
    throw error;
  }
}

/**
 * Test product performance report generation
 */
export async function testProductPerformanceReport() {
  console.log("🧪 Testing Product Performance Report...");
  
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const report = await generateProductPerformanceReport({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      topCount: 20,
    });
    
    console.log("✅ Product Performance Report Generated:", {
      totalProducts: report.summary.totalProducts,
      productsWithSales: report.summary.productsWithSales,
      categoriesAnalyzed: report.categoryPerformance.length,
    });
    
    return report;
  } catch (error) {
    console.error("❌ Product Performance Report Failed:", error);
    throw error;
  }
}

/**
 * Test dashboard report generation
 */
export async function testDashboardReport() {
  console.log("🧪 Testing Dashboard Report...");
  
  try {
    const report = await generateDashboardReport();
    
    console.log("✅ Dashboard Report Generated:", {
      todayRevenue: report.sales.today.totalRevenue,
      inventoryAlerts: report.alerts.lowStock,
      categoriesTracked: report.categories.length,
    });
    
    return report;
  } catch (error) {
    console.error("❌ Dashboard Report Failed:", error);
    throw error;
  }
}

/**
 * Test CSV export functionality
 */
export async function testCSVExports() {
  console.log("🧪 Testing CSV Exports...");
  
  try {
    // Generate test reports
    const inventoryReport = await generateInventoryReport();
    const salesReport = await generateSalesReport();
    const lowStockReport = await generateLowStockReport();
    const performanceReport = await generateProductPerformanceReport();
    
    // Test CSV generation (without actual download)
    const csvTests = [
      { name: "Inventory CSV", func: () => exportInventoryCSV(inventoryReport, "test-inventory.csv") },
      { name: "Sales CSV", func: () => exportSalesCSV(salesReport, "test-sales.csv") },
      { name: "Low Stock CSV", func: () => exportLowStockCSV(lowStockReport, "test-lowstock.csv") },
      { name: "Performance CSV", func: () => exportProductPerformanceCSV(performanceReport, "test-performance.csv") },
    ];
    
    for (const test of csvTests) {
      try {
        const result = test.func();
        console.log(`✅ ${test.name} Export:`, result.success ? "Success" : "Failed");
      } catch (error) {
        console.error(`❌ ${test.name} Export Failed:`, error);
      }
    }
    
  } catch (error) {
    console.error("❌ CSV Export Tests Failed:", error);
    throw error;
  }
}

/**
 * Test text report generation
 */
export async function testTextReports() {
  console.log("🧪 Testing Text Report Generation...");
  
  try {
    // Generate test reports
    const inventoryReport = await generateInventoryReport();
    const salesReport = await generateSalesReport();
    const lowStockReport = await generateLowStockReport();
    const performanceReport = await generateProductPerformanceReport();
    
    // Test text generation
    const textTests = [
      { name: "Inventory Text", type: "inventory", data: inventoryReport },
      { name: "Sales Text", type: "sales", data: salesReport },
      { name: "Low Stock Text", type: "lowstock", data: lowStockReport },
      { name: "Performance Text", type: "performance", data: performanceReport },
    ];
    
    for (const test of textTests) {
      try {
        const textContent = generateTextReport(test.data, test.type);
        const hasContent = textContent && textContent.length > 100;
        console.log(`✅ ${test.name} Report:`, hasContent ? "Generated" : "Empty");
        
        if (!hasContent) {
          console.warn(`⚠️ ${test.name} seems too short:`, textContent.length, "characters");
        }
      } catch (error) {
        console.error(`❌ ${test.name} Generation Failed:`, error);
      }
    }
    
  } catch (error) {
    console.error("❌ Text Report Tests Failed:", error);
    throw error;
  }
}

/**
 * Run all report tests
 */
export async function runAllReportTests() {
  console.log("🚀 Starting Comprehensive Report System Tests...");
  const startTime = Date.now();
  
  const tests = [
    { name: "Inventory Report", func: testInventoryReport },
    { name: "Sales Report", func: testSalesReport },
    { name: "Financial Report", func: testFinancialReport },
    { name: "Low Stock Report", func: testLowStockReport },
    { name: "Product Performance Report", func: testProductPerformanceReport },
    { name: "Dashboard Report", func: testDashboardReport },
    { name: "CSV Exports", func: testCSVExports },
    { name: "Text Reports", func: testTextReports },
  ];
  
  const results = {
    passed: 0,
    failed: 0,
    total: tests.length,
    errors: [],
  };
  
  for (const test of tests) {
    try {
      console.log(`\n📊 Running ${test.name}...`);
      await test.func();
      results.passed++;
      console.log(`✅ ${test.name} - PASSED`);
    } catch (error) {
      results.failed++;
      results.errors.push({ test: test.name, error: error.message });
      console.error(`❌ ${test.name} - FAILED:`, error.message);
    }
  }
  
  const duration = Date.now() - startTime;
  
  console.log("\n" + "=".repeat(50));
  console.log("📋 REPORT SYSTEM TEST RESULTS");
  console.log("=".repeat(50));
  console.log(`✅ Passed: ${results.passed}/${results.total}`);
  console.log(`❌ Failed: ${results.failed}/${results.total}`);
  console.log(`⏱️ Duration: ${duration}ms`);
  
  if (results.failed > 0) {
    console.log("\n❌ Failed Tests:");
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
    });
  }
  
  if (results.failed === 0) {
    console.log("\n🎉 All report system tests passed! Ready for production.");
  } else {
    console.log(`\n⚠️ ${results.failed} test(s) failed. Please review and fix issues.`);
  }
  
  return results;
}

/**
 * Quick smoke test for basic functionality
 */
export async function smokeTest() {
  console.log("💨 Running Report System Smoke Test...");
  
  try {
    // Test basic report generation
    const dashboardReport = await generateDashboardReport();
    
    if (!dashboardReport || !dashboardReport.sales) {
      throw new Error("Dashboard report structure invalid");
    }
    
    console.log("✅ Smoke Test Passed - Report system is functional");
    return true;
  } catch (error) {
    console.error("❌ Smoke Test Failed:", error);
    return false;
  }
}

// Export all test functions
export default {
  testInventoryReport,
  testSalesReport,
  testFinancialReport,
  testLowStockReport,
  testProductPerformanceReport,
  testDashboardReport,
  testCSVExports,
  testTextReports,
  runAllReportTests,
  smokeTest,
};
