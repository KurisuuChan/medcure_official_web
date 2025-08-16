import React, { useState, useEffect } from "react";
import {
  X,
  Filter,
  Search,
  Tag,
  DollarSign,
  Package,
  Calendar,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

export function FilterModal({
  isOpen,
  onClose,
  onApplyFilters,
  categories = [],
  currentFilters = {},
}) {
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    minStock: "",
    maxStock: "",
    stockStatus: "", // "all", "low", "out", "available"
    supplier: "",
    expiryWithin: "", // days
    ...currentFilters,
  });

  useEffect(() => {
    if (isOpen) {
      setFilters({
        category: "",
        minPrice: "",
        maxPrice: "",
        minStock: "",
        maxStock: "",
        stockStatus: "",
        supplier: "",
        expiryWithin: "",
        ...currentFilters,
      });
    }
  }, [isOpen, currentFilters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    // Remove empty filters
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    onApplyFilters(cleanFilters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters = {
      category: "",
      minPrice: "",
      maxPrice: "",
      minStock: "",
      maxStock: "",
      stockStatus: "",
      supplier: "",
      expiryWithin: "",
    };
    setFilters(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== "" && value !== null && value !== undefined
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Filter size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Advanced Filters
              </h2>
              <p className="text-sm text-gray-500">
                Filter products by various criteria
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Category & Supplier */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Tag size={20} />
              Category & Supplier
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
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
                  value={filters.supplier}
                  onChange={handleInputChange}
                  placeholder="Supplier name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign size={20} />
              Price Range
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Price (₱)
                </label>
                <input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Price (₱)
                </label>
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="No limit"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Stock Levels */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Package size={20} />
              Stock Levels
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Status
              </label>
              <select
                name="stockStatus"
                value={filters.stockStatus}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Stock Levels</option>
                <option value="available">
                  Available (Above Critical Level)
                </option>
                <option value="low">
                  Low Stock (At or Below Critical Level)
                </option>
                <option value="out">Out of Stock (0 quantity)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Stock
                </label>
                <input
                  type="number"
                  name="minStock"
                  value={filters.minStock}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Stock
                </label>
                <input
                  type="number"
                  name="maxStock"
                  value={filters.maxStock}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="No limit"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Expiry */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Calendar size={20} />
              Expiry Date
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiring Within (Days)
              </label>
              <select
                name="expiryWithin"
                value={filters.expiryWithin}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Products</option>
                <option value="7">Next 7 days</option>
                <option value="30">Next 30 days</option>
                <option value="60">Next 60 days</option>
                <option value="90">Next 90 days</option>
              </select>
            </div>
          </div>

          {/* Active Filters Preview */}
          {hasActiveFilters && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Filter size={16} />
                Active Filters
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters)
                  .filter(
                    ([, value]) =>
                      value !== "" && value !== null && value !== undefined
                  )
                  .map(([key, value]) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                    >
                      {key.charAt(0).toUpperCase() +
                        key.slice(1).replace(/([A-Z])/g, " $1")}
                      : {value}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
          >
            <RotateCcw size={16} />
            Clear All
          </button>
          <div className="flex-1"></div>
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
