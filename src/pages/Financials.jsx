import React from "react";
import {
  BarChart,
  TrendingUp,
  Banknote,
  ShoppingCart,
  Download,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";
import useFinancials from "@/hooks/useFinancials";

export default function Financials() {
  const {
    data,
    isLoading,
    error,
    selectedPeriod,
    isRefreshing,
    computedMetrics,
    refresh,
    changePeriod,
    formatCurrency,
    formatPercentage,
    formatNumber,
  } = useFinancials("month");

  const {
    revenueSummary,
    costAnalysis,
    topProducts,
    monthlyTrends,
    // paymentBreakdown,
    // categoryPerformance,
  } = data;

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                <BarChart size={24} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Financial Overview
                </h1>
                <p className="text-gray-600 mt-1">
                  Track revenue, costs, and financial performance
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedPeriod}
                  onChange={(e) => changePeriod(e.target.value)}
                  disabled={isLoading}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 text-sm"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium">
                <Download size={16} />
                Export
              </button>
              <button
                onClick={refresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 text-sm"
              >
                <RefreshCw
                  size={16}
                  className={isRefreshing ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-200 rounded-lg flex items-center justify-center">
              <span className="text-red-600 font-bold text-sm">!</span>
            </div>
            <div>
              <strong className="text-red-800">Error:</strong> {error}
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        {/* Revenue Card */}
        <div className="flex-1 bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-emerald-600">
              {computedMetrics.revenueGrowth >= 0 ? (
                <ArrowUpRight size={16} />
              ) : (
                <ArrowDownRight size={16} />
              )}
              <span className="text-sm font-semibold">
                {isLoading
                  ? "..."
                  : formatPercentage(computedMetrics.revenueGrowth) || "N/A"}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-emerald-700 font-medium">
              Total Revenue
            </p>
            <p className="text-2xl font-bold text-emerald-800">
              {isLoading ? (
                <span className="animate-pulse bg-gray-200 h-8 w-32 rounded inline-block"></span>
              ) : (
                formatCurrency(revenueSummary?.totalRevenue || 0)
              )}
            </p>
            <p className="text-sm text-emerald-600 mt-1">vs last period</p>
          </div>
        </div>

        {/* Profit Card */}
        <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Banknote size={20} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-blue-600">
              {computedMetrics.profitGrowth >= 0 ? (
                <ArrowUpRight size={16} />
              ) : (
                <ArrowDownRight size={16} />
              )}
              <span className="text-sm font-semibold">
                {isLoading
                  ? "..."
                  : formatPercentage(computedMetrics.profitGrowth) || "N/A"}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-blue-700 font-medium">Gross Profit</p>
            <p className="text-2xl font-bold text-blue-800">
              {isLoading ? (
                <span className="animate-pulse bg-gray-200 h-8 w-32 rounded inline-block"></span>
              ) : (
                formatCurrency(costAnalysis?.grossProfit || 0)
              )}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              {isLoading
                ? "..."
                : formatPercentage(costAnalysis?.profitMargin || 0)}{" "}
              margin
            </p>
          </div>
        </div>

        {/* Sales Card */}
        <div className="flex-1 bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
              <ShoppingCart size={20} className="text-white" />
            </div>
            <div className="flex items-center gap-1 text-indigo-600">
              <ArrowUpRight size={16} />
              <span className="text-sm font-semibold">{selectedPeriod}</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-indigo-700 font-medium">Total Sales</p>
            <p className="text-2xl font-bold text-indigo-800">
              {isLoading ? (
                <span className="animate-pulse bg-gray-200 h-8 w-32 rounded inline-block"></span>
              ) : (
                formatNumber(revenueSummary?.salesCount || 0)
              )}
            </p>
            <p className="text-sm text-indigo-600 mt-1">transactions</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        {/* Monthly Revenue Chart */}
        <div className="flex-1 bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
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
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse text-gray-400">
                Loading chart data...
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-end gap-2">
              {(monthlyTrends || []).slice(-12).map((data, index) => {
                const maxRevenue = Math.max(
                  ...(monthlyTrends || []).map((m) => m.revenue)
                );
                const maxProfit = Math.max(
                  ...(monthlyTrends || []).map((m) => m.profit)
                );
                return (
                  <div
                    key={`trend-${data.month || index}`}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div className="w-full flex flex-col gap-1">
                      <div
                        className="bg-blue-500 rounded-t"
                        style={{
                          height: `${
                            maxRevenue > 0
                              ? (data.revenue / maxRevenue) * 180
                              : 0
                          }px`,
                        }}
                      ></div>
                      <div
                        className="bg-green-500 rounded-b"
                        style={{
                          height: `${
                            maxProfit > 0 ? (data.profit / maxProfit) * 60 : 0
                          }px`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 mt-2">
                      {data.month?.substring(0, 3) || "N/A"}
                    </span>
                  </div>
                );
              })}
              {(!monthlyTrends || monthlyTrends.length === 0) && (
                <div className="w-full text-center text-gray-500 py-20">
                  No monthly data available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cost Breakdown */}
        <div className="flex-1 bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Cost Breakdown
          </h2>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={`cost-loading-${i}`} className="animate-pulse">
                  <div className="flex justify-between mb-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Cost of Goods Sold</span>
                  <span className="font-semibold">
                    {formatCurrency(costAnalysis?.totalCosts || 0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width:
                        costAnalysis?.totalRevenue > 0
                          ? `${
                              ((costAnalysis?.totalCosts || 0) /
                                costAnalysis.totalRevenue) *
                              100
                            }%`
                          : "0%",
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Gross Profit</span>
                  <span className="font-semibold">
                    {formatCurrency(costAnalysis?.grossProfit || 0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width:
                        costAnalysis?.totalRevenue > 0
                          ? `${
                              ((costAnalysis?.grossProfit || 0) /
                                costAnalysis.totalRevenue) *
                              100
                            }%`
                          : "0%",
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Average Order Value</span>
                  <span className="font-semibold">
                    {formatCurrency(revenueSummary?.averageOrderValue || 0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Performing Products */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Top Performing Products
          </h2>
          <button className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm">
            <Filter size={16} />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                  Product
                </th>
                <th className="py-4 px-6 text-right text-sm font-semibold text-gray-700">
                  Revenue
                </th>
                <th className="py-4 px-6 text-right text-sm font-semibold text-gray-700">
                  Profit
                </th>
                <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700">
                  Sales
                </th>
                <th className="py-4 px-6 text-right text-sm font-semibold text-gray-700">
                  Margin
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading
                ? [...Array(5)].map((_, index) => (
                    <tr
                      key={`product-loading-${index}`}
                      className="hover:bg-white"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse ml-auto"></div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse ml-auto"></div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse mx-auto"></div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse ml-auto"></div>
                      </td>
                    </tr>
                  ))
                : (topProducts || []).map((product, index) => (
                    <tr
                      key={product.id || index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {product.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatNumber(product.totalQuantity)} units sold
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-right font-semibold text-gray-900">
                        {formatCurrency(product.totalRevenue)}
                      </td>
                      <td className="py-5 px-6 text-right font-semibold text-emerald-600">
                        {formatCurrency(product.profit)}
                      </td>
                      <td className="py-5 px-6 text-center">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {formatNumber(product.totalQuantity)}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="font-semibold text-sm text-blue-600">
                            {formatPercentage(product.profitMargin)}
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                product.profitMargin > 45
                                  ? "bg-green-500"
                                  : "bg-blue-500"
                              }`}
                              style={{
                                width: `${
                                  product.profitMargin > 0
                                    ? Math.min(product.profitMargin, 100)
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
              {!isLoading && (!topProducts || topProducts.length === 0) && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">
                    No product data available for the selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
