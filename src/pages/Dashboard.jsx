import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  AlertTriangle,
  Clock3,
  PackageX,
  DollarSign,
  LineChart,
  Zap,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import SalesByHourChart from "@/components/charts/SalesByHourChart";

// Main summary cards with navigation
const summaryCardsConfig = [
  {
    title: "Total Products",
    icon: <PackageX className="w-6 h-6" />,
    colors: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-200",
      hover: "hover:bg-blue-100",
    },
    route: "/management",
    description: "Manage inventory",
  },
  {
    title: "Low Stock",
    icon: <AlertTriangle className="w-6 h-6" />,
    colors: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-200",
      hover: "hover:bg-amber-100",
    },
    route: "/management",
    description: "Needs attention",
  },
  {
    title: "Expiring Soon",
    icon: <Clock3 className="w-6 h-6" />,
    colors: {
      bg: "bg-red-50",
      text: "text-red-600",
      border: "border-red-200",
      hover: "hover:bg-red-100",
    },
    route: "/management",
    description: "Check expiry dates",
  },
  {
    title: "Today Sales",
    icon: <DollarSign className="w-6 h-6" />,
    colors: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-200",
      hover: "hover:bg-emerald-100",
    },
    route: "/reports",
    description: "View sales reports",
  },
];

const SummaryCard = ({ title, value, config, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white p-6 rounded-2xl shadow-sm border-2 ${config.colors.border} ${config.colors.hover} hover:shadow-lg transition-all duration-300 group cursor-pointer hover:-translate-y-2 relative overflow-hidden`}
    >
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
        <div
          className={`w-full h-full ${config.colors.text} transform rotate-12 scale-150`}
        >
          {config.icon}
        </div>
      </div>

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-14 h-14 rounded-2xl ${config.colors.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}
          >
            <div className={config.colors.text}>{config.icon}</div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:scale-110 transition-all duration-300" />
        </div>

        <div className="space-y-2">
          <p className="text-3xl font-bold text-gray-800 tabular-nums">
            {value}
          </p>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500 font-medium">
            {config.description}
          </p>
        </div>
      </div>
    </div>
  );
};

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  config: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { summaryCards, salesByHourData, recentSales } = useDashboardData();

  const handleCardClick = (route) => {
    navigate(route);
  };

  // Get the main summary cards we want to display
  const mainCards = summaryCards.filter((card) =>
    summaryCardsConfig.some((config) => config.title === card.title)
  );

  return (
    <div className="space-y-10 p-6 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          <Zap className="w-4 h-4" />
          Real-time Dashboard
        </div>
        <h1 className="text-4xl font-bold text-gray-800">MedCure Dashboard</h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Your pharmacy management hub - monitor key metrics, track performance,
          and stay informed about critical alerts.
        </p>
      </div>

      {/* Main Summary Cards */}
      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {mainCards.map((card) => {
          const config = summaryCardsConfig.find((c) => c.title === card.title);
          return (
            <SummaryCard
              key={card.title}
              title={card.title}
              value={card.value}
              config={config}
              onClick={() => handleCardClick(config.route)}
            />
          );
        })}
      </div>

      {/* Analytics Section */}
      <div className="space-y-8">
        {/* Analytics Section - Full Width */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-gray-200/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                <LineChart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  Sales Performance
                </h3>
                <p className="text-gray-600">Real-time hourly sales tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-700">
                Live Data
              </span>
            </div>
          </div>
          <SalesByHourChart data={salesByHourData} />
        </div>

        {/* Recent Activity - Enhanced */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-gray-200/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  Recent Sales Activity
                </h3>
                <p className="text-gray-600">
                  Latest transactions and performance metrics
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/reports")}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 font-medium rounded-xl transition-all duration-200 border border-indigo-200"
            >
              View all reports →
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Sales List */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Latest Transactions
              </h4>
              <div className="space-y-3">
                {recentSales.slice(0, 6).map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100/80 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <DollarSign size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">
                          {sale.product}
                        </div>
                        <div className="text-xs text-gray-500">{sale.time}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-800">
                        ₱{sale.price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-md">
                        Qty: {sale.qty}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Metrics */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Performance Summary
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200">
                  <div className="text-2xl font-bold text-emerald-600 mb-1">
                    ₱24.5K
                  </div>
                  <div className="text-sm font-medium text-emerald-800">
                    Today's Revenue
                  </div>
                  <div className="text-xs text-emerald-600 mt-1">
                    ↗ +12% from yesterday
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    148
                  </div>
                  <div className="text-sm font-medium text-blue-800">
                    Products Sold
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    ↗ +8% from yesterday
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    23
                  </div>
                  <div className="text-sm font-medium text-orange-800">
                    Avg/Hour
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    Peak: 2-3 PM
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    98%
                  </div>
                  <div className="text-sm font-medium text-purple-800">
                    Satisfaction
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    Based on feedback
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
