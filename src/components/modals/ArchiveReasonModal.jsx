import React, { useState } from "react";
import { X, Archive, AlertTriangle } from "lucide-react";
import PropTypes from "prop-types";

const ArchiveReasonModal = ({
  isOpen,
  onClose,
  onConfirm,
  product,
  isLoading = false,
}) => {
  const [reason, setReason] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");

  const presetReasons = [
    "Product expired",
    "Damaged/defective product",
    "Low demand",
    "Discontinued by supplier",
    "Inventory cleanup",
    "Quality control issue",
    "Regulatory compliance",
    "Other",
  ];

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset);
    if (preset === "Other") {
      setReason("");
    } else {
      setReason(preset);
    }
  };

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert("Please provide a reason for archiving this product.");
      return;
    }
    onConfirm(reason);
    handleClose();
  };

  const handleClose = () => {
    setReason("");
    setSelectedPreset("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Archive className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Archive Product
              </h2>
              <p className="text-sm text-gray-500">
                Provide a reason for archiving
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Product Info */}
          {product && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {product.name?.charAt(0) || "P"}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Stock: {product.total_stock || product.stock || 0} units
                  </p>
                  {product.category && (
                    <p className="text-xs text-gray-400">{product.category}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Archive Confirmation
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  This product will be moved to the archive and removed from
                  active inventory. You can restore it later if needed.
                </p>
              </div>
            </div>
          </div>

          {/* Preset Reasons */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select a reason for archiving:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presetReasons.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handlePresetSelect(preset)}
                  className={`text-left p-3 rounded-lg border transition-colors text-sm ${
                    selectedPreset === preset
                      ? "border-orange-300 bg-orange-50 text-orange-700"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reason Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedPreset === "Other"
                ? "Specify reason:"
                : "Additional details (optional):"}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                selectedPreset === "Other"
                  ? "Please specify the reason for archiving this product..."
                  : "Add any additional details about why this product is being archived..."
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !reason.trim()}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Archiving...
              </>
            ) : (
              <>
                <Archive size={16} />
                Archive Product
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

ArchiveReasonModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  product: PropTypes.object,
  isLoading: PropTypes.bool,
};

export default ArchiveReasonModal;
