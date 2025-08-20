import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  AlertTriangle,
  Clock,
  Package,
  X,
  Settings,
  UserCircle,
  Coins,
  PackageX,
  BarChart3,
  Plus,
  CheckCircle,
  Info,
} from "lucide-react";
import PropTypes from "prop-types";
import { useNotification } from "@/hooks/useNotification";

export default function Header({ onLogout, user }) {
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const [menuOpen, setMenuOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const actionsRef = useRef(null);

  // Load initial user profile from localStorage and listen for settings updates
  useEffect(() => {
    // Load initial profile from localStorage
    const loadInitialProfile = async () => {
      try {
        const stored = localStorage.getItem("medcure_user_profile");
        if (stored && stored !== "[object Object]") {
          const profile = JSON.parse(stored);
          setUserProfile(profile);
        }
      } catch (error) {
        console.warn("Failed to load initial profile:", error);
      }
    };

    loadInitialProfile();

    // Listen for real-time updates
    const handleSettingsUpdate = (event) => {
      if (event.detail?.profile) {
        setUserProfile(event.detail.profile);
      }
    };

    window.addEventListener("settingsUpdated", handleSettingsUpdate);
    return () =>
      window.removeEventListener("settingsUpdated", handleSettingsUpdate);
  }, []);

  // Mock notifications data with enhanced design
  const [notifications] = useState([
    {
      id: 1,
      title: "Low Stock Alert",
      message: "Paracetamol 500mg is running low. Only 15 units remaining.",
      type: "warning",
      category: "Inventory",
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      is_read: false,
    },
    {
      id: 2,
      title: "Sale Completed",
      message: "Transaction #1234 completed successfully. Total: ₱750.00",
      type: "success",
      category: "Sales",
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      is_read: true,
    },
    {
      id: 3,
      title: "System Update",
      message: "New features have been added to the POS system.",
      type: "info",
      category: "System",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      is_read: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Handle search functionality
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/inventory?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "error":
        return AlertTriangle;
      case "warning":
        return Package;
      case "success":
        return CheckCircle;
      case "info":
      default:
        return Info;
    }
  };

  // Get notification display config
  const getNotificationDisplayConfig = (type) => {
    switch (type) {
      case "error":
        return {
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          iconColor: "text-red-600",
        };
      case "warning":
        return {
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          iconColor: "text-amber-600",
        };
      case "success":
        return {
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          iconColor: "text-green-600",
        };
      case "info":
      default:
        return {
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          iconColor: "text-blue-600",
        };
    }
  };

  // Format notification time
  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Handle logout
  const handleLogout = () => {
    onLogout?.();
    addNotification("Logged out successfully", "success");
    setMenuOpen(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target))
        setNotifOpen(false);
      if (actionsRef.current && !actionsRef.current.contains(e.target))
        setActionsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-14 sm:h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200/80 flex items-center justify-between px-3 sm:px-4 md:px-6 sticky top-0 z-50 shadow-sm">
      {/* Left Section - Search */}
      <div className="flex items-center gap-3 sm:gap-4 md:gap-6 flex-1">
        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="relative max-w-sm sm:max-w-md lg:max-w-lg w-full"
        >
          <Search
            size={16}
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search medicines, inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg sm:rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all duration-200 placeholder:text-gray-500"
          />
        </form>

        {/* Quick Actions - Desktop */}
        <div className="hidden lg:flex items-center gap-3">
          <div ref={actionsRef} className="relative">
            <button
              onClick={() => setActionsOpen((o) => !o)}
              className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg lg:rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group"
            >
              <Plus
                size={16}
                className="group-hover:rotate-90 transition-transform duration-200"
              />
              <span className="font-medium text-sm hidden xl:block">
                Quick Actions
              </span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  actionsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {actionsOpen && (
              <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden z-50 backdrop-blur-sm">
                <div className="p-2 sm:p-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 sm:mb-3 px-2">
                    Quick Actions
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    <button
                      onClick={() => {
                        navigate("/pos");
                        setActionsOpen(false);
                      }}
                      className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-all duration-200 group border border-transparent hover:border-blue-200"
                    >
                      <div className="w-7 sm:w-8 h-7 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Coins size={16} className="text-blue-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        New Sale
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        navigate("/inventory");
                        setActionsOpen(false);
                      }}
                      className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 hover:bg-emerald-50 rounded-lg sm:rounded-xl transition-all duration-200 group border border-transparent hover:border-emerald-200"
                    >
                      <div className="w-7 sm:w-8 h-7 sm:h-8 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                        <PackageX size={16} className="text-emerald-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        Add Product
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        navigate("/reports");
                        setActionsOpen(false);
                      }}
                      className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 hover:bg-indigo-50 rounded-lg sm:rounded-xl transition-all duration-200 group border border-transparent hover:border-indigo-200"
                    >
                      <div className="w-7 sm:w-8 h-7 sm:h-8 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                        <BarChart3 size={16} className="text-indigo-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        Analytics
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        navigate("/contacts");
                        setActionsOpen(false);
                      }}
                      className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 hover:bg-orange-50 rounded-lg sm:rounded-xl transition-all duration-200 group border border-transparent hover:border-orange-200"
                    >
                      <div className="w-7 sm:w-8 h-7 sm:h-8 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                        <Clock size={16} className="text-orange-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        Contacts
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Actions Mobile Button */}
        <div className="lg:hidden relative" ref={actionsRef}>
          <button
            onClick={() => setActionsOpen((o) => !o)}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-sm"
            title="Quick Actions"
          >
            <Plus
              size={18}
              className={`${
                actionsOpen ? "rotate-45" : ""
              } transition-transform duration-200`}
            />
          </button>

          {actionsOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden z-50 backdrop-blur-sm">
              <div className="p-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                  Quick Actions
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      navigate("/pos");
                      setActionsOpen(false);
                    }}
                    className="flex items-center gap-3 w-full p-2 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Coins size={16} className="text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      New Sale
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      navigate("/inventory");
                      setActionsOpen(false);
                    }}
                    className="flex items-center gap-3 w-full p-2 hover:bg-emerald-50 rounded-lg transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                      <PackageX size={16} className="text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Add Product
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      navigate("/reports");
                      setActionsOpen(false);
                    }}
                    className="flex items-center gap-3 w-full p-2 hover:bg-indigo-50 rounded-lg transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <BarChart3 size={16} className="text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Analytics
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      navigate("/contacts");
                      setActionsOpen(false);
                    }}
                    className="flex items-center gap-3 w-full p-2 hover:bg-orange-50 rounded-lg transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <Clock size={16} className="text-orange-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Contacts
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 sm:p-2.5 rounded-lg sm:rounded-xl hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-all duration-200 group"
            aria-label="Notifications"
          >
            <Bell
              size={18}
              className="group-hover:scale-105 transition-transform"
            />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-500 text-white text-xs font-semibold rounded-full min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-[20px] flex items-center justify-center shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-84 bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden z-50 backdrop-blur-sm">
              {/* Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200/80">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                    Notifications
                  </h3>
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-3 sm:gap-5 mt-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600">
                      {notifications.filter((n) => n.type === "error").length}{" "}
                      Critical
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-600">
                      {notifications.filter((n) => n.type === "warning").length}{" "}
                      Warnings
                    </span>
                  </div>
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="ml-auto text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors text-xs sm:text-sm"
                  >
                    Mark all read
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-72 sm:max-h-80 overflow-y-auto">
                {notifications && notifications.length > 0 ? (
                  <div className="divide-y divide-gray-100/80">
                    {notifications.slice(0, 5).map((notification) => {
                      const IconComponent = getNotificationIcon(
                        notification.type
                      );
                      const displayConfig = getNotificationDisplayConfig(
                        notification.type
                      );

                      return (
                        <button
                          key={notification.id}
                          className={`w-full text-left p-3 sm:p-4 hover:bg-gray-50/80 transition-all duration-200 ${
                            !notification.is_read
                              ? "bg-blue-50/30 border-l-2 border-l-blue-500"
                              : ""
                          }`}
                          onClick={() => {}}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${displayConfig.bgColor} ${displayConfig.borderColor} border shadow-sm`}
                            >
                              <IconComponent
                                size={16}
                                className={displayConfig.iconColor}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1.5">
                                <h4 className="text-sm font-semibold text-gray-900">
                                  {notification.title}
                                </h4>
                                {!notification.is_read && (
                                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                                {notification.message}
                              </p>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                {formatNotificationTime(
                                  notification.created_at
                                )}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 sm:p-10 text-center">
                    <Bell size={32} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-sm text-gray-500 font-medium">
                      No new notifications
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      You're all caught up!
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 border-t border-gray-200/80">
                <button
                  onClick={() => {
                    navigate("/notification-history");
                    setNotifOpen(false);
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2.5 rounded-lg sm:rounded-xl hover:bg-blue-50 transition-all duration-200"
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
            className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200 group"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center text-sm font-semibold shadow-sm group-hover:shadow-md transition-shadow overflow-hidden">
              {userProfile?.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {user?.name
                    ? user.name.charAt(0).toUpperCase()
                    : user?.initials || "A"}
                </div>
              )}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-semibold text-gray-900">
                {userProfile?.full_name || user?.name || "Admin User"}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {user?.role || "Administrator"}
              </div>
            </div>
            <ChevronDown
              size={14}
              className="text-gray-400 group-hover:text-gray-600 transition-colors hidden sm:block"
            />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-3 w-52 sm:w-56 rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-sm border border-gray-200/80 shadow-xl py-2 text-sm z-50 overflow-hidden"
            >
              {/* User Info Header */}
              <div className="px-3 sm:px-4 py-3 border-b border-gray-100">
                <div className="font-semibold text-gray-900">
                  {userProfile?.full_name || user?.name || "Admin User"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {userProfile?.email || user?.email || "admin@medcure.com"}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    navigate("/settings");
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full text-left px-3 sm:px-4 py-2.5 hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <Settings size={18} className="text-gray-500" />
                  <span className="font-medium">System Settings</span>
                </button>
              </div>

              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full text-left px-3 sm:px-4 py-2.5 hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors font-medium"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
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
    email: PropTypes.string,
  }),
};
