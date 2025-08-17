/**
 * MedCure Role-Based Access Control Service
 * Manages user roles, permissions, and access control for pharmacy operations
 */

// Define all available permissions in the system
export const PERMISSIONS = {
  // User Management
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  USER_MANAGE_ROLES: "user:manage_roles",

  // Inventory Management
  INVENTORY_CREATE: "inventory:create",
  INVENTORY_READ: "inventory:read",
  INVENTORY_UPDATE: "inventory:update",
  INVENTORY_DELETE: "inventory:delete",
  INVENTORY_MANAGE: "inventory:manage",
  INVENTORY_BULK_OPERATIONS: "inventory:bulk_operations",

  // Sales & POS
  POS_ACCESS: "pos:access",
  POS_PROCESS_SALES: "pos:process_sales",
  POS_REFUNDS: "pos:refunds",
  POS_VOID_TRANSACTIONS: "pos:void_transactions",
  POS_CASH_DRAWER: "pos:cash_drawer",

  // Financial Management
  FINANCE_READ: "finance:read",
  FINANCE_REPORTS: "finance:reports",
  FINANCE_EXPORT: "finance:export",
  FINANCE_ANALYTICS: "finance:analytics",

  // Reports & Analytics
  REPORTS_VIEW: "reports:view",
  REPORTS_GENERATE: "reports:generate",
  REPORTS_EXPORT: "reports:export",
  REPORTS_ADVANCED: "reports:advanced",

  // System Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_UPDATE: "settings:update",
  SETTINGS_SYSTEM: "settings:system",

  // Customer Management
  CUSTOMER_CREATE: "customer:create",
  CUSTOMER_READ: "customer:read",
  CUSTOMER_UPDATE: "customer:update",
  CUSTOMER_DELETE: "customer:delete",

  // Prescription Management
  PRESCRIPTION_VERIFY: "prescription:verify",
  PRESCRIPTION_DISPENSE: "prescription:dispense",
  PRESCRIPTION_HISTORY: "prescription:history",

  // Admin Functions
  ADMIN_ALL: "admin:all",
  ADMIN_AUDIT: "admin:audit",
  ADMIN_BACKUP: "admin:backup",
  ADMIN_SYSTEM_CONFIG: "admin:system_config",
};

