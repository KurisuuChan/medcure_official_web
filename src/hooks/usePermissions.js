import { hasPermission } from "../services/roleService";

/**
 * Get current user from localStorage (development mock)
 */
function getCurrentUser() {
  try {
    const storedUser = localStorage.getItem("medcure_user");
    if (storedUser) {
      return JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("Failed to get current user:", error);
  }

  // Return mock admin user for development
  return {
    id: 1,
    role: "administrator",
    permissions: ["admin:all"],
  };
}

/**
 * Hook to check if current user has a specific permission
 * @param {string} permission - Permission to check
 * @returns {boolean} Whether user has the permission
 */
export function usePermission(permission) {
  const currentUser = getCurrentUser();
  return hasPermission(currentUser, permission);
}

/**
 * Permission-based navigation helper
 * Filters navigation items based on user permissions
 */
export function filterNavigationByPermissions(
  navigationItems,
  userPermissions
) {
  return navigationItems.filter((item) => {
    if (!item.requiredPermission) {
      return true; // No permission required
    }

    return userPermissions.some((permission) =>
      hasPermission({ permissions: [permission] }, item.requiredPermission)
    );
  });
}
