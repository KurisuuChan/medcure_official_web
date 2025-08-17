/**
 * MedCure User Management Service
 * Handles admin and employee account management with role-based access control
 */

import { supabase, TABLES } from "../lib/supabase.js";
import { shouldUseMockAPI } from "./backendService.js";
import {
  ROLES,
  hasPermission,
  PERMISSIONS,
  canPerformUserAction,
} from "./roleService.js";

// Mock user database for development
let mockUserDatabase = [
  {
    id: 1,
    username: "admin",
    email: "admin@medcure.com",
    firstName: "Admin",
    lastName: "User",
    role: "administrator",
    permissions: ["admin:all"],
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: "2024-01-01T00:00:00Z",
    createdBy: null,
    profileAvatar: null,
    jobTitle: "System Administrator",
    phone: "+63 912 345 6789",
    department: "Administration",
    employeeId: "EMP001",
    dateHired: "2024-01-01",
    salary: 50000,
    emergencyContact: {
      name: "Emergency Contact",
      phone: "+63 912 345 6700",
      relationship: "Spouse",
    },
    preferences: {
      theme: "light",
      notifications: true,
      language: "en",
    },
    address: {
      street: "123 Admin Street",
      city: "Manila",
      province: "Metro Manila",
      zipCode: "1000",
    },
  },
  {
    id: 2,
    username: "pharmacist01",
    email: "maria.santos@medcure.com",
    firstName: "Maria",
    lastName: "Santos",
    role: "pharmacist",
    permissions: [],
    isActive: true,
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
    createdAt: "2024-02-01T00:00:00Z",
    createdBy: 1,
    profileAvatar: null,
    jobTitle: "Lead Pharmacist",
    phone: "+63 912 345 6788",
    department: "Pharmacy",
    employeeId: "EMP002",
    dateHired: "2024-02-01",
    salary: 40000,
    licenseNumber: "PH-12345",
    emergencyContact: {
      name: "Juan Santos",
      phone: "+63 912 345 6701",
      relationship: "Husband",
    },
    preferences: {
      theme: "light",
      notifications: true,
      language: "en",
    },
    address: {
      street: "456 Pharmacy Ave",
      city: "Quezon City",
      province: "Metro Manila",
      zipCode: "1100",
    },
  },
  {
    id: 3,
    username: "assistant01",
    email: "john.cruz@medcure.com",
    firstName: "John",
    lastName: "Cruz",
    role: "pharmacy_assistant",
    permissions: [],
    isActive: true,
    lastLogin: new Date(Date.now() - 172800000).toISOString(),
    createdAt: "2024-03-01T00:00:00Z",
    createdBy: 1,
    profileAvatar: null,
    jobTitle: "Pharmacy Assistant",
    phone: "+63 912 345 6787",
    department: "Pharmacy",
    employeeId: "EMP003",
    dateHired: "2024-03-01",
    salary: 25000,
    emergencyContact: {
      name: "Ana Cruz",
      phone: "+63 912 345 6702",
      relationship: "Mother",
    },
    preferences: {
      theme: "light",
      notifications: false,
      language: "en",
    },
    address: {
      street: "789 Assistant Road",
      city: "Makati",
      province: "Metro Manila",
      zipCode: "1200",
    },
  },
  {
    id: 4,
    username: "cashier01",
    email: "ana.reyes@medcure.com",
    firstName: "Ana",
    lastName: "Reyes",
    role: "cashier",
    permissions: [],
    isActive: true,
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
    createdAt: "2024-04-01T00:00:00Z",
    createdBy: 2,
    profileAvatar: null,
    jobTitle: "Cashier",
    phone: "+63 912 345 6786",
    department: "Sales",
    employeeId: "EMP004",
    dateHired: "2024-04-01",
    salary: 22000,
    emergencyContact: {
      name: "Pedro Reyes",
      phone: "+63 912 345 6703",
      relationship: "Father",
    },
    preferences: {
      theme: "dark",
      notifications: true,
      language: "en",
    },
    address: {
      street: "321 Cashier Lane",
      city: "Pasig",
      province: "Metro Manila",
      zipCode: "1600",
    },
  },
];

/**
 * Get all users (admin function)
 * @param {Object} currentUser - Current user making the request
 * @returns {Promise<Object>} Users list
 */
