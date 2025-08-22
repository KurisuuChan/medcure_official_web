import React, { useState } from "react";
import { supabase } from "../config/supabase.js";
import { Database, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

export default function ArchiveConnectionTest() {
  const [testResults, setTestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const createTestArchivedProduct = async () => {
    try {
      // First, let's see if there are any products to archive
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("is_archived", false)
        .limit(1);

      if (productsError) {
        console.error("Failed to get products:", productsError);
        return;
      }

      if (!products || products.length === 0) {
        // Create a test product first
        const { data: newProduct, error: createError } = await supabase
          .from("products")
          .insert([{
            name: "Test Archive Product",
            category: "Test",
            price: 10.00,
            cost_price: 5.00,
            stock: 0,
            total_stock: 0,
            pieces_per_sheet: 1,
            sheets_per_box: 1,
            is_archived: false
          }])
          .select()
          .single();

        if (createError) {
          console.error("Failed to create test product:", createError);
          return;
        }

        console.log("✅ Created test product:", newProduct);
        
        // Now archive it
        const { data: archivedProduct, error: archiveError } = await supabase
          .from("products")
          .update({
            is_archived: true,
            archived_date: new Date().toISOString(),
            archived_by: "Debug Test",
            archive_reason: "Test archive for debugging"
          })
          .eq("id", newProduct.id)
          .select()
          .single();

        if (archiveError) {
          console.error("Failed to archive test product:", archiveError);
          return;
        }

        console.log("✅ Archived test product:", archivedProduct);
      } else {
        // Archive the first available product
        const product = products[0];
        const { data: archivedProduct, error: archiveError } = await supabase
          .from("products")
          .update({
            is_archived: true,
            archived_date: new Date().toISOString(),
            archived_by: "Debug Test",
            archive_reason: "Test archive for debugging"
          })
          .eq("id", product.id)
          .select()
          .single();

        if (archiveError) {
          console.error("Failed to archive product:", archiveError);
          return;
        }

        console.log("✅ Archived existing product:", archivedProduct);
      }
    } catch (error) {
      console.error("❌ Failed to create test archived product:", error);
    }
  };

  const runConnectionTest = async () => {
    setIsLoading(true);
    const results = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    try {
      // Test 1: Basic Supabase Connection
      console.log("🔍 Testing Supabase connection...");
      const { data: connectionTest, error: connectionError } = await supabase
        .from("products")
        .select("count", { count: "exact" })
        .limit(1);

      results.tests.push({
        name: "Supabase Connection",
        status: connectionError ? "failed" : "passed",
        message: connectionError 
          ? `Connection failed: ${connectionError.message}`
          : "Connection successful",
        details: connectionError ? connectionError : { count: connectionTest }
      });

      // Test 2: Check Archived Products Count
      console.log("🔍 Testing archived products query...");
      const { data: archivedCount, error: archivedError } = await supabase
        .from("products")
        .select("*", { count: "exact" })
        .eq("is_archived", true);

      results.tests.push({
        name: "Archived Products Query",
        status: archivedError ? "failed" : "passed",
        message: archivedError 
          ? `Query failed: ${archivedError.message}`
          : `Found ${archivedCount?.length || 0} archived products`,
        details: archivedError ? archivedError : { 
          count: archivedCount?.length || 0,
          products: archivedCount?.slice(0, 3).map(p => ({ id: p.id, name: p.name, archived_date: p.archived_date }))
        }
      });

      // Test 3: Check Safe Delete Function
      console.log("🔍 Testing safe delete function...");
      const { data: functionTest, error: functionError } = await supabase
        .rpc("safe_delete_archived_products", { product_ids: [] });

      results.tests.push({
        name: "Safe Delete Function",
        status: functionError ? "failed" : "passed",
        message: functionError 
          ? `Function failed: ${functionError.message}`
          : "Function available",
        details: functionError ? functionError : functionTest
      });

      // Test 4: Check Product Structure
      console.log("🔍 Testing product table structure...");
      const { data: sampleProduct, error: structureError } = await supabase
        .from("products")
        .select("*")
        .limit(1)
        .single();

      results.tests.push({
        name: "Product Table Structure",
        status: structureError ? "failed" : "passed",
        message: structureError 
          ? `Structure check failed: ${structureError.message}`
          : "Table structure valid",
        details: structureError ? structureError : {
          columns: sampleProduct ? Object.keys(sampleProduct) : [],
          hasArchiveFields: sampleProduct ? {
            is_archived: 'is_archived' in sampleProduct,
            archived_date: 'archived_date' in sampleProduct,
            archived_by: 'archived_by' in sampleProduct,
            archive_reason: 'archive_reason' in sampleProduct
          } : {}
        }
      });

    } catch (error) {
      console.error("❌ Connection test failed:", error);
      results.tests.push({
        name: "General Error",
        status: "failed",
        message: `Unexpected error: ${error.message}`,
        details: error
      });
    }

    setTestResults(results);
    setIsLoading(false);
    console.log("📊 Connection test results:", results);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "passed":
        return <CheckCircle size={16} className="text-green-600" />;
      case "failed":
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <Database size={16} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "passed":
        return "bg-green-50 border-green-200 text-green-700";
      case "failed":
        return "bg-red-50 border-red-200 text-red-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database size={20} className="text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Archive Connection Test
          </h3>
        </div>
        <button
          onClick={runConnectionTest}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Testing..." : "Run Test"}
        </button>
        <button
          onClick={createTestArchivedProduct}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Database size={16} />
          Create Test Archive
        </button>
      </div>

      {testResults && (
        <div className="space-y-3">
          <div className="text-xs text-gray-500 mb-3">
            Last tested: {new Date(testResults.timestamp).toLocaleString()}
          </div>
          
          {testResults.tests.map((test, index) => (
            <div
              key={index}
              className={`p-3 border rounded-lg ${getStatusColor(test.status)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(test.status)}
                <span className="font-medium">{test.name}</span>
              </div>
              <div className="text-sm">{test.message}</div>
              {test.details && (
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer hover:text-gray-600">
                    View Details
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(test.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {!testResults && (
        <div className="text-center py-4 text-gray-500">
          Click "Run Test" to check archive functionality
        </div>
      )}
    </div>
  );
}
