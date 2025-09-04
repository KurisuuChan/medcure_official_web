import React, { useState } from "react";
import { useReports } from "../hooks/useReports.js";
import ReportViewer from "../components/ReportViewer.jsx";
import {
  exportInventoryCSV,
  exportSalesCSV,
  exportLowStockCSV,
  exportProductPerformanceCSV,
  exportReportPDF,
} from "../utils/exportUtils.js";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Award,
  Calendar,
  Download,
  FileText,
  Activity,
  Package,
} from "lucide-react";

export default function Reports() {
  const {
    reports,
    loading,
    errors,
    generateInventory,
    generateSales,
    generateLowStock,
    generateProductPerformance,
  } = useReports();

  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const [reportOptions, setReportOptions] = useState({
    includeCharts: true,
    includeSummary: true,
    lowStockThreshold: 10,
  });

  const [viewingReport, setViewingReport] = useState(null);
  const [viewingReportType, setViewingReportType] = useState(null);

  /**
   * Handle inventory report generation
   */
  const handleInventoryReport = async (exportType = "view") => {
    try {
      const reportData = await generateInventory({
        includeLowStock: true,
        includeValuation: true,
        lowStockThreshold: reportOptions.lowStockThreshold,
      });

      if (exportType === "view") {
        setViewingReport(reportData);
        setViewingReportType("inventory");
      } else if (exportType === "pdf") {
        exportReportPDF(reportData, "inventory", "inventory-report.txt");
      } else if (exportType === "csv") {
        exportInventoryCSV(reportData);
      }
    } catch (error) {
      console.error("Error generating inventory report:", error);
    }
  };

  /**
   * Handle sales report generation
   */
  const handleSalesReport = async (exportType = "view") => {
    try {
      const options = {
        includeHourlyData: true,
        includeCategoryData: true,
        includeTopProducts: true,
      };

      if (dateRange.startDate && dateRange.endDate) {
        options.startDate = new Date(dateRange.startDate).toISOString();
        options.endDate = new Date(dateRange.endDate).toISOString();
      }

      const reportData = await generateSales(options);

      if (exportType === "view") {
        setViewingReport(reportData);
        setViewingReportType("sales");
      } else if (exportType === "pdf") {
        exportReportPDF(reportData, "sales", "sales-report.txt");
      } else if (exportType === "csv") {
        exportSalesCSV(reportData);
      }
    } catch (error) {
      console.error("Error generating sales report:", error);
    }
  };

  /**
   * Handle low stock report generation
   */
  const handleLowStockReport = async (exportType = "view") => {
    try {
      const reportData = await generateLowStock({
        threshold: reportOptions.lowStockThreshold,
        includeRecommendations: true,
      });

      if (exportType === "view") {
        setViewingReport(reportData);
        setViewingReportType("lowStock");
      } else if (exportType === "pdf") {
        exportReportPDF(reportData, "lowstock", "low-stock-report.txt");
      } else if (exportType === "csv") {
        exportLowStockCSV(reportData);
      }
    } catch (error) {
      console.error("Error generating low stock report:", error);
    }
  };

  /**
   * Handle product performance report generation
   */
  const handlePerformanceReport = async (exportType = "view") => {
    try {
      const options = {
        topCount: 20,
      };

      if (dateRange.startDate && dateRange.endDate) {
        options.startDate = new Date(dateRange.startDate).toISOString();
        options.endDate = new Date(dateRange.endDate).toISOString();
      }

      const reportData = await generateProductPerformance(options);

      if (exportType === "view") {
        setViewingReport(reportData);
        setViewingReportType("productPerformance");
      } else if (exportType === "pdf") {
        exportReportPDF(reportData, "performance", "product-performance.txt");
      } else if (exportType === "csv") {
        exportProductPerformanceCSV(reportData);
      }
    } catch (error) {
      console.error("Error generating performance report:", error);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <BarChart3 size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Analytics & Reports
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 leading-relaxed">
                Generate comprehensive business insights and export data for
                analysis.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center text-sm text-gray-500">
              <Activity className="w-4 h-4 mr-2" />
              Real-time data
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">
              Report Configuration
            </h3>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Low Stock Threshold
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={reportOptions.lowStockThreshold}
                  onChange={(e) =>
                    setReportOptions((prev) => ({
                      ...prev,
                      lowStockThreshold: parseInt(e.target.value) || 10,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                  units
                </span>
              </div>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600 font-medium">
              Quick select:
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDateRange({
                    startDate: new Date(
                      new Date().setDate(new Date().getDate() - 7)
                    )
                      .toISOString()
                      .split("T")[0],
                    endDate: new Date().toISOString().split("T")[0],
                  });
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Last 7 days
              </button>
              <button
                onClick={() => {
                  setDateRange({
                    startDate: new Date(
                      new Date().setDate(new Date().getDate() - 30)
                    )
                      .toISOString()
                      .split("T")[0],
                    endDate: new Date().toISOString().split("T")[0],
                  });
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Last 30 days
              </button>
              <button
                onClick={() => {
                  setDateRange({ startDate: "", endDate: "" });
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Report Cards Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inventory Report */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-800">
                    Inventory Analysis
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Stock levels, valuations & alerts
                  </p>
                </div>
              </div>
              {reports.inventory && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Ready
                </span>
              )}
            </div>

            {errors.inventory && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">⚠️ {errors.inventory}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => handleInventoryReport("view")}
                disabled={loading.inventory}
                className="w-full flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {loading.inventory ? (
                  <>
                    <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleInventoryReport("pdf")}
                  disabled={loading.inventory || !reports.inventory}
                  className="flex items-center justify-center px-3 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <FileText className="w-4 h-4 mr-1.5" />
                  TXT
                </button>
                <button
                  onClick={() => handleInventoryReport("csv")}
                  disabled={loading.inventory || !reports.inventory}
                  className="flex items-center justify-center px-3 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  CSV
                </button>
              </div>
            </div>

            {reports.inventory && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  {reports.inventory.summary.totalProducts} products analyzed
                </div>
              </div>
            )}
          </div>

          {/* Sales Report */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-800">
                    Sales Analytics
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Revenue trends & performance
                  </p>
                </div>
              </div>
              {reports.sales && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Ready
                </span>
              )}
            </div>

            {errors.sales && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">⚠️ {errors.sales}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => handleSalesReport("view")}
                disabled={loading.sales}
                className="w-full flex items-center justify-center px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {loading.sales ? (
                  <>
                    <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSalesReport("pdf")}
                  disabled={loading.sales || !reports.sales}
                  className="flex items-center justify-center px-3 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <FileText className="w-4 h-4 mr-1.5" />
                  TXT
                </button>
                <button
                  onClick={() => handleSalesReport("csv")}
                  disabled={loading.sales || !reports.sales}
                  className="flex items-center justify-center px-3 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  CSV
                </button>
              </div>
            </div>

            {reports.sales && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  {reports.sales.summary.totalSales} transactions analyzed
                </div>
              </div>
            )}
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-800">Stock Alerts</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Low inventory & reorder alerts
                  </p>
                </div>
              </div>
              {reports.lowStock && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    reports.lowStock.summary.totalLowStock > 0
                      ? "bg-orange-100 text-orange-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {reports.lowStock.summary.totalLowStock > 0
                    ? "Alerts"
                    : "Good"}
                </span>
              )}
            </div>

            {errors.lowStock && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">⚠️ {errors.lowStock}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => handleLowStockReport("view")}
                disabled={loading.lowStock}
                className="w-full flex items-center justify-center px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {loading.lowStock ? (
                  <>
                    <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Checking...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Check Stock
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleLowStockReport("pdf")}
                  disabled={loading.lowStock || !reports.lowStock}
                  className="flex items-center justify-center px-3 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <FileText className="w-4 h-4 mr-1.5" />
                  TXT
                </button>
                <button
                  onClick={() => handleLowStockReport("csv")}
                  disabled={loading.lowStock || !reports.lowStock}
                  className="flex items-center justify-center px-3 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  CSV
                </button>
              </div>
            </div>

            {reports.lowStock && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  {reports.lowStock.summary.totalLowStock > 0 ? (
                    <>
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                      <span className="text-orange-600 font-medium">
                        {reports.lowStock.summary.totalLowStock} products need
                        attention
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-green-600">
                        All products in stock
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Product Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-800">
                    Performance Insights
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Profitability & turnover analysis
                  </p>
                </div>
              </div>
              {reports.productPerformance && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Ready
                </span>
              )}
            </div>

            {errors.productPerformance && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">
                  ⚠️ {errors.productPerformance}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => handlePerformanceReport("view")}
                disabled={loading.productPerformance}
                className="w-full flex items-center justify-center px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {loading.productPerformance ? (
                  <>
                    <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4 mr-2" />
                    Analyze Performance
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePerformanceReport("pdf")}
                  disabled={
                    loading.productPerformance || !reports.productPerformance
                  }
                  className="flex items-center justify-center px-3 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <FileText className="w-4 h-4 mr-1.5" />
                  TXT
                </button>
                <button
                  onClick={() => handlePerformanceReport("csv")}
                  disabled={
                    loading.productPerformance || !reports.productPerformance
                  }
                  className="flex items-center justify-center px-3 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  CSV
                </button>
              </div>
            </div>

            {reports.productPerformance && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  {reports.productPerformance.summary.productsWithSales}{" "}
                  products with sales data
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Information Panel */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="font-semibold text-blue-800 mb-2">
                Report Overview
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                    <span>
                      <strong>Inventory Analysis:</strong> Current stock levels,
                      valuations & category insights
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                    <span>
                      <strong>Sales Analytics:</strong> Revenue trends,
                      transaction patterns & top performers
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></div>
                    <span>
                      <strong>Stock Alerts:</strong> Low inventory warnings with
                      reorder recommendations
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                    <span>
                      <strong>Performance Insights:</strong> Product
                      profitability & turnover analysis
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700 font-medium">
                    Export formats: CSV for analysis • TXT for detailed reports
                  </span>
                  <div className="flex items-center text-blue-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-xs">Live data</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Viewer Modal */}
        {viewingReport && viewingReportType && (
          <ReportViewer
            report={viewingReport}
            reportType={viewingReportType}
            onClose={() => {
              setViewingReport(null);
              setViewingReportType(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
