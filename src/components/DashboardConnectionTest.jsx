import React, { useState, useEffect } from "react";
import { useDashboardData } from "../hooks/useDashboardData.js";
import {
  getSalesSummary,
  getRecentSales,
  getBestSellers,
} from "../services/salesService.js";
import {
  getProducts,
  getLowStockProducts,
  getProductCount,
  getExpiringSoonProducts,
} from "../services/productService.js";

export default function DashboardConnectionTest() {
  const [manualTests, setManualTests] = useState({});
  const { data: dashboardData, isLoading, error } = useDashboardData();

  useEffect(() => {
    runManualTests();
  }, []);

  const runManualTests = async () => {
    const results = {};

    console.log("🧪 Testing Dashboard Backend Components...");

    // Test 1: Product Count
    try {
      const productCount = await getProductCount();
      results.productCount = {
        status: "success",
        data: productCount,
        message: `Found ${productCount} products`,
      };
      console.log("✅ Product count:", productCount);
    } catch (error) {
      results.productCount = {
        status: "error",
        message: error.message,
      };
      console.log("❌ Product count error:", error.message);
    }

    // Test 2: Products List
    try {
      const products = await getProducts();
      results.products = {
        status: "success",
        data: products?.slice(0, 3),
        message: `Retrieved ${products?.length || 0} products`,
      };
      console.log("✅ Products retrieved:", products?.length || 0);
    } catch (error) {
      results.products = {
        status: "error",
        message: error.message,
      };
      console.log("❌ Products error:", error.message);
    }

    // Test 3: Low Stock Products
    try {
      const lowStock = await getLowStockProducts(10);
      results.lowStock = {
        status: "success",
        data: lowStock?.slice(0, 3),
        message: `Found ${lowStock?.length || 0} low stock items`,
      };
      console.log("✅ Low stock items:", lowStock?.length || 0);
    } catch (error) {
      results.lowStock = {
        status: "error",
        message: error.message,
      };
      console.log("❌ Low stock error:", error.message);
    }

    // Test 4: Expiring Soon Products
    try {
      const expiring = await getExpiringSoonProducts(30);
      results.expiring = {
        status: "success",
        data: expiring?.slice(0, 3),
        message: `Found ${expiring?.length || 0} expiring items`,
      };
      console.log("✅ Expiring products:", expiring?.length || 0);
    } catch (error) {
      results.expiring = {
        status: "error",
        message: error.message,
      };
      console.log("❌ Expiring products error:", error.message);
    }

    // Test 5: Sales Summary
    try {
      const todaySales = await getSalesSummary("today");
      results.salesSummary = {
        status: "success",
        data: todaySales,
        message: `Today: ₱${todaySales?.totalRevenue || 0} from ${
          todaySales?.totalTransactions || 0
        } transactions`,
      };
      console.log("✅ Sales summary:", todaySales);
    } catch (error) {
      results.salesSummary = {
        status: "error",
        message: error.message,
      };
      console.log("❌ Sales summary error:", error.message);
    }

    // Test 6: Recent Sales
    try {
      const recentSales = await getRecentSales(5);
      results.recentSales = {
        status: "success",
        data: recentSales?.slice(0, 3),
        message: `Found ${recentSales?.length || 0} recent sales`,
      };
      console.log("✅ Recent sales:", recentSales?.length || 0);
    } catch (error) {
      results.recentSales = {
        status: "error",
        message: error.message,
      };
      console.log("❌ Recent sales error:", error.message);
    }

    // Test 7: Best Sellers
    try {
      const bestSellers = await getBestSellers(5);
      results.bestSellers = {
        status: "success",
        data: bestSellers?.slice(0, 3),
        message: `Found ${bestSellers?.length || 0} best sellers`,
      };
      console.log("✅ Best sellers:", bestSellers?.length || 0);
    } catch (error) {
      results.bestSellers = {
        status: "error",
        message: error.message,
      };
      console.log("❌ Best sellers error:", error.message);
    }

    setManualTests(results);
    console.log("🎯 Manual tests completed!");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      default:
        return "⏸️";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Hook Data Test */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Dashboard Hook Test
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Hook Status:</span>
            <span
              className={`text-sm ${
                isLoading
                  ? "text-blue-600"
                  : error
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {isLoading ? "🔄 Loading..." : error ? "❌ Error" : "✅ Success"}
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">Error: {error}</p>
            </div>
          )}

          {dashboardData && !isLoading && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Summary Cards:</strong>{" "}
                  {dashboardData.summaryCards?.length || 0}
                </div>
                <div>
                  <strong>Recent Sales:</strong>{" "}
                  {dashboardData.recentSales?.length || 0}
                </div>
                <div>
                  <strong>Best Sellers:</strong>{" "}
                  {dashboardData.bestSellers?.length || 0}
                </div>
                <div>
                  <strong>Low Stock:</strong>{" "}
                  {dashboardData.lowStockItems?.length || 0}
                </div>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                  View Full Dashboard Data
                </summary>
                <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto max-h-60">
                  {JSON.stringify(dashboardData, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>

      {/* Individual Service Tests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Individual Service Tests
        </h3>

        <div className="space-y-3">
          {Object.entries(manualTests).map(([key, result]) => (
            <div key={key} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">
                  {key.charAt(0).toUpperCase() + key.slice(1)} Service
                </span>
                <span className={`text-sm ${getStatusColor(result.status)}`}>
                  {getStatusIcon(result.status)} {result.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{result.message}</p>

              {result.data && (
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700">
                    View sample data
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200 mt-4">
          <button
            onClick={runManualTests}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Retest Services
          </button>
        </div>
      </div>
    </div>
  );
}
