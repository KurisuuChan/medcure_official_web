import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Pill,
  ShoppingCart,
  Contact,
  Bell,
  Banknote,
  Archive,
  Settings,
  ChevronLeft,
  BarChart3,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import PropTypes from "prop-types";

const menu = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "blue",
    description: "Overview & Analytics",
  },
  {
    to: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    color: "indigo",
    description: "Detailed Reports",
  },
  {
    to: "/management",
    label: "Inventory",
    icon: Pill,
    color: "emerald",
    description: "Stock Management",
  },
  {
    to: "/point-of-sales",
    label: "Point of Sale",
    icon: ShoppingCart,
    color: "orange",
    description: "Sales Terminal",
  },
  {
    to: "/archived",
    label: "Archived",
    icon: Archive,
    color: "gray",
    description: "Archived Records",
  },
  {
    to: "/contacts",
    label: "Patients",
    icon: Contact,
    color: "purple",
    description: "Patient Database",
  },
  {
    to: "/notifications",
    label: "Notifications",
    icon: Bell,
    color: "red",
    description: "System Alerts",
  },
  {
    to: "/financials",
    label: "Financials",
    icon: Banknote,
    color: "green",
    description: "Financial Overview",
  },
  {
    to: "/reports",
    label: "Reports",
    icon: BarChart3,
    color: "slate",
    description: "Business Reports",
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
    color: "slate",
    description: "System Configuration",
  },
];

