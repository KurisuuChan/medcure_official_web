import React, { useState, useEffect } from "react";
import {
  Archive,
  Search,
  Package,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Eye,
  RefreshCw,
  RotateCcw,
  ChevronDown,
  FileText,
  Clock,
  Tag,
  ExternalLink,
  Trash2,
} from "lucide-react";
import {
  useArchivedProducts,
  useRestoreArchivedProduct,
  usePermanentlyDeleteArchivedItem,
  useBulkPermanentlyDeleteArchivedItems,
} from "../hooks/useArchive.js";
import { useNotification } from "../hooks/useNotification.js";
import { formatCurrency, formatDate } from "../utils/formatters.js";
import ArchiveConnectionTest from "../components/ArchiveConnectionTest.jsx";

export default function Archived() {
  const { addNotification } = useNotification();
  const {
    data: archivedItems = [],
    isLoading,
    error,
    refetch,
  } = useArchivedProducts();
  const restoreProduct = useRestoreArchivedProduct();
  const deleteProduct = usePermanentlyDeleteArchivedItem();
  const bulkDeleteProducts = useBulkPermanentlyDeleteArchivedItems();

  // Debug logging
  useEffect(() => {
    console.log("🔄 Archive page mounted/updated");
    console.log("📊 Archived items:", archivedItems?.length || 0);
    console.log("⏳ Loading:", isLoading);
    console.log("❌ Error:", error);
    console.log("📋 Items data:", archivedItems);
  }, [archivedItems, isLoading, error]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all"); // all, week, month, year
  const [reasonFilter, setReasonFilter] = useState("all"); // all, expired, damaged, low-demand, recalled, discontinued, bulk, other
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, name
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedItems, setExpandedItems] = useState([]);

  // Clean up localStorage corruption on mount
  useEffect(() => {
    const cleanupLocalStorage = () => {
      try {
        // Check and clean specific keys that might be corrupted
        const keysToCheck = ["medcure_archived_items", "archived_items"];

        keysToCheck.forEach((key) => {
          try {
            const stored = localStorage.getItem(key);
            if (
              stored &&
              (stored === "[object Object]" ||
                stored.includes("[object Object]") ||
                stored === "undefined" ||
                stored === "null")
            ) {
              console.warn(`Cleaning corrupted localStorage key: ${key}`);
              localStorage.removeItem(key);
            }
          } catch (error) {
            console.warn(`Error checking localStorage key ${key}:`, error);
            try {
              localStorage.removeItem(key);
            } catch (removeError) {
              console.error(
                `Failed to remove corrupted key ${key}:`,
                removeError
              );
            }
          }
        });
      } catch (error) {
        console.error("Error during localStorage cleanup:", error);
      }
    };

    cleanupLocalStorage();
  }, []);

  // Handle restore functionality
  const handleRestore = async (item) => {
    if (window.confirm(`Are you sure you want to restore "${item.name}"?`)) {
      try {
        await restoreProduct.mutateAsync({
          productId: item.id,
          restoredBy: "Admin", // You can modify this to use actual user info
        });
        addNotification(
          `"${item.name}" has been restored successfully`,
          "success"
        );
        setSelectedItems((prev) => prev.filter((id) => id !== item.id));
      } catch (error) {
        console.error("Restore error:", error);
        addNotification(error.message || "Failed to restore product", "error");
      }
    }
  };

  // Handle permanent delete functionality
  const handleDelete = async (item) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${item.name}"? This action cannot be undone.`
      )
    ) {
      try {
        const result = await deleteProduct.mutateAsync({
          productId: item.id,
          deletedBy: "Admin", // You can modify this to use actual user info
        });

        addNotification(
          `"${item.name}" has been permanently deleted`,
          "success"
        );
        setSelectedItems((prev) => prev.filter((id) => id !== item.id));

        // Optional: Log successful deletion
        console.log("Product deleted successfully:", result);
      } catch (error) {
        console.error("Delete error:", error);

        // Provide more specific error messages
        const errorMessage = error.message || "Failed to delete product";

        if (
          errorMessage.includes("not found") ||
          errorMessage.includes("not archived")
        ) {
          addNotification(
            `Cannot delete "${item.name}": Product not found or not archived`,
            "error"
          );
        } else {
          addNotification(
            `Failed to delete "${item.name}": ${errorMessage}`,
            "error"
          );
        }
      }
    }
  };

  // Handle bulk delete functionality
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    if (
      window.confirm(
        `Are you sure you want to permanently delete ${selectedItems.length} products? This action cannot be undone.`
      )
    ) {
      try {
        // Use the bulk delete hook for better performance
        const result = await bulkDeleteProducts.mutateAsync({
          productIds: selectedItems,
          deletedBy: "Admin", // You can modify this to use actual user info
        });

        if (result.success) {
          addNotification(
            `${result.totalDeleted} products permanently deleted successfully`,
            "success"
          );

          if (result.skipped > 0) {
            addNotification(
              `${result.skipped} products were skipped (not archived)`,
              "warning"
            );
          }
        }

        setSelectedItems([]);
      } catch (error) {
        console.error("Bulk delete error:", error);
        addNotification(
          error.message || "Failed to delete selected products",
          "error"
        );
      }
    }
  };

  const handleBulkRestore = async () => {
    if (selectedItems.length === 0) return;

    if (
      window.confirm(
        `Are you sure you want to restore ${selectedItems.length} products?`
      )
    ) {
      try {
        await Promise.all(
          selectedItems.map((id) =>
            restoreProduct.mutateAsync({
              productId: id,
              restoredBy: "Admin",
            })
          )
        );
        addNotification(
          `${selectedItems.length} products restored successfully`,
          "success"
        );
        setSelectedItems([]);
      } catch (error) {
        console.error("Bulk restore error:", error);
        addNotification(
          error.message || "Failed to restore some products",
          "error"
        );
      }
    }
  };

  // Filter and sort archived items
  const filteredItems = archivedItems
    .filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        item.name?.toLowerCase().includes(searchLower) ||
        item.reason?.toLowerCase().includes(searchLower) ||
        item.archived_by?.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower) ||
        item.original_data?.category?.toLowerCase().includes(searchLower) ||
        item.original_data?.brand_name?.toLowerCase().includes(searchLower) ||
        item.original_data?.manufacturer?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Filter by reason type
      if (reasonFilter !== "all") {
        const lowerReason = item.reason?.toLowerCase() || "";
        switch (reasonFilter) {
          case "expired":
            if (
              !lowerReason.includes("expired") &&
              !lowerReason.includes("expiry")
            )
              return false;
            break;
          case "damaged":
            if (
              !lowerReason.includes("damaged") &&
              !lowerReason.includes("defective")
            )
              return false;
            break;
          case "low-demand":
            if (
              !lowerReason.includes("low demand") &&
              !lowerReason.includes("slow moving")
            )
              return false;
            break;
          case "recalled":
            if (
              !lowerReason.includes("recalled") &&
              !lowerReason.includes("quality")
            )
              return false;
            break;
          case "discontinued":
            if (
              !lowerReason.includes("discontinued") &&
              !lowerReason.includes("obsolete")
            )
              return false;
            break;
          case "bulk":
            if (!lowerReason.includes("bulk")) return false;
            break;
          case "other": {
            const isKnownReason =
              lowerReason.includes("expired") ||
              lowerReason.includes("expiry") ||
              lowerReason.includes("damaged") ||
              lowerReason.includes("defective") ||
              lowerReason.includes("low demand") ||
              lowerReason.includes("slow moving") ||
              lowerReason.includes("recalled") ||
              lowerReason.includes("quality") ||
              lowerReason.includes("discontinued") ||
              lowerReason.includes("obsolete") ||
              lowerReason.includes("bulk");
            if (isKnownReason) return false;
            break;
          }
        }
      }

      const archiveDate = new Date(item.archived_date);
      const now = new Date();

      switch (filterBy) {
        case "week":
          return now - archiveDate <= 7 * 24 * 60 * 60 * 1000;
        case "month":
          return now - archiveDate <= 30 * 24 * 60 * 60 * 1000;
        case "year":
          return now - archiveDate <= 365 * 24 * 60 * 60 * 1000;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.archived_date) - new Date(b.archived_date);
        case "name":
          return a.name?.localeCompare(b.name) || 0;
        default: // newest
          return new Date(b.archived_date) - new Date(a.archived_date);
      }
    });

  const handleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedItems((prev) =>
      prev.length === filteredItems.length
        ? []
        : filteredItems.map((item) => item.id)
    );
  };

  const handleRefresh = async () => {
    console.log("🔄 Manual refresh triggered");
    try {
      await refetch();
      addNotification("Archive data refreshed", "success");
      console.log("✅ Manual refresh completed");
    } catch (error) {
      console.error("❌ Manual refresh failed:", error);
      addNotification("Failed to refresh data", "error");
    }
  };

  const toggleExpanded = (id) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getArchiveReasonBadge = (reason) => {
    if (!reason) {
      return {
        color: "bg-gray-50 text-gray-700 border-gray-200",
        icon: <Tag size={12} />,
        label: "No reason specified",
      };
    }

    const lowerReason = reason.toLowerCase();

    if (lowerReason.includes("expired") || lowerReason.includes("expiry")) {
      return {
        color: "bg-red-50 text-red-700 border-red-200",
        icon: <Clock size={12} />,
        label: "Expired",
      };
    } else if (
      lowerReason.includes("damaged") ||
      lowerReason.includes("defective")
    ) {
      return {
        color: "bg-orange-50 text-orange-700 border-orange-200",
        icon: <AlertCircle size={12} />,
        label: "Damaged/Defective",
      };
    } else if (
      lowerReason.includes("low demand") ||
      lowerReason.includes("slow moving")
    ) {
      return {
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <Package size={12} />,
        label: "Low Demand",
      };
    } else if (
      lowerReason.includes("recalled") ||
      lowerReason.includes("quality")
    ) {
      return {
        color: "bg-purple-50 text-purple-700 border-purple-200",
        icon: <ExternalLink size={12} />,
        label: "Quality Issue",
      };
    } else if (
      lowerReason.includes("discontinued") ||
      lowerReason.includes("obsolete")
    ) {
      return {
        color: "bg-gray-50 text-gray-700 border-gray-200",
        icon: <Archive size={12} />,
        label: "Discontinued",
      };
    } else if (lowerReason.includes("bulk")) {
      return {
        color: "bg-indigo-50 text-indigo-700 border-indigo-200",
        icon: <Package size={12} />,
        label: "Bulk Operation",
      };
    } else {
      return {
        color: "bg-green-50 text-green-700 border-green-200",
        icon: <FileText size={12} />,
        label: "Other",
      };
    }
  };

  const getStockStatusColor = (stock) => {
    if (!stock || stock === 0) return "text-red-600";
    if (stock <= 10) return "text-orange-600";
    return "text-green-600";
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-md">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Archive
          </h3>
          <p className="text-gray-600 mb-4">Unable to load archived products</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                <Archive size={24} className="text-gray-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Archived Products
                </h1>
                <p className="text-gray-600 mt-1">
                  Products that have been archived from inventory management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw
                  size={16}
                  className={isLoading ? "animate-spin" : ""}
                />
                Refresh
              </button>
              {/* Debug button - Remove in production */}
              <button
                onClick={async () => {
                  console.log("🐛 Force debugging archive functions...");
                  console.log("📊 Current archived items:", archivedItems);
                  console.log("⏳ Is loading:", isLoading);
                  console.log("❌ Error:", error);

                  // Force a direct database query
                  try {
                    const { supabase } = await import("../config/supabase.js");
                    const { data, error: dbError } = await supabase
                      .from("products")
                      .select("*")
                      .eq("is_archived", true);

                    console.log("🔍 Direct DB query result:", {
                      data,
                      dbError,
                    });

                    if (data && data.length > 0) {
                      console.log(
                        "✅ Found archived products in DB:",
                        data.length
                      );
                      await refetch();
                    } else {
                      console.log("⚠️ No archived products found in DB");
                    }
                  } catch (debugError) {
                    console.error("❌ Debug query failed:", debugError);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-purple-700 bg-purple-50 border border-purple-300 rounded-lg hover:bg-purple-100 transition-colors"
              >
                🐛 Debug
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <Package size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-indigo-600 font-medium">
                    Total Archived
                  </p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {filteredItems.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Calendar size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">
                    This Month
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {
                      filteredItems.filter((item) => {
                        const archiveDate = new Date(item.archived_date);
                        const now = new Date();
                        return now - archiveDate <= 30 * 24 * 60 * 60 * 1000;
                      }).length
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-amber-600 font-medium">
                    Expired Items
                  </p>
                  <p className="text-2xl font-bold text-amber-900">
                    {
                      archivedItems.filter((item) => {
                        const reason = item.reason?.toLowerCase() || "";
                        return (
                          reason.includes("expired") ||
                          reason.includes("expiry")
                        );
                      }).length
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-green-600" />
                <div>
                  <p className="text-sm text-green-600">Restorable</p>
                  <p className="text-xl font-semibold text-green-900">
                    {archivedItems.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Component - Remove in production */}
      <ArchiveConnectionTest />

      {/* Filters and Search */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by name, reason, category, brand, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              >
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>

              <select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              >
                <option value="all">All Reasons</option>
                <option value="expired">Expired</option>
                <option value="damaged">Damaged/Defective</option>
                <option value="low-demand">Low Demand</option>
                <option value="recalled">Quality Issues</option>
                <option value="discontinued">Discontinued</option>
                <option value="bulk">Bulk Operations</option>
                <option value="other">Other</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Product Name</option>
              </select>
            </div>
          </div>

          {selectedItems.length > 0 && (
            <div className="mt-4 flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium text-blue-900">
                {selectedItems.length} items selected
              </span>
              <button
                onClick={handleBulkRestore}
                disabled={restoreProduct.isPending}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RotateCcw size={14} />
                {restoreProduct.isPending ? "Restoring..." : "Restore Selected"}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={
                  bulkDeleteProducts.isPending || deleteProduct.isPending
                }
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 border border-red-700"
              >
                <Trash2 size={14} />
                {bulkDeleteProducts.isPending || deleteProduct.isPending
                  ? "Deleting..."
                  : "Delete Selected"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw
                size={32}
                className="mx-auto mb-4 text-gray-400 animate-spin"
              />
              <p className="text-gray-600">Loading archived products...</p>
            </div>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedItems.length === filteredItems.length &&
                      filteredItems.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Select All ({filteredItems.length})
                  </span>
                </label>
              </div>
            </div>

            {/* Table Content */}
            <div className="divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const isExpanded = expandedItems.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />

                          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                            <Package size={20} className="text-gray-600" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {item.name}
                              </h3>
                              {(() => {
                                const reasonBadge = getArchiveReasonBadge(
                                  item.reason
                                );
                                return (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${reasonBadge.color} hover:shadow-sm transition-shadow cursor-default`}
                                    title={item.reason || "No reason specified"}
                                  >
                                    {reasonBadge.icon}
                                    {reasonBadge.label}
                                  </span>
                                );
                              })()}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Package size={14} />
                                {item.category ||
                                  item.original_data?.category ||
                                  "Uncategorized"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {formatDate(item.archived_date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <User size={14} />
                                {item.archived_by || "System"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(
                                item.selling_price ||
                                  item.original_data?.selling_price ||
                                  0
                              )}
                            </div>
                            <div
                              className={`text-xs font-medium ${getStockStatusColor(
                                item.total_stock ||
                                  item.original_data?.total_stock ||
                                  item.original_stock
                              )}`}
                            >
                              Stock:{" "}
                              {item.total_stock ||
                                item.original_data?.total_stock ||
                                item.original_stock ||
                                0}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleExpanded(item.id)}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <ChevronDown
                                size={16}
                                className={`transform transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleRestore(item)}
                              disabled={restoreProduct.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              <RotateCcw size={14} />
                              {restoreProduct.isPending
                                ? "Restoring..."
                                : "Restore"}
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              disabled={deleteProduct.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors disabled:opacity-50 border border-red-200 hover:border-red-300"
                              title="Permanently delete this product"
                            >
                              <Trash2 size={14} />
                              {deleteProduct.isPending
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 ml-16 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Product Details */}
                            <div className="lg:col-span-2">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Package size={16} />
                                Product Details
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Cost Price:
                                    </span>
                                    <span className="font-medium">
                                      {formatCurrency(
                                        item.cost_price ||
                                          item.original_data?.cost_price ||
                                          0
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Selling Price:
                                    </span>
                                    <span className="font-medium">
                                      {formatCurrency(
                                        item.selling_price ||
                                          item.original_data?.selling_price ||
                                          0
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Stock Level:
                                    </span>
                                    <span
                                      className={`font-medium ${getStockStatusColor(
                                        item.total_stock ||
                                          item.original_data?.total_stock ||
                                          item.original_stock
                                      )}`}
                                    >
                                      {item.total_stock ||
                                        item.original_data?.total_stock ||
                                        item.original_stock ||
                                        0}{" "}
                                      units
                                    </span>
                                  </div>
                                  {(item.expiry_date ||
                                    item.original_data?.expiry_date) && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">
                                        Expiry Date:
                                      </span>
                                      <span className="font-medium">
                                        {formatDate(
                                          item.expiry_date ||
                                            item.original_data?.expiry_date
                                        )}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  {(item.brand_name ||
                                    item.original_data?.brand_name) && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">
                                        Brand:
                                      </span>
                                      <span className="font-medium">
                                        {item.brand_name ||
                                          item.original_data?.brand_name}
                                      </span>
                                    </div>
                                  )}
                                  {(item.manufacturer ||
                                    item.original_data?.manufacturer) && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">
                                        Manufacturer:
                                      </span>
                                      <span className="font-medium">
                                        {item.manufacturer ||
                                          item.original_data?.manufacturer}
                                      </span>
                                    </div>
                                  )}
                                  {(item.supplier ||
                                    item.original_data?.supplier) && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">
                                        Supplier:
                                      </span>
                                      <span className="font-medium">
                                        {item.supplier ||
                                          item.original_data?.supplier}
                                      </span>
                                    </div>
                                  )}
                                  {(item.batch_number ||
                                    item.original_data?.batch_number) && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">
                                        Batch Number:
                                      </span>
                                      <span className="font-medium">
                                        {item.batch_number ||
                                          item.original_data?.batch_number}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Archive Information */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Archive size={16} />
                                Archive Information
                              </h4>
                              <div className="space-y-3 text-sm">
                                <div>
                                  <span className="text-gray-600 text-xs uppercase tracking-wide">
                                    Archive Reason
                                  </span>
                                  <div className="mt-1 p-3 bg-white rounded-lg border border-gray-200">
                                    {(() => {
                                      const reasonBadge = getArchiveReasonBadge(
                                        item.reason
                                      );
                                      return (
                                        <div className="space-y-2">
                                          <span
                                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${reasonBadge.color} hover:shadow-sm transition-shadow cursor-default`}
                                            title={
                                              item.reason ||
                                              "No reason specified"
                                            }
                                          >
                                            {reasonBadge.icon}
                                            {reasonBadge.label}
                                          </span>
                                          {item.reason && (
                                            <p className="text-gray-700 text-sm leading-relaxed">
                                              {item.reason}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Archived Date:
                                    </span>
                                    <span className="font-medium">
                                      {formatDate(item.archived_date)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">
                                      Archived By:
                                    </span>
                                    <span className="font-medium">
                                      {item.archived_by || "System"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Type:</span>
                                    <span className="font-medium capitalize">
                                      {item.type || "Product"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Archive size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Archived Products
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterBy !== "all" || reasonFilter !== "all"
                ? "No archived products match your current filters"
                : "No products have been archived yet"}
            </p>
            {(searchTerm || filterBy !== "all" || reasonFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterBy("all");
                  setReasonFilter("all");
                }}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
