import React from "react";
import {
  formatCurrency,
  formatDate,
  formatPercentage,
} from "../utils/exportUtils.js";

/**
 * Report Viewer Component
 * Displays generated reports in a formatted, readable layout
 */
export default function ReportViewer({ report, reportType, onClose }) {
  if (!report) return null;

  const renderInventoryReport = () => (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-3">Inventory Summary</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-blue-600">Total Products</div>
            <div className="text-xl font-bold text-blue-900">
              {report.summary.totalProducts}
            </div>
          </div>
          <div>
            <div className="text-sm text-blue-600">Stock Value</div>
            <div className="text-xl font-bold text-blue-900">
              {formatCurrency(report.summary.totalStockValue)}
            </div>
          </div>
          <div>
            <div className="text-sm text-blue-600">Retail Value</div>
            <div className="text-xl font-bold text-blue-900">
              {formatCurrency(report.summary.totalRetailValue)}
            </div>
          </div>
          <div>
            <div className="text-sm text-blue-600">Profit Margin</div>
            <div className="text-xl font-bold text-blue-900">
              {formatPercentage(report.summary.profitMargin)}
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div>
        <h3 className="font-semibold mb-3">Category Breakdown</h3>
        <div className="grid gap-3">
          {report.categoryBreakdown.map((category) => (
            <div
              key={category.category}
              className="bg-white border border-gray-200 rounded-lg p-3"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{category.category}</div>
                  <div className="text-sm text-gray-600">
                    {category.count} products • {category.totalStock} units
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatCurrency(category.totalValue)}
                  </div>
                  <div className="text-sm text-gray-600">Total Value</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Low Stock Alerts */}
      {report.lowStock && (
        <div>
          <h3 className="font-semibold mb-3">Low Stock Alerts</h3>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-sm text-orange-600">Total Low Stock</div>
                <div className="text-xl font-bold text-orange-900">
                  {report.lowStock.count}
                </div>
              </div>
              <div>
                <div className="text-sm text-orange-600">Out of Stock</div>
                <div className="text-xl font-bold text-orange-900">
                  {report.lowStock.criticalProducts.length}
                </div>
              </div>
              <div>
                <div className="text-sm text-orange-600">Threshold</div>
                <div className="text-xl font-bold text-orange-900">
                  {report.lowStock.threshold}
                </div>
              </div>
            </div>
            {report.lowStock.products.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Critical Products</h4>
                <div className="space-y-2">
                  {report.lowStock.products.slice(0, 10).map((product) => (
                    <div
                      key={product.id}
                      className="flex justify-between items-center bg-white rounded p-2"
                    >
                      <span>{product.name}</span>
                      <span className="text-orange-600 font-medium">
                        {product.total_stock || 0} units
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderSalesReport = () => (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-3">Sales Summary</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-green-600">Total Sales</div>
            <div className="text-xl font-bold text-green-900">
              {report.summary.totalSales}
            </div>
          </div>
          <div>
            <div className="text-sm text-green-600">Total Revenue</div>
            <div className="text-xl font-bold text-green-900">
              {formatCurrency(report.summary.totalRevenue)}
            </div>
          </div>
          <div>
            <div className="text-sm text-green-600">Average Transaction</div>
            <div className="text-xl font-bold text-green-900">
              {formatCurrency(report.summary.averageTransaction)}
            </div>
          </div>
          <div>
            <div className="text-sm text-green-600">Daily Average</div>
            <div className="text-xl font-bold text-green-900">
              {formatCurrency(report.summary.dailyAverage)}
            </div>
          </div>
        </div>
        <div className="mt-3 text-sm text-green-600">
          Period: {formatDate(report.summary.period.startDate)} to{" "}
          {formatDate(report.summary.period.endDate)}
        </div>
      </div>

      {/* Top Products */}
      {report.topProducts && (
        <div>
          <h3 className="font-semibold mb-3">Top Products</h3>
          <div className="space-y-2">
            {report.topProducts.slice(0, 10).map((product, index) => (
              <div
                key={product.name}
                className="bg-white border border-gray-200 rounded-lg p-3"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">
                      #{index + 1} {product.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {product.category} • {product.quantitySold} units sold
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(product.revenue)}
                    </div>
                    <div className="text-sm text-gray-600">Revenue</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {report.categoryBreakdown && (
        <div>
          <h3 className="font-semibold mb-3">Sales by Category</h3>
          <div className="grid gap-3">
            {report.categoryBreakdown.map((category) => (
              <div
                key={category.category}
                className="bg-white border border-gray-200 rounded-lg p-3"
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium">{category.category}</div>
                  <div className="font-medium">
                    {formatCurrency(category.revenue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderLowStockReport = () => (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h3 className="font-semibold text-orange-900 mb-3">
          Low Stock Alert Summary
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-orange-600">Total Low Stock</div>
            <div className="text-xl font-bold text-orange-900">
              {report.summary.totalLowStock}
            </div>
          </div>
          <div>
            <div className="text-sm text-orange-600">Out of Stock</div>
            <div className="text-xl font-bold text-orange-900">
              {report.summary.outOfStock}
            </div>
          </div>
          <div>
            <div className="text-sm text-orange-600">Critically Low</div>
            <div className="text-xl font-bold text-orange-900">
              {report.summary.criticallyLow}
            </div>
          </div>
          <div>
            <div className="text-sm text-orange-600">Threshold</div>
            <div className="text-xl font-bold text-orange-900">
              {report.summary.threshold}
            </div>
          </div>
        </div>
      </div>

      {/* Out of Stock Products */}
      {report.products.outOfStock.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 text-red-600">
            ⚠️ Out of Stock Products
          </h3>
          <div className="space-y-2">
            {report.products.outOfStock.map((product) => (
              <div
                key={product.id}
                className="bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-red-900">
                      {product.name}
                    </div>
                    <div className="text-sm text-red-600">
                      {product.category || "N/A"}
                    </div>
                  </div>
                  <div className="text-red-600 font-bold">0 units</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critically Low Products */}
      {report.products.criticallyLow.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 text-orange-600">
            🔶 Critically Low Stock
          </h3>
          <div className="space-y-2">
            {report.products.criticallyLow.map((product) => (
              <div
                key={product.id}
                className="bg-orange-50 border border-orange-200 rounded-lg p-3"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-orange-900">
                      {product.name}
                    </div>
                    <div className="text-sm text-orange-600">
                      {product.category || "N/A"}
                    </div>
                  </div>
                  <div className="text-orange-600 font-bold">
                    {product.total_stock || 0} units
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reorder Recommendations */}
      {report.recommendations && (
        <div>
          <h3 className="font-semibold mb-3">Reorder Recommendations</h3>
          <div className="space-y-2">
            {report.recommendations.slice(0, 10).map((rec) => (
              <div
                key={rec.productId}
                className="bg-blue-50 border border-blue-200 rounded-lg p-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-blue-900">
                      {rec.productName}
                    </div>
                    <div className="text-sm text-blue-600">
                      Current: {rec.currentStock} • Recommended:{" "}
                      {rec.recommendedOrderQuantity}
                    </div>
                    <div className="text-sm text-blue-600">
                      Urgency: {rec.urgency} • Est. Cost:{" "}
                      {formatCurrency(rec.estimatedCost)}
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      rec.urgency === "Critical"
                        ? "bg-red-100 text-red-800"
                        : rec.urgency === "High"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {rec.urgency}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderPerformanceReport = () => (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-purple-900 mb-3">
          Performance Summary
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-purple-600">Total Products</div>
            <div className="text-xl font-bold text-purple-900">
              {report.summary.totalProducts}
            </div>
          </div>
          <div>
            <div className="text-sm text-purple-600">Products with Sales</div>
            <div className="text-xl font-bold text-purple-900">
              {report.summary.productsWithSales}
            </div>
          </div>
          <div>
            <div className="text-sm text-purple-600">Total Revenue</div>
            <div className="text-xl font-bold text-purple-900">
              {formatCurrency(report.summary.totalRevenue)}
            </div>
          </div>
          <div>
            <div className="text-sm text-purple-600">Total Profit</div>
            <div className="text-xl font-bold text-purple-900">
              {formatCurrency(report.summary.totalProfit)}
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers by Revenue */}
      <div>
        <h3 className="font-semibold mb-3">Top Performers by Revenue</h3>
        <div className="space-y-2">
          {report.topPerformers.byRevenue.slice(0, 10).map((product, index) => (
            <div
              key={product.id}
              className="bg-white border border-gray-200 rounded-lg p-3"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    #{index + 1} {product.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {product.category} • {product.quantitySold} sold •
                    {formatPercentage(product.profitMargin)} margin
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatCurrency(product.revenue)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Profit: {formatCurrency(product.profit)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Performance */}
      <div>
        <h3 className="font-semibold mb-3">Category Performance</h3>
        <div className="grid gap-3">
          {report.categoryPerformance.map((category) => (
            <div
              key={category.category}
              className="bg-white border border-gray-200 rounded-lg p-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{category.category}</div>
                  <div className="text-sm text-gray-600">
                    {category.totalProducts} products • Avg turnover:{" "}
                    {Number(category.averageTurnover).toFixed(2)}
                  </div>
                  {category.topProduct && (
                    <div className="text-sm text-blue-600">
                      Top: {category.topProduct.name}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatCurrency(category.totalRevenue)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Profit: {formatCurrency(category.totalProfit)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const getReportTitle = () => {
    switch (reportType) {
      case "inventory":
        return "Inventory Report";
      case "sales":
        return "Sales Report";
      case "lowStock":
        return "Low Stock Alert Report";
      case "productPerformance":
        return "Product Performance Report";
      default:
        return "Report";
    }
  };

  const renderReportContent = () => {
    switch (reportType) {
      case "inventory":
        return renderInventoryReport();
      case "sales":
        return renderSalesReport();
      case "lowStock":
        return renderLowStockReport();
      case "productPerformance":
        return renderPerformanceReport();
      default:
        return <div>Unsupported report type</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold">{getReportTitle()}</h2>
            <div className="text-sm text-gray-600">
              Generated on{" "}
              {formatDate(
                report.summary?.lastUpdated || new Date().toISOString()
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {renderReportContent()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="text-sm text-gray-600 text-center">
            MedCure Pharmacy Management System • Report generated automatically
          </div>
        </div>
      </div>
    </div>
  );
}
