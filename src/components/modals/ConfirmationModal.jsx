import React from "react";
import {
  X,
  AlertTriangle,
  Archive,
  Trash2,
  CheckCircle,
  Info,
} from "lucide-react";

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "warning", // "warning", "danger", "info", "success"
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <Trash2 size={24} className="text-red-600" />;
      case "warning":
        return <AlertTriangle size={24} className="text-orange-600" />;
      case "success":
        return <CheckCircle size={24} className="text-green-600" />;
      case "archive":
        return <Archive size={24} className="text-blue-600" />;
      default:
        return <Info size={24} className="text-blue-600" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case "danger":
        return {
          bg: "bg-red-100",
          button: "bg-red-600 hover:bg-red-700",
          text: "text-red-800",
        };
      case "warning":
        return {
          bg: "bg-orange-100",
          button: "bg-orange-600 hover:bg-orange-700",
          text: "text-orange-800",
        };
      case "success":
        return {
          bg: "bg-green-100",
          button: "bg-green-600 hover:bg-green-700",
          text: "text-green-800",
        };
      case "archive":
        return {
          bg: "bg-blue-100",
          button: "bg-blue-600 hover:bg-blue-700",
          text: "text-blue-800",
        };
      default:
        return {
          bg: "bg-blue-100",
          button: "bg-blue-600 hover:bg-blue-700",
          text: "text-blue-800",
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${colors.bg} rounded-lg`}>{getIcon()}</div>
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className={`text-sm ${colors.text}`}>{message}</p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 ${colors.button} text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Specific confirmation modals for common actions
export function DeleteProductModal({
  isOpen,
  onClose,
  onConfirm,
  productName,
  isLoading = false,
}) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Product"
      message={`Are you sure you want to permanently delete "${productName}"? This action cannot be undone.`}
      type="danger"
      confirmText="Delete"
      isLoading={isLoading}
    />
  );
}

export function ArchiveProductModal({
  isOpen,
  onClose,
  onConfirm,
  productName,
  isLoading = false,
}) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Archive Product"
      message={`Are you sure you want to archive "${productName}"? Archived products will not appear in the main inventory but can be restored later.`}
      type="archive"
      confirmText="Archive"
      isLoading={isLoading}
    />
  );
}

export function BulkArchiveModal({
  isOpen,
  onClose,
  onConfirm,
  count,
  isLoading = false,
}) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Archive Products"
      message={`Are you sure you want to archive ${count} selected product${
        count > 1 ? "s" : ""
      }? Archived products will not appear in the main inventory but can be restored later.`}
      type="archive"
      confirmText={`Archive ${count} Product${count > 1 ? "s" : ""}`}
      isLoading={isLoading}
    />
  );
}

export function BulkDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  count,
  isLoading = false,
}) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Products"
      message={`Are you sure you want to permanently delete ${count} selected product${
        count > 1 ? "s" : ""
      }? This action cannot be undone.`}
      type="danger"
      confirmText={`Delete ${count} Product${count > 1 ? "s" : ""}`}
      isLoading={isLoading}
    />
  );
}
