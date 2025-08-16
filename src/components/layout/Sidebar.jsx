import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Pill,
  ShoppingCart,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import PropTypes from "prop-types";

// Streamlined menu with primary functions only
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
    icon: Pill,
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
    to: "/analytics",
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
    description: "Customer Directory",
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
          h-full bg-white/95 backdrop-blur-lg border-r border-gray-200/50 flex flex-col transition-all duration-300 ease-out relative
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
          className={`h-16 flex items-center border-b border-gray-100 relative ${
            expanded || mobileMenuOpen
              ? "justify-between px-6"
              : "justify-center"
          } ${mobileMenuOpen ? "px-4" : ""}`}
        >
          {expanded || mobileMenuOpen ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  <span>M</span>
                </div>
                <div className="space-y-0.5">
                  <div className="font-semibold text-gray-900 text-base">
                    {branding?.name || "MedCure"}
                  </div>
                  <div className="text-xs text-gray-500 hidden sm:block">
                    Pharmacy System
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
                className="w-8 h-8 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200"
                aria-label={
                  mobileMenuOpen ? "Close mobile menu" : "Collapse sidebar"
                }
              >
                {mobileMenuOpen ? <X size={16} /> : <ChevronLeft size={16} />}
              </button>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                <span>M</span>
              </div>
              {/* Toggle Button - Floating when collapsed */}
              <button
                onClick={() => setExpanded((c) => !c)}
                className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-full items-center justify-center text-gray-600 hover:text-gray-700 transition-all duration-200 shadow-sm z-20"
                aria-label="Expand sidebar"
              >
                <ChevronRight size={14} />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-hidden">
          <ul
            className={`space-y-1 ${
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
                      `flex items-center transition-all duration-200 relative group ${
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
                          className={`flex items-center justify-center transition-all duration-200 ${
                            isActive ? "scale-105" : "group-hover:scale-105"
                          } ${expanded || mobileMenuOpen ? "" : "w-5 h-5"}`}
                        >
                          <IconComponent size={18} className="flex-shrink-0" />
                        </div>

                        {(expanded || mobileMenuOpen) && (
                          <div className="flex-1 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="truncate font-medium leading-tight">
                                {item.label}
                              </span>
                              {isActive && (
                                <span className="text-xs opacity-75 font-normal">
                                  {item.description}
                                </span>
                              )}
                            </div>
                            {item.badge && (
                              <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Clean active indicator */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-current rounded-r-sm opacity-80"></div>
                        )}
                      </>
                    )}
                  </NavLink>

                  {/* Tooltip for collapsed state */}
                  {!expanded && !mobileMenuOpen && (
                    <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-lg">
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
            <div className="mt-8 px-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
                Quick Access
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    // Navigate to notifications page
                    navigate("/notifications");
                    // Close mobile menu if open
                    if (window.innerWidth < 768) {
                      setMobileMenuOpen(false);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50/50 rounded-lg transition-all duration-200"
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="font-medium">Notifications</span>
                  <span className="ml-auto px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                    3
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
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50/50 rounded-lg transition-all duration-200"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Financials</span>
                </button>

                <button
                  onClick={() => {
                    // Navigate to archived items page
                    navigate("/archived");
                    // Close mobile menu if open
                    if (window.innerWidth < 768) {
                      setMobileMenuOpen(false);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50/50 rounded-lg transition-all duration-200"
                >
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="font-medium">Archived Items</span>
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div
          className={`border-t border-gray-100 ${
            expanded || mobileMenuOpen ? "p-4" : "p-3"
          }`}
        >
          {expanded || mobileMenuOpen ? (
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600 font-medium">
                  System Online
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-500">
                  © {new Date().getFullYear()} MedCure
                </div>
                <div className="text-xs text-gray-400">Version 2.1.0</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="text-xs text-gray-400 font-medium">v2.1</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

Sidebar.propTypes = {
  branding: PropTypes.shape({ name: PropTypes.string }),
};
