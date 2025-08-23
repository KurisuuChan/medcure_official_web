/**
 * Role Profile Utilities
 * Manages role-based profile information for different user types
 */

/**
 * Get profile information for a specific role
 * @param {string} role - User role (admin, manager, cashier, pharmacist)
 * @returns {Object} Role profile information
 */
export function getRoleProfile(role) {
  const roleProfiles = getRoleProfiles();
  return roleProfiles[role] || roleProfiles.admin;
}

/**
 * Get all role profiles from localStorage
 * @returns {Object} All role profiles
 */
export function getRoleProfiles() {
  try {
    const stored = localStorage.getItem("medcure_role_profiles");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn("Failed to load role profiles:", error);
  }

  // Return default profiles if not found
  return {
    admin: {
      full_name: "Administrator",
      avatar_url: "",
      display_name: "System Admin",
      role_color: "#3b82f6", // blue
    },
    employee: {
      full_name: "Employee/Cashier",
      avatar_url: "",
      display_name: "Staff Member",
      role_color: "#f59e0b", // amber
    },
    // Legacy support - map old roles to employee
    cashier: {
      full_name: "Employee/Cashier",
      avatar_url: "",
      display_name: "Staff Member",
      role_color: "#f59e0b", // amber
    },
  };
}

/**
 * Get current user's role-based profile
 * @param {string} currentRole - Current user's role
 * @returns {Object} Current role profile merged with user profile
 */
export function getCurrentRoleProfile(currentRole) {
  try {
    // Get role-specific profile
    const roleProfile = getRoleProfile(currentRole);

    // Get current user profile
    const stored = localStorage.getItem("medcure_user_profile");
    let userProfile = {};
    if (stored && stored !== "[object Object]") {
      userProfile = JSON.parse(stored);
    }

    // Merge role profile with user profile, prioritizing role-specific data
    return {
      ...userProfile,
      full_name: roleProfile.full_name || userProfile.full_name || "",
      avatar_url: roleProfile.avatar_url || userProfile.avatar_url || "",
      display_name:
        roleProfile.display_name ||
        roleProfile.full_name ||
        userProfile.full_name ||
        "",
      role_color: roleProfile.role_color || "#3b82f6",
    };
  } catch (error) {
    console.warn("Failed to get current role profile:", error);
    return {
      full_name: currentRole || "User",
      avatar_url: "",
      display_name: currentRole || "User",
      role_color: "#3b82f6",
    };
  }
}

/**
 * Update role-specific profile data
 * @param {string} role - Role to update
 * @param {Object} profileData - Profile data to update
 */
export function updateRoleProfile(role, profileData) {
  try {
    const roleProfiles = getRoleProfiles();
    roleProfiles[role] = {
      ...roleProfiles[role],
      ...profileData,
    };

    localStorage.setItem("medcure_role_profiles", JSON.stringify(roleProfiles));

    // Dispatch update event
    window.dispatchEvent(
      new CustomEvent("roleProfileUpdated", {
        detail: { role, profile: roleProfiles[role] },
      })
    );

    return roleProfiles[role];
  } catch (error) {
    console.error("Failed to update role profile:", error);
    return null;
  }
}

/**
 * Get role display information
 * @param {string} role - User role
 * @returns {Object} Role display info with icon and color
 */
export function getRoleDisplayInfo(role) {
  const roleInfo = {
    admin: {
      label: "Administrator",
      icon: "🛡️",
      color: "#3b82f6",
      description: "System Administrator",
    },
    manager: {
      label: "Manager",
      icon: "👔",
      color: "#10b981",
      description: "Store Manager",
    },
    cashier: {
      label: "Cashier",
      icon: "💳",
      color: "#f59e0b",
      description: "Point of Sale Operator",
    },
    pharmacist: {
      label: "Pharmacist",
      icon: "💊",
      color: "#8b5cf6",
      description: "Licensed Pharmacist",
    },
    employee: {
      label: "Employee",
      icon: "👤",
      color: "#6b7280",
      description: "Staff Member",
    },
  };

  return roleInfo[role] || roleInfo.employee;
}
