import { useState, useEffect } from "react";
import { isMockMode } from "../utils/mockApi.js";
import { getProducts, getCategories } from "../services/productService.js";

export function MockApiStatus() {
  const [status, setStatus] = useState({
    mockMode: false,
    productsLoaded: false,
    categoriesLoaded: false,
    error: null,
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const mockMode = isMockMode();

        // Test products API
        const productsResult = await getProducts();
        const categoriesResult = await getCategories();

        setStatus({
          mockMode,
          productsLoaded:
            !productsResult.error && productsResult.data?.length > 0,
          categoriesLoaded:
            !categoriesResult.error && categoriesResult.data?.length > 0,
          error: productsResult.error || categoriesResult.error,
        });
      } catch (error) {
        setStatus((prev) => ({
          ...prev,
          error: error.message,
        }));
      }
    };

    checkStatus();
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg p-4 shadow-lg min-w-[280px]">
      <h3 className="font-semibold text-gray-900 mb-2">API Status</h3>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span>Mock Mode:</span>
          <span
            className={`px-2 py-1 rounded text-xs ${
              status.mockMode
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {status.mockMode ? "ENABLED" : "DISABLED"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Products API:</span>
          <span
            className={`px-2 py-1 rounded text-xs ${
              status.productsLoaded
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {status.productsLoaded ? "WORKING" : "FAILED"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Categories API:</span>
          <span
            className={`px-2 py-1 rounded text-xs ${
              status.categoriesLoaded
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {status.categoriesLoaded ? "WORKING" : "FAILED"}
          </span>
        </div>

        {status.error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
            Error: {status.error}
          </div>
        )}
      </div>
    </div>
  );
}
