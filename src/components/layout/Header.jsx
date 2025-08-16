import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Search,
  User,
  ChevronDown,
  LogOut,
  AlertTriangle,
  Clock,
  Package,
  TrendingUp,
  Shield,
  CheckCircle,
  Info,
  X,
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

  const markAsRead = (id) => {
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
    <header className="h-16 bg-white/90 backdrop-blur border-b flex items-center justify-between px-6 gap-6 sticky top-0 z-40">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative w-full max-w-xs hidden sm:block">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Quick search…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 relative transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-semibold rounded-full min-w-[1.2rem] h-5 px-1.5 flex items-center justify-center shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-3 w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-800">
                    Notifications
                  </h3>
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/50 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600">
                      {stats.critical} Critical
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-600">
                      {stats.warnings} Warnings
                    </span>
                  </div>
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
                                <h4
                                  className={`text-sm font-semibold ${
                                    notification.unread
                                      ? "text-gray-900"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {notification.title}
                                </h4>
                                {notification.unread && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {notification.time}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  {notification.unread ? "Mark read" : "Read"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Bell size={32} className="mx-auto mb-3 text-gray-400" />
                    <h4 className="text-sm font-medium text-gray-600 mb-1">
                      No notifications
                    </h4>
                    <p className="text-xs text-gray-500">
                      You're all caught up!
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => {
                    setNotifOpen(false);
                    // Navigate to notifications page
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-semibold shadow">
              {user?.initials || "AD"}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-sm font-medium leading-none text-gray-800">
                {user?.name || "Admin"}
              </span>
              <span className="text-[11px] text-gray-500">
                {user?.role || "Administrator"}
              </span>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-gray-200 shadow-lg py-2 text-sm z-50"
            >
              <button
                onClick={() => {
                  addNotification("Profile settings not implemented", "info");
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
              >
                Profile
              </button>
              <button
                onClick={() => {
                  onLogout?.();
                  addNotification("Logged out", "success");
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600"
              >
                <LogOut size={16} /> Logout
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