// Define role hierarchy and default permissions
export const ROLES = {
  ADMINISTRATOR: {
    name: "administrator",
    displayName: "Administrator",
    description: "Full system access with all permissions",
    color: "#dc2626", // red-600
    permissions: [PERMISSIONS.ADMIN_ALL], // Admin gets all permissions automatically
    hierarchy: 5,
  },

  PHARMACY_MANAGER: {
    name: "pharmacy_manager",
    displayName: "Pharmacy Manager",
    description: "Manage pharmacy operations, staff, and reports",
    color: "#7c3aed", // violet-600
    permissions: [
      // User Management (limited)
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.USER_CREATE,

      // Full Inventory Access
      PERMISSIONS.INVENTORY_CREATE,
      PERMISSIONS.INVENTORY_READ,
      PERMISSIONS.INVENTORY_UPDATE,
      PERMISSIONS.INVENTORY_DELETE,
      PERMISSIONS.INVENTORY_MANAGE,
      PERMISSIONS.INVENTORY_BULK_OPERATIONS,

      // POS Access
      PERMISSIONS.POS_ACCESS,
      PERMISSIONS.POS_PROCESS_SALES,
      PERMISSIONS.POS_REFUNDS,
      PERMISSIONS.POS_VOID_TRANSACTIONS,
      PERMISSIONS.POS_CASH_DRAWER,

      // Financial Reports
      PERMISSIONS.FINANCE_READ,
      PERMISSIONS.FINANCE_REPORTS,
      PERMISSIONS.FINANCE_EXPORT,
      PERMISSIONS.FINANCE_ANALYTICS,

      // Reports
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_GENERATE,
      PERMISSIONS.REPORTS_EXPORT,
      PERMISSIONS.REPORTS_ADVANCED,

      // Settings
      PERMISSIONS.SETTINGS_READ,
      PERMISSIONS.SETTINGS_UPDATE,

      // Customer Management
      PERMISSIONS.CUSTOMER_CREATE,
      PERMISSIONS.CUSTOMER_READ,
      PERMISSIONS.CUSTOMER_UPDATE,
      PERMISSIONS.CUSTOMER_DELETE,

      // Prescription Management
      PERMISSIONS.PRESCRIPTION_VERIFY,
      PERMISSIONS.PRESCRIPTION_DISPENSE,
      PERMISSIONS.PRESCRIPTION_HISTORY,
    ],
    hierarchy: 4,
  },

  PHARMACIST: {
    name: "pharmacist",
    displayName: "Licensed Pharmacist",
    description:
      "Verify prescriptions, manage medications, and provide consultations",
    color: "#059669", // emerald-600
    permissions: [
      // Inventory Management
      PERMISSIONS.INVENTORY_CREATE,
      PERMISSIONS.INVENTORY_READ,
      PERMISSIONS.INVENTORY_UPDATE,
      PERMISSIONS.INVENTORY_MANAGE,

      // POS Access
      PERMISSIONS.POS_ACCESS,
      PERMISSIONS.POS_PROCESS_SALES,
      PERMISSIONS.POS_REFUNDS,

      // Reports (View Only)
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.REPORTS_GENERATE,

      // Settings (Read Only)
      PERMISSIONS.SETTINGS_READ,

      // Customer Management
      PERMISSIONS.CUSTOMER_CREATE,
      PERMISSIONS.CUSTOMER_READ,
      PERMISSIONS.CUSTOMER_UPDATE,

      // Full Prescription Access
      PERMISSIONS.PRESCRIPTION_VERIFY,
      PERMISSIONS.PRESCRIPTION_DISPENSE,
      PERMISSIONS.PRESCRIPTION_HISTORY,

      // Financial (Limited)
      PERMISSIONS.FINANCE_READ,
    ],
    hierarchy: 3,
  },

  PHARMACY_ASSISTANT: {
    name: "pharmacy_assistant",
    displayName: "Pharmacy Assistant",
    description: "Assist with inventory, sales, and customer service",
    color: "#2563eb", // blue-600
    permissions: [
      // Limited Inventory
      PERMISSIONS.INVENTORY_READ,
      PERMISSIONS.INVENTORY_UPDATE,

      // POS Access
      PERMISSIONS.POS_ACCESS,
      PERMISSIONS.POS_PROCESS_SALES,

      // Customer Management
      PERMISSIONS.CUSTOMER_READ,
      PERMISSIONS.CUSTOMER_UPDATE,

      // Basic Reports
      PERMISSIONS.REPORTS_VIEW,

      // Settings (Read Only)
      PERMISSIONS.SETTINGS_READ,
    ],
    hierarchy: 2,
  },

  CASHIER: {
    name: "cashier",
    displayName: "Cashier",
    description: "Process sales and handle customer transactions",
    color: "#ea580c", // orange-600
    permissions: [
      // POS Access Only
      PERMISSIONS.POS_ACCESS,
      PERMISSIONS.POS_PROCESS_SALES,

      // Customer Info (Read Only)
      PERMISSIONS.CUSTOMER_READ,

      // Basic Inventory (Read Only)
      PERMISSIONS.INVENTORY_READ,

      // Settings (Read Only)
      PERMISSIONS.SETTINGS_READ,
    ],
    hierarchy: 1,
  },

  VIEWER: {
    name: "viewer",
    displayName: "Viewer",
    description: "Read-only access to reports and basic information",
    color: "#6b7280", // gray-500
    permissions: [
      // Read Only Access
      PERMISSIONS.INVENTORY_READ,
      PERMISSIONS.CUSTOMER_READ,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.SETTINGS_READ,
      PERMISSIONS.FINANCE_READ,
    ],
    hierarchy: 0,
  },
};

/**
 * Check if a user has a specific permission
 * @param {Object} user - User object with role and permissions
 * @param {string} permission - Permission to check
 * @returns {boolean} Whether user has the permission
 */
export function hasPermission(user, permission) {
  if (!user || !user.role) return false;

  // Admin has all permissions
  if (
    user.role === "administrator" ||
    (user.permissions && user.permissions.includes(PERMISSIONS.ADMIN_ALL))
  ) {
    return true;
  }

  // Check role-based permissions
  const roleConfig = Object.values(ROLES).find(
    (role) => role.name === user.role
  );
  if (roleConfig && roleConfig.permissions.includes(permission)) {
    return true;
  }

  // Check user-specific permissions
  if (user.permissions && user.permissions.includes(permission)) {
    return true;
  }

  return false;
}

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object
 * @param {Array} permissions - Array of permissions to check
 * @returns {boolean} Whether user has any of the permissions
 */
export function hasAnyPermission(user, permissions) {
  return permissions.some((permission) => hasPermission(user, permission));
}

/**
 * Check if user has all of the specified permissions
 * @param {Object} user - User object
 * @param {Array} permissions - Array of permissions to check
 * @returns {boolean} Whether user has all permissions
 */
export function hasAllPermissions(user, permissions) {
  return permissions.every((permission) => hasPermission(user, permission));
}

/**
 * Get user's role information
 * @param {Object} user - User object
 * @returns {Object} Role configuration
 */
