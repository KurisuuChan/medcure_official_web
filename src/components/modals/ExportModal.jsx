import React, { useState } from "react";
import {
  X,
  FileText,
  Download,
  Package,
  AlertTriangle,
  DollarSign,
  List,
} from "lucide-react";
import {
  generateProductCatalogPDF,
  generateLowStockReportPDF,
  generateInventoryValuationPDF,
  generateProductListPDF,
} from "../../utils/pdfUtils.js";

export function ExportModal({ isOpen, onClose, products }) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    groupByCategory: true,
    includeFinancials: true,
    reportType: "catalog",
  });

  const handleExport = async (reportType) => {
    console.log("🔧 Export started:", reportType, "Products:", products.length);
    setIsExporting(true);

    try {
      let result;
      const timestamp = new Date().toISOString().split("T")[0];

      switch (reportType) {
        case "catalog":
          console.log("🔧 Generating catalog PDF...");
          result = generateProductCatalogPDF(products, {
            title: "Product Catalog",
            filename: `product-catalog-${timestamp}.pdf`,
            groupByCategory: exportOptions.groupByCategory,
            includeFinancials: exportOptions.includeFinancials,
          });
          break;
        case "lowStock":
          console.log("🔧 Generating low stock PDF...");
          result = generateLowStockReportPDF(
            products,
            `low-stock-report-${timestamp}.pdf`
          );
          break;
        case "valuation":
          console.log("🔧 Generating valuation PDF...");
          result = generateInventoryValuationPDF(
            products,
            `inventory-valuation-${timestamp}.pdf`
          );
          break;
        case "simple":
          result = generateProductListPDF(
            products,
            `product-list-${timestamp}.pdf`
          );
          break;
        default:
          throw new Error("Unknown report type");
      }

      console.log("🔧 Export result:", result);

      if (result && result.success) {
        console.log("🔧 Export successful, closing modal");
        onClose();
      } else {
        throw new Error(result?.error || "Export failed");
      }
    } catch (error) {
      console.error("🔧 Export failed:", error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOptionChange = (key, value) => {
    setExportOptions((prev) => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  const lowStockProducts = products.filter(
    (p) => (p.total_stock || 0) <= (p.critical_level || 10)
  );

  const exportReports = [
    {
      type: "catalog",
      title: "Complete Product Catalog",
      description:
        "Full product listing with details, pricing, and stock levels",
      icon: <Package size={20} className="text-blue-600" />,
      color: "blue",
      count: products.length,
    },
    {
      type: "lowStock",
      title: "Low Stock Report",
      description: "Products that need restocking (at or below critical level)",
      icon: <AlertTriangle size={20} className="text-orange-600" />,
      color: "orange",
      count: lowStockProducts.length,
    },
    {
      type: "valuation",
      title: "Inventory Valuation",
      description:
        "Financial overview with inventory values and profit analysis",
      icon: <DollarSign size={20} className="text-green-600" />,
      color: "green",
      count: products.length,
    },
    {
      type: "simple",
      title: "Simple Product List",
      description: "Basic product information without financial data",
      icon: <List size={20} className="text-purple-600" />,
      color: "purple",
      count: products.length,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText size={24} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Export Reports
              </h2>
              <p className="text-sm text-gray-500">
                Choose the type of report you want to generate
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Export Options */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Export Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.groupByCategory}
                    onChange={(e) =>
                      handleOptionChange("groupByCategory", e.target.checked)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Group by Category
                  </span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeFinancials}
                    onChange={(e) =>
                      handleOptionChange("includeFinancials", e.target.checked)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Include Financial Data
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Report Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exportReports.map((report) => (
              <div
                key={report.type}
                className="border-2 border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 bg-${report.color}-100 rounded-lg`}>
                    {report.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">
                      {report.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {report.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {report.count} product{report.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleExport(report.type)}
                  disabled={
                    isExporting ||
                    (report.type === "lowStock" && report.count === 0)
                  }
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    report.type === "lowStock" && report.count === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : `bg-${report.color}-600 text-white hover:bg-${report.color}-700`
                  }`}
                >
                  {isExporting ? (
                    "Generating..."
                  ) : (
                    <>
                      <Download size={16} />
                      Export PDF
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-blue-600" />
              <h4 className="font-semibold text-blue-800">
                PDF Export Information
              </h4>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • Reports are generated in PDF format for easy sharing and
                printing
              </li>
              <li>
                • Financial data includes costs, selling prices, profit margins,
                and inventory values
              </li>
              <li>
                • Stock levels are color-coded: Green (Available), Orange (Low
                Stock), Red (Out of Stock)
              </li>
              <li>
                • All reports include a summary section with key inventory
                statistics
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
