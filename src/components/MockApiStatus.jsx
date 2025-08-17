import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Move, X } from "lucide-react";
import { isMockMode } from "../utils/mockApi.js";
import { getProducts, getCategories } from "../services/productService.js";

export function MockApiStatus() {
  const [isMinimized, setIsMinimized] = useState(true); // Start minimized
  const [isHidden, setIsHidden] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const elementRef = useRef(null);

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

  // Handle drag start
  const handleMouseDown = (e) => {
    if (e.target.closest(".drag-handle")) {
      setIsDragging(true);
      const rect = elementRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      e.preventDefault();
    }
  };

  // Handle drag move
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // Keep within viewport bounds
        const maxX =
          window.innerWidth - (elementRef.current?.offsetWidth || 280);
        const maxY =
          window.innerHeight - (elementRef.current?.offsetHeight || 100);

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (isHidden) {
    return (
      <button
        onClick={() => setIsHidden(false)}
        className="fixed bottom-4 right-4 z-[60] bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-colors"
        title="Show API Status"
      >
        <Move size={16} />
      </button>
    );
  }

  return (
    <div
      ref={elementRef}
      className={`fixed z-[60] bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-200 ${
        isDragging ? "shadow-2xl scale-105" : "hover:shadow-xl"
      } ${isMinimized ? "min-w-[200px]" : "min-w-[280px]"}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "default",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header with drag handle, minimize button, and close button */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div
            className="drag-handle p-1 hover:bg-gray-200 rounded transition-colors cursor-grab active:cursor-grabbing"
            title="Drag to move"
          >
            <Move size={14} className="text-gray-600" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">API Status</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <ChevronDown size={14} className="text-gray-600" />
            ) : (
              <ChevronUp size={14} className="text-gray-600" />
            )}
          </button>
          <button
            onClick={() => setIsHidden(true)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Hide (show button will appear at bottom-right)"
          >
            <X size={14} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content area - only show when not minimized */}
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isMinimized ? "max-h-0" : "max-h-96"
        }`}
      >
        <div className="p-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Mock Mode:</span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
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
                className={`px-2 py-1 rounded text-xs font-medium ${
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
                className={`px-2 py-1 rounded text-xs font-medium ${
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
