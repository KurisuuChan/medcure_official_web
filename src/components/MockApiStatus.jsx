import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { isMockMode } from "../utils/mockApi.js";
import { getProducts, getCategories } from "../services/productService.js";

export function MockApiStatus() {
  const [isMinimized, setIsMinimized] = useState(false);
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
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[280px]">
      {/* Header with minimize button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">API Status</h3>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title={isMinimized ? "Expand" : "Minimize"}
        >
          {isMinimized ? (
            <ChevronDown size={16} className="text-gray-600" />
          ) : (
            <ChevronUp size={16} className="text-gray-600" />
          )}
        </button>
      </div>

      {/* Content area - only show when not minimized */}
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isMinimized ? "max-h-0" : "max-h-96"
        }`}
      >
        <div className="p-4">
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
      </div>
    </div>
  );
}
