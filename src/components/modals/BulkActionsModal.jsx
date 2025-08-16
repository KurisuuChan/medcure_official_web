import React, { useState } from "react";
import {
  X,
  Package,
  Archive,
  Trash2,
  Edit,
  Tag,
  DollarSign,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export function BulkActionsModal({
  isOpen,
  onClose,
  selectedProducts = [],
  onBulkUpdate,
  onBulkArchive,
  onBulkDelete,
  categories = [],
}) {
  const [activeAction, setActiveAction] = useState(null);
  const [bulkUpdateData, setBulkUpdateData] = useState({
    category: "",
    supplier: "",
    cost_price: "",
    selling_price: "",
    critical_level: "",
    markup_percentage: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBulkUpdateData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMarkupChange = (e) => {
    const percentage = parseFloat(e.target.value);
    if (!isNaN(percentage) && bulkUpdateData.cost_price) {
      const costPrice = parseFloat(bulkUpdateData.cost_price);
      const sellingPrice = costPrice * (1 + percentage / 100);
      setBulkUpdateData((prev) => ({
        ...prev,
        markup_percentage: percentage.toString(),
        selling_price: sellingPrice.toFixed(2),
      }));
    } else {
      setBulkUpdateData((prev) => ({
        ...prev,
        markup_percentage: e.target.value,
      }));
    }
  };

  const handleBulkUpdate = async () => {
    setIsProcessing(true);
    try {
      // Filter out empty values
      const updateData = Object.entries(bulkUpdateData).reduce(
        (acc, [key, value]) => {
          if (value !== "" && key !== "markup_percentage") {
            if (key === "cost_price" || key === "selling_price") {
              acc[key] = parseFloat(value);
            } else if (key === "critical_level") {
              acc[key] = parseInt(value);
            } else {
              acc[key] = value;
            }
          }
          return acc;
        },
        {}
      );

      await onBulkUpdate(selectedProducts, updateData);
      onClose();
    } catch (error) {
      console.error("Bulk update failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkArchive = async () => {
    setIsProcessing(true);
    try {
      await onBulkArchive(selectedProducts);
      onClose();
    } catch (error) {
      console.error("Bulk archive failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      await onBulkDelete(selectedProducts);
      onClose();
    } catch (error) {
      console.error("Bulk delete failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setBulkUpdateData({
      category: "",
      supplier: "",
      cost_price: "",
      selling_price: "",
      critical_level: "",
      markup_percentage: "",
    });
    setActiveAction(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package size={24} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Bulk Actions</h2>
              <p className="text-sm text-gray-500">
                {selectedProducts.length} product
                {selectedProducts.length > 1 ? "s" : ""} selected
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!activeAction ? (
            /* Action Selection */
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Choose an action for selected products:
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveAction("update")}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Edit size={20} className="text-blue-600" />
                    <span className="font-semibold text-gray-800">
                      Bulk Update
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Update fields for all selected products
                  </p>
                </button>

                <button
                  onClick={() => setActiveAction("archive")}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Archive size={20} className="text-orange-600" />
                    <span className="font-semibold text-gray-800">
                      Archive Products
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Move products to archived status
                  </p>
                </button>

                <button
                  onClick={() => setActiveAction("delete")}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Trash2 size={20} className="text-red-600" />
                    <span className="font-semibold text-gray-800">
                      Delete Products
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Permanently delete selected products
                  </p>
                </button>
              </div>
            </div>
          ) : activeAction === "update" ? (
            /* Bulk Update Form */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Bulk Update Products
                </h3>
                <button
                  onClick={() => setActiveAction(null)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Back to Actions
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Only fields with values will be
                  updated. Leave fields empty to keep existing values.
                </p>
              </div>

              <div className="space-y-4">
                {/* Category & Supplier */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={bulkUpdateData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Keep existing category</option>
                      {categories.map((category) => (
                        <option
                          key={category.name || category}
                          value={category.name || category}
                        >
                          {category.name || category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier
                    </label>
                    <input
                      type="text"
                      name="supplier"
                      value={bulkUpdateData.supplier}
                      onChange={handleInputChange}
                      placeholder="Keep existing supplier"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost Price (₱)
                    </label>
                    <input
                      type="number"
                      name="cost_price"
                      value={bulkUpdateData.cost_price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      placeholder="Keep existing price"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Markup %
                    </label>
                    <input
                      type="number"
                      name="markup_percentage"
                      value={bulkUpdateData.markup_percentage}
                      onChange={handleMarkupChange}
                      step="0.1"
                      min="0"
                      placeholder="Calculate from cost"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selling Price (₱)
                    </label>
                    <input
                      type="number"
                      name="selling_price"
                      value={bulkUpdateData.selling_price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      placeholder="Keep existing price"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Critical Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Critical Level
                  </label>
                  <input
                    type="number"
                    name="critical_level"
                    value={bulkUpdateData.critical_level}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="Keep existing level"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ) : activeAction === "archive" ? (
            /* Archive Confirmation */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Archive Products
                </h3>
                <button
                  onClick={() => setActiveAction(null)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Back to Actions
                </button>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3">
                <AlertTriangle
                  size={24}
                  className="text-orange-600 flex-shrink-0"
                />
                <div>
                  <h4 className="font-semibold text-orange-800">
                    Archive Confirmation
                  </h4>
                  <p className="text-sm text-orange-700">
                    You are about to archive {selectedProducts.length} product
                    {selectedProducts.length > 1 ? "s" : ""}. Archived products
                    will not appear in the main inventory but can be restored
                    later.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Delete Confirmation */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Delete Products
                </h3>
                <button
                  onClick={() => setActiveAction(null)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Back to Actions
                </button>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertTriangle
                  size={24}
                  className="text-red-600 flex-shrink-0"
                />
                <div>
                  <h4 className="font-semibold text-red-800">
                    Delete Confirmation
                  </h4>
                  <p className="text-sm text-red-700">
                    You are about to permanently delete{" "}
                    {selectedProducts.length} product
                    {selectedProducts.length > 1 ? "s" : ""}. This action cannot
                    be undone.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold disabled:opacity-50"
          >
            Cancel
          </button>

          {activeAction === "update" && (
            <button
              onClick={handleBulkUpdate}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
            >
              {isProcessing ? "Updating..." : "Update Products"}
            </button>
          )}

          {activeAction === "archive" && (
            <button
              onClick={handleBulkArchive}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold disabled:opacity-50"
            >
              {isProcessing ? "Archiving..." : "Archive Products"}
            </button>
          )}

          {activeAction === "delete" && (
            <button
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50"
            >
              {isProcessing ? "Deleting..." : "Delete Products"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
