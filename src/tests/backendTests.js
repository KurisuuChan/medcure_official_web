/**
 * Backend Functionality Test
 * This file contains tests to verify all backend services are working
 */

import {
  getProducts,
  getInventorySummary,
  getCategories,
} from "./services/productService.js";

import {
  getSalesTransactions,
  getSalesSummary,
} from "./services/salesService.js";

import { parseCSV, formatCurrency } from "./utils/csvUtils.js";

/**
 * Test Product Service
 */
export async function testProductService() {
  console.log("🧪 Testing Product Service...");

  try {
    // Test getting products
    const { data: products, error: getError } = await getProducts();
    if (getError) throw new Error(`Get products failed: ${getError}`);
    console.log("✅ Get products:", products?.length || 0, "products found");

    // Test getting categories
    const { data: categories, error: catError } = await getCategories();
    if (catError) throw new Error(`Get categories failed: ${catError}`);
    console.log(
      "✅ Get categories:",
      categories?.length || 0,
      "categories found"
    );

    // Test inventory summary
    const { data: summary, error: summaryError } = await getInventorySummary();
    if (summaryError)
      throw new Error(`Get inventory summary failed: ${summaryError}`);
    console.log("✅ Inventory summary:", summary);

    return true;
  } catch (error) {
    console.error("❌ Product Service test failed:", error.message);
    return false;
  }
}

/**
 * Test Sales Service
 */
export async function testSalesService() {
  console.log("🧪 Testing Sales Service...");

  try {
    // Test getting sales transactions
    const { data: transactions, error: getError } = await getSalesTransactions({
      limit: 5,
    });
    if (getError) throw new Error(`Get transactions failed: ${getError}`);
    console.log(
      "✅ Get transactions:",
      transactions?.length || 0,
      "transactions found"
    );

    // Test sales summary
    const { data: summary, error: summaryError } = await getSalesSummary(
      "today"
    );
    if (summaryError)
      throw new Error(`Get sales summary failed: ${summaryError}`);
    console.log("✅ Sales summary:", summary);

    return true;
  } catch (error) {
    console.error("❌ Sales Service test failed:", error.message);
    return false;
  }
}

/**
 * Test CSV Utilities
 */
export async function testCSVUtils() {
  console.log("🧪 Testing CSV Utilities...");

  try {
    // Test CSV parsing
    const testCSV = `name,category,cost_price,selling_price,total_stock
"Test Product","Test Category",10.50,15.00,100`;

    const { data: parsedData, error: parseError } = parseCSV(testCSV);
    if (parseError) throw new Error(`CSV parsing failed: ${parseError}`);
    console.log("✅ CSV parsing:", parsedData?.length || 0, "rows parsed");

    // Test currency formatting
    const formatted = formatCurrency(1234.56);
    console.log("✅ Currency formatting:", formatted);

    return true;
  } catch (error) {
    console.error("❌ CSV Utilities test failed:", error.message);
    return false;
  }
}

/**
 * Test Database Connection
 */
export async function testDatabaseConnection() {
  console.log("🧪 Testing Database Connection...");

  try {
    const { error } = await getProducts({ limit: 1 });
    if (error) throw new Error(`Database connection failed: ${error}`);
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection test failed:", error.message);
    return false;
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log("🚀 Starting Backend Functionality Tests...");
  console.log("=".repeat(50));

  const tests = [
    { name: "Database Connection", test: testDatabaseConnection },
    { name: "Product Service", test: testProductService },
    { name: "Sales Service", test: testSalesService },
    { name: "CSV Utilities", test: testCSVUtils },
  ];

  const results = [];

  for (const { name, test } of tests) {
    console.log(`\n📋 Testing ${name}...`);
    const result = await test();
    results.push({ name, passed: result });
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 Test Results Summary:");
  console.log("=".repeat(50));

  results.forEach(({ name, passed }) => {
    console.log(
      `${passed ? "✅" : "❌"} ${name}: ${passed ? "PASSED" : "FAILED"}`
    );
  });

  const passedTests = results.filter((r) => r.passed).length;
  const totalTests = results.length;

  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log(
      "🎉 All backend functionality tests PASSED! Backend is fully functional."
    );
  } else {
    console.log("⚠️  Some tests failed. Please check the errors above.");
  }

  return passedTests === totalTests;
}

// Auto-run tests if this file is imported in development
if (import.meta.env.DEV) {
  // Uncomment the line below to auto-run tests
  // runAllTests();
}
