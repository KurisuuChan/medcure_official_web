import { useState, useEffect } from "react";
import { X, ShoppingCart, Package, FileText, Circle } from "lucide-react";
import {
  calculateTotalPieces,
  calculateTotalPrice,
  validateStockAvailability,
  formatQuantityDisplay,
} from "../../utils/calculations.js";
import { formatCurrency } from "../../utils/formatters.js";

/**
 * Modal for selecting quantity with box/sheet/piece breakdown
 * Used in POS system when adding products to cart
 */
export default function QuantitySelectionModal({
  isOpen,
  onClose,
  onAddToCart,
  product,
}) {
  const [quantities, setQuantities] = useState({
    boxes: 0,
    sheets: 0,
    pieces: 0,
  });

  const [error, setError] = useState("");

  // Reset quantities when modal opens with new product
  useEffect(() => {
    if (isOpen && product) {
      setQuantities({ boxes: 0, sheets: 0, pieces: 0 });
      setError("");
    }
  }, [isOpen, product]);

  // Calculate totals
  const totalPieces = product ? calculateTotalPieces(quantities, product) : 0;
  const totalPrice = product ? calculateTotalPrice(quantities, product) : 0;

  // Handle quantity changes
  const handleQuantityChange = (type, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    setQuantities((prev) => ({
      ...prev,
      [type]: numValue,
    }));
    setError("");
  };

  // Handle quick select buttons
  const handleQuickSelect = (type, amount) => {
    if (!product) return;

    setQuantities((prev) => {
      const newQuantities = { ...prev };

      switch (type) {
        case "box":
          newQuantities.boxes = amount;
          newQuantities.sheets = 0;
          newQuantities.pieces = 0;
          break;
        case "sheet":
          newQuantities.boxes = 0;
          newQuantities.sheets = amount;
          newQuantities.pieces = 0;
          break;
        case "piece":
          newQuantities.boxes = 0;
          newQuantities.sheets = 0;
          newQuantities.pieces = amount;
          break;
      }

      return newQuantities;
    });
    setError("");
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!product) return;

    // Validate stock availability
    const validation = validateStockAvailability(quantities, product);
    if (!validation.success) {
      setError(validation.message);
      return;
    }

    if (totalPieces <= 0) {
      setError("Please select a quantity greater than zero");
      return;
    }

    // Create cart item
    const cartItem = {
      id: product.id,
      product,
      quantities,
      totalPieces,
      totalPrice,
      displayQuantity: formatQuantityDisplay(quantities),
    };

    onAddToCart(cartItem);
    onClose();
  };

  if (!isOpen || !product) return null;

  const hasVariants =
    product.pieces_per_sheet > 1 || product.sheets_per_box > 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Select Quantity
            </h2>
            <p className="text-sm text-gray-600 mt-1">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">
              Price per piece:
            </span>
            <span className="text-lg font-semibold text-blue-600">
              {formatCurrency(product.price)}
            </span>
          </div>

          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">
              Available stock:
            </span>
            <span
              className={`text-sm font-medium ${
                product.stock <= 5
                  ? "text-red-600"
                  : product.stock <= 10
                  ? "text-amber-600"
                  : "text-green-600"
              }`}
            >
              {product.stock} pieces
            </span>
          </div>

          {hasVariants && (
            <div className="text-xs text-gray-500 space-y-1">
              <div>• {product.pieces_per_sheet} pieces per sheet</div>
              <div>• {product.sheets_per_box} sheets per box</div>
              <div>
                • {product.pieces_per_sheet * product.sheets_per_box} pieces per
                box
              </div>
            </div>
          )}
        </div>

        {/* Quantity Selection */}
        <div className="p-6 space-y-6">
          {/* Box Selection */}
          {hasVariants && product.sheets_per_box > 1 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Package size={18} className="text-blue-600 mr-2" />
                  <span className="font-medium text-gray-700">Boxes</span>
                </div>
                <div className="flex space-x-2">
                  {[1, 2, 3, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleQuickSelect("box", num)}
                      className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min="0"
                value={quantities.boxes}
                onChange={(e) => handleQuantityChange("boxes", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                ={" "}
                {quantities.boxes *
                  product.sheets_per_box *
                  product.pieces_per_sheet}{" "}
                pieces
              </p>
            </div>
          )}

          {/* Sheet Selection */}
          {hasVariants && product.pieces_per_sheet > 1 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <FileText size={18} className="text-green-600 mr-2" />
                  <span className="font-medium text-gray-700">Sheets</span>
                </div>
                <div className="flex space-x-2">
                  {[1, 2, 5, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleQuickSelect("sheet", num)}
                      className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min="0"
                value={quantities.sheets}
                onChange={(e) => handleQuantityChange("sheets", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                = {quantities.sheets * product.pieces_per_sheet} pieces
              </p>
            </div>
          )}

          {/* Piece Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Circle size={18} className="text-purple-600 mr-2" />
                <span className="font-medium text-gray-700">
                  Individual Pieces
                </span>
              </div>
              <div className="flex space-x-2">
                {[1, 2, 5, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleQuickSelect("piece", num)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              min="0"
              value={quantities.pieces}
              onChange={(e) => handleQuantityChange("pieces", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Total Summary */}
          {totalPieces > 0 && (
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">
                  Total Quantity:
                </span>
                <span className="font-semibold text-blue-600">
                  {formatQuantityDisplay(quantities)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">Total Pieces:</span>
                <span className="font-semibold text-blue-600">
                  {totalPieces}
                </span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-medium text-gray-700">Total Price:</span>
                <span className="font-bold text-blue-600">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAddToCart}
            disabled={totalPieces <= 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <ShoppingCart size={16} className="mr-2" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
