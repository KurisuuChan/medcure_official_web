import React, { useState } from "react";
import {
  FileText,
  Package,
  AlertTriangle,
  Loader2,
  Download,
  Eye,
  BarChart3,
} from "lucide-react";
import {
  getInventoryReport,
  getLowStockReport,
} from "../services/reportService";
import { useNotification } from "../hooks/useNotification";

export default function ReportsFixed() {
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
      showNotification(
        `Failed to generate inventory report: ${error.message}`,
        "error"
      );
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
      showNotification(
        `Failed to generate low stock report: ${error.message}`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData || !reportData.data) {
      showNotification("No data to export", "warning");
      return;
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      Object.keys(reportData.data[0] || {}).join(",") +
      "\n" +
      reportData.data.map((row) => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${reportData.type}_report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification("Report exported to CSV", "success");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-800">Business Reports</h1>
        <p className="text-gray-600">
          Generate comprehensive reports from your pharmacy operations data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                Inventory Report
              </h3>
              <p className="text-gray-600 text-sm">
                Current stock levels and product overview
              </p>
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
              <h3 className="text-xl font-bold text-gray-800">
                Low Stock Alert
              </h3>
              <p className="text-gray-600 text-sm">
                Products below critical levels
              </p>
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
              <h2 className="text-2xl font-bold text-gray-800">
                {reportData.title}
              </h2>
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
                        <th
                          key={key}
                          className="text-left py-2 px-3 font-semibold text-gray-700 capitalize"
                        >
                          {key.replace(/_/g, " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.slice(0, 50).map((row, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-white/50"
                      >
                        {Object.values(row).map((value, valueIndex) => (
                          <td
                            key={valueIndex}
                            className="py-2 px-3 text-gray-600"
                          >
                            {typeof value === "number" && value > 1000
                              ? value.toLocaleString()
                              : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.data.length > 50 && (
                  <p className="text-center text-gray-500 mt-4">
                    Showing first 50 of {reportData.data.length} records. Export
                    for complete data.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No data available.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
