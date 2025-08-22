import React, { useState } from "react";
import { supabase } from "../config/supabase.js";
import { Database, Search, RefreshCw } from "lucide-react";

export default function ArchiveDebugger() {
  const [debugData, setDebugData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDatabaseCheck = async () => {
    setIsLoading(true);
    try {
      console.log("🔍 Running database debug check...");

      // Check all products
      const { data: allProducts, error: allError } = await supabase
        .from("products")
        .select("id, name, is_archived, archived_date, archive_reason");

      if (allError) {
        throw new Error(`All products query failed: ${allError.message}`);
      }

      // Check specifically archived products
      const { data: archivedProducts, error: archivedError } = await supabase
        .from("products")
        .select("*")
        .eq("is_archived", true);

      if (archivedError) {
        throw new Error(`Archived products query failed: ${archivedError.message}`);
      }

      // Check for products with archived data but is_archived = false
      const { data: inconsistent, error: inconsistentError } = await supabase
        .from("products")
        .select("id, name, is_archived, archived_date, archive_reason")
        .not("archived_date", "is", null)
        .eq("is_archived", false);

      if (inconsistentError) {
        console.warn("Inconsistent data query failed:", inconsistentError);
      }

      const debugResult = {
        timestamp: new Date().toISOString(),
        totalProducts: allProducts?.length || 0,
        archivedProducts: archivedProducts?.length || 0,
        inconsistentProducts: inconsistent?.length || 0,
        allProductsData: allProducts || [],
        archivedProductsData: archivedProducts || [],
        inconsistentData: inconsistent || [],
      };

      setDebugData(debugResult);
      console.log("📊 Debug Results:", debugResult);

    } catch (error) {
      console.error("❌ Debug check failed:", error);
      setDebugData({
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Database size={20} className="text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Archive Debug Tool</h3>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={runDatabaseCheck}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Search size={16} />
          )}
          {isLoading ? "Checking..." : "Check Database"}
        </button>
      </div>

      {debugData && (
        <div className="space-y-4">
          {debugData.error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Error</h4>
              <p className="text-red-700 text-sm">{debugData.error}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">Total Products</h4>
                  <p className="text-2xl font-bold text-blue-900">{debugData.totalProducts}</p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-1">Archived Products</h4>
                  <p className="text-2xl font-bold text-green-900">{debugData.archivedProducts}</p>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-1">Inconsistent Data</h4>
                  <p className="text-2xl font-bold text-yellow-900">{debugData.inconsistentProducts}</p>
                </div>
              </div>

              {debugData.archivedProductsData?.length > 0 && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Archived Products Details</h4>
                  <div className="max-h-64 overflow-y-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(debugData.archivedProductsData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {debugData.inconsistentData?.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Inconsistent Data (has archived_date but is_archived=false)</h4>
                  <div className="max-h-64 overflow-y-auto">
                    <pre className="text-xs text-yellow-700 whitespace-pre-wrap">
                      {JSON.stringify(debugData.inconsistentData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500">
                Last checked: {new Date(debugData.timestamp).toLocaleString()}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