export async function getAllUsers(currentUser) {
  if (!hasPermission(currentUser, PERMISSIONS.USER_READ)) {
    return {
      data: null,
      error: "Insufficient permissions to view users",
      success: false,
    };
  }

  if (await shouldUseMockAPI()) {
    console.log("👥 Getting users list - using mock mode");
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Filter users based on permissions
    let filteredUsers = mockUserDatabase.filter((user) => user.isActive);

    // Non-admins can only see users they can manage
    if (!hasPermission(currentUser, PERMISSIONS.ADMIN_ALL)) {
      filteredUsers = filteredUsers.filter((user) =>
        canPerformUserAction(currentUser, user, "read")
      );
    }

    return {
      data: filteredUsers.map((user) => ({
        ...user,
        password: undefined, // Never send passwords
      })),
      error: null,
      success: true,
    };
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("isActive", true)
      .order("createdAt", { ascending: false });

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data,
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Get users error:", error);
    return {
      data: null,
      error: error.message,
      success: false,
    };
  }
}

/**
 * Create new user account
 * @param {Object} currentUser - Current user creating the account
 * @param {Object} userData - New user data
 * @returns {Promise<Object>} Creation result
 */
export async function createUser(currentUser, userData) {
  if (!hasPermission(currentUser, PERMISSIONS.USER_CREATE)) {
    return {
      data: null,
      error: "Insufficient permissions to create users",
      success: false,
    };
  }

  const {
    email,
    firstName,
    lastName,
    role,
    phone,
    jobTitle,
    department,
    employeeId,
    salary,
    dateHired,
    licenseNumber,
    address,
    emergencyContact,
  } = userData;

  if (await shouldUseMockAPI()) {
    console.log("👥 Creating new user - using mock mode");
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if user exists
    const existingUser = mockUserDatabase.find(
      (u) => u.email === email || u.username === userData.username
    );
    if (existingUser) {
      return {
        data: null,
        error: "User with this email already exists",
        success: false,
      };
    }

    // Generate username from email
    const username = email.split("@")[0];

    const newUser = {
      id: Math.max(...mockUserDatabase.map((u) => u.id)) + 1,
      username,
      email,
      firstName,
      lastName,
      role,
      permissions: [],
      isActive: true,
      lastLogin: null,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
      profileAvatar: null,
      jobTitle: jobTitle || "",
      phone: phone || "",
      department: department || "",
      employeeId:
        employeeId ||
        `EMP${String(mockUserDatabase.length + 1).padStart(3, "0")}`,
      dateHired: dateHired || new Date().toISOString().split("T")[0],
      salary: salary || 0,
      licenseNumber: licenseNumber || null,
      emergencyContact: emergencyContact || {},
      preferences: {
        theme: "light",
        notifications: true,
        language: "en",
      },
      address: address || {},
    };

    mockUserDatabase.push(newUser);

    return {
      data: { ...newUser, password: undefined },
      error: null,
      success: true,
    };
  }

  try {
    // Create auth user first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: userData.temporaryPassword || "TempPassword123!",
    });

    if (authError) {
      return {
        data: null,
        error: authError.message,
        success: false,
      };
    }

    // Create user profile
    const userProfile = {
      auth_id: authData.user.id,
      email,
      username: email.split("@")[0],
      firstName,
      lastName,
      role,
      permissions: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
      jobTitle,
      phone,
      department,
      employeeId,
      salary,
      dateHired,
      licenseNumber,
      emergencyContact,
      address,
    };

    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .insert([userProfile])
      .select()
      .single();

    if (profileError) {
      return {
        data: null,
        error: profileError.message,
        success: false,
      };
    }

    return {
      data: profileData,
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Create user error:", error);
    return {
      data: null,
      error: error.message,
      success: false,
    };
  }
}

/**
 * Update user account
 * @param {Object} currentUser - Current user making the update
 * @param {number} userId - ID of user to update
 * @param {Object} updates - Update data
 * @returns {Promise<Object>} Update result
 */
