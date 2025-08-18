import React from "react";
import PropTypes from "prop-types";
import {
  TrendingUp,
  AlertTriangle,
  Clock3,
  PackageX,
  Award,
  LineChart,
} from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import SalesByHourChart from "@/components/charts/SalesByHourChart";
import SalesByCategoryChart from "@/components/charts/SalesByCategoryChart";

const iconMap = {
  "Total Products": <PackageX className="w-5 h-5" />,
  "Low Stock": <AlertTriangle className="w-5 h-5" />,
  "Expiring Soon": <Clock3 className="w-5 h-5" />,
  "Today Sales": <TrendingUp className="w-5 h-5" />,
  "Avg / Hour": <LineChart className="w-5 h-5" />,
  "Best Seller Qty": <Award className="w-5 h-5" />,
};

const SummaryCard = ({ title, value, iconBg }) => (
  <div
    className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition flex flex-col gap-3"
    aria-label={title}
  >
    <div
      className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}
    >
      {iconMap[title]}
    </div>
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {title}
      </p>
      <p className="text-xl font-bold text-gray-800 mt-1 tabular-nums">
        {value}
      </p>
    </div>
  </div>
);

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  iconBg: PropTypes.string.isRequired,
};

export default function Dashboard() {
  const { data: dashboardData, isLoading, error } = useDashboardData();

  // Extract data with fallbacks for loading state
  const {
    summaryCards = [],
    salesByHourData = [],
    salesByCategory = [],
    bestSellers = [],
    expiringSoon = [],
    lowStockItems = [],
    recentSales = [],
  } = dashboardData || {};

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Admin Dashboard</h2>
          <p className="text-gray-600 text-sm">
            Overview metrics & inventory insights for your pharmacy
            administration.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading dashboard data...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error loading dashboard: {error.message}
        </div>
      )}

      {/* Dashboard Content */}
      {!isLoading && !error && (
        <>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {summaryCards.map((c) => (
              <SummaryCard key={c.title} {...c} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <LineChart className="text-blue-600" /> Hourly Sales
              </h3>
              <SalesByHourChart data={salesByHourData} />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="text-emerald-600" /> Sales by Category
              </h3>
              <SalesByCategoryChart data={salesByCategory} />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Award className="text-yellow-500" /> Best Sellers
              </h3>
              <ul className="space-y-3 text-sm">
                {bestSellers.map((b) => (
                  <li
                    key={b.name}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-700 truncate pr-3">
                      {b.name}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-gray-100 font-semibold text-gray-800 text-xs">
                      {b.quantity} sold
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock3 className="text-red-500" /> Expiring Soon
              </h3>
              <ul className="space-y-3 text-sm">
                {expiringSoon.map((e) => (
                  <li
                    key={e.name}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-700 truncate pr-3">
                      {e.name}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-semibold text-xs">
                      {e.days} days
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="text-amber-600" /> Low Stock
              </h3>
              <ul className="space-y-3 text-sm">
                {lowStockItems.map((l) => (
                  <li
                    key={l.name}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-700 truncate pr-3">
                      {l.name}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold text-xs">
                      {l.quantity} left
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="text-blue-600" /> Recent Sales
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-gray-600 bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Product</th>
                    <th className="text-center px-4 py-2 font-medium">Qty</th>
                    <th className="text-right px-4 py-2 font-medium">Price</th>
                    <th className="text-right px-4 py-2 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentSales.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-800">
                        {r.product}
                      </td>
                      <td className="px-4 py-2 text-center tabular-nums">
                        {r.qty}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        ₱{r.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-500">
                        {r.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
