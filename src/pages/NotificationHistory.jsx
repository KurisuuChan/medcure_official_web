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
} from "lucide-react";

export default function NotificationHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  // Mock notification data
  const notifications = [
    {
      id: 1,
      type: "warning",
      title: "Low Stock Alert",
      message: "Paracetamol 500mg is running low. Only 8 units remaining.",
      time: "2024-08-16 14:30",
      read: false,
      category: "Inventory",
    },
    {
      id: 2,
      type: "error",
      title: "Out of Stock",
      message:
        "Vitamin C 1000mg is now out of stock. Please reorder immediately.",
      time: "2024-08-16 12:15",
      read: false,
      category: "Inventory",
    },
    {
      id: 3,
      type: "info",
      title: "New Product Added",
      message: "Aspirin 81mg has been successfully added to inventory.",
      time: "2024-08-16 10:45",
      read: true,
      category: "System",
    },
    {
      id: 4,
      type: "success",
      title: "Sale Completed",
      message: "Transaction #1248 completed successfully. Total: ₱1,250.00",
      time: "2024-08-16 09:20",
      read: true,
      category: "Sales",
    },
    {
      id: 5,
      type: "warning",
      title: "Expiry Alert",
      message:
        "Amoxicillin 500mg expires in 30 days. Consider promotional pricing.",
      time: "2024-08-15 16:30",
      read: true,
      category: "Inventory",
    },
    {
      id: 6,
      type: "info",
      title: "Daily Report",
      message: "Your daily sales report is now available for download.",
      time: "2024-08-15 18:00",
      read: true,
      category: "Reports",
    },
    {
      id: 7,
      type: "error",
      title: "Payment Failed",
      message:
        "Payment processing failed for transaction #1247. Manual review required.",
      time: "2024-08-15 14:22",
      read: false,
      category: "Sales",
    },
    {
      id: 8,
      type: "success",
      title: "Backup Completed",
      message: "Daily database backup completed successfully.",
      time: "2024-08-15 02:00",
      read: true,
      category: "System",
    },
  ];

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
      (filterType === "unread" && !notification.read) ||
      (filterType === "read" && notification.read) ||
      notification.category.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const handleSelectNotification = (id) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const categoryStats = {
    inventory: notifications.filter((n) => n.category === "Inventory").length,
    sales: notifications.filter((n) => n.category === "Sales").length,
    system: notifications.filter((n) => n.category === "System").length,
    reports: notifications.filter((n) => n.category === "Reports").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg m-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b border-gray-200 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center">
                  <Bell size={24} className="text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Notification History
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Complete log of all system and inventory alerts
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Bell size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">
                    Total Notifications
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {notifications.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-amber-600 font-medium">Unread</p>
                  <p className="text-2xl font-bold text-amber-900">
                    {unreadCount}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-emerald-600 font-medium">
                    Inventory Alerts
                  </p>
                  <p className="text-2xl font-bold text-emerald-900">
                    {categoryStats.inventory}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-violet-50 to-violet-100 border border-violet-200 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-500 rounded-lg flex items-center justify-center">
                  <Info size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-violet-600 font-medium">
                    Sales Alerts
                  </p>
                  <p className="text-2xl font-bold text-violet-900">
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
              <button className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200">
                <CheckCircle size={16} /> Mark as Read
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-semibold hover:bg-orange-200">
                <Archive size={16} /> Archive
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200">
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
                    notification.read
                  )} border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(
                          notification.id
                        )}
                        onChange={() =>
                          handleSelectNotification(notification.id)
                        }
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3
                            className={`font-semibold ${
                              !notification.read
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            {notification.category}
                          </span>
                        </div>
                        <p
                          className={`mb-3 ${
                            !notification.read
                              ? "text-gray-800"
                              : "text-gray-600"
                          }`}
                        >
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock size={14} />
                          {notification.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                        <Eye size={16} />
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
      </div>
    </div>
  );
}
