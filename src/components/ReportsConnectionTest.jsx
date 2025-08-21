import React, { useState, useEffect } from "react";
import { supabase } from "../config/supabase.js";
import { generateInventoryReport } from "../services/reportService.js";

export default function ReportsConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState({
    supabase: "checking",
    products: "checking",
    sales: "checking",
    reports: "checking",
  });

  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    testConnections();
  }, []);

  const testConnections = async () => {
    const results = {};

    // Test 1: Basic Supabase connection
    try {
      const { error } = await supabase
        .from("products")
        .select("count", { count: "exact", head: true });

      if (error) throw error;

      results.supabase = {
        status: "success",
        message: "Connected successfully",
      };
      setConnectionStatus((prev) => ({ ...prev, supabase: "success" }));
    } catch (error) {
      results.supabase = { status: "error", message: error.message };
      setConnectionStatus((prev) => ({ ...prev, supabase: "error" }));
    }

    // Test 2: Products table access
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock, total_stock")
        .limit(5);

      if (error) throw error;

      results.products = {
        status: "success",
        message: `Found ${data?.length || 0} products`,
        data: data,
      };
      setConnectionStatus((prev) => ({ ...prev, products: "success" }));
    } catch (error) {
      results.products = { status: "error", message: error.message };
      setConnectionStatus((prev) => ({ ...prev, products: "error" }));
    }

    // Test 3: Sales table access
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(
          `
          id, 
          total, 
          created_at,
          sale_items (
            id,
            quantity,
            unit_price,
            products (name)
          )
        `
        )
        .limit(5);

      if (error) throw error;

      results.sales = {
        status: "success",
        message: `Found ${data?.length || 0} sales`,
        data: data,
      };
      setConnectionStatus((prev) => ({ ...prev, sales: "success" }));
    } catch (error) {
      results.sales = { status: "error", message: error.message };
      setConnectionStatus((prev) => ({ ...prev, sales: "error" }));
    }

    // Test 4: Report generation
    try {
      const reportData = await generateInventoryReport({
        includeLowStock: false,
        includeValuation: false,
      });

      results.reports = {
        status: "success",
        message: `Generated report with ${reportData.summary.totalProducts} products`,
        data: reportData.summary,
      };
      setConnectionStatus((prev) => ({ ...prev, reports: "success" }));
    } catch (error) {
      results.reports = { status: "error", message: error.message };
      setConnectionStatus((prev) => ({ ...prev, reports: "error" }));
    }

    setTestResults(results);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "checking":
        return "🔄";
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
      case "checking":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Reports Backend Connection Test
      </h3>

      <div className="space-y-4">
        {/* Connection Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(connectionStatus).map(([key, status]) => (
            <div key={key} className="text-center">
              <div className="text-2xl mb-1">{getStatusIcon(status)}</div>
              <div className={`text-sm font-medium ${getStatusColor(status)}`}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Results */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          {Object.entries(testResults).map(([key, result]) => (
            <div key={key} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800">
                  {key.charAt(0).toUpperCase() + key.slice(1)} Test
                </span>
                <span className={`text-sm ${getStatusColor(result.status)}`}>
                  {getStatusIcon(result.status)} {result.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{result.message}</p>

              {result.data && (
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700">
                    View data sample
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={testConnections}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Retest Connections
          </button>

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            🔄 Reload Page
          </button>
        </div>

        {/* Environment Info */}
        <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
          <p>
            <strong>Supabase URL:</strong>{" "}
            {import.meta.env.VITE_SUPABASE_URL ? "✅ Configured" : "❌ Missing"}
          </p>
          <p>
            <strong>Supabase Key:</strong>{" "}
            {import.meta.env.VITE_SUPABASE_ANON_KEY
              ? "✅ Configured"
              : "❌ Missing"}
          </p>
          <p>
            <strong>Service Role Key:</strong>{" "}
            {import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
              ? "✅ Available"
              : "❌ Not set"}
          </p>
        </div>
      </div>
    </div>
  );
}
