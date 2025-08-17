import React, { useState } from "react";
import { 
  FileText, 
  Download, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Loader2,
  Activity,
  BarChart3,
  Eye
} from "lucide-react";
import { 
  getSalesReport, 
  getInventoryReport, 
  getLowStockReport, 
  getExpiringProductsReport, 
  getProductPerformanceReport, 
  getStockMovementReport 
} from "../services/reportService";
import { useNotification } from "../hooks/useNotification";

export default function Reports() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const { showNotification } = useNotification();

  const generateInventoryReport = async () => {
    setLoading(true);
    try {
      const result = await getInventoryReport();
      if (result.error) {
        throw new Error(result.error);
      }
      setReportData({
        type: "inventory",
        data: result.data,
        title: "Current Inventory Report",
        generatedAt: new Date(),
      });
      showNotification("Inventory report generated successfully", "success");
    } catch (error) {
      console.error("Inventory report error:", error);
      showNotification(`Failed to generate inventory report: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const generateLowStockReport = async () => {
    setLoading(true);
    try {
      const result = await getLowStockReport();
      if (result.error) {
        throw new Error(result.error);
      }
      setReportData({
        type: "lowstock",
        data: result.data,
        title: "Low Stock Alert Report",
        generatedAt: new Date(),
      });
      showNotification("Low stock report generated successfully", "success");
    } catch (error) {
      console.error("Low stock report error:", error);
      showNotification(`Failed to generate low stock report: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData || !reportData.data) {
      showNotification("No data to export", "warning");
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(reportData.data[0] || {}).join(",") + "\n" +
      reportData.data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportData.type}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification("Report exported to CSV", "success");
  };

  const reportTypes = [
    {
      id: "inventory",
      title: "Inventory Report",
      description: "Current stock levels and product overview",
      icon: Package,
      color: "blue",
      action: generateInventoryReport,
    },
    {
      id: "lowstock",
      title: "Low Stock Alert",
      description: "Products below critical levels",
      icon: AlertTriangle,
      color: "amber",
      action: generateLowStockReport,
    },
  ];

  const colorClasses = {
    blue: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
    amber: "from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
  };

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-800">Business Reports</h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Generate comprehensive reports and analytics from your pharmacy operations data.
        </p>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => {
          const IconComponent = report.icon;
          return (
            <div
              key={report.id}
              className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[report.color]} rounded-2xl flex items-center justify-center shadow-sm`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">{report.title}</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                {report.description}
              </p>
              
              <button
                onClick={report.action}
                disabled={loading}
                className={`w-full px-4 py-3 bg-gradient-to-r ${colorClasses[report.color]} text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Report Preview */}
      {reportData && (
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{reportData.title}</h2>
              <p className="text-gray-600">
                Generated on {reportData.generatedAt.toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setReportData(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Close Preview
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Report Data Display */}
          <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-auto">
            {reportData.data && reportData.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {Object.keys(reportData.data[0]).map((key) => (
                        <th key={key} className="text-left py-2 px-3 font-semibold text-gray-700 capitalize">
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.slice(0, 50).map((row, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-white/50">
                        {Object.values(row).map((value, valueIndex) => (
                          <td key={valueIndex} className="py-2 px-3 text-gray-600">
                            {typeof value === 'number' && value > 1000 
                              ? value.toLocaleString() 
                              : String(value)
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.data.length > 50 && (
                  <p className="text-center text-gray-500 mt-4">
                    Showing first 50 of {reportData.data.length} records. Export for complete data.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No data available for the selected criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const { showNotification } = useNotification();

  const generateInventoryReport = async () => {
    setLoading(true);
    try {
      const result = await getInventoryReport();
      if (result.error) {
        throw new Error(result.error);
      }
      setReportData({
        type: "inventory",
        data: result.data,
        title: "Current Inventory Report",
        generatedAt: new Date(),
      });
      showNotification("Inventory report generated successfully", "success");
    } catch (error) {
      console.error("Inventory report error:", error);
      showNotification(`Failed to generate inventory report: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const generateLowStockReport = async () => {
    setLoading(true);
    try {
      const result = await getLowStockReport();
      if (result.error) {
        throw new Error(result.error);
      }
      setReportData({
        type: "lowstock",
        data: result.data,
        title: "Low Stock Alert Report",
        generatedAt: new Date(),
      });
      showNotification("Low stock report generated successfully", "success");
    } catch (error) {
      console.error("Low stock report error:", error);
      showNotification(`Failed to generate low stock report: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData || !reportData.data) {
      showNotification("No data to export", "warning");
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(reportData.data[0] || {}).join(",") + "\n" +
      reportData.data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportData.type}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification("Report exported to CSV", "success");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-800">Business Reports</h1>
        <p className="text-gray-600">Generate comprehensive reports from your pharmacy operations data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Inventory Report</h3>
              <p className="text-gray-600 text-sm">Current stock levels and product overview</p>
            </div>
          </div>
          <button
            onClick={generateInventoryReport}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Generate Report
              </>
            )}
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Low Stock Alert</h3>
              <p className="text-gray-600 text-sm">Products below critical levels</p>
            </div>
          </div>
          <button
            onClick={generateLowStockReport}
            disabled={loading}
            className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {reportData && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{reportData.title}</h2>
              <p className="text-gray-600">Generated on {reportData.generatedAt.toLocaleDateString()}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setReportData(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-auto">
            {reportData.data && reportData.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {Object.keys(reportData.data[0]).map((key) => (
                        <th key={key} className="text-left py-2 px-3 font-semibold text-gray-700 capitalize">
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.slice(0, 50).map((row, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-white/50">
                        {Object.values(row).map((value, valueIndex) => (
                          <td key={valueIndex} className="py-2 px-3 text-gray-600">
                            {typeof value === 'number' && value > 1000 
                              ? value.toLocaleString() 
                              : String(value)
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.data.length > 50 && (
                  <p className="text-center text-gray-500 mt-4">
                    Showing first 50 of {reportData.data.length} records. Export for complete data.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No data available.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

  // Predefined date ranges
  const predefinedRanges = {
    today: {
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    },
    week: {
      startDate: format(startOfWeek(new Date()), "yyyy-MM-dd"),
      endDate: format(endOfWeek(new Date()), "yyyy-MM-dd"),
    },
    month: {
      startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    },
    last7days: {
      startDate: format(subDays(new Date(), 7), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    },
    last30days: {
      startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    },
  };

  // Report types configuration
  const reportTypes = [
    {
      id: "sales",
      title: "Sales Report",
      description: "Revenue, transactions, and sales analytics",
      icon: DollarSign,
      color: "emerald",
      requiresDateRange: true,
      action: () => generateSalesReport(),
    },
    {
      id: "inventory",
      title: "Inventory Report", 
      description: "Current stock levels and product overview",
      icon: Package,
      color: "blue",
      requiresDateRange: false,
      action: () => generateInventoryReport(),
    },
    {
      id: "lowstock",
      title: "Low Stock Alert",
      description: "Products below critical levels",
      icon: AlertTriangle,
      color: "amber", 
      requiresDateRange: false,
      action: () => generateLowStockReport(),
    },
    {
      id: "expiring",
      title: "Expiring Products",
      description: "Products nearing expiry dates",
      icon: Clock,
      color: "red",
      requiresDateRange: false,
      action: () => generateExpiringReport(),
    },
    {
      id: "performance",
      title: "Product Performance",
      description: "Top selling products and analytics",
      icon: TrendingUp,
      color: "purple",
      requiresDateRange: false,
      action: () => generatePerformanceReport(),
    },
    {
      id: "stockmovement",
      title: "Stock Movement",
      description: "Inventory changes and audit trail",
      icon: Activity,
      color: "indigo",
      requiresDateRange: true,
      action: () => generateStockMovementReport(),
    },
  ];

  // Generate different types of reports
  const generateSalesReport = async () => {
    setLoading(true);
    try {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      const result = await getSalesReport(startDate, endDate, "daily");
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setReportData({
        type: "sales",
        data: result.data,
        title: `Sales Report (${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")})`,
        generatedAt: new Date(),
      });
      
      showNotification("Sales report generated successfully", "success");
    } catch (error) {
      console.error("Sales report error:", error);
      showNotification(`Failed to generate sales report: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const generateInventoryReport = async () => {
    setLoading(true);
    try {
      const result = await getInventoryReport();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setReportData({
        type: "inventory",
        data: result.data,
        title: "Current Inventory Report",
        generatedAt: new Date(),
      });
      
      showNotification("Inventory report generated successfully", "success");
    } catch (error) {
      console.error("Inventory report error:", error);
      showNotification(`Failed to generate inventory report: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const generateLowStockReport = async () => {
    setLoading(true);
    try {
      const result = await getLowStockReport();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setReportData({
        type: "lowstock",
        data: result.data,
        title: "Low Stock Alert Report",
        generatedAt: new Date(),
      });
      
      showNotification("Low stock report generated successfully", "success");
    } catch (error) {
      console.error("Low stock report error:", error);
      showNotification(`Failed to generate low stock report: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const generateExpiringReport = async () => {
    setLoading(true);
    try {
      const result = await getExpiringProductsReport(30); // 30 days ahead
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setReportData({
        type: "expiring",
        data: result.data,
        title: "Expiring Products Report (Next 30 Days)",
        generatedAt: new Date(),
      });
      
      showNotification("Expiring products report generated successfully", "success");
    } catch (error) {
      console.error("Expiring products report error:", error);
      showNotification(`Failed to generate expiring products report: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const generatePerformanceReport = async () => {
    setLoading(true);
    try {
      const result = await getProductPerformanceReport(period);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setReportData({
        type: "performance",
        data: result.data,
        title: `Product Performance Report (${period})`,
        generatedAt: new Date(),
      });
      
      showNotification("Performance report generated successfully", "success");
    } catch (error) {
      console.error("Performance report error:", error);
      showNotification(`Failed to generate performance report: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const generateStockMovementReport = async () => {
    setLoading(true);
    try {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      const result = await getStockMovementReport(startDate, endDate);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setReportData({
        type: "stockmovement",
        data: result.data,
        title: `Stock Movement Report (${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")})`,
        generatedAt: new Date(),
      });
      
      showNotification("Stock movement report generated successfully", "success");
    } catch (error) {
      console.error("Stock movement report error:", error);
      showNotification(`Failed to generate stock movement report: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle predefined range selection
  const handleRangeSelect = (rangeKey) => {
    setDateRange(predefinedRanges[rangeKey]);
  };

  // Export functionality
  const exportToPDF = () => {
    showNotification("PDF export functionality coming soon", "info");
  };

  const exportToCSV = () => {
    if (!reportData || !reportData.data) {
      showNotification("No data to export", "warning");
      return;
    }

    // Basic CSV export
    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(reportData.data[0] || {}).join(",") + "\n" +
      reportData.data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportData.type}_report_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification("Report exported to CSV", "success");
  };

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-800">Business Reports</h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Generate comprehensive reports and analytics from your pharmacy operations data.
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-800">Date Range:</span>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="self-center text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {Object.entries(predefinedRanges).map(([key]) => (
              <button
                key={key}
                onClick={() => handleRangeSelect(key)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors capitalize"
              >
                {key.replace(/(\d+)/, ' $1 ')}
              </button>
            ))}
          </div>
        </div>

        {/* Period Selector for Performance Report */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-800">Performance Period:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => {
          const IconComponent = report.icon;
          const colorClasses = {
            emerald: "from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
            blue: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
            amber: "from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
            red: "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
            purple: "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
            indigo: "from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700",
          };

          return (
            <div
              key={report.id}
              className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[report.color]} rounded-2xl flex items-center justify-center shadow-sm`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                {report.requiresDateRange && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    Date Range
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">{report.title}</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                {report.description}
              </p>
              
              <button
                onClick={report.action}
                disabled={loading}
                className={`w-full px-4 py-3 bg-gradient-to-r ${colorClasses[report.color]} text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Report Preview */}
      {reportData && (
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{reportData.title}</h2>
              <p className="text-gray-600">
                Generated on {format(reportData.generatedAt, "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setReportData(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Close Preview
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={exportToPDF}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Report Data Display */}
          <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-auto">
            {reportData.data && reportData.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {Object.keys(reportData.data[0]).map((key) => (
                        <th key={key} className="text-left py-2 px-3 font-semibold text-gray-700 capitalize">
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.slice(0, 50).map((row, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-white/50">
                        {Object.values(row).map((value, valueIndex) => (
                          <td key={valueIndex} className="py-2 px-3 text-gray-600">
                            {typeof value === 'number' && value > 1000 
                              ? value.toLocaleString() 
                              : String(value)
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.data.length > 50 && (
                  <p className="text-center text-gray-500 mt-4">
                    Showing first 50 of {reportData.data.length} records. Export for complete data.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No data available for the selected criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Package,
  AlertTriangle,
  BarChart3,
  Activity,
  Filter,
  Loader2,
  FileSpreadsheet,
  Eye,
  Clock,
  DollarSign,
} from "lucide-react";
import {
  getSalesReport,
  getInventoryReport,
  getLowStockReport,
  getExpiringProductsReport,
  getProductPerformanceReport,
  getStockMovementReport,
} from "../services/reportService";
import { useNotification } from "../hooks/useNotification";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export default function Reports() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 7), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });
  const [period, setPeriod] = useState("week");
  const { showNotification } = useNotification();

  // Predefined date ranges
  const predefinedRanges = {
    today: {
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    },
    week: {
      startDate: format(startOfWeek(new Date()), "yyyy-MM-dd"),
      endDate: format(endOfWeek(new Date()), "yyyy-MM-dd"),
    },
    month: {
      startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    },
    last7days: {
      startDate: format(subDays(new Date(), 7), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    },
    last30days: {
      startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
    },
  };

  // Report types configuration
  const reportTypes = [
    {
      id: "sales",
      title: "Sales Report",
      description: "Revenue, transactions, and sales analytics",
      icon: DollarSign,
      color: "emerald",
      requiresDateRange: true,
      action: () => generateSalesReport(),
    },
    {
      id: "inventory",
      title: "Inventory Report", 
      description: "Current stock levels and product overview",
      icon: Package,
      color: "blue",
      requiresDateRange: false,
      action: () => generateInventoryReport(),
    },
    {
      id: "lowstock",
      title: "Low Stock Alert",
      description: "Products below critical levels",
      icon: AlertTriangle,
      color: "amber", 
      requiresDateRange: false,
      action: () => generateLowStockReport(),
    },
    {
      id: "expiring",
      title: "Expiring Products",
      description: "Products nearing expiry dates",
      icon: Clock,
      color: "red",
      requiresDateRange: false,
      action: () => generateExpiringReport(),
    },
    {
      id: "performance",
      title: "Product Performance",
      description: "Top selling products and analytics",
      icon: TrendingUp,
      color: "purple",
      requiresDateRange: false,
      action: () => generatePerformanceReport(),
    },
    {
      id: "stockmovement",
      title: "Stock Movement",
      description: "Inventory changes and audit trail",
      icon: Activity,
      color: "indigo",
      requiresDateRange: true,
      action: () => generateStockMovementReport(),
    },
  ];

  // Generate different types of reports
  const generateSalesReport = async () => {
    setLoading(true);
    try {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      const result = await getSalesReport(startDate, endDate, "daily");
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setReportData({
        type: "sales",
        data: result.data,
        title: `Sales Report (${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")})`,
        generatedAt: new Date(),
      });
      
      showNotification("Sales report generated successfully", "success");
    } catch (error) {
      console.error("Sales report error:", error);
      showNotification(`Failed to generate sales report: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const generateInventoryReport = async () => {
    setLoading(true);
    try {
      const result = await getInventoryReport();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setReportData({
        type: "inventory",
        data: result.data,
        title: "Current Inventory Report",
        generatedAt: new Date(),
      });
      
      showNotification("Inventory report generated successfully", "success");
    } catch (error) {
      console.error("Inventory report error:", error);
      showNotification(`Failed to generate inventory report: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const generateLowStockReport = async () => {
    setLoading(true);
    try {
      const result = await getLowStockReport();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setReportData({
        type: "lowstock",
        data: result.data,
        title: "Low Stock Alert Report",
        generatedAt: new Date(),
      });
      
      showNotification("Low stock report generated successfully", "success");
    } catch (error) {
      console.error("Low stock report error:", error);
      showNotification(`Failed to generate low stock report: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const generateExpiringReport = async () => {
    setLoading(true);
    try {
      const result = await getExpiringProductsReport(30); // 30 days ahead
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setReportData({
        type: "expiring",
        data: result.data,
        title: "Expiring Products Report (Next 30 Days)",
        generatedAt: new Date(),
      });
      
      showNotification("Expiring products report generated successfully", "success");
    } catch (error) {
      console.error("Expiring products report error:", error);
      showNotification(`Failed to generate expiring products report: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const generatePerformanceReport = async () => {
    setLoading(true);
    try {
      const result = await getProductPerformanceReport(period);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setReportData({
        type: "performance",
        data: result.data,
        title: `Product Performance Report (${period})`,
        generatedAt: new Date(),
      });
      
      showNotification("Performance report generated successfully", "success");
    } catch (error) {
      console.error("Performance report error:", error);
      showNotification(`Failed to generate performance report: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const generateStockMovementReport = async () => {
    setLoading(true);
    try {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      const result = await getStockMovementReport(startDate, endDate);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setReportData({
        type: "stockmovement",
        data: result.data,
        title: `Stock Movement Report (${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")})`,
        generatedAt: new Date(),
      });
      
      showNotification("Stock movement report generated successfully", "success");
    } catch (error) {
      console.error("Stock movement report error:", error);
      showNotification(`Failed to generate stock movement report: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle predefined range selection
  const handleRangeSelect = (rangeKey) => {
    setDateRange(predefinedRanges[rangeKey]);
  };

  // Export functionality
  const exportToPDF = () => {
    showNotification("PDF export functionality coming soon", "info");
  };

  const exportToCSV = () => {
    if (!reportData || !reportData.data) {
      showNotification("No data to export", "warning");
      return;
    }

    // Basic CSV export
    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(reportData.data[0] || {}).join(",") + "\n" +
      reportData.data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportData.type}_report_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification("Report exported to CSV", "success");
  };

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-800">Business Reports</h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Generate comprehensive reports and analytics from your pharmacy operations data.
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-800">Date Range:</span>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="self-center text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {Object.entries(predefinedRanges).map(([key]) => (
              <button
                key={key}
                onClick={() => handleRangeSelect(key)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors capitalize"
              >
                {key.replace(/(\d+)/, ' $1 ')}
              </button>
            ))}
          </div>
        </div>

        {/* Period Selector for Performance Report */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-800">Performance Period:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => {
          const IconComponent = report.icon;
          const colorClasses = {
            emerald: "from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
            blue: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
            amber: "from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
            red: "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
            purple: "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
            indigo: "from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700",
          };

          return (
            <div
              key={report.id}
              className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[report.color]} rounded-2xl flex items-center justify-center shadow-sm`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                {report.requiresDateRange && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    Date Range
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">{report.title}</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                {report.description}
              </p>
              
              <button
                onClick={report.action}
                disabled={loading}
                className={`w-full px-4 py-3 bg-gradient-to-r ${colorClasses[report.color]} text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Report Preview */}
      {reportData && (
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{reportData.title}</h2>
              <p className="text-gray-600">
                Generated on {format(reportData.generatedAt, "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setReportData(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Close Preview
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={exportToPDF}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Report Data Display */}
          <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-auto">
            {reportData.data && reportData.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {Object.keys(reportData.data[0]).map((key) => (
                        <th key={key} className="text-left py-2 px-3 font-semibold text-gray-700 capitalize">
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.slice(0, 50).map((row, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-white/50">
                        {Object.values(row).map((value, valueIndex) => (
                          <td key={valueIndex} className="py-2 px-3 text-gray-600">
                            {typeof value === 'number' && value > 1000 
                              ? value.toLocaleString() 
                              : String(value)
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.data.length > 50 && (
                  <p className="text-center text-gray-500 mt-4">
                    Showing first 50 of {reportData.data.length} records. Export for complete data.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No data available for the selected criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-800">Business Reports</h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Generate comprehensive reports and analytics from your pharmacy operations data.
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-800">Date Range:</span>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="self-center text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {Object.entries(predefinedRanges).map(([key, range]) => (
              <button
                key={key}
                onClick={() => handleRangeSelect(key)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors capitalize"
              >
                {key.replace(/(\d+)/, ' $1 ')}
              </button>
            ))}
          </div>
        </div>

        {/* Period Selector for Performance Report */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-800">Performance Period:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => {
          const IconComponent = report.icon;
          const colorClasses = {
            emerald: "from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
            blue: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
            amber: "from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
            red: "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
            purple: "from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
            indigo: "from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700",
          };

          return (
            <div
              key={report.id}
              className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[report.color]} rounded-2xl flex items-center justify-center shadow-sm`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                {report.requiresDateRange && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    Date Range
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">{report.title}</h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                {report.description}
              </p>
              
              <button
                onClick={report.action}
                disabled={loading}
                className={`w-full px-4 py-3 bg-gradient-to-r ${colorClasses[report.color]} text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Report Preview */}
      {reportData && (
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{reportData.title}</h2>
              <p className="text-gray-600">
                Generated on {format(reportData.generatedAt, "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setReportData(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Close Preview
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={exportToPDF}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Report Data Display */}
          <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-auto">
            {reportData.data && reportData.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {Object.keys(reportData.data[0]).map((key) => (
                        <th key={key} className="text-left py-2 px-3 font-semibold text-gray-700 capitalize">
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.slice(0, 50).map((row, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-white/50">
                        {Object.values(row).map((value, valueIndex) => (
                          <td key={valueIndex} className="py-2 px-3 text-gray-600">
                            {typeof value === 'number' && value > 1000 
                              ? value.toLocaleString() 
                              : String(value)
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.data.length > 50 && (
                  <p className="text-center text-gray-500 mt-4">
                    Showing first 50 of {reportData.data.length} records. Export for complete data.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No data available for the selected criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reports</h2>
        <p className="text-sm text-gray-600">
          Generate analytical PDF / CSV exports (coming soon).
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h3 className="font-semibold mb-2">Inventory PDF</h3>
          <p className="text-sm text-gray-600 mb-4">
            Export a snapshot of current stock levels.
          </p>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            disabled
          >
            Generate (WIP)
          </button>
        </div>
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h3 className="font-semibold mb-2">Sales Summary</h3>
          <p className="text-sm text-gray-600 mb-4">
            Period revenue, discounts & average ticket size.
          </p>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            disabled
          >
            Generate (WIP)
          </button>
        </div>
      </div>
    </div>
  );
}
