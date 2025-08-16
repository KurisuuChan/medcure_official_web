import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  Menu,
} from "lucide-react";
import PropTypes from "prop-types";

const menu = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/management", label: "Management", icon: Pill },
  { to: "/archived", label: "Archived", icon: Archive },
  { to: "/point-of-sales", label: "POS", icon: ShoppingCart },
  { to: "/contacts", label: "Contacts", icon: Contact },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/financials", label: "Financials", icon: Banknote },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ branding }) {
  const [expanded, setExpanded] = useState(() => {
    const stored = localStorage.getItem("mc-sidebar-expanded");
    return stored ? JSON.parse(stored) : true;
  });
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("mc-sidebar-expanded", JSON.stringify(expanded));
  }, [expanded]);

  return (
    <aside
      className={`h-full bg-white/95 backdrop-blur border-r border-gray-200 flex flex-col transition-all duration-300 ${
        expanded ? "w-64" : "w-20"
      }`}
      aria-label="Sidebar navigation"
    >
      <div className="h-16 flex items-center justify-between px-4 border-b">
        <div className="font-semibold tracking-wide text-blue-600 text-sm flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold">
            {branding?.name?.[0] || "M"}
          </span>
          {expanded && (
            <span className="truncate">{branding?.name || "MedCure"}</span>
          )}
        </div>
        <button
          onClick={() => setExpanded((c) => !c)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? <ChevronLeft size={18} /> : <Menu size={18} />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-4" aria-label="Primary">
        <ul className="space-y-1 px-2">
          {menu.map((item) => {
            const ActiveIcon = item.icon;
            const active = location.pathname === item.to;
            return (
              <li key={item.to} className="group relative">
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`
                  }
                >
                  <ActiveIcon
                    size={18}
                    className={
                      active
                        ? "opacity-100"
                        : "opacity-80 group-hover:opacity-100"
                    }
                  />
                  {expanded && <span className="truncate">{item.label}</span>}
                </NavLink>
                {!expanded && (
                  <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 text-xs font-medium bg-gray-900 text-white px-2 py-1 rounded opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition">
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 text-[10px] text-gray-500 uppercase tracking-wider border-t">
        © {new Date().getFullYear()} MedCure
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  branding: PropTypes.shape({ name: PropTypes.string }),
};
