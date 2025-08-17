import React, { useState } from "react";
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
  RotateCcw,
} from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";

export default function NotificationHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  // Use the notifications hook for backend integration
  const {
    notifications,
    stats,
    loading,
    error,
    markAsRead,
    markMultipleRead,
    deleteNotificationItem,
    deleteMultiple,
    refresh,
  } = useNotifications();

  // Debug logging
  React.useEffect(() => {
    console.log("🔔 Notifications Data:", {
      notifications: notifications?.length || 0,
      loading,
      error,
      stats,
    });
  }, [notifications, loading, error, stats]);
  const getNotificationIcon = (type) => {
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

  const getNotificationBg = (type, read) => {
    const base = read ? "bg-gray-50" : "bg-white border-l-4";
    switch (type) {
      case "warning":
        return `${base} ${!read ? "border-orange-500" : ""}`;
      case "error":
        return `${base} ${!read ? "border-red-500" : ""}`;
      case "success":
        return `${base} ${!read ? "border-green-500" : ""}`;
      case "info":
      default:
        return `${base} ${!read ? "border-blue-500" : ""}`;
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterType === "all" ||
      (filterType === "unread" && !notification.is_read) ||
      (filterType === "read" && notification.is_read) ||
      notification.category.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const handleSelectNotification = (id) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const unreadCount = stats?.unread || 0;
  const categoryStats = {
    inventory: stats?.byCategory?.inventory || 0,
    sales: stats?.byCategory?.sales || 0,
    system: stats?.byCategory?.system || 0,
    reports: stats?.byCategory?.reports || 0,
  };

  // Show loading state
  if (loading) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading notifications...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Error Loading Notifications
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-100">
            <Bell size={32} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Notification History
            </h1>
            <p className="text-gray-500 mt-1">
              Complete log of all system and inventory alerts
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200"
        >
          <RotateCcw size={16} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Total Notifications</p>
              <p className="text-2xl font-bold text-blue-800">
                {notifications.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-orange-600">Unread</p>
              <p className="text-2xl font-bold text-orange-800">
                {unreadCount}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600">Inventory Alerts</p>
              <p className="text-2xl font-bold text-green-800">
                {categoryStats.inventory}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Info size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-purple-600">Sales Alerts</p>
              <p className="text-2xl font-bold text-purple-800">
                {categoryStats.sales}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {selectedNotifications.length > 0 && (
        <div className="flex items-center gap-4 p-4 mb-6 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="font-semibold text-blue-800 flex-grow">
            {selectedNotifications.length} selected
          </p>
          <button
            onClick={() => markMultipleRead(selectedNotifications)}
            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200"
          >
            <CheckCircle size={16} /> Mark as Read
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-semibold hover:bg-orange-200">
            <Archive size={16} /> Archive
          </button>
          <button
            onClick={() => deleteMultiple(selectedNotifications)}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 py-4 border-t border-b border-gray-200 mb-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="inventory">Inventory</option>
            <option value="sales">Sales</option>
            <option value="system">System</option>
            <option value="reports">Reports</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter size={16} />
            More Filters
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`${getNotificationBg(
                notification.type,
                notification.is_read
              )} border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => handleSelectNotification(notification.id)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3
                        className={`font-semibold ${
                          !notification.is_read
                            ? "text-gray-900"
                            : "text-gray-700"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        {notification.category}
                      </span>
                    </div>
                    <p
                      className={`mb-3 ${
                        !notification.is_read
                          ? "text-gray-800"
                          : "text-gray-600"
                      }`}
                    >
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock size={14} />
                      {new Date(notification.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50"
                      title="Mark as read"
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotificationItem(notification.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    title="Delete notification"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Bell size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No notifications found
          </h3>
          <p className="text-gray-500 mb-6">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Pagination */}
      {filteredNotifications.length > 0 && (
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {filteredNotifications.length} of {notifications.length}{" "}
            notifications
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              Previous
            </button>
            <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              1
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
