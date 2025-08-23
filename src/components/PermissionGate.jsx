import React from "react";
import { usePermissions } from "../hooks/usePermissions.js";

/**
 * Permission Gate Component
 * Only renders children if user has required permissions
 */
export function PermissionGate({
  permission,
  role,
  component,
  route,
  children,
  fallback = null,
  requireAll = false,
}) {
  const {
    hasPermission,
    isAdmin,
    isEmployee,
    canAccessRoute,
    canAccessComponent,
  } = usePermissions();

  // Check permission
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasAccess = requireAll
      ? permissions.every((p) => hasPermission(p))
      : permissions.some((p) => hasPermission(p));

    if (!hasAccess) return fallback;
  }

  // Check role
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    const hasRole = roles.some((r) => {
      if (r === "admin") return isAdmin();
      if (r === "employee" || r === "cashier") return isEmployee();
      return false;
    });

    if (!hasRole) return fallback;
  }

  // Check route access
  if (route && !canAccessRoute(route)) {
    return fallback;
  }

  // Check component access
  if (component && !canAccessComponent(component)) {
    return fallback;
  }

  return children;
}

export default PermissionGate;
