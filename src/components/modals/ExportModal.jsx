import React, { useState } from "react";
import {
  X,
  FileText,
  Download,
  Package,
  AlertTriangle,
  DollarSign,
  List,
  Calendar,
  BarChart3,
} from "lucide-react";
import { useNotification } from "../../hooks/useNotification.js";
import {
  generateProductCatalogPDF,
  generateLowStockReportPDF,
  generateInventoryValuationPDF,
  generateTransactionHistoryPDF,
  generateSalesReportPDF,
  generateProductListPDF,
  testPDFGeneration,
} from "../../utils/pdfUtils.js";

export function ExportModal({
  isOpen,
  onClose,
  data = [],
  dataType = "products",
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    groupByCategory: true,
    includeFinancials: true,
    includeImages: false,
    reportType: "catalog",
  });

  const { addNotification } = useNotification();

  const handleExport = async (reportType) => {
    console.log("🔧 Export started:", reportType, "Data count:", data.length);
    setIsExporting(true);

    try {
      let result;
      const timestamp = new Date().toISOString().split("T")[0];

      // Prepare export options
      const options = {
        title: getReportTitle(reportType),
        filename: `${reportType}-${timestamp}.pdf`,
        groupByCategory: exportOptions.groupByCategory,
        includeFinancials: exportOptions.includeFinancials,
        includeImages: exportOptions.includeImages,
        timestamp: new Date(),
        dataType,
      };

      // Test PDF generation first
      const testResult = testPDFGeneration();
      if (!testResult.success) {
        throw new Error(`PDF library test failed: ${testResult.error}`);
      }

      switch (reportType) {
        case "catalog": {
          result = await generateProductCatalogPDF(data, options);
          break;
        }
        case "lowStock": {
          const lowStockData = data.filter(
            (item) =>
              (item.stock || item.total_stock || 0) <=
              (item.critical_level || 10)
          );
          result = await generateLowStockReportPDF(
            lowStockData,
            options.filename
          );
          break;
        }
        case "valuation": {
          result = await generateInventoryValuationPDF(data, options.filename);
          break;
        }
        case "transactions": {
          result = await generateTransactionHistoryPDF(data, options.filename);
          break;
        }
        case "sales": {
          result = await generateSalesReportPDF(data, options.filename);
          break;
        }
        case "simple": {
          result = await generateProductListPDF(data, options.filename);
          break;
        }
        default:
          throw new Error("Unknown report type");
      }

      console.log("🔧 Export result:", result);

      if (result && result.success) {
        addNotification(
          `${getReportTitle(reportType)} exported successfully`,
          "success"
        );
        onClose();
      } else {
        throw new Error(result?.error || "Export failed");
      }
    } catch (error) {
      console.error("🔧 Export failed:", error);
      addNotification(`Export failed: ${error.message}`, "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleOptionChange = (key, value) => {
    setExportOptions((prev) => ({ ...prev, [key]: value }));
  };

  const getReportTitle = (reportType) => {
    const titles = {
      catalog: "Complete Product Catalog",
      lowStock: "Low Stock Report",
      valuation: "Inventory Valuation Report",
      transactions: "Transaction History Report",
      sales: "Sales Report",
      simple: "Simple Product List",
    };
    return titles[reportType] || "Report";
  };

  if (!isOpen) return null;

  // Filter data based on type for report options
  const lowStockItems = data.filter(
    (item) =>
      (item.stock || item.total_stock || 0) <= (item.critical_level || 10)
  );

  // Define export reports based on data type
  const getExportReports = () => {
    if (dataType === "transactions") {
      return [
        {
          type: "transactions",
          title: "Transaction History",
          description: "Complete transaction history with payment information",
          icon: <Calendar size={20} className="text-blue-600" />,
          color: "blue",
          count: data.length,
        },
        {
          type: "sales",
          title: "Sales Summary",
          description: "Sales performance analysis with totals and trends",
          icon: <BarChart3 size={20} className="text-green-600" />,
          color: "green",
          count: data.length,
        },
      ];
    }

    // Default product reports
    return [
      {
        type: "catalog",
        title: "Complete Product Catalog",
        description:
          "Full product listing with details, pricing, and stock levels",
        icon: <Package size={20} className="text-blue-600" />,
        color: "blue",
        count: data.length,
      },
      {
        type: "lowStock",
        title: "Low Stock Report",
        description:
          "Products that need restocking (at or below critical level)",
        icon: <AlertTriangle size={20} className="text-orange-600" />,
        color: "orange",
        count: lowStockItems.length,
      },
      {
        type: "valuation",
        title: "Inventory Valuation",
        description:
          "Financial overview with inventory values and profit analysis",
        icon: <DollarSign size={20} className="text-green-600" />,
        color: "green",
        count: data.length,
      },
      {
        type: "simple",
        title: "Simple Product List",
        description: "Basic product information without financial data",
        icon: <List size={20} className="text-purple-600" />,
        color: "purple",
        count: data.length,
      },
    ];
  };

  const exportReports = getExportReports();

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
            disabled={isExporting}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Export Options */}
          {dataType === "products" && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Export Options
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.groupByCategory}
                      onChange={(e) =>
                        handleOptionChange("groupByCategory", e.target.checked)
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isExporting}
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
                        handleOptionChange(
                          "includeFinancials",
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isExporting}
                    />
                    <span className="text-sm text-gray-700">
                      Include Financial Data
                    </span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeImages}
                      onChange={(e) =>
                        handleOptionChange("includeImages", e.target.checked)
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isExporting}
                    />
                    <span className="text-sm text-gray-700">
                      Include Product Images
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

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
                      {report.count}{" "}
                      {dataType === "transactions" ? "transaction" : "product"}
                      {report.count !== 1 ? "s" : ""}
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
                      : isExporting
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : `bg-${report.color}-600 text-white hover:bg-${report.color}-700`
                  }`}
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Generating...
                    </>
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
              {dataType === "products" && (
                <>
                  <li>
                    • Financial data includes costs, selling prices, profit
                    margins, and inventory values
                  </li>
                  <li>
                    • Stock levels are color-coded: Green (Available), Orange
                    (Low Stock), Red (Out of Stock)
                  </li>
                </>
              )}
              {dataType === "transactions" && (
                <>
                  <li>
                    • Transaction reports include payment methods, and item
                    breakdowns
                  </li>
                  <li>
                    • Sales reports provide performance analysis and trends
                  </li>
                </>
              )}
              <li>
                • All reports include a summary section with key{" "}
                {dataType === "transactions" ? "sales" : "inventory"} statistics
              </li>
            </ul>
          </div>

          {/* Data Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={16} className="text-green-600" />
              <h4 className="font-semibold text-green-800">Data Summary</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-800">
                  {data.length}
                </p>
                <p className="text-green-600">
                  Total{" "}
                  {dataType === "transactions" ? "Transactions" : "Products"}
                </p>
              </div>
              {dataType === "products" && (
                <>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-800">
                      {lowStockItems.length}
                    </p>
                    <p className="text-orange-600">Low Stock</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-800">
                      {
                        new Set(
                          data.map((item) => item.category).filter(Boolean)
                        ).size
                      }
                    </p>
                    <p className="text-blue-600">Categories</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-800">
                      ₱
                      {data
                        .reduce(
                          (sum, item) =>
                            sum +
                            (item.stock || item.total_stock || 0) *
                              (item.price || item.selling_price || 0),
                          0
                        )
                        .toLocaleString()}
                    </p>
                    <p className="text-purple-600">Total Value</p>
                  </div>
                </>
              )}
              {dataType === "transactions" && (
                <>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-800">
                      ₱
                      {data
                        .reduce((sum, txn) => sum + (txn.total_amount || 0), 0)
                        .toLocaleString()}
                    </p>
                    <p className="text-blue-600">Total Sales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-800">
                      {data.filter((txn) => txn.status === "completed").length}
                    </p>
                    <p className="text-orange-600">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-800">
                      {data.filter((txn) => txn.is_pwd_senior).length}
                    </p>
                    <p className="text-purple-600">PWD/Senior</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold disabled:opacity-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportModal;
