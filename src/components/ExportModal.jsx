import React, { useState } from "react";
import { X, Download, FileText, File, Package } from "lucide-react";
import PropTypes from "prop-types";

const ExportModal = ({ isOpen, onClose, products = [] }) => {
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportType, setExportType] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (products.length === 0) {
      alert("No products to export");
      return;
    }

    setIsExporting(true);

    try {
      let dataToExport = products;

      // Filter data based on export type
      if (exportType === "low-stock") {
        dataToExport = products.filter((product) => {
          const stock = product.stock || product.total_stock || 0;
          return stock <= 10; // Low stock threshold
        });
      } else if (exportType === "out-of-stock") {
        dataToExport = products.filter((product) => {
          const stock = product.stock || product.total_stock || 0;
          return stock === 0;
        });
      }

      if (dataToExport.length === 0) {
        alert("No products match the selected criteria");
        setIsExporting(false);
        return;
      }

      if (exportFormat === "csv") {
        exportToCSV(dataToExport);
      } else if (exportFormat === "json") {
        exportToJSON(dataToExport);
      }

      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
      setIsExporting(false);
    }
  };

  const exportToCSV = (data) => {
    const headers = [
      "name",
      "category",
      "price",
      "cost_price",
      "stock",
      "pieces_per_sheet",
      "sheets_per_box",
      "supplier",
      "description",
    ];

    const csvContent = [
      headers.join(","),
      ...data.map((product) => {
        return headers
          .map((header) => {
            let value = "";
            if (header === "price") {
              value = product.price || product.selling_price || 0;
            } else if (header === "stock") {
              value = product.stock || product.total_stock || 0;
            } else {
              value = product[header] || "";
            }
            // Escape commas and quotes in CSV
            return typeof value === "string" && value.includes(",")
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          })
          .join(",");
      }),
    ].join("\n");

    downloadFile(csvContent, "products.csv", "text/csv");
  };

  const exportToJSON = (data) => {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, "products.json", "application/json");
  };

  const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Download className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">Export Products</h2>
                <p className="text-green-100">Download product data</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-green-500 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Export Format */}
          <div>
            <div className="block text-sm font-semibold text-gray-700 mb-3">
              Export Format
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat("csv")}
                className={`flex items-center justify-center p-4 border-2 rounded-lg transition-colors ${
                  exportFormat === "csv"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <FileText className="w-6 h-6 mr-2" />
                CSV
              </button>
              <button
                onClick={() => setExportFormat("json")}
                className={`flex items-center justify-center p-4 border-2 rounded-lg transition-colors ${
                  exportFormat === "json"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <File className="w-6 h-6 mr-2" />
                JSON
              </button>
            </div>
          </div>

          {/* Export Type */}
          <div>
            <div className="block text-sm font-semibold text-gray-700 mb-3">
              Export Type
            </div>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportType"
                  value="all"
                  checked={exportType === "all"}
                  onChange={(e) => setExportType(e.target.value)}
                  className="mr-3 text-green-600"
                />
                <Package className="w-4 h-4 mr-2 text-gray-400" />
                All Products ({products.length})
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportType"
                  value="low-stock"
                  checked={exportType === "low-stock"}
                  onChange={(e) => setExportType(e.target.value)}
                  className="mr-3 text-green-600"
                />
                <Package className="w-4 h-4 mr-2 text-yellow-400" />
                Low Stock Products (≤ 10)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="exportType"
                  value="out-of-stock"
                  checked={exportType === "out-of-stock"}
                  onChange={(e) => setExportType(e.target.value)}
                  className="mr-3 text-green-600"
                />
                <Package className="w-4 h-4 mr-2 text-red-400" />
                Out of Stock Products
              </label>
            </div>
          </div>

          {/* Export Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> The {exportFormat.toUpperCase()} file will
              contain product information including name, category, pricing,
              stock levels, and supplier details.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ExportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  products: PropTypes.array,
};

export default ExportModal;
