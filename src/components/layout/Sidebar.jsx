import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Archive,
  FileText,
} from "lucide-react";
import PropTypes from "prop-types";

// Menu structure matching MedCure_Official repository
const menu = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "blue",
    description: "Overview & Insights",
    badge: null,
  },
  {
    to: "/management",
    label: "Inventory",
    icon: Package,
    color: "emerald",
    description: "Stock & Products",
    badge: null,
  },
  {
    to: "/point-of-sales",
    label: "Point of Sale",
    icon: ShoppingCart,
    color: "orange",
    description: "Sales Terminal",
    badge: null,
  },
  {
    to: "/reports",
    label: "Reports",
    icon: BarChart3,
    color: "indigo",
    description: "Analytics & Reports",
    badge: null,
  },
  {
    to: "/contacts",
    label: "Contacts",
    icon: Users,
    color: "purple",
    description: "Suppliers & Employees",
    badge: null,
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
    color: "slate",
    description: "System Configuration",
    badge: null,
  },
];

export default function Sidebar({ branding }) {
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(() => {
    const stored = localStorage.getItem("mc-sidebar-expanded");
    return stored ? JSON.parse(stored) : true;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [businessSettings, setBusinessSettings] = useState(null);

  // Load initial business settings from localStorage and listen for settings updates
  useEffect(() => {
    // Load initial business settings from localStorage
    const loadInitialBusinessSettings = async () => {
      try {
        const stored = localStorage.getItem("medcure_business_settings");
        if (stored && stored !== "[object Object]") {
          const settings = JSON.parse(stored);
          setBusinessSettings(settings);
        }
      } catch (error) {
        console.warn("Failed to load initial business settings:", error);
      }
    };

    loadInitialBusinessSettings();

    // Listen for real-time updates
    const handleSettingsUpdate = (event) => {
      if (event.detail?.business) {
        setBusinessSettings(event.detail.business);
      }
    };

    window.addEventListener("settingsUpdated", handleSettingsUpdate);
    return () =>
      window.removeEventListener("settingsUpdated", handleSettingsUpdate);
  }, []);

  // Auto-collapse sidebar on mobile screens
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile && expanded) {
        setExpanded(false);
      }
    };

    handleResize(); // Check on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [expanded]);

  // Close mobile menu on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setMobileMenuOpen(false);
    };

    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);

  useEffect(() => {
    localStorage.setItem("mc-sidebar-expanded", JSON.stringify(expanded));
  }, [expanded]);

  return (
    <>
      {/* Mobile Menu Button - Only visible on mobile */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-700 transition-all duration-200 shadow-sm"
        aria-label="Toggle mobile menu"
      >
        {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          h-full bg-white/95 backdrop-blur-lg border-r border-gray-200/50 flex flex-col relative
          transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${expanded ? "w-72" : "w-16"}
          md:relative md:translate-x-0
          ${
            mobileMenuOpen
              ? "fixed left-0 top-0 z-50 translate-x-0 w-80 shadow-2xl"
              : "fixed left-0 top-0 z-50 -translate-x-full md:translate-x-0"
          }
        `}
        style={{
          background: "linear-gradient(to bottom, #ffffff, #f8fafc)",
          boxShadow: mobileMenuOpen
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
        aria-label="Navigation"
      >
        {/* Header */}
        <div
          className={`h-16 flex items-center border-b border-gray-100 relative transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            expanded || mobileMenuOpen
              ? "justify-between px-6"
              : "justify-center"
          } ${mobileMenuOpen ? "px-4" : ""}`}
        >
          {expanded || mobileMenuOpen ? (
            <>
              <div
                className={`flex items-center gap-3 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  expanded || mobileMenuOpen
                    ? "opacity-100 transform translate-x-0"
                    : "opacity-0 transform -translate-x-4"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm transition-all duration-300 overflow-hidden">
                  {businessSettings?.logo_url ? (
                    <img
                      src={businessSettings.logo_url}
                      alt="Business Logo"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <span>
                      {businessSettings?.business_name?.[0] ||
                        branding?.name?.[0] ||
                        "M"}
                    </span>
                  )}
                </div>
                <div
                  className={`space-y-0.5 transition-all duration-500 delay-100 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    expanded || mobileMenuOpen
                      ? "opacity-100 transform translate-x-0"
                      : "opacity-0 transform translate-x-4"
                  }`}
                >
                  <div className="font-semibold text-gray-900 text-base">
                    {businessSettings?.business_name ||
                      branding?.name ||
                      "MedCure"}
                  </div>
                  <div className="text-xs text-gray-500 hidden sm:block">
                    {businessSettings?.tagline || "Pharmacy System"}
                  </div>
                </div>
              </div>
              {/* Toggle Button */}
              <button
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setMobileMenuOpen(false);
                  } else {
                    setExpanded((c) => !c);
                  }
                }}
                className="w-8 h-8 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-300 hover:scale-105 active:scale-95"
                aria-label={
                  mobileMenuOpen ? "Close mobile menu" : "Collapse sidebar"
                }
              >
                <div className="transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
                  {mobileMenuOpen ? <X size={16} /> : <ChevronLeft size={16} />}
                </div>
              </button>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm transition-all duration-300 hover:scale-105 overflow-hidden">
                {businessSettings?.logo_url ? (
                  <img
                    src={businessSettings.logo_url}
                    alt="Business Logo"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <span>
                    {businessSettings?.business_name?.[0] ||
                      branding?.name?.[0] ||
                      "M"}
                  </span>
                )}
              </div>
              {/* Toggle Button - Floating when collapsed */}
              <button
                onClick={() => setExpanded((c) => !c)}
                className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-full items-center justify-center text-gray-600 hover:text-gray-700 transition-all duration-300 shadow-sm z-20 hover:scale-110 active:scale-95 hover:shadow-md"
                aria-label="Expand sidebar"
              >
                <div className="transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
                  <ChevronRight size={14} />
                </div>
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-hidden">
          <ul
            className={`space-y-1 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              expanded || mobileMenuOpen ? "px-3" : "px-2"
            }`}
          >
            {menu.map((item) => {
              const IconComponent = item.icon;
              const colorClasses = {
                blue: "text-blue-600 bg-blue-50/80 border-blue-100/50 hover:bg-blue-100/60 hover:border-blue-200",
                emerald:
                  "text-emerald-600 bg-emerald-50/80 border-emerald-100/50 hover:bg-emerald-100/60 hover:border-emerald-200",
                orange:
                  "text-orange-600 bg-orange-50/80 border-orange-100/50 hover:bg-orange-100/60 hover:border-orange-200",
                gray: "text-gray-600 bg-gray-50/80 border-gray-100/50 hover:bg-gray-100/60 hover:border-gray-200",
                purple:
                  "text-purple-600 bg-purple-50/80 border-purple-100/50 hover:bg-purple-100/60 hover:border-purple-200",
                red: "text-red-600 bg-red-50/80 border-red-100/50 hover:bg-red-100/60 hover:border-red-200",
                green:
                  "text-green-600 bg-green-50/80 border-green-100/50 hover:bg-green-100/60 hover:border-green-200",
                indigo:
                  "text-indigo-600 bg-indigo-50/80 border-indigo-100/50 hover:bg-indigo-100/60 hover:border-indigo-200",
                teal: "text-teal-600 bg-teal-50/80 border-teal-100/50 hover:bg-teal-100/60 hover:border-teal-200",
                slate:
                  "text-slate-600 bg-slate-50/80 border-slate-100/50 hover:bg-slate-100/60 hover:border-slate-200",
              };

              return (
                <li key={item.to} className="group">
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        setMobileMenuOpen(false);
                      }
                    }}
                    className={({ isActive }) =>
                      `flex items-center transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] relative group ${
                        expanded || mobileMenuOpen
                          ? "gap-3 rounded-lg px-3 py-2.5 text-sm"
                          : "justify-center rounded-lg p-2.5"
                      } ${
                        isActive
                          ? `${
                              colorClasses[item.color]
                            } border font-medium shadow-sm`
                          : "text-gray-600 hover:text-gray-800 hover:bg-gray-50/50 border border-transparent hover:border-gray-100/50"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          className={`flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                            isActive ? "scale-105" : "group-hover:scale-105"
                          } ${expanded || mobileMenuOpen ? "" : "w-5 h-5"}`}
                        >
                          <IconComponent
                            size={18}
                            className="flex-shrink-0 transition-all duration-300"
                          />
                        </div>

                        {(expanded || mobileMenuOpen) && (
                          <div
                            className={`flex-1 flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                              expanded || mobileMenuOpen
                                ? "opacity-100 transform translate-x-0"
                                : "opacity-0 transform translate-x-4"
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="truncate font-medium leading-tight transition-all duration-300">
                                {item.label}
                              </span>
                              {isActive && (
                                <span className="text-xs opacity-75 font-normal transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
                                  {item.description}
                                </span>
                              )}
                            </div>
                            {item.badge && (
                              <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full transition-all duration-300 animate-pulse">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Clean active indicator */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-current rounded-r-sm opacity-80 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"></div>
                        )}
                      </>
                    )}
                  </NavLink>

                  {/* Tooltip for collapsed state */}
                  {!expanded && !mobileMenuOpen && (
                    <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] whitespace-nowrap z-50 pointer-events-none shadow-lg transform group-hover:translate-x-1">
                      {item.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-3 border-transparent border-r-gray-900"></div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Quick Access Section - Only when expanded */}
          {(expanded || mobileMenuOpen) && (
            <div
              className={`mt-8 px-3 transition-all duration-600 delay-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                expanded || mobileMenuOpen
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-4"
              }`}
            >
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1 transition-all duration-300">
                Quick Access
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    // Navigate to archived items page
                    navigate("/archived");
                    // Close mobile menu if open
                    if (window.innerWidth < 768) {
                      setMobileMenuOpen(false);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50/50 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] hover:shadow-sm"
                >
                  <div className="w-2 h-2 bg-gray-500 rounded-full transition-all duration-300"></div>
                  <span className="font-medium transition-all duration-300">
                    Archived
                  </span>
                </button>

                <button
                  onClick={() => {
                    // Navigate to financials page
                    navigate("/financials");
                    // Close mobile menu if open
                    if (window.innerWidth < 768) {
                      setMobileMenuOpen(false);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50/50 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] hover:shadow-sm"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full transition-all duration-300"></div>
                  <span className="font-medium transition-all duration-300">
                    Financials
                  </span>
                </button>

                <button
                  onClick={() => {
                    // Navigate to notifications page
                    navigate("/notification-history");
                    // Close mobile menu if open
                    if (window.innerWidth < 768) {
                      setMobileMenuOpen(false);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50/50 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] hover:shadow-sm"
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full transition-all duration-300 animate-pulse"></div>
                  <span className="font-medium transition-all duration-300">
                    Notifications
                  </span>
                  <span className="ml-auto px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full transition-all duration-300 animate-pulse">
                    3
                  </span>
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div
          className={`border-t border-gray-100 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            expanded || mobileMenuOpen ? "p-4" : "p-3"
          }`}
        >
          {expanded || mobileMenuOpen ? (
            <div
              className={`text-center space-y-2 transition-all duration-500 delay-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                expanded || mobileMenuOpen
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-4"
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600 font-medium transition-all duration-300">
                  System Online
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-500 transition-all duration-300">
                  © {new Date().getFullYear()}{" "}
                  {businessSettings?.business_name ||
                    branding?.name ||
                    "MedCure"}
                </div>
                <div className="text-xs text-gray-400 transition-all duration-300">
                  Version 2.1.0
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 transition-all duration-300">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="text-xs text-gray-400 font-medium transition-all duration-300">
                v2.1
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

Sidebar.propTypes = {
  branding: PropTypes.shape({
    name: PropTypes.string,
  }),
};
