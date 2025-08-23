import React from "react";
import { usePermissions } from "../hooks/usePermissions.js";

/**
 * Role Badge Component
 * Displays the current user's role with styling
 */
export function RoleBadge({ className = "" }) {
  const { getRoleInfo } = usePermissions();
  const roleInfo = getRoleInfo();

  if (!roleInfo) {
    return null;
  }

  return (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full ${className}`}
      style={{
        backgroundColor: `${roleInfo.color}20`,
        color: roleInfo.color,
      }}
    >
      {roleInfo.icon} {roleInfo.badge}
    </span>
  );
}

export default RoleBadge;
