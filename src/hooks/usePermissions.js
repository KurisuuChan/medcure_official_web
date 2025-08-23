import { useMemo } from "react";
import {
  hasPermission,
  canAccessRoute,
  canAccessSettingsTab,
  canAccessComponent,
  getCurrentUserRole,
  getUserPermissions,
  getRoleInfo,
  PERMISSIONS,
} from "../utils/permissions.js";

/**
 * React Hook for Permission Management
 * Simplified for Admin + Employee/Cashier roles
 */
export function usePermissions() {
  const userRole = getCurrentUserRole();
  const permissions = getUserPermissions();
  const roleInfo = getRoleInfo();

  const permissionHelpers = useMemo(
    () => ({
      // Role checks
      isAdmin: () => userRole === "admin",
      isEmployee: () => userRole === "employee",

      // Permission checks
      hasPermission: (permission) => hasPermission(permission),

      // Route access
      canAccessRoute: (route) => canAccessRoute(route),

      // Settings access
      canAccessSettingsTab: (tab) => canAccessSettingsTab(tab),

      // Component access
      canAccessComponent: (component) => canAccessComponent(component),

      // Specific feature checks
      canManageSystem: () => hasPermission(PERMISSIONS.MANAGE_SYSTEM),
      canManageUsers: () => hasPermission(PERMISSIONS.MANAGE_USERS),
      canManageInventory: () => hasPermission(PERMISSIONS.MANAGE_INVENTORY),
      canAccessDebug: () => hasPermission(PERMISSIONS.ACCESS_DEBUG),
      canViewFinancials: () => hasPermission(PERMISSIONS.VIEW_FINANCIALS),
      canProcessSales: () => hasPermission(PERMISSIONS.PROCESS_SALES),
      canWriteInventory: () => hasPermission(PERMISSIONS.WRITE_INVENTORY),
      canReadInventory: () => hasPermission(PERMISSIONS.READ_INVENTORY),

      // Utility
      getUserRole: () => userRole,
      getRoleInfo: () => roleInfo,
      getAllPermissions: () => permissions,
    }),
    [userRole, permissions, roleInfo]
  );

  return permissionHelpers;
}

/**
 * Permission checker utility
 * Returns true/false for permission checks without JSX
 */
export function checkPermission(permission, role, component, route) {
  const userRole = getCurrentUserRole();

  // Check permission
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasAccess = permissions.some((p) => hasPermission(p));
    if (!hasAccess) return false;
  }

  // Check role
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    const hasRole = roles.some((r) => {
      if (r === "admin") return userRole === "admin";
      if (r === "employee" || r === "cashier") return userRole === "employee";
      return false;
    });
    if (!hasRole) return false;
  }

  // Check route access
  if (route && !canAccessRoute(route)) {
    return false;
  }

  // Check component access
  if (component && !canAccessComponent(component)) {
    return false;
  }

  return true;
}

/**
 * Get role information for current user
 */
export function getCurrentRoleInfo() {
  const userRole = getCurrentUserRole();
  return getRoleInfo(userRole);
}

/**
 * Check if current user has specific permission
 */
export function userHasPermission(permission) {
  return hasPermission(permission);
}

/**
 * Get all permissions for current user
 */
export function getCurrentUserPermissions() {
  return getUserPermissions();
}
