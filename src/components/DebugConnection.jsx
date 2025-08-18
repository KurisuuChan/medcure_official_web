import React, { useState, useEffect } from "react";
import { supabase } from "../config/supabase.js";

export default function DebugConnection() {
  const [connectionStatus, setConnectionStatus] = useState("Testing...");
  const [products, setProducts] = useState([]);
  const [columns, setColumns] = useState([]);
  const [error, setError] = useState(null);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    const runTests = async () => {
      testConnection();
    };
    runTests();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addTestResult = (test, status, message) => {
    setTestResults((prev) => [
      ...prev,
      { test, status, message, timestamp: new Date().toLocaleTimeString() },
    ]);
  };

  const testConnection = async () => {
    setTestResults([]);
    setError(null);

    try {
      // Test 1: Basic connection
      addTestResult("Connection", "testing", "Testing basic connection...");
      console.log("Testing Supabase connection...");
      console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
      console.log(
        "Supabase Key length:",
        import.meta.env.VITE_SUPABASE_ANON_KEY?.length
      );

      // Test 2: Fetch products
      addTestResult("Fetch", "testing", "Fetching products...");
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .limit(5);

      if (error) {
        console.error("Supabase error:", error);
        addTestResult("Fetch", "error", `Failed: ${error.message}`);
        setError(error.message);
        setConnectionStatus("Failed");
      } else {
        console.log("Products fetched:", data);
        addTestResult(
          "Fetch",
          "success",
          `Found ${data?.length || 0} products`
        );
        setProducts(data || []);
        setConnectionStatus("Connected");

        // Test 3: Check columns if we have data
        if (data && data.length > 0) {
          const sampleProduct = data[0];
          const columnList = Object.keys(sampleProduct);
          setColumns(columnList);
          addTestResult(
            "Columns",
            "success",
            `Found ${columnList.length} columns: ${columnList.join(", ")}`
          );
        } else {
          addTestResult(
            "Columns",
            "warning",
            "No products found to check columns"
          );
        }
      }

      // Test 4: Test insert with minimal data
      addTestResult(
        "Insert Test",
        "testing",
        "Testing insert with minimal data..."
      );
      await testMinimalInsert();
    } catch (err) {
      console.error("Connection error:", err);
      addTestResult("Connection", "error", `Connection failed: ${err.message}`);
      setError(err.message);
      setConnectionStatus("Failed");
    }
  };

  const testMinimalInsert = async () => {
    try {
      // Try inserting with required fields based on the columns we found
      const testProduct = {
        name: `Test Product ${Date.now()}`,
        category: "Test Category", // Required field
        price: 15.0, // This is the required price column, not selling_price
      };

      const { data, error } = await supabase
        .from("products")
        .insert([testProduct])
        .select()
        .single();

      if (error) {
        addTestResult(
          "Insert Test",
          "error",
          `Insert failed: ${error.message}`
        );

        // Try with more complete data if basic insert fails
        if (error.message.includes("violates not-null constraint")) {
          addTestResult(
            "Insert Test",
            "info",
            "Trying with more complete data..."
          );
          await testCompleteInsert();
        } else if (error.message.includes("not found")) {
          addTestResult(
            "Insert Test",
            "info",
            "Trying alternative column names..."
          );
          await testAlternativeInsert();
        }
      } else {
        addTestResult(
          "Insert Test",
          "success",
          `Insert successful! ID: ${data.id}`
        );
        console.log("Inserted product:", data);

        // Clean up - delete the test product
        await supabase.from("products").delete().eq("id", data.id);
        addTestResult("Cleanup", "success", "Test product cleaned up");
      }
    } catch (err) {
      addTestResult("Insert Test", "error", `Insert error: ${err.message}`);
    }
  };

  const testCompleteInsert = async () => {
    try {
      const completeTestProduct = {
        name: `Complete Test ${Date.now()}`,
        category: "Medicine", // Required field
        price: 15.0, // Required price column
        cost_price: 10.0,
        selling_price: 15.0, // Additional price column
        stock: 100, // Using stock instead of total_stock
        generic_name: "Test Generic",
        brand_name: "Test Brand",
        supplier: "Test Supplier",
        description: "Test Description",
        critical_level: 10,
        pieces_per_sheet: 1,
        sheets_per_box: 1,
        batch_number: "TEST001",
      };

      const { data, error } = await supabase
        .from("products")
        .insert([completeTestProduct])
        .select()
        .single();

      if (error) {
        addTestResult(
          "Complete Insert",
          "error",
          `Complete insert failed: ${error.message}`
        );
      } else {
        addTestResult(
          "Complete Insert",
          "success",
          `Complete insert successful! ID: ${data.id}`
        );
        // Clean up
        await supabase.from("products").delete().eq("id", data.id);
        addTestResult("Cleanup", "success", "Complete test product cleaned up");
      }
    } catch (err) {
      addTestResult(
        "Complete Insert",
        "error",
        `Complete insert error: ${err.message}`
      );
    }
  };

  const testAlternativeInsert = async () => {
    const alternatives = [
      { product_name: "Test Product Alt 1" },
      { title: "Test Product Alt 2" },
      { name: "Test Product Alt 3", price: 10 },
      { name: "Test Product Alt 4", cost: 10, price: 15 },
    ];

    for (let i = 0; i < alternatives.length; i++) {
      try {
        const { data, error } = await supabase
          .from("products")
          .insert([alternatives[i]])
          .select()
          .single();

        if (!error) {
          addTestResult(
            "Alternative Insert",
            "success",
            `Success with schema: ${JSON.stringify(alternatives[i])}`
          );
          // Clean up
          await supabase.from("products").delete().eq("id", data.id);
          return;
        } else {
          addTestResult(
            "Alternative Insert",
            "warning",
            `Failed ${i + 1}: ${error.message}`
          );
        }
      } catch (err) {
        addTestResult(
          "Alternative Insert",
          "warning",
          `Error ${i + 1}: ${err.message}`
        );
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      case "testing":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg mb-4 max-w-4xl">
      <h3 className="font-bold mb-2">🔧 Supabase Connection Debug</h3>

      <div className="mb-4">
        <p>
          Overall Status:{" "}
          <span
            className={
              connectionStatus === "Connected"
                ? "text-green-600"
                : connectionStatus === "Failed"
                ? "text-red-600"
                : "text-yellow-600"
            }
          >
            {connectionStatus}
          </span>
        </p>
      </div>

      {/* Test Results */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Test Results:</h4>
        <div className="space-y-1 max-h-40 overflow-y-auto bg-white p-3 rounded border">
          {testResults.map((result, idx) => (
            <div key={idx} className="text-sm">
              <span className="text-gray-500">[{result.timestamp}]</span>{" "}
              <span className="font-medium">{result.test}:</span>{" "}
              <span className={getStatusColor(result.status)}>
                {result.message}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Columns Found */}
      {columns.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Database Columns Found:</h4>
          <div className="bg-white p-3 rounded border">
            <div className="grid grid-cols-3 gap-2 text-sm">
              {columns.map((col, idx) => (
                <span
                  key={idx}
                  className="font-mono bg-gray-100 px-2 py-1 rounded"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Details */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded">
          <h4 className="font-semibold text-red-700">Error Details:</h4>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Sample Products */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">
          Sample Products ({products.length}):
        </h4>
        {products.length > 0 ? (
          <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto">
            {products.map((product, index) => (
              <div key={product.id || index} className="text-sm border-b py-1">
                <strong>
                  {product.name || product.product_name || "Unnamed"}
                </strong>
                {product.category && ` - ${product.category}`}
                {(product.stock || product.total_stock) &&
                  ` - Stock: ${product.stock || product.total_stock}`}
                {(product.price || product.selling_price) &&
                  ` - Price: ${product.price || product.selling_price}`}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No products found</p>
        )}
      </div>

      <button
        onClick={testConnection}
        className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
      >
        🔄 Run All Tests Again
      </button>
    </div>
  );
}
