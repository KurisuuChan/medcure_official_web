import React, { memo, useMemo } from "react";
import { formatCurrency } from "../utils/formatters.js";

/**
 * Optimized Product Card with React.memo and computed values
 */
const ProductCard = memo(
  ({ product, onEdit, onArchive, onViewDetails, isSelected = false }) => {
    // Memoize expensive calculations
    const computedValues = useMemo(
      () => ({
        stockStatus:
          product.stock <= 0
            ? "out-of-stock"
            : product.stock <= 10
            ? "low-stock"
            : "in-stock",
        profitMargin:
          product.selling_price > 0
            ? (
                ((product.selling_price - product.cost_price) /
                  product.selling_price) *
                100
              ).toFixed(1)
            : 0,
        totalValue: product.stock * product.selling_price,
        statusColor:
          product.stock <= 0 ? "red" : product.stock <= 10 ? "orange" : "green",
      }),
      [product.stock, product.selling_price, product.cost_price]
    );

    // Memoize handlers to prevent child re-renders
    const handleEdit = useMemo(() => () => onEdit(product), [onEdit, product]);
    const handleArchive = useMemo(
      () => () => onArchive(product),
      [onArchive, product]
    );
    const handleViewDetails = useMemo(
      () => () => onViewDetails(product),
      [onViewDetails, product]
    );

    return (
      <div
        className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
          isSelected ? "ring-2 ring-blue-500" : ""
        }`}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 truncate">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600">{product.category}</p>
          </div>
          <div
            className={`px-2 py-1 rounded text-xs font-medium bg-${computedValues.statusColor}-100 text-${computedValues.statusColor}-800`}
          >
            {product.stock} units
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          <div>
            <span className="text-gray-500">Price:</span>
            <span className="ml-1 font-medium">
              {formatCurrency(product.selling_price)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Margin:</span>
            <span className="ml-1 font-medium">
              {computedValues.profitMargin}%
            </span>
          </div>
          <div>
            <span className="text-gray-500">Total Value:</span>
            <span className="ml-1 font-medium">
              {formatCurrency(computedValues.totalValue)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Status:</span>
            <span
              className={`ml-1 font-medium text-${computedValues.statusColor}-600`}
            >
              {computedValues.stockStatus}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleViewDetails}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            View
          </button>
          <button
            onClick={handleEdit}
            className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={handleArchive}
            className="px-3 py-1.5 text-sm bg-orange-100 text-orange-800 rounded hover:bg-orange-200"
          >
            Archive
          </button>
        </div>
      </div>
    );
  }
);

ProductCard.displayName = "ProductCard";

export default ProductCard;
