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
  ShoppingCart,
  CheckCircle,
} from "lucide-react";

export function QuantitySelectionModal({
  isOpen,
  onClose,
  product,
  onAddToCart,
  existingQuantity = 0, // eslint-disable-line no-unused-vars
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
  const calculateTotalPieces = React.useCallback(
    (boxes, sheets, pieces) => {
      if (!product) return 0;

      const piecesFromBoxes = boxes * (product.total_pieces_per_box || 0);
      const piecesFromSheets = sheets * (product.pieces_per_sheet || 0);
      return piecesFromBoxes + piecesFromSheets + pieces;
    },
    [product]
  );

  // Validate quantities and calculate totals
  useEffect(() => {
    const newErrors = [];
    const totalPieces = calculateTotalPieces(
      quantityMode.boxes,
      quantityMode.sheets,
      quantityMode.pieces
    );

    // Check if any quantity is selected
    if (totalPieces === 0) {
      newErrors.push("Please select at least one item");
    }

    // Check stock availability
    if (totalPieces > (product?.total_stock || 0)) {
      newErrors.push(
        `Not enough stock available (${
          product?.total_stock || 0
        } pieces remaining)`
      );
    }

    // Check for negative values
    if (
      quantityMode.boxes < 0 ||
      quantityMode.sheets < 0 ||
      quantityMode.pieces < 0
    ) {
      newErrors.push("Quantities cannot be negative");
    }

    setErrors(newErrors);
    setIsValid(newErrors.length === 0 && totalPieces > 0);
  }, [quantityMode, product, calculateTotalPieces]);

  const handleQuantityChange = (type, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    setQuantityMode((prev) => ({ ...prev, [type]: numValue }));
  };

  const incrementQuantity = (type) => {
    setQuantityMode((prev) => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const decrementQuantity = (type) => {
    setQuantityMode((prev) => ({
      ...prev,
      [type]: Math.max(0, prev[type] - 1),
    }));
  };

  const handleAddToCart = () => {
    if (!isValid) return;

    const totalPieces = calculateTotalPieces(
      quantityMode.boxes,
      quantityMode.sheets,
      quantityMode.pieces
    );

    // Call onAddToCart with product and quantityInfo as separate parameters
    onAddToCart(product, {
      boxes: quantityMode.boxes,
      sheets: quantityMode.sheets,
      pieces: quantityMode.pieces,
      totalPieces: totalPieces,
    });

    onClose();
  };

  const totalSelectedPieces = calculateTotalPieces(
    quantityMode.boxes,
    quantityMode.sheets,
    quantityMode.pieces
  );

  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900/60 via-blue-900/40 to-slate-900/60 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/20 transform transition-all duration-500 ease-out scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Gradient */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-t-3xl p-6 overflow-hidden">
          {/* Decorative background shapes */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30">
                <Package size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">Select Quantity</h3>
                <p className="text-blue-100 text-sm font-medium truncate max-w-64">
                  {product.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 text-white/80 hover:text-white rounded-2xl hover:bg-white/20 transition-all duration-200"
            >
              <X size={24} />
            </button>
          </div>

          {/* Stock Information Card */}
          <div className="relative z-10 mt-6 bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-blue-100 text-sm font-medium">
                  Available Stock
                </span>
                <div className="text-3xl font-bold text-white flex items-center gap-2">
                  {product.total_stock || 0}
                  <span className="text-lg font-medium text-blue-100">
                    pieces
                  </span>
                </div>
              </div>
              <div className="text-right text-blue-100 text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <Layers size={16} />
                  <span>{product.pieces_per_sheet || 1} pieces/sheet</span>
                </div>
                <div className="flex items-center gap-2">
                  <Box size={16} />
                  <span>{product.sheets_per_box || 1} sheets/box</span>
                </div>
                <div className="text-blue-200 font-semibold">
                  ₱{(product.selling_price || product.price || 0).toFixed(2)}
                  /piece
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-50/80 to-white">
          {/* Quick Selection Cards */}
          <div className="grid grid-cols-3 gap-4">
            <button
              className="group p-5 bg-gradient-to-br from-blue-50 to-blue-100/80 border-2 border-blue-200/60 rounded-2xl hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              onClick={() =>
                setQuantityMode({ boxes: 1, sheets: 0, pieces: 0 })
              }
            >
              <Box
                size={32}
                className="text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300"
              />
              <div className="text-base font-bold text-blue-800">1 Box</div>
              <div className="text-xs text-blue-600 mt-1">
                Max:{" "}
                {Math.floor(
                  (product.total_stock || 0) /
                    (product.total_pieces_per_box || 1)
                )}
              </div>
            </button>

            <button
              className="group p-5 bg-gradient-to-br from-green-50 to-green-100/80 border-2 border-green-200/60 rounded-2xl hover:from-green-100 hover:to-green-200 hover:border-green-300 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              onClick={() =>
                setQuantityMode({ boxes: 0, sheets: 1, pieces: 0 })
              }
            >
              <Layers
                size={32}
                className="text-green-600 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300"
              />
              <div className="text-base font-bold text-green-800">1 Sheet</div>
              <div className="text-xs text-green-600 mt-1">
                Max:{" "}
                {Math.floor(
                  (product.total_stock || 0) / (product.pieces_per_sheet || 1)
                )}
              </div>
            </button>

            <button
              className="group p-5 bg-gradient-to-br from-orange-50 to-orange-100/80 border-2 border-orange-200/60 rounded-2xl hover:from-orange-100 hover:to-orange-200 hover:border-orange-300 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              onClick={() =>
                setQuantityMode({ boxes: 0, sheets: 0, pieces: 1 })
              }
            >
              <Hash
                size={32}
                className="text-orange-600 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300"
              />
              <div className="text-base font-bold text-orange-800">1 Piece</div>
              <div className="text-xs text-orange-600 mt-1">
                Max: {product.total_stock || 0}
              </div>
            </button>
          </div>

          {/* Detailed Quantity Controls */}
          <div className="space-y-4">
            {/* Boxes */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-blue-200/30 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Box size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-blue-800">Boxes</span>
                    <div className="text-sm text-blue-600">
                      {product.total_pieces_per_box ||
                        (product.pieces_per_sheet || 1) *
                          (product.sheets_per_box || 1)}{" "}
                      pcs/box
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-600">
                    {quantityMode.boxes *
                      (product.total_pieces_per_box ||
                        (product.pieces_per_sheet || 1) *
                          (product.sheets_per_box || 1))}{" "}
                    pieces
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => decrementQuantity("boxes")}
                  className="p-2 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors"
                >
                  <Minus size={20} className="text-blue-600" />
                </button>
                <input
                  type="number"
                  min="0"
                  value={quantityMode.boxes}
                  onChange={(e) =>
                    handleQuantityChange("boxes", e.target.value)
                  }
                  className="flex-1 text-center text-lg font-semibold py-3 px-4 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => incrementQuantity("boxes")}
                  className="p-2 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors"
                >
                  <Plus size={20} className="text-blue-600" />
                </button>
              </div>
            </div>

            {/* Sheets */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-green-200/30 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-xl">
                    <Layers size={20} className="text-green-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-green-800">Sheets</span>
                    <div className="text-sm text-green-600">
                      {product.pieces_per_sheet || 1} pcs/sheet
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-600">
                    {quantityMode.sheets * (product.pieces_per_sheet || 1)}{" "}
                    pieces
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => decrementQuantity("sheets")}
                  className="p-2 bg-green-100 hover:bg-green-200 rounded-xl transition-colors"
                >
                  <Minus size={20} className="text-green-600" />
                </button>
                <input
                  type="number"
                  min="0"
                  value={quantityMode.sheets}
                  onChange={(e) =>
                    handleQuantityChange("sheets", e.target.value)
                  }
                  className="flex-1 text-center text-lg font-semibold py-3 px-4 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  onClick={() => incrementQuantity("sheets")}
                  className="p-2 bg-green-100 hover:bg-green-200 rounded-xl transition-colors"
                >
                  <Plus size={20} className="text-green-600" />
                </button>
              </div>
            </div>

            {/* Individual Pieces */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-orange-200/30 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-xl">
                    <Hash size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-orange-800">
                      Individual Pieces
                    </span>
                    <div className="text-sm text-orange-600">1 piece each</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-orange-600">
                    {quantityMode.pieces} pieces
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => decrementQuantity("pieces")}
                  className="p-2 bg-orange-100 hover:bg-orange-200 rounded-xl transition-colors"
                >
                  <Minus size={20} className="text-orange-600" />
                </button>
                <input
                  type="number"
                  min="0"
                  value={quantityMode.pieces}
                  onChange={(e) =>
                    handleQuantityChange("pieces", e.target.value)
                  }
                  className="flex-1 text-center text-lg font-semibold py-3 px-4 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <button
                  onClick={() => incrementQuantity("pieces")}
                  className="p-2 bg-orange-100 hover:bg-orange-200 rounded-xl transition-colors"
                >
                  <Plus size={20} className="text-orange-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Total Summary */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-5 border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">
                Total Selected:
              </span>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {totalSelectedPieces} pieces
                </div>
                <div className="text-sm text-gray-600">
                  ₱
                  {(
                    totalSelectedPieces *
                    (product.selling_price || product.price || 0)
                  ).toFixed(2)}{" "}
                  total
                </div>
              </div>
            </div>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-red-800 mb-2">
                <AlertTriangle size={20} />
                <span className="font-semibold">
                  Please fix the following issues:
                </span>
              </div>
              <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-white/80 backdrop-blur-sm rounded-b-3xl">
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-2xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToCart}
              disabled={!isValid}
              className={`flex-1 px-6 py-3 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 ${
                isValid
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isValid ? (
                <>
                  <CheckCircle size={20} />
                  Add to Cart
                </>
              ) : (
                <>
                  <ShoppingCart size={20} />
                  Add to Cart
                </>
              )}
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
    price: PropTypes.number,
    selling_price: PropTypes.number,
    total_stock: PropTypes.number,
    pieces_per_sheet: PropTypes.number,
    sheets_per_box: PropTypes.number,
    total_pieces_per_box: PropTypes.number,
  }).isRequired,
  onAddToCart: PropTypes.func.isRequired,
  existingQuantity: PropTypes.number,
};

QuantitySelectionModal.defaultProps = {
  existingQuantity: 0,
};

export default QuantitySelectionModal;
