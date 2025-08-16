import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  X,
  Package,
  Plus,
  Minus,
  Box,
  Layers,
  Hash,
  AlertTriangle,
  CheckCircle,
  ShoppingCart,
} from "lucide-react";

export function QuantitySelectionModal({
  isOpen,
  onClose,
  product,
  onAddToCart,
  existingQuantity = 0,
}) {
  const [quantityMode, setQuantityMode] = useState({
    boxes: 0,
    sheets: 0,
    pieces: 0,
  });

  const [errors, setErrors] = useState([]);
  const [isValid, setIsValid] = useState(false);

  // Reset when product changes or modal opens
  useEffect(() => {
    if (isOpen && product) {
      setQuantityMode({
        boxes: 0,
        sheets: 0,
        pieces: 0,
      });
      setErrors([]);
    }
  }, [isOpen, product]);

  // Calculate total pieces
  const calculateTotalPieces = (boxes, sheets, pieces) => {
    if (!product) return 0;

    const piecesFromBoxes = boxes * (product.total_pieces_per_box || 0);
    const piecesFromSheets = sheets * (product.pieces_per_sheet || 0);
    return piecesFromBoxes + piecesFromSheets + pieces;
  };

  const totalPieces = calculateTotalPieces(
    quantityMode.boxes,
    quantityMode.sheets,
    quantityMode.pieces
  );

  const totalAmount = totalPieces * (product?.selling_price || 0);
  const availableStock = (product?.total_stock || 0) - existingQuantity;

  // Enhanced validation with detailed stock checking
  useEffect(() => {
    const newErrors = [];

    if (totalPieces <= 0) {
      newErrors.push("Please specify a quantity greater than 0");
    }

    if (totalPieces > availableStock) {
      newErrors.push(`Insufficient stock. Available: ${availableStock} pieces`);
    }

    if (
      quantityMode.boxes < 0 ||
      quantityMode.sheets < 0 ||
      quantityMode.pieces < 0
    ) {
      newErrors.push("Quantities cannot be negative");
    }

    // Check individual packaging limits
    const maxBoxes = Math.floor(
      availableStock / (product?.total_pieces_per_box || 1)
    );
    const maxSheets = Math.floor(
      availableStock / (product?.pieces_per_sheet || 1)
    );

    if (quantityMode.boxes > maxBoxes && maxBoxes > 0) {
      newErrors.push(
        `Maximum ${maxBoxes} boxes available (${
          maxBoxes * (product?.total_pieces_per_box || 0)
        } pieces)`
      );
    }

    if (quantityMode.sheets > maxSheets && maxSheets > 0) {
      newErrors.push(
        `Maximum ${maxSheets} sheets available (${
          maxSheets * (product?.pieces_per_sheet || 0)
        } pieces)`
      );
    }

    if (quantityMode.pieces > availableStock) {
      newErrors.push(`Maximum ${availableStock} individual pieces available`);
    }

    setErrors(newErrors);
    setIsValid(
      newErrors.length === 0 && totalPieces > 0 && totalPieces <= availableStock
    );
  }, [quantityMode, totalPieces, availableStock, product]);

  const handleQuantityChange = (type, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);

    // Apply smart limiters based on stock and packaging
    let limitedValue = numValue;

    if (type === "boxes") {
      const maxBoxes = Math.floor(
        availableStock / (product?.total_pieces_per_box || 1)
      );
      limitedValue = Math.min(numValue, maxBoxes);
    } else if (type === "sheets") {
      const maxSheets = Math.floor(
        availableStock / (product?.pieces_per_sheet || 1)
      );
      limitedValue = Math.min(numValue, maxSheets);
    } else if (type === "pieces") {
      limitedValue = Math.min(numValue, availableStock);
    }

    setQuantityMode((prev) => ({
      ...prev,
      [type]: limitedValue,
    }));
  };

  const handleIncrement = (type) => {
    setQuantityMode((prev) => {
      let newValue = prev[type] + 1;

      // Apply limiters for increment
      if (type === "boxes") {
        const maxBoxes = Math.floor(
          availableStock / (product?.total_pieces_per_box || 1)
        );
        newValue = Math.min(newValue, maxBoxes);
      } else if (type === "sheets") {
        const maxSheets = Math.floor(
          availableStock / (product?.pieces_per_sheet || 1)
        );
        newValue = Math.min(newValue, maxSheets);
      } else if (type === "pieces") {
        newValue = Math.min(newValue, availableStock);
      }

      // Check if total would exceed stock
      const testQuantity = { ...prev, [type]: newValue };
      const testTotal = calculateTotalPieces(
        testQuantity.boxes,
        testQuantity.sheets,
        testQuantity.pieces
      );

      if (testTotal > availableStock) {
        return prev; // Don't increment if it would exceed stock
      }

      return {
        ...prev,
        [type]: newValue,
      };
    });
  };

  const handleDecrement = (type) => {
    setQuantityMode((prev) => ({
      ...prev,
      [type]: Math.max(0, prev[type] - 1),
    }));
  };

  const handleAddToCart = () => {
    if (!isValid || !product) return;

    const success = onAddToCart(product, {
      boxes: quantityMode.boxes,
      sheets: quantityMode.sheets,
      pieces: quantityMode.pieces,
    });

    if (success) {
      onClose();
    }
  };

  const handleQuickAdd = (type) => {
    const maxBoxes = Math.floor(
      availableStock / (product?.total_pieces_per_box || 1)
    );
    const maxSheets = Math.floor(
      availableStock / (product?.pieces_per_sheet || 1)
    );

    switch (type) {
      case "box":
        if (maxBoxes >= 1) {
          setQuantityMode({ boxes: 1, sheets: 0, pieces: 0 });
        }
        break;
      case "sheet":
        if (maxSheets >= 1) {
          setQuantityMode({ boxes: 0, sheets: 1, pieces: 0 });
        }
        break;
      case "piece":
        if (availableStock >= 1) {
          setQuantityMode({ boxes: 0, sheets: 0, pieces: 1 });
        }
        break;
      default:
        break;
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Select Quantity
              </h3>
              <p className="text-sm text-gray-500 truncate max-w-48">
                {product.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Product Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Available Stock:
              </span>
              <div className="text-right">
                <span className="text-lg font-bold text-green-600">
                  {availableStock} pieces
                </span>
                {existingQuantity > 0 && (
                  <p className="text-xs text-gray-500">
                    ({existingQuantity} already in cart)
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <p>• {product.pieces_per_sheet} pieces per sheet</p>
                <p>• {product.sheets_per_box} sheets per box</p>
              </div>
              <div>
                <p>• {product.total_pieces_per_box} pieces per box</p>
                <p>• ₱{product.selling_price.toFixed(2)} per piece</p>
              </div>
            </div>
            {product.brand_name && (
              <div className="mt-2 text-xs text-blue-600">
                <p>Brand: {product.brand_name}</p>
              </div>
            )}
            {product.expiry_date && (
              <div className="mt-1 text-xs text-orange-600">
                <p>
                  Expires: {new Date(product.expiry_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Quick Add Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {(() => {
              const maxBoxes = Math.floor(
                availableStock / (product?.total_pieces_per_box || 1)
              );
              const maxSheets = Math.floor(
                availableStock / (product?.pieces_per_sheet || 1)
              );

              return (
                <>
                  <button
                    onClick={() => handleQuickAdd("box")}
                    disabled={maxBoxes < 1}
                    className={`p-3 border rounded-lg transition-colors text-center ${
                      maxBoxes >= 1
                        ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
                        : "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <Box
                      size={20}
                      className={`mx-auto mb-1 ${
                        maxBoxes >= 1 ? "text-blue-600" : "text-gray-400"
                      }`}
                    />
                    <p
                      className={`text-xs font-medium ${
                        maxBoxes >= 1 ? "text-blue-700" : "text-gray-500"
                      }`}
                    >
                      1 Box
                    </p>
                    <p className="text-xs text-gray-500">Max: {maxBoxes}</p>
                  </button>

                  <button
                    onClick={() => handleQuickAdd("sheet")}
                    disabled={maxSheets < 1}
                    className={`p-3 border rounded-lg transition-colors text-center ${
                      maxSheets >= 1
                        ? "bg-green-50 border-green-200 hover:bg-green-100"
                        : "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <Layers
                      size={20}
                      className={`mx-auto mb-1 ${
                        maxSheets >= 1 ? "text-green-600" : "text-gray-400"
                      }`}
                    />
                    <p
                      className={`text-xs font-medium ${
                        maxSheets >= 1 ? "text-green-700" : "text-gray-500"
                      }`}
                    >
                      1 Sheet
                    </p>
                    <p className="text-xs text-gray-500">Max: {maxSheets}</p>
                  </button>

                  <button
                    onClick={() => handleQuickAdd("piece")}
                    disabled={availableStock < 1}
                    className={`p-3 border rounded-lg transition-colors text-center ${
                      availableStock >= 1
                        ? "bg-orange-50 border-orange-200 hover:bg-orange-100"
                        : "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <Hash
                      size={20}
                      className={`mx-auto mb-1 ${
                        availableStock >= 1
                          ? "text-orange-600"
                          : "text-gray-400"
                      }`}
                    />
                    <p
                      className={`text-xs font-medium ${
                        availableStock >= 1
                          ? "text-orange-700"
                          : "text-gray-500"
                      }`}
                    >
                      1 Piece
                    </p>
                    <p className="text-xs text-gray-500">
                      Max: {availableStock}
                    </p>
                  </button>
                </>
              );
            })()}
          </div>

          {/* Quantity Selectors */}
          <div className="space-y-4">
            {/* Boxes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Box size={20} className="text-blue-600" />
                  <span className="font-semibold text-blue-800">Boxes</span>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    {product.total_pieces_per_box} pcs/box
                  </span>
                </div>
                <span className="text-sm font-medium text-blue-700">
                  {quantityMode.boxes * product.total_pieces_per_box} pieces
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDecrement("boxes")}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min="0"
                  value={quantityMode.boxes}
                  onChange={(e) =>
                    handleQuantityChange("boxes", e.target.value)
                  }
                  className="w-20 text-center border border-blue-300 rounded-lg py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => handleIncrement("boxes")}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Sheets */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers size={20} className="text-green-600" />
                  <span className="font-semibold text-green-800">Sheets</span>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    {product.pieces_per_sheet} pcs/sheet
                  </span>
                </div>
                <span className="text-sm font-medium text-green-700">
                  {quantityMode.sheets * product.pieces_per_sheet} pieces
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDecrement("sheets")}
                  className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min="0"
                  value={quantityMode.sheets}
                  onChange={(e) =>
                    handleQuantityChange("sheets", e.target.value)
                  }
                  className="w-20 text-center border border-green-300 rounded-lg py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  onClick={() => handleIncrement("sheets")}
                  className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Pieces */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Hash size={20} className="text-orange-600" />
                  <span className="font-semibold text-orange-800">
                    Individual Pieces
                  </span>
                </div>
                <span className="text-sm font-medium text-orange-700">
                  {quantityMode.pieces} pieces
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDecrement("pieces")}
                  className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min="0"
                  value={quantityMode.pieces}
                  onChange={(e) =>
                    handleQuantityChange("pieces", e.target.value)
                  }
                  className="w-20 text-center border border-orange-300 rounded-lg py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <button
                  onClick={() => handleIncrement("pieces")}
                  className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  Please fix the following issues:
                </span>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li
                    key={`summary-${index}`}
                    className="flex items-center gap-1"
                  >
                    <span>•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Total Summary */}
          <div
            className={`rounded-lg p-4 ${
              isValid ? "bg-green-50 border border-green-200" : "bg-gray-100"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-700">
                Total Quantity:
              </span>
              <div className="flex items-center gap-2">
                {isValid && (
                  <CheckCircle size={16} className="text-green-600" />
                )}
                <span
                  className={`text-xl font-bold ${
                    isValid ? "text-green-600" : "text-gray-600"
                  }`}
                >
                  {totalPieces} pieces
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Total Amount:</span>
              <span className="font-semibold">₱{totalAmount.toFixed(2)}</span>
            </div>
            {totalPieces > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                <p>
                  {quantityMode.boxes > 0 &&
                    `${quantityMode.boxes} box${
                      quantityMode.boxes > 1 ? "es" : ""
                    }`}
                  {quantityMode.boxes > 0 &&
                    (quantityMode.sheets > 0 || quantityMode.pieces > 0) &&
                    " + "}
                  {quantityMode.sheets > 0 &&
                    `${quantityMode.sheets} sheet${
                      quantityMode.sheets > 1 ? "s" : ""
                    }`}
                  {quantityMode.sheets > 0 && quantityMode.pieces > 0 && " + "}
                  {quantityMode.pieces > 0 &&
                    `${quantityMode.pieces} piece${
                      quantityMode.pieces > 1 ? "s" : ""
                    }`}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToCart}
              disabled={!isValid}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                isValid
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <ShoppingCart size={16} />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

QuantitySelectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    selling_price: PropTypes.number,
    total_stock: PropTypes.number,
    pieces_per_sheet: PropTypes.number,
    sheets_per_box: PropTypes.number,
    total_pieces_per_box: PropTypes.number,
    brand_name: PropTypes.string,
    expiry_date: PropTypes.string,
  }).isRequired,
  onAddToCart: PropTypes.func.isRequired,
  existingQuantity: PropTypes.number,
};

QuantitySelectionModal.defaultProps = {
  existingQuantity: 0,
};

export default QuantitySelectionModal;
