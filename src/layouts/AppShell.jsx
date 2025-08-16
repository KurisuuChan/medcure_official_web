import React from "react";
import PropTypes from "prop-types";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings as SettingsIcon,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { to: "/inventory", label: "Inventory", icon: <Package size={18} /> },
  { to: "/sales", label: "POS", icon: <ShoppingCart size={18} /> },
  { to: "/reports", label: "Reports", icon: <BarChart3 size={18} /> },
  { to: "/settings", label: "Settings", icon: <SettingsIcon size={18} /> },
];

const AppShell = ({ branding }) => {
  return (
    <div className="h-screen flex bg-gray-100 text-gray-800">
      <aside
        role="navigation"
        aria-label="Main"
        className="w-60 bg-white border-r flex flex-col"
      >
        <div className="h-16 flex items-center px-4 border-b font-semibold tracking-wide text-blue-600">
          {branding?.name || "MedCure"}
        </div>
        <nav className="flex-1 overflow-y-auto py-4" aria-label="Primary">
          <ul className="space-y-1">
            {navItems.map((n) => (
              <li key={n.to} className="group">
                <NavLink
                  to={n.to}
                  end={n.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-r-full transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white shadow"
                        : "hover:bg-gray-50 text-gray-700"
                    }`
                  }
                >
                  <span className="opacity-80 group-hover:opacity-100">
                    {n.icon}
                  </span>
                  {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 text-xs text-gray-500">
          © {new Date().getFullYear()} MedCure
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold">Pharmacy Management</h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium hidden sm:inline">
              Professional Build
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

AppShell.propTypes = {
  branding: PropTypes.shape({ name: PropTypes.string }),
};

export default AppShell;
