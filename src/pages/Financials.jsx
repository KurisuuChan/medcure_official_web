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
} from "lucide-react";

export default function Financials() {
  const [dateRange, setDateRange] = useState("month");

  // Mock financial data
  const stats = {
    totalRevenue: 2450000,
    totalCosts: 1680000,
    grossProfit: 770000,
    profitMargin: 31.4,
    totalSales: 1248,
    avgOrderValue: 1963.14,
  };

  const monthlyData = [
    { month: "Jan", revenue: 185000, costs: 125000, profit: 60000 },
    { month: "Feb", revenue: 205000, costs: 140000, profit: 65000 },
    { month: "Mar", revenue: 195000, costs: 135000, profit: 60000 },
    { month: "Apr", revenue: 220000, costs: 150000, profit: 70000 },
    { month: "May", revenue: 240000, costs: 165000, profit: 75000 },
    { month: "Jun", revenue: 230000, costs: 160000, profit: 70000 },
    { month: "Jul", revenue: 250000, costs: 170000, profit: 80000 },
    { month: "Aug", revenue: 265000, costs: 180000, profit: 85000 },
    { month: "Sep", revenue: 255000, costs: 175000, profit: 80000 },
    { month: "Oct", revenue: 270000, costs: 185000, profit: 85000 },
    { month: "Nov", revenue: 280000, costs: 190000, profit: 90000 },
    { month: "Dec", revenue: 290000, costs: 195000, profit: 95000 },
  ];

  const topProducts = [
    {
      name: "Amoxicillin 500mg",
      revenue: 145000,
      profit: 58000,
      margin: 40.0,
      sales: 580,
    },
    {
      name: "Paracetamol 500mg",
      revenue: 98000,
      profit: 39200,
      margin: 40.0,
      sales: 1960,
    },
    {
      name: "Vitamin C 1000mg",
      revenue: 87500,
      profit: 43750,
      margin: 50.0,
      sales: 1750,
    },
    {
      name: "Ibuprofen 200mg",
      revenue: 76000,
      profit: 30400,
      margin: 40.0,
      sales: 760,
    },
    {
      name: "Aspirin 81mg",
      revenue: 54000,
      profit: 27000,
      margin: 50.0,
      sales: 2700,
    },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-100">
            <BarChart size={32} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Financial Overview
            </h1>
            <p className="text-gray-500 mt-1">
              Revenue, costs, and profitability analytics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download size={16} />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800">
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
          <div className="h-64 flex items-end gap-2">
            {monthlyData.map((data) => (
              <div
                key={data.month}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div className="w-full flex flex-col gap-1">
                  <div
                    className="bg-blue-500 rounded-t"
                    style={{ height: `${(data.revenue / 300000) * 200}px` }}
                  ></div>
                  <div
                    className="bg-green-500 rounded-b"
                    style={{ height: `${(data.profit / 100000) * 60}px` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 mt-2">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Cost Breakdown
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Cost of Goods Sold</span>
                <span className="font-semibold">{formatCurrency(1200000)}</span>
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
                <span className="font-semibold">{formatCurrency(320000)}</span>
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
                <span className="font-semibold">{formatCurrency(160000)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: "9.5%" }}
                ></div>
              </div>
            </div>
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
    </div>
  );
}
