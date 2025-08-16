import React from "react";
import {
  X,
  Package,
  DollarSign,
  Hash,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Tag,
} from "lucide-react";
import { formatCurrency } from "../../utils/csvUtils.js";

export function ProductViewModal({ isOpen, onClose, onEdit, product }) {
  if (!isOpen || !product) return null;

  const getStatusBadge = (stock, criticalLevel = 10) => {
    if (stock === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold bg-red-100 text-red-700 rounded-full">
          <AlertTriangle size={14} />
          Out of Stock
        </span>
      );
    } else if (stock <= criticalLevel) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold bg-orange-100 text-orange-700 rounded-full">
          <AlertTriangle size={14} />
          Low Stock
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold bg-green-100 text-green-700 rounded-full">
          <CheckCircle size={14} />
          Available
        </span>
      );
    }
  };

  const totalPiecesPerBox =
    (product.pieces_per_sheet || 1) * (product.sheets_per_box || 1);

  const profitPerUnit = product.selling_price - product.cost_price;
  const markupPercentage =
    product.cost_price > 0
      ? ((profitPerUnit / product.cost_price) * 100).toFixed(1)
      : 0;

  const totalInventoryValue = product.total_stock * product.cost_price;
  const potentialRevenue = product.total_stock * product.selling_price;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              {product.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {product.name}
              </h2>
              <p className="text-gray-500">{product.generic_name}</p>
              {product.brand_name && (
                <p className="text-sm text-blue-600 font-medium">
                  Brand: {product.brand_name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(product)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Edit Product
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Status and Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-800">
                {product.total_stock}
              </div>
              <div className="text-sm text-gray-600">Current Stock</div>
              <div className="mt-2">
                {getStatusBadge(product.total_stock, product.critical_level)}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(product.selling_price)}
              </div>
              <div className="text-sm text-gray-600">Selling Price</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(profitPerUnit)}
              </div>
              <div className="text-sm text-gray-600">Profit per Unit</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {markupPercentage}%
              </div>
              <div className="text-sm text-gray-600">Markup</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                  <Package size={20} />
                  Product Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Product Name:</span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  {product.generic_name && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Generic Name:</span>
                      <span className="font-medium">
                        {product.generic_name}
                      </span>
                    </div>
                  )}
                  {product.brand_name && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Brand Name:</span>
                      <span className="font-medium">{product.brand_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Category:</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      <Tag size={12} />
                      {product.category}
                    </span>
                  </div>
                  {product.supplier && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Supplier:</span>
                      <span className="font-medium">{product.supplier}</span>
                    </div>
                  )}
                  {product.description && (
                    <div className="py-2">
                      <span className="text-gray-600 block mb-2">
                        Description:
                      </span>
                      <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">
                        {product.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stock & Packaging */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                  <Hash size={20} />
                  Stock & Packaging
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Current Stock:</span>
                    <span className="font-medium">
                      {product.total_stock} pieces
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Critical Level:</span>
                    <span className="font-medium">
                      {product.critical_level} pieces
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Pieces per Sheet:</span>
                    <span className="font-medium">
                      {product.pieces_per_sheet || 1}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Sheets per Box:</span>
                    <span className="font-medium">
                      {product.sheets_per_box || 1}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Pieces per Box:</span>
                    <span className="font-medium">{totalPiecesPerBox}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing & Financial */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                  <DollarSign size={20} />
                  Pricing & Financial
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Cost Price:</span>
                    <span className="font-medium">
                      {formatCurrency(product.cost_price)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Selling Price:</span>
                    <span className="font-medium">
                      {formatCurrency(product.selling_price)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Profit per Unit:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(profitPerUnit)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Markup Percentage:</span>
                    <span className="font-medium text-blue-600">
                      {markupPercentage}%
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">
                      Total Inventory Value:
                    </span>
                    <span className="font-medium text-purple-600">
                      {formatCurrency(totalInventoryValue)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Potential Revenue:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(potentialRevenue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                  <Calendar size={20} />
                  Additional Information
                </h3>
                <div className="space-y-3">
                  {product.expiry_date && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Expiry Date:</span>
                      <span className="font-medium">
                        {new Date(product.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {product.batch_number && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Batch Number:</span>
                      <span className="font-medium">
                        {product.batch_number}
                      </span>
                    </div>
                  )}
                  {product.created_at && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">
                        {new Date(product.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {product.updated_at && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium">
                        {new Date(product.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Warning for low stock */}
          {product.total_stock <= product.critical_level && (
            <div className="mt-8 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3">
              <AlertTriangle
                size={24}
                className="text-orange-600 flex-shrink-0"
              />
              <div>
                <h4 className="font-semibold text-orange-800">Stock Alert</h4>
                <p className="text-sm text-orange-700">
                  {product.total_stock === 0
                    ? "This product is out of stock."
                    : "This product is running low on stock. Consider restocking soon."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
          >
            Close
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(product)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Edit Product
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
