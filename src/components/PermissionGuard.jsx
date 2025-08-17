import React from "react";
import { Shield, AlertCircle } from "lucide-react";
import { usePermission } from "../hooks/usePermissions";

/**
 * Component that conditionally renders children based on permissions
 * @param {string} permission - Required permission
 * @param {React.ReactNode} children - Content to render if permission granted
 * @param {React.ReactNode} fallback - Content to render if permission denied
 */
export function PermissionGuard({ permission, children, fallback = null }) {
  const hasAccess = usePermission(permission);

  if (!hasAccess) {
    return fallback;
  }

  return children;
}

/**
 * Default access denied component
 */
export function AccessDenied({ requiredPermission }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>

          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Please contact your
            administrator if you believe this is an error.
          </p>

          {requiredPermission && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <AlertCircle className="w-4 h-4" />
                <span>
                  Required permission:{" "}
                  <code className="bg-gray-200 px-2 py-1 rounded text-xs">
                    {requiredPermission}
                  </code>
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Go Back
            </button>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Component for showing/hiding UI elements based on permissions
 */
export function ConditionalRender({
  permission,
  children,
  fallback = null,
  invert = false,
}) {
  const hasAccess = usePermission(permission);
  const shouldShow = invert ? !hasAccess : hasAccess;

  return shouldShow ? children : fallback;
}

/**
 * Permission status indicator component
 */
export function PermissionStatus({ permission, showDetails = false }) {
  const hasAccess = usePermission(permission);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          hasAccess ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span
        className={`text-sm ${hasAccess ? "text-green-700" : "text-red-700"}`}
      >
        {hasAccess ? "Granted" : "Denied"}
      </span>
      {showDetails && (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
          {permission}
        </code>
      )}
    </div>
  );
}
