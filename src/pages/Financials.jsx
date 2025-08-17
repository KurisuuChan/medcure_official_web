import React, { useState } from "react";
import {
  BarChart,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Download,
  Filter,
  RefreshCw,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { useFinancials } from "../hooks/useFinancials";

export default function Financials() {
  const {
    loading,
    error,
    period,
    overview,
    monthlyTrends,
    topProducts,
    costBreakdown,
    metrics,
    changePeriod,
    refreshAll,
    exportReport,
    formatCurrency,
    isLoaded,
  } = useFinancials();

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    await exportReport();
    setIsExporting(false);
  };

  const handlePeriodChange = (newPeriod) => {
    changePeriod(newPeriod);
  };

  // Loading state
  if (loading && !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            ⚠️ Error loading financial data
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => refreshAll()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = {
    totalRevenue: overview?.revenue?.total || 0,
    totalCosts: overview?.costs?.total || 0,
    grossProfit: overview?.profit?.gross || 0,
    profitMargin: overview?.profit?.margin || 0,
    totalSales: overview?.transactions?.count || 0,
    avgOrderValue: overview?.transactions?.averageValue || 0,
  };

  return (
    <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-lg max-w-full overflow-x-hidden relative">
      {/* Loading Overlay */}
      {loading && isLoaded && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-2xl">
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Refreshing data...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-100">
            <BarChart size={32} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Financial Overview
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Revenue, costs, and profitability analytics
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-500" />
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-200 rounded-lg">
              <DollarSign size={24} className="text-emerald-600" />
            </div>
            <div className="text-xs text-emerald-600 font-medium">
              {metrics?.monthlyGrowth > 0 ? "+" : ""}
              {(metrics?.monthlyGrowth || 0).toFixed(1)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-800 mb-1">
            {formatCurrency(stats.totalRevenue)}
          </div>
          <div className="text-sm text-emerald-600">Total Revenue</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-200 rounded-lg">
              <TrendingUp size={24} className="text-blue-600" />
            </div>
            <div className="text-xs text-blue-600 font-medium">
              {(stats.profitMargin || 0).toFixed(1)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-800 mb-1">
            {formatCurrency(stats.grossProfit)}
          </div>
          <div className="text-sm text-blue-600">Gross Profit</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-200 rounded-lg">
              <ShoppingCart size={24} className="text-purple-600" />
            </div>
            <div className="text-xs text-purple-600 font-medium">
              {formatCurrency(stats.avgOrderValue)}
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-800 mb-1">
            {stats.totalSales.toLocaleString()}
          </div>
          <div className="text-sm text-purple-600">Total Sales</div>
        </div>
      </div>

      {/* Date Range and Export Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-gray-500">
          <span className="text-sm">Period:</span>
          <span className="text-sm font-medium text-gray-700 capitalize">
            {period}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            Export
          </button>
          <button
            onClick={refreshAll}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-200 rounded-lg">
              <TrendingUp size={24} className="text-green-700" />
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <ArrowUpRight size={16} />
              <span className="text-sm font-semibold">+12.5%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-green-700 font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-green-800">
              {formatCurrency(stats.totalRevenue)}
            </p>
            <p className="text-sm text-green-600 mt-1">vs last month</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-200 rounded-lg">
              <DollarSign size={24} className="text-blue-700" />
            </div>
            <div className="flex items-center gap-1 text-blue-600">
              <ArrowUpRight size={16} />
              <span className="text-sm font-semibold">+8.3%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-blue-700 font-medium">Gross Profit</p>
            <p className="text-3xl font-bold text-blue-800">
              {formatCurrency(stats.grossProfit)}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              {stats.profitMargin}% margin
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-200 rounded-lg">
              <ShoppingCart size={24} className="text-purple-700" />
            </div>
            <div className="flex items-center gap-1 text-purple-600">
              <ArrowUpRight size={16} />
              <span className="text-sm font-semibold">+15.2%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-purple-700 font-medium">Total Sales</p>
            <p className="text-3xl font-bold text-purple-800">
              {stats.totalSales.toLocaleString()}
            </p>
            <p className="text-sm text-purple-600 mt-1">transactions</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Revenue Chart */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Monthly Performance
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Profit</span>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-end gap-2 px-2">
            {monthlyTrends && monthlyTrends.length > 0 ? (
              monthlyTrends.map((data) => {
                const maxRevenue = Math.max(
                  ...monthlyTrends.map((d) => d.revenue || 0)
                );
                const maxProfit = Math.max(
                  ...monthlyTrends.map((d) => d.profit || 0)
                );
                const revenueHeight =
                  maxRevenue > 0
                    ? Math.max(20, (data.revenue / maxRevenue) * 180)
                    : 20;
                const profitHeight =
                  maxProfit > 0
                    ? Math.max(10, (data.profit / maxProfit) * 60)
                    : 10;

                return (
                  <div
                    key={data.month}
                    className="flex-1 flex flex-col items-center gap-1 min-w-0"
                  >
                    <div className="w-full flex flex-col gap-1 items-center">
                      <div className="w-8 flex flex-col gap-1">
                        <div
                          className="bg-blue-500 rounded-t w-full transition-all duration-300"
                          style={{ height: `${revenueHeight}px` }}
                          title={`Revenue: ${formatCurrency(
                            data.revenue || 0
                          )}`}
                        ></div>
                        <div
                          className="bg-green-500 rounded-b w-full transition-all duration-300"
                          style={{ height: `${profitHeight}px` }}
                          title={`Profit: ${formatCurrency(data.profit || 0)}`}
                        ></div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 mt-2 truncate w-full text-center">
                      {data.month}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">No monthly data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Cost Breakdown
          </h2>
          <div className="space-y-4">
            {costBreakdown?.categories?.length > 0 ? (
              costBreakdown.categories.map((category, index) => (
                <div key={category.name}>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">{category.name}</span>
                    <span className="font-semibold">
                      {formatCurrency(category.amount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${(() => {
                        if (index === 0) return "bg-red-500";
                        if (index === 1) return "bg-orange-500";
                        if (index === 2) return "bg-yellow-500";
                        return "bg-blue-500";
                      })()}`}
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              // Fallback to mock data when costBreakdown is not available
              <>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Cost of Goods Sold</span>
                    <span className="font-semibold">
                      {formatCurrency(stats.totalCosts * 0.714)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: "71.4%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Operating Expenses</span>
                    <span className="font-semibold">
                      {formatCurrency(stats.totalCosts * 0.19)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: "19.0%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Utilities & Rent</span>
                    <span className="font-semibold">
                      {formatCurrency(stats.totalCosts * 0.095)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: "9.5%" }}
                    ></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top Performing Products */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Top Performing Products
          </h2>
          <button className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg">
            <Filter size={16} />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">
                  Product
                </th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-500">
                  Revenue
                </th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-500">
                  Profit
                </th>
                <th className="py-3 px-4 text-center text-sm font-semibold text-gray-500">
                  Sales
                </th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-gray-500">
                  Margin
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topProducts.map((product, index) => (
                <tr key={product.name} className="hover:bg-white">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {product.sales} units sold
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-gray-800">
                    {formatCurrency(product.revenue)}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-green-600">
                    {formatCurrency(product.profit)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {product.sales}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-semibold text-sm w-12 text-blue-600">
                        {product.margin.toFixed(1)}%
                      </span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            product.margin > 45 ? "bg-green-500" : "bg-blue-500"
                          }`}
                          style={{
                            width: `${
                              product.margin > 0 ? product.margin : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Breakdown Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            Cost Breakdown
          </h3>
          <div className="text-sm text-gray-500">Period: {period}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {costBreakdown?.categories?.map((category) => (
            <div
              key={category.name}
              className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <DollarSign size={20} className="text-gray-600" />
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  {category.percentage}%
                </div>
              </div>
              <div className="text-lg font-bold text-gray-800 mb-1">
                {formatCurrency(category.amount)}
              </div>
              <div className="text-sm text-gray-600">{category.name}</div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                  style={{ width: `${category.percentage}%` }}
                ></div>
              </div>
            </div>
          )) || (
            <div className="col-span-4 text-center py-8 text-gray-500">
              <DollarSign size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No cost breakdown data available for this period</p>
            </div>
          )}
        </div>

        {costBreakdown?.total && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-800">
                Total Costs
              </span>
              <span className="text-xl font-bold text-red-600">
                {formatCurrency(costBreakdown.total)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
