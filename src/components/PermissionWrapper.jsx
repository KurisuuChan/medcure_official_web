import React from "react";
import { usePermission } from "../hooks/usePermissions";
import { AccessDenied } from "./PermissionGuard";

/**
 * Higher-order component that wraps components with permission checks
 * @param {React.Component} WrappedComponent - Component to protect
 * @param {string} requiredPermission - Permission required to access the component
 * @param {object} options - Additional options for the protection
 */
export function withPermission(
  WrappedComponent,
  requiredPermission,
  options = {}
) {
  return function ProtectedComponent(props) {
    const { fallbackComponent: FallbackComponent = AccessDenied } = options;

    const hasAccess = usePermission(requiredPermission);

    if (!hasAccess) {
      return <FallbackComponent requiredPermission={requiredPermission} />;
    }

    return <WrappedComponent {...props} />;
  };
}

export default withPermission;
