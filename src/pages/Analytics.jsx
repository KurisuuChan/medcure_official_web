import React from "react";
import {
  TrendingUp,
  AlertTriangle,
  Clock3,
  Award,
  Activity,
  BarChart3,
  Package,
} from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import SalesByCategoryChart from "@/components/charts/SalesByCategoryChart";

export default function Analytics() {
  const {
    salesByCategory,
    bestSellers,
    expiringSoon,
    lowStockItems,
    recentSales,
  } = useDashboardData();

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-800">Detailed Analytics</h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          In-depth analysis of your pharmacy operations, sales patterns, and
          inventory insights.
        </p>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Sales Chart */}
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-gray-200/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                Category Sales
              </h3>
              <p className="text-gray-600">
                Sales distribution by product category
              </p>
            </div>
          </div>
          <SalesByCategoryChart data={salesByCategory} />
        </div>

        {/* Performance Metrics */}
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-gray-200/50">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Key Metrics</h3>
              <p className="text-gray-600">Important performance indicators</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                ₱24.5K
              </div>
              <div className="text-sm font-semibold text-blue-800">
                Today's Revenue
              </div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200">
              <div className="text-3xl font-bold text-emerald-600 mb-2">
                148
              </div>
              <div className="text-sm font-semibold text-emerald-800">
                Total Products
              </div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
              <div className="text-3xl font-bold text-orange-600 mb-2">23</div>
              <div className="text-sm font-semibold text-orange-800">
                Transactions/Hour
              </div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
              <div className="text-3xl font-bold text-purple-600 mb-2">98%</div>
              <div className="text-sm font-semibold text-purple-800">
                Customer Satisfaction
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Best Sellers */}
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-gray-200/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Top Sellers</h3>
            </div>
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
              This week
            </div>
          </div>
          <div className="space-y-4">
            {bestSellers.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-orange-50/50 to-orange-100/30 hover:from-orange-50 hover:to-orange-100/50 transition-all duration-200 border border-orange-200/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="font-semibold text-gray-700">
                    {item.name}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-sm">
                  {item.quantity} sold
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-gray-200/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <Clock3 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Expiring Soon</h3>
            </div>
            <div className="text-xs text-red-600 bg-red-100 px-3 py-1 rounded-full font-medium">
              Urgent
            </div>
          </div>
          <div className="space-y-4">
            {expiringSoon.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-red-50/50 to-red-100/30 hover:from-red-50 hover:to-red-100/50 transition-all duration-200 border border-red-200/50"
              >
                <span className="font-semibold text-gray-700">{item.name}</span>
                <div className="flex items-center gap-2">
                  <Clock3 className="w-4 h-4 text-red-500" />
                  <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-sm">
                    {item.days} days
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-gray-200/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                Low Stock Alert
              </h3>
            </div>
            <div className="text-xs text-amber-600 bg-amber-100 px-3 py-1 rounded-full font-medium">
              Action needed
            </div>
          </div>
          <div className="space-y-4">
            {lowStockItems.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-50/50 to-amber-100/30 hover:from-amber-50 hover:to-amber-100/50 transition-all duration-200 border border-amber-200/50"
              >
                <span className="font-semibold text-gray-700">{item.name}</span>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-500" />
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-bold text-sm">
                    {item.quantity} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Sales Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-200/50 overflow-hidden">
        <div className="p-8 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  Detailed Sales Activity
                </h3>
                <p className="text-gray-600">
                  Complete transaction history and analysis
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="text-sm font-bold text-gray-700 uppercase tracking-wide pb-4">
                    Product
                  </th>
                  <th className="text-sm font-bold text-gray-700 uppercase tracking-wide pb-4 text-center">
                    Quantity
                  </th>
                  <th className="text-sm font-bold text-gray-700 uppercase tracking-wide pb-4 text-right">
                    Price
                  </th>
                  <th className="text-sm font-bold text-gray-700 uppercase tracking-wide pb-4 text-right">
                    Time
                  </th>
                  <th className="text-sm font-bold text-gray-700 uppercase tracking-wide pb-4 text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-gray-50/50 transition-colors duration-200"
                  >
                    <td className="py-4">
                      <div className="font-semibold text-gray-800">
                        {sale.product}
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                        {sale.qty}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="font-bold text-gray-800">
                        ₱{sale.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="text-gray-600 font-medium">
                        {sale.time}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-xs">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
