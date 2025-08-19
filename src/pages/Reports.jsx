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
    <div className="min-h-screen bg-gray-50/30">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-gray-900 tracking-tight">Analytics & Reports</h1>
            <p className="text-gray-500 mt-1 font-light">
              Generate insights and export business data
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Real-time data</span>
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex items-center mb-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
          <h3 className="font-medium text-gray-900">Report Configuration</h3>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all duration-200 bg-white/80"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="w-full px-4 py-3 border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all duration-200 bg-white/80"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">
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
                className="w-full px-4 py-3 border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all duration-200 bg-white/80 pr-12"
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">units</span>
            </div>
          </div>
        </div>
        
        {/* Quick Date Presets */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500 font-medium">Quick select:</span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setDateRange({
                  startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0],
                });
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100/70 hover:bg-gray-200/70 rounded-lg transition-colors duration-200"
            >
              Last 7 days
            </button>
            <button
              onClick={() => {
                setDateRange({
                  startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0],
                });
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100/70 hover:bg-gray-200/70 rounded-lg transition-colors duration-200"
            >
              Last 30 days
            </button>
            <button
              onClick={() => {
                setDateRange({ startDate: "", endDate: "" });
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100/70 hover:bg-gray-200/70 rounded-lg transition-colors duration-200"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Inventory Report */}
        <div className="group relative bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Inventory Analysis</h3>
                <p className="text-sm text-gray-500 mt-0.5">Stock levels, valuations & alerts</p>
              </div>
            </div>
            {reports.inventory && (
              <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                Ready
              </div>
            )}
          </div>
          
          {errors.inventory && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">⚠️ {errors.inventory}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={() => handleInventoryReport("view")}
              disabled={loading.inventory}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 group"
            >
              {loading.inventory ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Generate Report
                </>
              )}
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleInventoryReport("pdf")}
                disabled={loading.inventory || !reports.inventory}
                className="flex items-center justify-center px-3 py-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg text-sm font-medium transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                TXT
              </button>
              <button
                onClick={() => handleInventoryReport("csv")}
                disabled={loading.inventory || !reports.inventory}
                className="flex items-center justify-center px-3 py-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg text-sm font-medium transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v4m4-4v4m4-4v4" />
                </svg>
                CSV
              </button>
            </div>
          </div>
          
          {reports.inventory && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {reports.inventory.summary.totalProducts} products analyzed
              </div>
            </div>
          )}
        </div>

        {/* Sales Report */}
        <div className="group relative bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 hover:shadow-lg hover:shadow-green-500/5 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Sales Analytics</h3>
                <p className="text-sm text-gray-500 mt-0.5">Revenue trends & performance</p>
              </div>
            </div>
            {reports.sales && (
              <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                Ready
              </div>
            )}
          </div>
          
          {errors.sales && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">⚠️ {errors.sales}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={() => handleSalesReport("view")}
              disabled={loading.sales}
              className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 group"
            >
              {loading.sales ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Generate Report
                </>
              )}
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSalesReport("pdf")}
                disabled={loading.sales || !reports.sales}
                className="flex items-center justify-center px-3 py-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg text-sm font-medium transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                TXT
              </button>
              <button
                onClick={() => handleSalesReport("csv")}
                disabled={loading.sales || !reports.sales}
                className="flex items-center justify-center px-3 py-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg text-sm font-medium transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v4m4-4v4m4-4v4" />
                </svg>
                CSV
              </button>
            </div>
          </div>
          
          {reports.sales && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {reports.sales.summary.totalSales} transactions analyzed
              </div>
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="group relative bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Stock Alerts</h3>
                <p className="text-sm text-gray-500 mt-0.5">Low inventory & reorder alerts</p>
              </div>
            </div>
            {reports.lowStock && (
              <div className={`flex items-center text-xs px-2 py-1 rounded-full ${
                reports.lowStock.summary.totalLowStock > 0 
                  ? "text-orange-600 bg-orange-50" 
                  : "text-green-600 bg-green-50"
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  reports.lowStock.summary.totalLowStock > 0 ? "bg-orange-500" : "bg-green-500"
                }`}></div>
                {reports.lowStock.summary.totalLowStock > 0 ? "Alerts" : "Good"}
              </div>
            )}
          </div>
          
          {errors.lowStock && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">⚠️ {errors.lowStock}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={() => handleLowStockReport("view")}
              disabled={loading.lowStock}
              className="w-full flex items-center justify-center px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 group"
            >
              {loading.lowStock ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Check Stock
                </>
              )}
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleLowStockReport("pdf")}
                disabled={loading.lowStock || !reports.lowStock}
                className="flex items-center justify-center px-3 py-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg text-sm font-medium transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                TXT
              </button>
              <button
                onClick={() => handleLowStockReport("csv")}
                disabled={loading.lowStock || !reports.lowStock}
                className="flex items-center justify-center px-3 py-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg text-sm font-medium transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v4m4-4v4m4-4v4" />
                </svg>
                CSV
              </button>
            </div>
          </div>
          
          {reports.lowStock && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center text-sm text-gray-600">
                {reports.lowStock.summary.totalLowStock > 0 ? (
                  <>
                    <svg className="w-4 h-4 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-orange-600 font-medium">
                      {reports.lowStock.summary.totalLowStock} products need attention
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-600">All products in stock</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Product Performance */}
        <div className="group relative bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Performance Insights</h3>
                <p className="text-sm text-gray-500 mt-0.5">Profitability & turnover analysis</p>
              </div>
            </div>
            {reports.productPerformance && (
              <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                Ready
              </div>
            )}
          </div>
          
          {errors.productPerformance && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">⚠️ {errors.productPerformance}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={() => handlePerformanceReport("view")}
              disabled={loading.productPerformance}
              className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 group"
            >
              {loading.productPerformance ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analyze Performance
                </>
              )}
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handlePerformanceReport("pdf")}
                disabled={loading.productPerformance || !reports.productPerformance}
                className="flex items-center justify-center px-3 py-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg text-sm font-medium transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                TXT
              </button>
              <button
                onClick={() => handlePerformanceReport("csv")}
                disabled={loading.productPerformance || !reports.productPerformance}
                className="flex items-center justify-center px-3 py-2 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg text-sm font-medium transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v4m4-4v4m4-4v4" />
                </svg>
                CSV
              </button>
            </div>
          </div>
          
          {reports.productPerformance && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {reports.productPerformance.summary.productsWithSales} products with sales data
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Information Panel */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50 rounded-2xl p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">Report Overview</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800/80">
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                  <span><strong>Inventory Analysis:</strong> Current stock levels, valuations & category insights</span>
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                  <span><strong>Sales Analytics:</strong> Revenue trends, transaction patterns & top performers</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></div>
                  <span><strong>Stock Alerts:</strong> Low inventory warnings with reorder recommendations</span>
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></div>
                  <span><strong>Performance Insights:</strong> Product profitability & turnover analysis</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700 font-medium">Export formats: CSV for analysis • TXT for detailed reports</span>
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
  );
}
