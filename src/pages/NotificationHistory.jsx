import React, { useState, useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  Search,
  Filter,
  Eye,
  Trash2,
  Archive,
  MoreVertical,
  Package,
  PackageCheck,
  TrendingUp,
  CreditCard,
  Settings,
  CheckSquare,
  Square,
  RefreshCw,
  Calendar,
  ExternalLink,
  ShoppingCart,
  Filter as FilterIcon,
  RotateCcw,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotification } from "@/hooks/useNotification";
import { useNavigate } from "react-router-dom";

export default function NotificationHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const navigate = useNavigate();

  // Use real notifications data
  const {
    notifications,
    stats,
    loading,
    error,
    loadNotifications,
    markAsRead,
    archiveNotifications,
    deleteNotifications,
    searchNotifications,
  } = useNotifications();

  const { addNotification } = useNotification();

  // Load notifications with filters
  useEffect(() => {
    loadNotifications({
      category: filterType === "all" ? null : filterType,
      unreadOnly: filterType === "unread",
      includeArchived: false,
      limit: 100, // Load more for history page
    });
  }, [filterType, loadNotifications]);

  // Get notification icon based on type and category
  const getNotificationIcon = (type, category) => {
    if (category === "inventory") {
      if (type === "error" || type === "warning")
        return <Package size={20} className="text-orange-500" />;
      return <PackageCheck size={20} className="text-green-500" />;
    }

    if (category === "sales") {
      if (type === "success")
        return <TrendingUp size={20} className="text-green-500" />;
      return <CreditCard size={20} className="text-blue-500" />;
    }

    if (category === "system") {
      return <Settings size={20} className="text-blue-500" />;
    }

    switch (type) {
      case "warning":
        return <AlertTriangle size={20} className="text-orange-500" />;
      case "error":
        return <AlertTriangle size={20} className="text-red-500" />;
      case "success":
        return <CheckCircle size={20} className="text-green-500" />;
      case "info":
      default:
        return <Info size={20} className="text-blue-500" />;
    }
  };

  // Filter notifications based on search and filter type
  const filteredNotifications = searchNotifications(searchTerm).filter(
    (notification) => {
      const matchesFilter =
        filterType === "all" ||
        (filterType === "unread" && !notification.is_read) ||
        (filterType === "read" && notification.is_read) ||
        notification.category.toLowerCase() === filterType.toLowerCase();
      return matchesFilter;
    }
  );

  const handleSelectNotification = (id) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Handle select all functionality
  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map((n) => n.id));
    }
  };

  // Handle bulk actions
  const handleMarkSelectedAsRead = async () => {
    try {
      await markAsRead(selectedNotifications);
      setSelectedNotifications([]);
      addNotification("Selected notifications marked as read", "success");
    } catch {
      addNotification("Failed to mark notifications as read", "error");
    }
  };

  const handleArchiveSelected = async () => {
    try {
      await archiveNotifications(selectedNotifications);
      setSelectedNotifications([]);
      addNotification("Selected notifications archived", "success");
    } catch {
      addNotification("Failed to archive notifications", "error");
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await deleteNotifications({ notificationIds: selectedNotifications });
      setSelectedNotifications([]);
      addNotification("Selected notifications deleted", "success");
    } catch {
      addNotification("Failed to delete notifications", "error");
    }
  };

  // Enhanced features for out-of-stock management
  const getOutOfStockNotifications = () => {
    return filteredNotifications.filter(
      (notification) =>
        notification.category === "inventory" &&
        (notification.type === "error" || notification.type === "warning") &&
        (notification.message.toLowerCase().includes("out of stock") ||
          notification.message.toLowerCase().includes("low stock") ||
          notification.title.toLowerCase().includes("low stock") ||
          notification.title.toLowerCase().includes("out of stock"))
    );
  };

  const handleSelectAllOutOfStock = () => {
    const outOfStockNotifications = getOutOfStockNotifications();
    const outOfStockIds = outOfStockNotifications.map((n) => n.id);

    if (outOfStockIds.every((id) => selectedNotifications.includes(id))) {
      // If all out-of-stock are selected, deselect them
      setSelectedNotifications((prev) =>
        prev.filter((id) => !outOfStockIds.includes(id))
      );
    } else {
      // Select all out-of-stock notifications
      setSelectedNotifications((prev) => [
        ...new Set([...prev, ...outOfStockIds]),
      ]);
    }
  };

  const handleGoToManagement = () => {
    const selectedOutOfStock = selectedNotifications.filter((id) => {
      const notification = notifications.find((n) => n.id === id);
      return (
        notification &&
        notification.category === "inventory" &&
        (notification.type === "error" || notification.type === "warning")
      );
    });

    if (selectedOutOfStock.length === 0) {
      addNotification("Please select inventory notifications first", "warning");
      return;
    }

    // Navigate to management page with selected product context
    navigate("/management", {
      state: {
        highlightLowStock: true,
        fromNotifications: selectedOutOfStock,
      },
    });
  };

  const handleArchiveOldNotifications = async () => {
    // Archive all read notifications older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const oldNotifications = notifications
      .filter(
        (notification) =>
          notification.is_read &&
          new Date(notification.created_at) < sevenDaysAgo
      )
      .map((n) => n.id);

    if (oldNotifications.length === 0) {
      addNotification("No old notifications to archive", "info");
      return;
    }

    try {
      await archiveNotifications(oldNotifications);
      addNotification(
        `Archived ${oldNotifications.length} old notifications`,
        "success"
      );
    } catch {
      addNotification("Failed to archive old notifications", "error");
    }
  };

  // Calculate stats from real data
  const categoryStats = {
    inventory: notifications.filter((n) => n.category === "inventory").length,
    sales: notifications.filter((n) => n.category === "sales").length,
    system: notifications.filter((n) => n.category === "system").length,
    reports: notifications.filter((n) => n.category === "reports").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Professional Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Bell size={24} className="text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Notification History
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Manage and review all system notifications
                  </p>
                </div>
              </div>
              <button
                onClick={() => loadNotifications()}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>

          {/* Clean Stats Overview */}
          <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-900">
                  {stats.total_count || notifications.length}
                </div>
                <div className="text-sm text-gray-500 mt-1">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-amber-600">
                  {stats.unread_count ||
                    notifications.filter((n) => !n.is_read).length}
                </div>
                <div className="text-sm text-gray-500 mt-1">Unread</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-blue-600">
                  {categoryStats.inventory}
                </div>
                <div className="text-sm text-gray-500 mt-1">Inventory</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-green-600">
                  {categoryStats.sales}
                </div>
                <div className="text-sm text-gray-500 mt-1">Sales</div>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Filter and Quick Actions */}
              <div className="flex items-center gap-3">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-w-[140px]"
                >
                  <option value="all">All Types</option>
                  <option value="unread">Unread Only</option>
                  <option value="inventory">Inventory</option>
                  <option value="sales">Sales</option>
                  <option value="system">System</option>
                </select>

                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  <FilterIcon size={16} />
                  More
                </button>
              </div>
            </div>

            {/* Advanced Filter Panel */}
            {showAdvancedFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Quick Actions
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSelectAllOutOfStock}
                    className="flex items-center gap-2 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm"
                  >
                    <Package size={16} />
                    Select All Out-of-Stock (
                    {getOutOfStockNotifications().length})
                  </button>

                  <button
                    onClick={handleGoToManagement}
                    disabled={selectedNotifications.length === 0}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    <ExternalLink size={16} />
                    Update Stock in Management
                  </button>

                  <button
                    onClick={handleArchiveOldNotifications}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Archive size={16} />
                    Archive Old Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Selection and Bulk Actions */}
          <div className="px-8 py-4 bg-white border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {selectedNotifications.length ===
                    filteredNotifications.length &&
                  filteredNotifications.length > 0 ? (
                    <CheckSquare size={16} className="text-blue-600" />
                  ) : (
                    <Square size={16} />
                  )}
                  Select All
                </button>

                {getOutOfStockNotifications().length > 0 && (
                  <button
                    onClick={handleSelectAllOutOfStock}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <Package size={16} />
                    Select Out-of-Stock ({getOutOfStockNotifications().length})
                  </button>
                )}

                {selectedNotifications.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {selectedNotifications.length} selected
                  </span>
                )}
              </div>

              {selectedNotifications.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMarkSelectedAsRead}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <CheckCircle size={16} />
                    Mark Read
                  </button>

                  {/* Smart action based on selection */}
                  {selectedNotifications.some((id) => {
                    const notification = notifications.find((n) => n.id === id);
                    return notification?.category === "inventory";
                  }) && (
                    <button
                      onClick={handleGoToManagement}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <ShoppingCart size={16} />
                      Update Stock
                    </button>
                  )}

                  <button
                    onClick={handleArchiveSelected}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <Archive size={16} />
                    Archive
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm">
                  Loading notifications...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <AlertTriangle
                  size={48}
                  className="mx-auto mb-4 text-red-400"
                />
                <h3 className="text-lg font-semibold text-red-600 mb-2">
                  Error loading notifications
                </h3>
                <p className="text-red-500 mb-6">{error}</p>
                <button
                  onClick={() => loadNotifications()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? "bg-blue-50/30" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(
                          notification.id
                        )}
                        onChange={() =>
                          handleSelectNotification(notification.id)
                        }
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                      />
                    </div>

                    {/* Icon */}
                    <div className="mt-1 flex-shrink-0">
                      {getNotificationIcon(
                        notification.type,
                        notification.category
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Title and Status */}
                          <div className="flex items-center gap-3 mb-2">
                            <h3
                              className={`font-medium text-gray-900 ${
                                !notification.is_read ? "font-semibold" : ""
                              }`}
                            >
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>

                          {/* Message */}
                          <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                            {notification.message}
                          </p>

                          {/* Meta Information */}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              {notification.time_ago ||
                                new Date(
                                  notification.created_at
                                ).toLocaleString()}
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full font-medium ${
                                notification.category === "inventory"
                                  ? "bg-orange-100 text-orange-700"
                                  : notification.category === "sales"
                                  ? "bg-green-100 text-green-700"
                                  : notification.category === "system"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {notification.category}
                            </span>
                            {notification.priority >= 3 && (
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                                {notification.priority === 4
                                  ? "Critical"
                                  : "High Priority"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                          {/* Smart action for inventory notifications */}
                          {notification.category === "inventory" &&
                            (notification.type === "error" ||
                              notification.type === "warning") && (
                              <button
                                onClick={() => handleGoToManagement()}
                                className="p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Update stock in Management"
                              >
                                <RotateCcw size={16} />
                              </button>
                            )}

                          <button
                            onClick={() => markAsRead([notification.id])}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Eye size={16} />
                          </button>

                          <div className="relative group">
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                              <MoreVertical size={16} />
                            </button>

                            {/* Quick action dropdown */}
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => markAsRead([notification.id])}
                                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Eye size={14} />
                                  Mark as Read
                                </button>
                                <button
                                  onClick={() =>
                                    archiveNotifications([notification.id])
                                  }
                                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Archive size={14} />
                                  Archive
                                </button>
                                {notification.category === "inventory" && (
                                  <button
                                    onClick={() => handleGoToManagement()}
                                    className="w-full px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                                  >
                                    <ExternalLink size={14} />
                                    Go to Management
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Footer with count and helpful tips */}
          {filteredNotifications.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <span>
                  Showing {filteredNotifications.length} of{" "}
                  {notifications.length} notifications
                </span>
                {filteredNotifications.length !== notifications.length && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterType("all");
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {/* Helpful tips for out-of-stock management */}
              {getOutOfStockNotifications().length > 0 && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="text-sm font-medium text-orange-800 mb-2">
                    📦 Out-of-Stock Management Tips:
                  </h4>
                  <ul className="text-xs text-orange-700 space-y-1">
                    <li>
                      • <strong>Select All Out-of-Stock:</strong> Use the orange
                      button to select all inventory alerts
                    </li>
                    <li>
                      • <strong>Mark as Read:</strong> Acknowledge notifications
                      you've reviewed
                    </li>
                    <li>
                      • <strong>Update Stock:</strong> Click "Update Stock" to
                      go to Management page and restock items
                    </li>
                    <li>
                      • <strong>Archive Old Notifications:</strong> Clean up
                      your notification history regularly
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Empty state with action suggestions */}
          {filteredNotifications.length === 0 && !loading && !error && (
            <div className="px-6 py-8">
              <div className="text-center">
                <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No notifications found
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  {searchTerm || filterType !== "all"
                    ? "Try adjusting your search or filters"
                    : "You're all caught up! No notifications yet."}
                </p>

                {filterType === "all" && !searchTerm && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left max-w-md mx-auto">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                      💡 Notification System Features:
                    </h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Automatic low stock alerts</li>
                      <li>• Product expiry warnings</li>
                      <li>• Sales completion confirmations</li>
                      <li>• System update notifications</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
