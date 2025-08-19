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

  // Validate selection
  useEffect(() => {
    const totalPieces = calculateTotalPieces(
      quantityMode.boxes,
      quantityMode.sheets,
      quantityMode.pieces
    );

    const newErrors = [];

    if (totalPieces <= 0) {
      newErrors.push("Please specify a quantity greater than 0");
    }

    if (totalPieces > (product?.total_stock || 0)) {
      newErrors.push(
        `Only ${product?.total_stock || 0} pieces available in stock`
      );
    }

    setErrors(newErrors);
    setIsValid(newErrors.length === 0 && totalPieces > 0);
  }, [quantityMode, product, calculateTotalPieces]);

  const handleQuantityChange = (type, value) => {
    const newValue = Math.max(0, parseInt(value) || 0);
    setQuantityMode((prev) => ({
      ...prev,
      [type]: newValue,
    }));
  };

  const incrementQuantity = (type) => {
    setQuantityMode((prev) => ({
      ...prev,
      [type]: prev[type] + 1,
    }));
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

    onAddToCart({
      ...product,
      selectedQuantity: totalPieces,
      quantityBreakdown: quantityMode,
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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 transform transition-all duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
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
          {/* Stock Information */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-green-800 font-semibold">
                Available Stock:
              </span>
              <span className="text-2xl font-bold text-green-600">
                {product.total_stock || 0} pieces
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-green-700">
              <div>
                • {product.pieces_per_sheet || 1} pieces per sheet •{" "}
                {product.sheets_per_box || 1} sheets per box
              </div>
              <div>
                •{" "}
                {product.total_pieces_per_box || product.pieces_per_sheet || 1}{" "}
                pieces per box • ₱{product.selling_price || product.price || 0}{" "}
                per piece
              </div>
            </div>
          </div>

          {/* Quick Selection Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() =>
                setQuantityMode({ boxes: 1, sheets: 0, pieces: 0 })
              }
              className="p-4 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
            >
              <Box size={20} className="mx-auto text-blue-600 mb-1" />
              <div className="text-sm font-semibold text-blue-700">1 Box</div>
              <div className="text-xs text-blue-600">
                Max:{" "}
                {Math.floor(
                  (product.total_stock || 0) /
                    (product.total_pieces_per_box || 1)
                )}
              </div>
            </button>

            <button
              onClick={() =>
                setQuantityMode({ boxes: 0, sheets: 1, pieces: 0 })
              }
              className="p-4 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-colors text-center"
            >
              <Layers size={20} className="mx-auto text-green-600 mb-1" />
              <div className="text-sm font-semibold text-green-700">
                1 Sheet
              </div>
              <div className="text-xs text-green-600">
                Max:{" "}
                {Math.floor(
                  (product.total_stock || 0) / (product.pieces_per_sheet || 1)
                )}
              </div>
            </button>

            <button
              onClick={() =>
                setQuantityMode({ boxes: 0, sheets: 0, pieces: 1 })
              }
              className="p-4 border-2 border-orange-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-colors text-center"
            >
              <Hash size={20} className="mx-auto text-orange-600 mb-1" />
              <div className="text-sm font-semibold text-orange-700">
                1 Piece
              </div>
              <div className="text-xs text-orange-600">
                Max: {product.total_stock || 0}
              </div>
            </button>
          </div>

          {/* Quantity Selectors */}
          <div className="space-y-4">
            {/* Boxes */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Box size={18} className="text-blue-600" />
                  <span className="font-semibold text-blue-800">Boxes</span>
                  <span className="text-sm text-blue-600">
                    {product.total_pieces_per_box || 1} pcs/box
                  </span>
                </div>
                <span className="text-sm font-semibold text-blue-700">
                  {quantityMode.boxes * (product.total_pieces_per_box || 1)}{" "}
                  pieces
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => decrementQuantity("boxes")}
                  className="p-2 rounded-lg bg-blue-200 hover:bg-blue-300 text-blue-700 transition-colors"
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
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => incrementQuantity("boxes")}
                  className="p-2 rounded-lg bg-blue-200 hover:bg-blue-300 text-blue-700 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Sheets */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-green-600" />
                  <span className="font-semibold text-green-800">Sheets</span>
                  <span className="text-sm text-green-600">
                    {product.pieces_per_sheet || 1} pcs/sheet
                  </span>
                </div>
                <span className="text-sm font-semibold text-green-700">
                  {quantityMode.sheets * (product.pieces_per_sheet || 1)} pieces
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => decrementQuantity("sheets")}
                  className="p-2 rounded-lg bg-green-200 hover:bg-green-300 text-green-700 transition-colors"
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
                  className="flex-1 px-3 py-2 border border-green-300 rounded-lg text-center font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={() => incrementQuantity("sheets")}
                  className="p-2 rounded-lg bg-green-200 hover:bg-green-300 text-green-700 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Individual Pieces */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Hash size={18} className="text-orange-600" />
                  <span className="font-semibold text-orange-800">
                    Individual Pieces
                  </span>
                </div>
                <span className="text-sm font-semibold text-orange-700">
                  {quantityMode.pieces} pieces
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => decrementQuantity("pieces")}
                  className="p-2 rounded-lg bg-orange-200 hover:bg-orange-300 text-orange-700 transition-colors"
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
                  className="flex-1 px-3 py-2 border border-orange-300 rounded-lg text-center font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={() => incrementQuantity("pieces")}
                  className="p-2 rounded-lg bg-orange-200 hover:bg-orange-300 text-orange-700 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={20}
                  className="text-red-600 mt-1 flex-shrink-0"
                />
                <div>
                  <h4 className="font-semibold text-red-800 mb-2">
                    Please fix the following issues:
                  </h4>
                  <ul className="text-red-700 text-sm space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Total Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">
                Total Quantity:
              </span>
              <span className="text-2xl font-bold text-blue-600">
                {totalSelectedPieces} pieces
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
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
