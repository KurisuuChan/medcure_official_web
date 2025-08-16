import React from "react";
import PropTypes from "prop-types";
import {
  TrendingUp,
  AlertTriangle,
  Clock3,
  PackageX,
  Award,
  LineChart,
  Activity,
  Zap,
  DollarSign,
} from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import SalesByHourChart from "@/components/charts/SalesByHourChart";
import SalesByCategoryChart from "@/components/charts/SalesByCategoryChart";

const iconMap = {
  "Total Products": <PackageX className="w-5 h-5" />,
  "Low Stock": <AlertTriangle className="w-5 h-5" />,
  "Expiring Soon": <Clock3 className="w-5 h-5" />,
  "Today Sales": <DollarSign className="w-5 h-5" />,
  "Avg / Hour": <Activity className="w-5 h-5" />,
  "Best Seller Qty": <Award className="w-5 h-5" />,
};

const colorMap = {
  "Total Products": { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
  "Low Stock": { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
  "Expiring Soon": { bg: "bg-red-50", text: "text-red-600", border: "border-red-100" },
  "Today Sales": { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  "Avg / Hour": { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
  "Best Seller Qty": { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100" },
};

const SummaryCard = ({ title, value }) => {
  const colors = colorMap[title] || { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-100" };
  
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border ${colors.border} hover:shadow-md transition-all duration-300 group hover:-translate-y-1`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <div className={colors.text}>
            {iconMap[title]}
          </div>
        </div>
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-800 tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
};

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default function Dashboard() {
  const {
    summaryCards,
    salesByHourData,
    salesByCategory,
    bestSellers,
    expiringSoon,
    lowStockItems,
    recentSales,
  } = useDashboardData();

  return (
    <div className="space-y-8 p-6 bg-gray-50/30 min-h-screen">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" />
            Real-time pharmacy insights and analytics
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">System Online</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((card) => (
          <SummaryCard key={card.title} title={card.title} value={card.value} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <LineChart className="w-4 h-4 text-blue-600" />
              </div>
              Hourly Sales Performance
            </h3>
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
              Last 24 hours
            </div>
          </div>
          <SalesByHourChart data={salesByHourData} />
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              Category Sales
            </h3>
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
              Today
            </div>
          </div>
          <SalesByCategoryChart data={salesByCategory} />
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Best Sellers */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                <Award className="w-4 h-4 text-orange-600" />
              </div>
              Top Sellers
            </h3>
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
              This week
            </div>
          </div>
          <div className="space-y-4">
            {bestSellers.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-700 text-sm">
                    {item.name}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 font-semibold text-xs">
                  {item.quantity} sold
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <Clock3 className="w-4 h-4 text-red-600" />
              </div>
              Expiring Soon
            </h3>
            <div className="text-xs text-red-600 bg-red-50 px-3 py-1 rounded-full font-medium">
              Urgent
            </div>
          </div>
          <div className="space-y-4">
            {expiringSoon.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-red-50/30 hover:bg-red-50/50 transition-colors duration-200">
                <span className="font-medium text-gray-700 text-sm">
                  {item.name}
                </span>
                <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold text-xs">
                  {item.days} days
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              Low Stock Alert
            </h3>
            <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full font-medium">
              Action needed
            </div>
          </div>
          <div className="space-y-4">
            {lowStockItems.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/30 hover:bg-amber-50/50 transition-colors duration-200">
                <span className="font-medium text-gray-700 text-sm">
                  {item.name}
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold text-xs">
                  {item.quantity} left
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sales Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            Recent Sales Activity
          </h3>
          <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
            Last 24 hours
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="text-xs font-semibold text-gray-600 uppercase tracking-wide pb-3">Product</th>
                <th className="text-xs font-semibold text-gray-600 uppercase tracking-wide pb-3 text-center">Quantity</th>
                <th className="text-xs font-semibold text-gray-600 uppercase tracking-wide pb-3 text-right">Price</th>
                <th className="text-xs font-semibold text-gray-600 uppercase tracking-wide pb-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentSales.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                  <td className="py-4">
                    <div className="font-medium text-gray-800 text-sm">{r.product}</div>
                  </td>
                  <td className="py-4 text-center">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs">
                      {r.qty}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="font-semibold text-gray-800 text-sm">₱{r.price.toFixed(2)}</div>
                  </td>
                  <td className="py-4 text-right">
                    <div className="text-sm text-gray-600">{r.time}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Total transactions: <span className="font-semibold text-gray-800">{recentSales.length}</span>
            </span>
            <button className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors duration-200">
              View all sales →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
