import React, { useState, useEffect } from "react";
import {
  X,
  Package,
  Plus,
  Minus,
  Save,
  AlertTriangle,
  CheckCircle,
  Upload,
  Download,
} from "lucide-react";
import { useNotification } from "@/hooks/useNotification";
import { supabase } from "@/config/supabase";

export default function BulkStockUpdateModal({
  isOpen,
  onClose,
  products = [],
  onUpdateSuccess,
}) {
  const [stockUpdates, setStockUpdates] = useState({});
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const { addNotification } = useNotification();

  // Initialize stock updates when modal opens
  useEffect(() => {
    if (isOpen && products.length > 0) {
      const initialUpdates = {};
      products.forEach((product) => {
        initialUpdates[product.id] = {
          current_stock: product.total_stock || 0,
          new_stock: product.total_stock || 0,
          operation: "set", // 'set', 'add', 'subtract'
          adjustment: 0,
        };
      });
      setStockUpdates(initialUpdates);
      setValidationErrors({});
    }
  }, [isOpen, products]);

  // Handle stock operation change
  const handleOperationChange = (productId, operation) => {
    setStockUpdates((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        operation,
        adjustment: 0,
        new_stock:
          operation === "set"
            ? prev[productId].current_stock
            : prev[productId].current_stock,
      },
    }));
  };

  // Handle adjustment value change
  const handleAdjustmentChange = (productId, value) => {
    const numValue = parseInt(value) || 0;
    const update = stockUpdates[productId];
    let newStock = update.current_stock;

    switch (update.operation) {
      case "set":
        newStock = Math.max(0, numValue);
        break;
      case "add":
        newStock = Math.max(0, update.current_stock + numValue);
        break;
      case "subtract":
        newStock = Math.max(0, update.current_stock - numValue);
        break;
    }

    setStockUpdates((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        adjustment: numValue,
        new_stock: newStock,
      },
    }));

    // Clear validation error for this product
    if (validationErrors[productId]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[productId];
        return newErrors;
      });
    }
  };

  // Validate updates
  const validateUpdates = () => {
    const errors = {};
    let hasChanges = false;

    Object.entries(stockUpdates).forEach(([productId, update]) => {
      if (update.new_stock !== update.current_stock) {
        hasChanges = true;
      }

      if (update.new_stock < 0) {
        errors[productId] = "Stock cannot be negative";
      }

      if (update.operation !== "set" && update.adjustment === 0) {
        // Allow 0 adjustments, but warn if no real change
      }
    });

    setValidationErrors(errors);
    return { isValid: Object.keys(errors).length === 0, hasChanges };
  };

  // Handle bulk update
  const handleBulkUpdate = async () => {
    const validation = validateUpdates();
    if (!validation.isValid) {
      addNotification("Please fix validation errors", "error");
      return;
    }

    if (!validation.hasChanges) {
      addNotification("No changes to apply", "warning");
      return;
    }

    setLoading(true);
    try {
      const updates = Object.entries(stockUpdates)
        .filter(([, update]) => update.new_stock !== update.current_stock)
        .map(([productId, update]) => ({
          id: parseInt(productId),
          total_stock: update.new_stock,
        }));

      // Call Supabase function for bulk update
      const { data, error } = await supabase.rpc("bulk_update_stock", {
        updates: updates,
      });

      if (error) throw error;

      const result = data[0];
      if (result.error_count > 0) {
        console.warn("Some updates failed:", result.errors);
        addNotification(
          `Updated ${result.success_count} products, ${result.error_count} failed`,
          "warning"
        );
      } else {
        addNotification(
          `Successfully updated stock for ${result.success_count} products`,
          "success"
        );
      }

      onUpdateSuccess && onUpdateSuccess();
      onClose();
    } catch (error) {
      console.error("Bulk update error:", error);
      addNotification("Failed to update stock. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Generate CSV template for bulk import
  const downloadTemplate = () => {
    const headers = [
      "Product ID",
      "Product Name",
      "Current Stock",
      "New Stock",
    ];
    const csvContent = [
      headers.join(","),
      ...products.map((product) =>
        [
          product.id,
          `"${product.name}"`,
          product.total_stock || 0,
          product.total_stock || 0,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bulk_stock_update_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Quick actions
  const applyToAll = (operation, value) => {
    const updates = {};
    products.forEach((product) => {
      let newStock = product.total_stock || 0;
      switch (operation) {
        case "set":
          newStock = Math.max(0, value);
          break;
        case "add":
          newStock = Math.max(0, (product.total_stock || 0) + value);
          break;
        case "subtract":
          newStock = Math.max(0, (product.total_stock || 0) - value);
          break;
      }
      updates[product.id] = {
        current_stock: product.total_stock || 0,
        new_stock: newStock,
        operation,
        adjustment: operation === "set" ? newStock : value,
      };
    });
    setStockUpdates(updates);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package size={24} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Bulk Stock Update
                </h2>
                <p className="text-gray-600 mt-1">
                  Update stock levels for {products.length} selected products
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                Quick Actions:
              </span>
              <button
                onClick={() => applyToAll("add", 10)}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
              >
                +10 All
              </button>
              <button
                onClick={() => applyToAll("add", 50)}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200"
              >
                +50 All
              </button>
              <button
                onClick={() => applyToAll("set", 0)}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
              >
                Set All to 0
              </button>
              <button
                onClick={downloadTemplate}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 flex items-center gap-1"
              >
                <Download size={14} />
                CSV Template
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            {products.map((product) => {
              const update = stockUpdates[product.id] || {};
              const hasError = validationErrors[product.id];
              const hasChange = update.new_stock !== update.current_stock;

              return (
                <div
                  key={product.id}
                  className={`border rounded-xl p-4 ${
                    hasError
                      ? "border-red-300 bg-red-50"
                      : hasChange
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-600">
                          ID: {product.id}
                        </span>
                        <span className="text-sm text-gray-600">
                          Category: {product.category}
                        </span>
                        <span
                          className={`text-sm px-2 py-1 rounded-full ${
                            (product.total_stock || 0) === 0
                              ? "bg-red-100 text-red-700"
                              : (product.total_stock || 0) <=
                                (product.low_stock_threshold || 10)
                              ? "bg-orange-100 text-orange-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          Current: {product.total_stock || 0}
                        </span>
                      </div>
                    </div>

                    {/* Stock Controls */}
                    <div className="flex items-center gap-3">
                      {/* Operation Type */}
                      <select
                        value={update.operation || "set"}
                        onChange={(e) =>
                          handleOperationChange(product.id, e.target.value)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="set">Set to</option>
                        <option value="add">Add</option>
                        <option value="subtract">Subtract</option>
                      </select>

                      {/* Adjustment Value */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            handleAdjustmentChange(
                              product.id,
                              (update.adjustment || 0) - 1
                            )
                          }
                          className="p-1 hover:bg-gray-200 rounded"
                          disabled={
                            update.operation === "subtract" &&
                            update.adjustment >= update.current_stock
                          }
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="number"
                          value={update.adjustment || 0}
                          onChange={(e) =>
                            handleAdjustmentChange(product.id, e.target.value)
                          }
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                        <button
                          onClick={() =>
                            handleAdjustmentChange(
                              product.id,
                              (update.adjustment || 0) + 1
                            )
                          }
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      {/* New Stock Display */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">→</span>
                        <span
                          className={`font-semibold px-3 py-1 rounded-lg ${
                            hasChange
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {update.new_stock || 0}
                        </span>
                        {hasChange && (
                          <CheckCircle size={16} className="text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {hasError && (
                    <div className="mt-2 flex items-center gap-2 text-red-600">
                      <AlertTriangle size={16} />
                      <span className="text-sm">{hasError}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {
                Object.values(stockUpdates).filter(
                  (update) => update.new_stock !== update.current_stock
                ).length
              }{" "}
              products will be updated
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpdate}
                disabled={
                  loading ||
                  Object.keys(validationErrors).length > 0 ||
                  Object.values(stockUpdates).filter(
                    (update) => update.new_stock !== update.current_stock
                  ).length === 0
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Update Stock
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
