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
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/management", label: "Inventory", icon: Pill },
  { to: "/point-of-sales", label: "Point of Sale", icon: ShoppingCart },
  { to: "/archived", label: "Archived", icon: Archive },
  { to: "/contacts", label: "Patients", icon: Contact },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/financials", label: "Financials", icon: Banknote },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
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
      className={`h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 relative ${
        expanded ? "w-64" : "w-16"
      }`}
      aria-label="Navigation"
    >
      {/* Header */}
      <div className={`h-14 flex items-center border-b border-gray-200 relative ${expanded ? 'justify-between px-4' : 'justify-center'}`}>
        {expanded ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                M
              </div>
              <span className="font-semibold text-gray-900">
                {branding?.name || "MedCure"}
              </span>
            </div>
            {/* Toggle Button - Inside header when expanded */}
            <button
              onClick={() => setExpanded((c) => !c)}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 border border-gray-300 hover:border-gray-400 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-200 group"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={16} className="group-hover:scale-110 transition-transform" />
            </button>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              M
            </div>
            {/* Toggle Button - Floating when collapsed */}
            <button
              onClick={() => setExpanded((c) => !c)}
              className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white hover:bg-blue-50 border-2 border-blue-200 hover:border-blue-400 rounded-full flex items-center justify-center text-blue-600 hover:text-blue-700 transition-all duration-200 shadow-md hover:shadow-lg z-10 group"
              aria-label="Expand sidebar"
            >
              <ChevronLeft size={16} className="rotate-180 group-hover:scale-110 transition-transform" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-hidden">
        <ul className={`space-y-1 ${expanded ? 'px-2' : 'px-1'}`}>
          {menu.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.to} className="group relative">
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center transition-all duration-200 ${
                      expanded 
                        ? 'gap-3 rounded-lg px-3 py-2.5 text-sm font-medium'
                        : 'justify-center rounded-lg p-2.5'
                    } ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`
                  }
                >
                  <div className={`flex items-center justify-center ${expanded ? '' : 'w-6 h-6'}`}>
                    <IconComponent size={20} className="flex-shrink-0" />
                  </div>
                  {expanded && (
                    <span className="truncate">{item.label}</span>
                  )}
                </NavLink>
                
                {/* Enhanced Tooltip for collapsed state */}
                {!expanded && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-lg">
                    <div className="font-medium">{item.label}</div>
                    {/* Arrow pointing to sidebar */}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Enhanced Footer */}
      <div className={`border-t border-gray-200 ${expanded ? 'p-4' : 'p-2'}`}>
        {expanded ? (
          <div className="text-center">
            <div className="text-xs text-gray-500 font-medium">
              © {new Date().getFullYear()} MedCure
            </div>
            <div className="text-xs text-gray-400 mt-1">
              v2.1.0
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  branding: PropTypes.shape({ name: PropTypes.string }),
};
