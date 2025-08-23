import React from "react";
import { usePermissions } from "../hooks/usePermissions.js";

/**
 * Higher-Order Component for Permission-based Rendering
 * Wraps components with permission context
 */
export function withPermissions(WrappedComponent) {
  return function PermissionWrappedComponent(props) {
    const permissions = usePermissions();
    return React.createElement(WrappedComponent, { ...props, permissions });
  };
}

export default withPermissions;
