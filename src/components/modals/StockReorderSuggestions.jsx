import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShoppingCart,
  BarChart3,
  Calendar,
  DollarSign,
  X,
  ExternalLink,
} from "lucide-react";
import { useNotification } from "@/hooks/useNotification";

export default function StockReorderSuggestions({
  isOpen,
  onClose,
  products = [],
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [sortBy, setSortBy] = useState("urgency"); // urgency, demand, cost
  const { addNotification } = useNotification();

  // Calculate reorder suggestions
  // Calculate reorder suggestions
  const calculateSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      // Get sales data for demand calculation (mock for now)
      const suggestions = products
        .filter(
          (product) =>
            (product.total_stock || 0) <= (product.low_stock_threshold || 10)
        )
        .map((product) => {
          // Mock sales data - replace with real API call
          const avgDailySales = Math.max(1, Math.floor(Math.random() * 10) + 1);
          const daysOfStock = Math.floor(
            (product.total_stock || 0) / avgDailySales
          );
          const suggestedOrder = Math.max(
            avgDailySales * 30, // 30 days worth
            (product.low_stock_threshold || 10) * 2 // or 2x threshold
          );

          // Calculate urgency score
          let urgencyScore = 100;
          if (product.total_stock === 0) urgencyScore = 95;
          else if (daysOfStock <= 3) urgencyScore = 90;
          else if (daysOfStock <= 7) urgencyScore = 80;
          else if (daysOfStock <= 14) urgencyScore = 70;
          else urgencyScore = 60;

          // Calculate demand score
          const demandScore = Math.min(100, avgDailySales * 10);

          // Calculate cost efficiency
          const totalCost = suggestedOrder * (product.cost_price || 0);
          const potential_revenue =
            suggestedOrder * (product.selling_price || 0);
          const profit_margin =
            potential_revenue > 0
              ? ((potential_revenue - totalCost) / potential_revenue) * 100
              : 0;

          return {
            ...product,
            avgDailySales,
            daysOfStock,
            suggestedOrder,
            urgencyScore,
            demandScore,
            totalCost,
            potential_revenue,
            profit_margin,
            priority:
              urgencyScore >= 90
                ? "critical"
                : urgencyScore >= 80
                ? "high"
                : urgencyScore >= 70
                ? "medium"
                : "low",
          };
        })
        .sort((a, b) => {
          switch (sortBy) {
            case "urgency":
              return b.urgencyScore - a.urgencyScore;
            case "demand":
              return b.demandScore - a.demandScore;
            case "cost":
              return a.totalCost - b.totalCost;
            default:
              return b.urgencyScore - a.urgencyScore;
          }
        });

      setSuggestions(suggestions);
    } catch (error) {
      console.error("Error calculating suggestions:", error);
      addNotification("Failed to calculate reorder suggestions", "error");
    } finally {
      setLoading(false);
    }
  }, [products, sortBy, addNotification]);

  useEffect(() => {
    if (isOpen && products.length > 0) {
      calculateSuggestions();
    }
  }, [isOpen, products, calculateSuggestions]);

  const handleSelectSuggestion = (productId) => {
    setSelectedSuggestions((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleGenerateReorderList = () => {
    const selectedItems = suggestions.filter((s) =>
      selectedSuggestions.includes(s.id)
    );

    if (selectedItems.length === 0) {
      addNotification("Please select items to reorder", "warning");
      return;
    }

    // Generate CSV for reorder
    const headers = [
      "Product Name",
      "Current Stock",
      "Suggested Order",
      "Unit Cost",
      "Total Cost",
      "Supplier",
      "Priority",
    ];

    const csvContent = [
      headers.join(","),
      ...selectedItems.map((item) =>
        [
          `"${item.name}"`,
          item.total_stock || 0,
          item.suggestedOrder,
          item.cost_price || 0,
          item.totalCost.toFixed(2),
          `"${item.supplier || "N/A"}"`,
          item.priority,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reorder_list_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
    URL.revokeObjectURL(url);

    addNotification(
      `Reorder list generated for ${selectedItems.length} items`,
      "success"
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "critical":
        return <AlertTriangle size={16} className="text-red-600" />;
      case "high":
        return <Clock size={16} className="text-orange-600" />;
      case "medium":
        return <BarChart3 size={16} className="text-yellow-600" />;
      case "low":
        return <CheckCircle size={16} className="text-green-600" />;
      default:
        return <Package size={16} className="text-gray-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <ShoppingCart size={24} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Smart Reorder Suggestions
                </h2>
                <p className="text-gray-600 mt-1">
                  AI-powered stock replenishment recommendations
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-red-600" />
                <div>
                  <p className="text-sm text-red-600 font-medium">Critical</p>
                  <p className="text-xl font-bold text-red-800">
                    {
                      suggestions.filter((s) => s.priority === "critical")
                        .length
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-orange-600" />
                <div>
                  <p className="text-sm text-orange-600 font-medium">High</p>
                  <p className="text-xl font-bold text-orange-800">
                    {suggestions.filter((s) => s.priority === "high").length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <DollarSign size={20} className="text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">
                    Total Cost
                  </p>
                  <p className="text-xl font-bold text-blue-800">
                    ₱
                    {suggestions
                      .reduce((sum, s) => sum + s.totalCost, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <TrendingUp size={20} className="text-green-600" />
                <div>
                  <p className="text-sm text-green-600 font-medium">
                    Avg Profit
                  </p>
                  <p className="text-xl font-bold text-green-800">
                    {suggestions.length > 0
                      ? (
                          suggestions.reduce(
                            (sum, s) => sum + s.profit_margin,
                            0
                          ) / suggestions.length
                        ).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="urgency">Urgency</option>
                <option value="demand">Demand</option>
                <option value="cost">Cost (Low to High)</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {selectedSuggestions.length} selected
              </span>
              <button
                onClick={handleGenerateReorderList}
                disabled={selectedSuggestions.length === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                <ExternalLink size={16} />
                Generate Reorder List
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Analyzing stock levels...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                All Stock Levels Look Good!
              </h3>
              <p className="text-gray-500">
                No immediate reorder suggestions at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`border rounded-xl p-6 transition-all ${
                    selectedSuggestions.includes(suggestion.id)
                      ? "border-purple-300 bg-purple-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedSuggestions.includes(suggestion.id)}
                        onChange={() => handleSelectSuggestion(suggestion.id)}
                        className="mt-2 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {suggestion.name}
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-gray-600">
                                ID: {suggestion.id}
                              </span>
                              <span className="text-sm text-gray-600">
                                Category: {suggestion.category}
                              </span>
                              <span className="text-sm text-gray-600">
                                Supplier: {suggestion.supplier || "N/A"}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getPriorityColor(
                              suggestion.priority
                            )}`}
                          >
                            {getPriorityIcon(suggestion.priority)}
                            <span className="text-sm font-medium capitalize">
                              {suggestion.priority}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Current Stock
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                              {suggestion.total_stock || 0}
                            </p>
                            <p className="text-xs text-gray-500">
                              ~{suggestion.daysOfStock} days left
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Suggested Order
                            </p>
                            <p className="text-lg font-bold text-blue-600">
                              {suggestion.suggestedOrder}
                            </p>
                            <p className="text-xs text-gray-500">
                              {suggestion.avgDailySales}/day demand
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Total Cost
                            </p>
                            <p className="text-lg font-bold text-red-600">
                              ₱{suggestion.totalCost.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              ₱{suggestion.cost_price || 0}/unit
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Profit Margin
                            </p>
                            <p className="text-lg font-bold text-green-600">
                              {suggestion.profit_margin.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500">
                              ₱{suggestion.potential_revenue.toLocaleString()}{" "}
                              revenue
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar for Urgency */}
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Urgency Score</span>
                            <span>{suggestion.urgencyScore}/100</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                suggestion.urgencyScore >= 90
                                  ? "bg-red-500"
                                  : suggestion.urgencyScore >= 80
                                  ? "bg-orange-500"
                                  : suggestion.urgencyScore >= 70
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${suggestion.urgencyScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {suggestions.length} items need attention •{" "}
              {selectedSuggestions.length} selected for reorder
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Select all critical and high priority items
                  const urgentItems = suggestions
                    .filter(
                      (s) => s.priority === "critical" || s.priority === "high"
                    )
                    .map((s) => s.id);
                  setSelectedSuggestions(urgentItems);
                }}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Select Urgent Items
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