export function getUserRole(user) {
  if (!user || !user.role) return null;

  return Object.values(ROLES).find((role) => role.name === user.role) || null;
}

/**
 * Get all available roles
 * @returns {Array} Array of role configurations
 */
export function getAllRoles() {
  return Object.values(ROLES);
}

/**
 * Get roles that can be assigned by current user
 * @param {Object} currentUser - Current user object
 * @returns {Array} Array of assignable roles
 */
export function getAssignableRoles(currentUser) {
  if (!currentUser) return [];

  const currentRole = getUserRole(currentUser);
  if (!currentRole) return [];

  // Admin can assign any role except admin (for security)
  if (hasPermission(currentUser, PERMISSIONS.ADMIN_ALL)) {
    return Object.values(ROLES).filter((role) => role.name !== "administrator");
  }

  // Managers can assign roles below their hierarchy
  if (hasPermission(currentUser, PERMISSIONS.USER_MANAGE_ROLES)) {
    return Object.values(ROLES).filter(
      (role) => role.hierarchy < currentRole.hierarchy
    );
  }

  return [];
}

/**
 * Check if user can perform action on target user
 * @param {Object} currentUser - Current user performing action
 * @param {Object} targetUser - Target user for the action
 * @param {string} action - Action to perform
 * @returns {boolean} Whether action is allowed
 */
export function canPerformUserAction(currentUser, targetUser, action) {
  if (!currentUser || !targetUser) return false;

  // Admin can do anything except modify other admins
  if (hasPermission(currentUser, PERMISSIONS.ADMIN_ALL)) {
    if (targetUser.role === "administrator" && action === "delete") {
      return false; // Can't delete admin accounts
    }
    return true;
  }

  const currentRole = getUserRole(currentUser);
  const targetRole = getUserRole(targetUser);

  if (!currentRole || !targetRole) return false;

  // Can only manage users with lower hierarchy
  if (currentRole.hierarchy <= targetRole.hierarchy) return false;

  // Check specific action permissions
  switch (action) {
    case "create":
      return hasPermission(currentUser, PERMISSIONS.USER_CREATE);
    case "read":
      return hasPermission(currentUser, PERMISSIONS.USER_READ);
    case "update":
      return hasPermission(currentUser, PERMISSIONS.USER_UPDATE);
    case "delete":
      return hasPermission(currentUser, PERMISSIONS.USER_DELETE);
    default:
      return false;
  }
}

/**
 * Get user's permissions as array
 * @param {Object} user - User object
 * @returns {Array} Array of permission strings
 */
export function getUserPermissions(user) {
  if (!user) return [];

  // Admin gets all permissions
  if (
    user.role === "administrator" ||
    (user.permissions && user.permissions.includes(PERMISSIONS.ADMIN_ALL))
  ) {
    return Object.values(PERMISSIONS);
  }

  const roleConfig = getUserRole(user);
  const rolePermissions = roleConfig ? roleConfig.permissions : [];
  const userPermissions = user.permissions || [];

  // Combine role permissions with user-specific permissions
  return [...new Set([...rolePermissions, ...userPermissions])];
}

/**
 * Permission groups for UI organization
 */
export const PERMISSION_GROUPS = {
  "User Management": [
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_MANAGE_ROLES,
  ],
  Inventory: [
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.INVENTORY_DELETE,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.INVENTORY_BULK_OPERATIONS,
  ],
  "Point of Sale": [
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_PROCESS_SALES,
    PERMISSIONS.POS_REFUNDS,
    PERMISSIONS.POS_VOID_TRANSACTIONS,
    PERMISSIONS.POS_CASH_DRAWER,
  ],
  Financial: [
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.FINANCE_REPORTS,
    PERMISSIONS.FINANCE_EXPORT,
    PERMISSIONS.FINANCE_ANALYTICS,
  ],
  Reports: [
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.REPORTS_ADVANCED,
  ],
  Settings: [
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.SETTINGS_SYSTEM,
  ],
  Customers: [
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.CUSTOMER_DELETE,
  ],
  Prescriptions: [
    PERMISSIONS.PRESCRIPTION_VERIFY,
    PERMISSIONS.PRESCRIPTION_DISPENSE,
    PERMISSIONS.PRESCRIPTION_HISTORY,
  ],
  Administration: [
    PERMISSIONS.ADMIN_ALL,
    PERMISSIONS.ADMIN_AUDIT,
    PERMISSIONS.ADMIN_BACKUP,
    PERMISSIONS.ADMIN_SYSTEM_CONFIG,
  ],
};

export default {
  PERMISSIONS,
  ROLES,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserRole,
  getAllRoles,
  getAssignableRoles,
  canPerformUserAction,
  getUserPermissions,
  PERMISSION_GROUPS,
};
