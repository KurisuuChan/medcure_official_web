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
} from "lucide-react";
import PropTypes from "prop-types";

const menu = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, color: "blue" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, color: "indigo" },
  { to: "/management", label: "Inventory", icon: Pill, color: "emerald" },
  {
    to: "/point-of-sales",
    label: "Point of Sale",
    icon: ShoppingCart,
    color: "orange",
  },
  { to: "/archived", label: "Archived", icon: Archive, color: "gray" },
  { to: "/contacts", label: "Patients", icon: Contact, color: "purple" },
  { to: "/notifications", label: "Notifications", icon: Bell, color: "red" },
  { to: "/financials", label: "Financials", icon: Banknote, color: "green" },
  { to: "/reports", label: "Reports", icon: BarChart3, color: "slate" },
  { to: "/settings", label: "Settings", icon: Settings, color: "slate" },
];

export default function Sidebar({ branding }) {
  const [expanded, setExpanded] = useState(() => {
    const stored = localStorage.getItem("mc-sidebar-expanded");
    return stored ? JSON.parse(stored) : true;
  });

  useEffect(() => {
    localStorage.setItem("mc-sidebar-expanded", JSON.stringify(expanded));
  }, [expanded]);

  return (
    <aside
      className={`h-full bg-white/95 backdrop-blur-sm border-r border-gray-200/80 flex flex-col transition-all duration-300 relative shadow-sm ${
        expanded ? "w-72" : "w-18"
      }`}
      aria-label="Navigation"
    >
      {/* Header */}
      <div
        className={`h-16 flex items-center border-b border-gray-200/80 relative ${
          expanded ? "justify-between px-6" : "justify-center"
        }`}
      >
        {expanded ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                M
              </div>
              <div>
                <div className="font-bold text-gray-900 text-lg">
                  {branding?.name || "MedCure"}
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  Pharmacy System
                </div>
              </div>
            </div>
            {/* Toggle Button - Inside header when expanded */}
            <button
              onClick={() => setExpanded((c) => !c)}
              className="w-9 h-9 bg-gray-100 hover:bg-gray-200 border border-gray-300 hover:border-gray-400 rounded-xl flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200 group shadow-sm hover:shadow"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft
                size={18}
                className="group-hover:scale-110 transition-transform"
              />
            </button>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              M
            </div>
            {/* Toggle Button - Floating when collapsed */}
            <button
              onClick={() => setExpanded((c) => !c)}
              className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white hover:bg-blue-50 border-2 border-blue-200 hover:border-blue-400 rounded-full flex items-center justify-center text-blue-600 hover:text-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl z-10 group"
              aria-label="Expand sidebar"
            >
              <ChevronLeft
                size={16}
                className="rotate-180 group-hover:scale-110 transition-transform"
              />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 overflow-hidden">
        <ul className={`space-y-2 ${expanded ? "px-4" : "px-2"}`}>
          {menu.map((item) => {
            const IconComponent = item.icon;
            const colorClasses = {
              blue: "text-blue-600 bg-blue-50 border-blue-200",
              emerald: "text-emerald-600 bg-emerald-50 border-emerald-200",
              orange: "text-orange-600 bg-orange-50 border-orange-200",
              gray: "text-gray-600 bg-gray-50 border-gray-200",
              purple: "text-purple-600 bg-purple-50 border-purple-200",
              red: "text-red-600 bg-red-50 border-red-200",
              green: "text-green-600 bg-green-50 border-green-200",
              indigo: "text-indigo-600 bg-indigo-50 border-indigo-200",
              slate: "text-slate-600 bg-slate-50 border-slate-200",
            };

            return (
              <li key={item.to} className="group relative">
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center transition-all duration-200 relative overflow-hidden ${
                      expanded
                        ? "gap-3 rounded-xl px-4 py-3 text-sm font-medium"
                        : "justify-center rounded-xl p-3"
                    } ${
                      isActive
                        ? `${colorClasses[item.color]} border shadow-sm`
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50/80"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={`flex items-center justify-center transition-transform duration-200 ${
                          isActive ? "scale-110" : "group-hover:scale-105"
                        } ${expanded ? "" : "w-6 h-6"}`}
                      >
                        <IconComponent size={20} className="flex-shrink-0" />
                      </div>
                      {expanded && (
                        <span className="truncate font-semibold">
                          {item.label}
                        </span>
                      )}

                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-current rounded-r-full opacity-60"></div>
                      )}
                    </>
                  )}
                </NavLink>

                {/* Enhanced Tooltip for collapsed state */}
                {!expanded && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-xl border border-gray-700">
                    <div className="font-semibold">{item.label}</div>
                    {/* Arrow pointing to sidebar */}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900/95"></div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Enhanced Footer */}
      <div
        className={`border-t border-gray-200/80 ${expanded ? "p-5" : "p-3"}`}
      >
        {expanded ? (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500 font-medium">
                System Online
              </span>
            </div>
            <div className="text-xs text-gray-500 font-medium">
              © {new Date().getFullYear()} MedCure Pharmacy
            </div>
            <div className="text-xs text-gray-400">Version 2.1.0</div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
            <div className="text-xs text-gray-400 font-bold">v2.1</div>
          </div>
        )}
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  branding: PropTypes.shape({ name: PropTypes.string }),
};