export default function Sidebar({ branding }) {
  const [expanded, setExpanded] = useState(() => {
    const stored = localStorage.getItem("mc-sidebar-expanded");
    return stored ? JSON.parse(stored) : true;
  });
  const [hoveredItem, setHoveredItem] = useState(null);
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
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [expanded]);

  // Close mobile menu on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setMobileMenuOpen(false);
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  useEffect(() => {
    localStorage.setItem("mc-sidebar-expanded", JSON.stringify(expanded));
  }, [expanded]);

  return (
    <>
      {/* Mobile Menu Button - Only visible on mobile */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-12 h-12 bg-white hover:bg-blue-50 border-2 border-blue-200 hover:border-blue-400 rounded-xl flex items-center justify-center text-blue-600 hover:text-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl group"
        aria-label="Toggle mobile menu"
      >
        {mobileMenuOpen ? (
          <X size={20} className="group-hover:scale-110 transition-all duration-300" />
        ) : (
          <Menu size={20} className="group-hover:scale-110 transition-all duration-300" />
        )}
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
          h-full bg-white/98 backdrop-blur-md border-r border-gray-200/60 flex flex-col transition-all duration-500 ease-in-out relative shadow-xl
          ${expanded ? "w-72" : "w-20"}
          md:relative md:translate-x-0
          ${mobileMenuOpen 
            ? "fixed left-0 top-0 z-50 translate-x-0 w-80" 
            : "fixed left-0 top-0 z-50 -translate-x-full md:translate-x-0"
          }
        `}
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.98), rgba(248,250,252,0.95))",
        }}
        aria-label="Navigation"
      >
      {/* Header */}
      <div
        className={`h-16 flex items-center border-b border-gray-200/60 relative backdrop-blur-sm ${
          expanded || mobileMenuOpen ? "justify-between px-6" : "justify-center"
        } ${mobileMenuOpen ? "px-4" : ""}`}
        style={{
          background:
            "linear-gradient(135deg, rgba(59,130,246,0.03), rgba(99,102,241,0.03))",
        }}
      >
        {expanded || mobileMenuOpen ? (
          <>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <span className="drop-shadow-sm">M</span>
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-gray-900 text-lg tracking-tight">
                  {branding?.name || "MedCure"}
                </div>
                <div className="text-xs text-gray-500 font-medium tracking-wide hidden sm:block">
                  Pharmacy Management System
                </div>
              </div>
            </div>
            {/* Toggle Button - Inside header when expanded or mobile */}
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileMenuOpen(false);
                } else {
                  setExpanded((c) => !c);
                }
              }}
              className="w-10 h-10 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-300 hover:border-gray-400 rounded-2xl flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-300 group shadow-md hover:shadow-lg transform hover:scale-105"
              aria-label={mobileMenuOpen ? "Close mobile menu" : "Collapse sidebar"}
            >
              {mobileMenuOpen ? (
                <X
                  size={18}
                  className="group-hover:scale-110 transition-all duration-300 drop-shadow-sm"
                />
              ) : (
                <ChevronLeft
                  size={18}
                  className="group-hover:scale-110 transition-all duration-300 drop-shadow-sm"
                />
              )}
            </button>
          </>
        ) : (
          <>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <span className="drop-shadow-sm">M</span>
            </div>
            {/* Enhanced Toggle Button - Floating when collapsed (desktop only) */}
            <button
              onClick={() => setExpanded((c) => !c)}
              className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-white hover:bg-blue-50 border-2 border-blue-200 hover:border-blue-400 rounded-full items-center justify-center text-blue-600 hover:text-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl z-20 group transform hover:scale-110"
              aria-label="Expand sidebar"
            >
              <ChevronRight
                size={16}
                className="group-hover:scale-110 transition-all duration-300 drop-shadow-sm"
              />
            </button>
          </>
        )}
      </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 overflow-hidden">
          <ul className={`space-y-3 ${expanded || mobileMenuOpen ? "px-5" : "px-3"}`}>
            {menu.map((item, index) => {
              const IconComponent = item.icon;
              const colorClasses = {
                blue: "text-blue-700 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-blue-100",
                emerald:
                  "text-emerald-700 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-emerald-100",
                orange:
                  "text-orange-700 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-orange-100",
                gray: "text-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-gray-100",
                purple:
                  "text-purple-700 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-purple-100",
                red: "text-red-700 bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-red-100",
                green:
                  "text-green-700 bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-green-100",
                indigo:
                  "text-indigo-700 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 shadow-indigo-100",
                slate:
                  "text-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-slate-100",
              };

              return (
                <li key={item.to} className="group relative">
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    onMouseEnter={() => setHoveredItem(index)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => {
                      // Close mobile menu when navigating
                      if (window.innerWidth < 768) {
                        setMobileMenuOpen(false);
                      }
                    }}
                    className={({ isActive }) =>
                      `flex items-center transition-all duration-300 ease-out relative overflow-hidden transform hover:scale-[1.02] active:scale-[0.98] ${
                        expanded || mobileMenuOpen
                          ? "gap-4 rounded-2xl px-5 py-4 text-sm font-medium"
                          : "justify-center rounded-2xl p-4"
                      } ${
                        isActive
                          ? `${colorClasses[item.color]} border shadow-lg`
                          : "text-gray-600 hover:text-gray-800 hover:bg-gradient-to-br hover:from-gray-50/80 hover:to-gray-100/80 border border-transparent hover:border-gray-200/50 hover:shadow-md"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Animated background shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out"></div>

                        <div
                          className={`flex items-center justify-center transition-all duration-300 relative z-10 ${
                            isActive
                              ? "scale-110 drop-shadow-sm"
                              : hoveredItem === index
                              ? "scale-105 rotate-3"
                              : "group-hover:scale-105"
                          } ${expanded || mobileMenuOpen ? "" : "w-6 h-6"}`}
                        >
                          <IconComponent
                            size={20}
                            className="flex-shrink-0 drop-shadow-sm"
                          />
                        </div>

                        {(expanded || mobileMenuOpen) && (
                          <div className="flex flex-col relative z-10">
                            <span
                              className={`truncate font-semibold tracking-tight transition-all duration-300 ${
                                hoveredItem === index ? "translate-x-1" : ""
                              }`}
                            >
                              {item.label}
                            </span>
                            {isActive && (
                              <span className="text-xs opacity-70 font-medium tracking-wide">
                                {item.description}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Enhanced active indicator */}
                        {isActive && (
                          <>
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-current rounded-r-full opacity-80 shadow-sm"></div>
                            <div className="absolute right-3 w-2 h-2 rounded-full bg-current opacity-60 animate-pulse"></div>
                          </>
                        )}
                      </>
                    )}
                  </NavLink>

                  {/* Enhanced Tooltip for collapsed state (desktop only) */}
                  {!expanded && !mobileMenuOpen && (
                    <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-6 px-4 py-3 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out whitespace-nowrap z-50 pointer-events-none shadow-2xl border border-gray-700/50 transform group-hover:translate-x-1">
                      <div className="space-y-1">
                        <div className="font-semibold tracking-tight">
                          {item.label}
                        </div>
                        <div className="text-xs opacity-80 font-medium">
                          {item.description}
                        </div>
                      </div>
                      {/* Enhanced arrow */}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900/95 drop-shadow-sm"></div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Enhanced Footer */}
        <div
          className={`border-t border-gray-200/60 backdrop-blur-sm ${
            expanded || mobileMenuOpen ? "p-6" : "p-4"
          }`}
          style={{
            background:
              "linear-gradient(135deg, rgba(59,130,246,0.02), rgba(99,102,241,0.02))",
          }}
        >
          {expanded || mobileMenuOpen ? (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-30"></div>
                </div>
                <span className="text-sm text-gray-600 font-semibold tracking-tight">
                  System Online
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-500 font-medium tracking-wide">
                  © {new Date().getFullYear()} MedCure Pharmacy
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  Version 2.1.0 • Professional Edition
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-30"></div>
              </div>
              <div className="text-xs text-gray-400 font-bold tracking-wider">
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
  branding: PropTypes.shape({ name: PropTypes.string }),
};
