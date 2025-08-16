import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  AlertTriangle,
  Clock,
  Package,
  TrendingUp,
  Shield,
  X,
  Settings,
  UserCircle,
  Activity,
} from "lucide-react";
import PropTypes from "prop-types";
import { useNotification } from "@/hooks/useNotification";

export default function Header({ onLogout, user }) {
  const { addNotification } = useNotification();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  // Mock notification data with pharmacy-specific content
  const notifications = [
    {
      id: 1,
      type: "critical",
      title: "Critical Stock Alert",
      message: "Paracetamol 500mg is out of stock",
      time: "2 min ago",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      unread: true,
    },
    {
      id: 2,
      type: "warning",
      title: "Low Stock Warning",
      message: "Amoxicillin 500mg - Only 8 units remaining",
      time: "15 min ago",
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      unread: true,
    },
    {
      id: 3,
      type: "expiry",
      title: "Expiry Alert",
      message: "Vitamin C expires in 10 days",
      time: "1 hour ago",
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      unread: false,
    },
    {
      id: 4,
      type: "sales",
      title: "High Sales Activity",
      message: "₱15,240 in sales today (+23%)",
      time: "2 hours ago",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      unread: false,
    },
    {
      id: 5,
      type: "system",
      title: "Backup Completed",
      message: "Daily backup completed successfully",
      time: "3 hours ago",
      icon: Shield,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAsRead = (_id) => {
    // In a real app, this would update the notification status
    addNotification("Notification marked as read", "success");
  };

  const markAllAsRead = () => {
    addNotification("All notifications marked as read", "success");
  };

  const getNotificationStats = () => {
    const critical = notifications.filter((n) => n.type === "critical").length;
    const warnings = notifications.filter((n) => n.type === "warning").length;
    return { critical, warnings };
  };

  const stats = getNotificationStats();

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target))
        setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Left Section */}
      <div className="flex items-center gap-4 flex-1">
        {/* Search Bar */}
        <div className="relative max-w-md w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search medicines, patients..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Quick Stats */}
        <div className="hidden lg:flex items-center gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Activity size={16} className="text-green-500" />
            <span>₱24.5K</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center gap-1">
            <Package size={16} className="text-blue-500" />
            <span>148</span>
          </div>
        </div>
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative p-2 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
              {/* Header */}
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                  <span>{stats.critical} Critical</span>
                  <span>{stats.warnings} Warnings</span>
                  <button
                    onClick={markAllAsRead}
                    className="ml-auto text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Mark all read
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => {
                      const IconComponent = notification.icon;
                      return (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                            notification.unread ? "bg-blue-25" : ""
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-lg ${notification.bgColor} ${notification.borderColor} border`}
                            >
                              <IconComponent
                                size={16}
                                className={notification.color}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </h4>
                                {notification.unread && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mb-1">
                                {notification.message}
                              </p>
                              <span className="text-xs text-gray-500">
                                {notification.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Bell size={32} className="mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-600">No notifications</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-gray-50 border-t">
                <button
                  onClick={() => {
                    setNotifOpen(false);
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 transition-colors"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
              {user?.initials || "A"}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-gray-900">
                {user?.name || "Admin"}
              </div>
              <div className="text-xs text-gray-500">
                {user?.role || "Administrator"}
              </div>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-48 rounded-lg bg-white border border-gray-200 shadow-lg py-1 text-sm z-50"
            >
              <button
                onClick={() => {
                  addNotification("Profile settings not implemented", "info");
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700"
              >
                <UserCircle size={16} />
                Profile
              </button>
              <button
                onClick={() => {
                  addNotification("Settings not implemented", "info");
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700"
              >
                <Settings size={16} />
                Settings
              </button>
              <div className="my-1 h-px bg-gray-200"></div>
              <button
                onClick={() => {
                  onLogout?.();
                  addNotification("Logged out successfully", "success");
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

Header.propTypes = {
  onLogout: PropTypes.func,
  user: PropTypes.shape({
    name: PropTypes.string,
    role: PropTypes.string,
    initials: PropTypes.string,
  }),
};
