import React from "react";
import {
  X,
  Package,
  DollarSign,
  Boxes,
  Factory,
  Tag,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, formatStockStatus } from "../../utils/formatters.js";

export default function ViewProductModal({ isOpen, onClose, product }) {
  if (!isOpen || !product) return null;

  const stockStatus = formatStockStatus(product.stock);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              {product.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {product.name}
              </h2>
              <p className="text-gray-500">{product.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stock Status Banner */}
          <div
            className={`p-4 rounded-lg border-l-4 ${stockStatus.bgColor} ${stockStatus.borderColor}`}
          >
            <div className="flex items-center gap-3">
              <Package className={stockStatus.color} size={20} />
              <div>
                <p className={`font-semibold ${stockStatus.color}`}>
                  Stock Status: {stockStatus.text}
                </p>
                <p className="text-sm text-gray-600">
                  Current stock level: {product.stock} pieces
                </p>
              </div>
            </div>
          </div>

          {/* Product Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Tag size={20} className="text-blue-600" />
                Product Information
              </h3>

              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-sm font-medium text-gray-500">
                    Product Name
                  </label>
                  <p className="text-gray-800 font-semibold">{product.name}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-sm font-medium text-gray-500">
                    Category
                  </label>
                  <p className="text-gray-800">{product.category}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Factory size={14} />
                    Manufacturer
                  </label>
                  <p className="text-gray-800">
                    {product.manufacturer || "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <DollarSign size={20} className="text-green-600" />
                Pricing & Inventory
              </h3>

              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-sm font-medium text-gray-500">
                    Cost Price
                  </label>
                  <p className="text-gray-800 font-semibold">
                    {product.cost_price
                      ? formatCurrency(product.cost_price)
                      : "Not set"}
                  </p>
                </div>

                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <label className="text-sm font-medium text-green-700">
                    Selling Price
                  </label>
                  <p className="text-green-800 font-bold text-lg">
                    {formatCurrency(product.price)}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Boxes size={14} />
                    Current Stock
                  </label>
                  <p className={`font-semibold text-lg ${stockStatus.color}`}>
                    {product.stock} pieces
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Package Information */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <Package size={20} />
              Package Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-blue-700">
                  Pieces per Sheet
                </label>
                <p className="text-blue-800 font-semibold text-xl">
                  {product.pieces_per_sheet}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-700">
                  Sheets per Box
                </label>
                <p className="text-blue-800 font-semibold text-xl">
                  {product.sheets_per_box}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <label className="text-sm font-medium text-blue-700">
                Total pieces per box
              </label>
              <p className="text-blue-800 font-bold text-2xl">
                {product.pieces_per_sheet * product.sheets_per_box} pieces
              </p>
            </div>
          </div>

          {/* Profit Margin (if cost price is available) */}
          {product.cost_price && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                <TrendingUp size={20} />
                Profit Analysis
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-green-700">
                    Profit per Unit
                  </label>
                  <p className="text-green-800 font-semibold text-xl">
                    {formatCurrency(product.price - product.cost_price)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-green-700">
                    Profit Margin
                  </label>
                  <p className="text-green-800 font-semibold text-xl">
                    {(
                      ((product.price - product.cost_price) / product.price) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-blue-600 rounded-lg hover:bg-blue-200 font-medium transition-colors"
          >
            <X size={16} />
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
