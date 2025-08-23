/**
 * MedCure Permission System
 * Simple 2-role system: Admin & Employee/Cashier
 */

import { getCurrentRole } from "../services/roleAuthService.js";

// Define all available permissions
export const PERMISSIONS = {
  // System Management
  MANAGE_SYSTEM: "manage:system",
  MANAGE_USERS: "manage:users",
  MANAGE_SETTINGS: "manage:settings",

  // Business Operations
  MANAGE_INVENTORY: "manage:inventory",
  MANAGE_BUSINESS: "manage:business",

  // Sales & POS
  PROCESS_SALES: "process:sales",
  ACCESS_POS: "access:pos",

  // Reports & Analytics
  VIEW_ALL_REPORTS: "view:all_reports",
  VIEW_DAILY_REPORTS: "view:daily_reports",
  VIEW_FINANCIALS: "view:financials",

  // Inventory
  READ_INVENTORY: "read:inventory",
  WRITE_INVENTORY: "write:inventory",

  // Debug & Development
  ACCESS_DEBUG: "access:debug",
  STORAGE_ADMIN: "storage:admin",
};

// Role-based permissions mapping
export const ROLE_PERMISSIONS = {
  admin: [
    // Full system access
    PERMISSIONS.MANAGE_SYSTEM,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.MANAGE_BUSINESS,
    PERMISSIONS.PROCESS_SALES,
    PERMISSIONS.ACCESS_POS,
    PERMISSIONS.VIEW_ALL_REPORTS,
    PERMISSIONS.VIEW_DAILY_REPORTS,
    PERMISSIONS.VIEW_FINANCIALS,
    PERMISSIONS.READ_INVENTORY,
    PERMISSIONS.WRITE_INVENTORY,
    PERMISSIONS.ACCESS_DEBUG,
    PERMISSIONS.STORAGE_ADMIN,
  ],

  employee: [
    // Limited access for cashiers/employees
    PERMISSIONS.PROCESS_SALES,
    PERMISSIONS.ACCESS_POS,
    PERMISSIONS.VIEW_DAILY_REPORTS,
    PERMISSIONS.READ_INVENTORY,
  ],

  // Alias for employee (since cashier is the same as employee)
  cashier: [
    PERMISSIONS.PROCESS_SALES,
    PERMISSIONS.ACCESS_POS,
    PERMISSIONS.VIEW_DAILY_REPORTS,
    PERMISSIONS.READ_INVENTORY,
  ],
};

// Feature access by role
export const FEATURE_ACCESS = {
  // Pages/Routes
  routes: {
    "/dashboard": ["admin", "employee", "cashier"],
    "/inventory": ["admin", "employee", "cashier"], // Read-only for employees
    "/management": ["admin"], // Admin only
    "/pos": ["admin", "employee", "cashier"],
    "/reports": ["admin"], // Full reports admin only
    "/financials": ["admin"],
    "/settings": ["admin", "employee", "cashier"], // Limited settings for employees
    "/archived": ["admin"],
    "/contacts": ["admin"],
    "/notifications": ["admin", "employee", "cashier"],
  },

  // Settings tabs
  settingsTabs: {
    profile: ["admin", "employee", "cashier"],
    roles: ["admin", "employee", "cashier"], // Can manage own role
    business: ["admin"], // Admin only
    appearance: ["admin"],
    system: ["admin"],
    notifications: ["admin", "employee", "cashier"],
    security: ["admin"],
    debug: ["admin"], // Admin only
  },

  // UI Components
  components: {
    userManagement: ["admin"],
    systemSettings: ["admin"],
    businessSettings: ["admin"],
    inventoryWrite: ["admin"],
    inventoryRead: ["admin", "employee", "cashier"],
    salesProcessing: ["admin", "employee", "cashier"],
    reportsAll: ["admin"],
    reportsDaily: ["admin", "employee", "cashier"],
    debugTools: ["admin"],
    storageAdmin: ["admin"],
  },
};

/**
 * Get user's current role (normalized)
 * @returns {string} 'admin' or 'employee'
 */
export function getCurrentUserRole() {
  const role = getCurrentRole();

  // Normalize role names
  if (role === "admin") return "admin";
  if (role === "employee" || role === "cashier") return "employee";

  // Default to employee for safety
  return "employee";
}

/**
 * Check if user has specific permission
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export function hasPermission(permission) {
  const userRole = getCurrentUserRole();
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if user can access a route
 * @param {string} route - Route path
 * @returns {boolean}
 */
export function canAccessRoute(route) {
  const userRole = getCurrentUserRole();
  const allowedRoles = FEATURE_ACCESS.routes[route] || [];
  return allowedRoles.includes(userRole);
}

/**
 * Check if user can access a settings tab
 * @param {string} tab - Tab name
 * @returns {boolean}
 */
export function canAccessSettingsTab(tab) {
  const userRole = getCurrentUserRole();
  const allowedRoles = FEATURE_ACCESS.settingsTabs[tab] || [];
  return allowedRoles.includes(userRole);
}

/**
 * Check if user can access a component/feature
 * @param {string} component - Component name
 * @returns {boolean}
 */
export function canAccessComponent(component) {
  const userRole = getCurrentUserRole();
  const allowedRoles = FEATURE_ACCESS.components[component] || [];
  return allowedRoles.includes(userRole);
}

/**
 * Get all permissions for current user
 * @returns {string[]} Array of permissions
 */
export function getUserPermissions() {
  const userRole = getCurrentUserRole();
  return ROLE_PERMISSIONS[userRole] || [];
}

/**
 * Role display information
 */
export const ROLE_INFO = {
  admin: {
    label: "Administrator",
    icon: "🛡️",
    color: "#3b82f6",
    description: "Full system access and management",
    badge: "ADMIN",
  },
  employee: {
    label: "Employee/Cashier",
    icon: "💳",
    color: "#f59e0b",
    description: "Point of sale and daily operations",
    badge: "STAFF",
  },
};

/**
 * Get role display info
 * @param {string} role - Role name
 * @returns {Object} Role display information
 */
export function getRoleInfo(role = null) {
  const userRole = role || getCurrentUserRole();
  return ROLE_INFO[userRole] || ROLE_INFO.employee;
}

/**
 * Session timeout by role (in milliseconds)
 */
export const SESSION_TIMEOUTS = {
  admin: 30 * 60 * 1000, // 30 minutes
  employee: 15 * 60 * 1000, // 15 minutes
};

/**
 * Get session timeout for current user
 * @returns {number} Timeout in milliseconds
 */
export function getSessionTimeout() {
  const userRole = getCurrentUserRole();
  return SESSION_TIMEOUTS[userRole] || SESSION_TIMEOUTS.employee;
}