export async function updateUser(currentUser, userId, updates) {
  if (await shouldUseMockAPI()) {
    console.log("👥 Updating user - using mock mode");
    await new Promise((resolve) => setTimeout(resolve, 300));

    const userIndex = mockUserDatabase.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return {
        data: null,
        error: "User not found",
        success: false,
      };
    }

    const targetUser = mockUserDatabase[userIndex];

    // Check permissions
    if (!canPerformUserAction(currentUser, targetUser, "update")) {
      return {
        data: null,
        error: "Insufficient permissions to update this user",
        success: false,
      };
    }

    // Apply updates
    mockUserDatabase[userIndex] = {
      ...mockUserDatabase[userIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id,
    };

    return {
      data: { ...mockUserDatabase[userIndex], password: undefined },
      error: null,
      success: true,
    };
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .update({
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.id,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data,
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Update user error:", error);
    return {
      data: null,
      error: error.message,
      success: false,
    };
  }
}

/**
 * Deactivate user account
 * @param {Object} currentUser - Current user making the request
 * @param {number} userId - ID of user to deactivate
 * @returns {Promise<Object>} Deactivation result
 */
export async function deactivateUser(currentUser, userId) {
  if (await shouldUseMockAPI()) {
    console.log("👥 Deactivating user - using mock mode");
    await new Promise((resolve) => setTimeout(resolve, 300));

    const userIndex = mockUserDatabase.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return {
        data: null,
        error: "User not found",
        success: false,
      };
    }

    const targetUser = mockUserDatabase[userIndex];

    // Check permissions
    if (!canPerformUserAction(currentUser, targetUser, "delete")) {
      return {
        data: null,
        error: "Insufficient permissions to deactivate this user",
        success: false,
      };
    }

    // Can't deactivate yourself
    if (userId === currentUser.id) {
      return {
        data: null,
        error: "Cannot deactivate your own account",
        success: false,
      };
    }

    mockUserDatabase[userIndex].isActive = false;
    mockUserDatabase[userIndex].deactivatedAt = new Date().toISOString();
    mockUserDatabase[userIndex].deactivatedBy = currentUser.id;

    return {
      data: { message: "User deactivated successfully" },
      error: null,
      success: true,
    };
  }

  try {
    const { error } = await supabase
      .from("users")
      .update({
        isActive: false,
        deactivatedAt: new Date().toISOString(),
        deactivatedBy: currentUser.id,
      })
      .eq("id", userId);

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: { message: "User deactivated successfully" },
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Deactivate user error:", error);
    return {
      data: null,
      error: error.message,
      success: false,
    };
  }
}

/**
 * Reset user password (admin function)
 * @param {Object} currentUser - Current user making the request
 * @param {number} userId - ID of user whose password to reset
 * @returns {Promise<Object>} Password reset result
 */
export async function resetUserPassword(currentUser, userId) {
  if (!hasPermission(currentUser, PERMISSIONS.USER_UPDATE)) {
    return {
      data: null,
      error: "Insufficient permissions to reset passwords",
      success: false,
    };
  }

  if (await shouldUseMockAPI()) {
    console.log("👥 Resetting user password - using mock mode");
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = mockUserDatabase.find((u) => u.id === userId);
    if (!user) {
      return {
        data: null,
        error: "User not found",
        success: false,
      };
    }

    // Generate temporary password
    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;

    return {
      data: {
        message: "Password reset successfully",
        temporaryPassword: tempPassword,
      },
      error: null,
      success: true,
    };
  }

  try {
    // In production, this would send a password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(
      `user_${userId}@medcure.com`
    );

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: { message: "Password reset email sent" },
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Reset password error:", error);
    return {
      data: null,
      error: error.message,
      success: false,
    };
  }
}

/**
 * Get user statistics for admin dashboard
 * @param {Object} currentUser - Current user making the request
 * @returns {Promise<Object>} User statistics
 */
export async function getUserStats(currentUser) {
  if (!hasPermission(currentUser, PERMISSIONS.USER_READ)) {
    return {
      data: null,
      error: "Insufficient permissions",
      success: false,
    };
  }

  if (await shouldUseMockAPI()) {
    console.log("👥 Getting user statistics - using mock mode");
    await new Promise((resolve) => setTimeout(resolve, 200));

    const activeUsers = mockUserDatabase.filter((u) => u.isActive);
    const roleStats = {};

    Object.values(ROLES).forEach((role) => {
      roleStats[role.name] = activeUsers.filter(
        (u) => u.role === role.name
      ).length;
    });

    return {
      data: {
        total: activeUsers.length,
        active: activeUsers.length,
        inactive: mockUserDatabase.length - activeUsers.length,
        byRole: roleStats,
        recentLogins: activeUsers.filter(
          (u) =>
            u.lastLogin &&
            new Date(u.lastLogin) >
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
      },
      error: null,
      success: true,
    };
  }

  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("role, isActive, lastLogin");

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    const activeUsers = users.filter((u) => u.isActive);
    const roleStats = {};

    Object.values(ROLES).forEach((role) => {
      roleStats[role.name] = activeUsers.filter(
        (u) => u.role === role.name
      ).length;
    });

    return {
      data: {
        total: activeUsers.length,
        active: activeUsers.length,
        inactive: users.length - activeUsers.length,
        byRole: roleStats,
        recentLogins: activeUsers.filter(
          (u) =>
            u.lastLogin &&
            new Date(u.lastLogin) >
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
      },
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Get user stats error:", error);
    return {
      data: null,
      error: error.message,
      success: false,
    };
  }
}

export default {
  getAllUsers,
  createUser,
  updateUser,
  deactivateUser,
  resetUserPassword,
  getUserStats,
};
