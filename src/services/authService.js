/**
 * MedCure Authentication Service
 * Handles user authentication, session management, and user profile operations with full backend integration
 */

import { supabase, TABLES } from "../lib/supabase.js";
import { shouldUseMockAPI } from "./backendService.js";

// Mock user data for development/fallback
const mockUsers = [
  {
    id: 1,
    username: "admin",
    email: "admin@medcure.com",
    firstName: "Admin",
    lastName: "User",
    role: "administrator",
    permissions: ["all"],
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: "2024-01-01T00:00:00Z",
    profileAvatar: null,
    jobTitle: "System Administrator",
    phone: "+63 912 345 6789",
    preferences: {
      theme: "light",
      notifications: true,
      language: "en",
    },
  },
  {
    id: 2,
    username: "pharmacist",
    email: "pharmacist@medcure.com",
    firstName: "Maria",
    lastName: "Santos",
    role: "pharmacist",
    permissions: ["inventory", "sales", "reports"],
    isActive: true,
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
    createdAt: "2024-02-01T00:00:00Z",
    profileAvatar: null,
    jobTitle: "Lead Pharmacist",
    phone: "+63 912 345 6788",
    preferences: {
      theme: "light",
      notifications: true,
      language: "en",
    },
  },
  {
    id: 3,
    username: "cashier",
    email: "cashier@medcure.com",
    firstName: "Juan",
    lastName: "Dela Cruz",
    role: "cashier",
    permissions: ["sales", "pos"],
    isActive: true,
    lastLogin: new Date(Date.now() - 172800000).toISOString(),
    createdAt: "2024-03-01T00:00:00Z",
    profileAvatar: null,
    jobTitle: "Cashier",
    phone: "+63 912 345 6787",
    preferences: {
      theme: "light",
      notifications: false,
      language: "en",
    },
  },
];

// Mock session storage
let currentSession = null;

/**
 * User login authentication
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.username - Username or email
 * @param {string} credentials.password - Password
 * @returns {Promise<Object>} Authentication result
 */
export async function login(credentials) {
  const { username, password } = credentials;

  if (await shouldUseMockAPI()) {
    console.log("🔐 Using mock authentication");
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

    // Mock authentication logic
    const user = mockUsers.find(
      (u) => u.username === username || u.email === username
    );

    if (!user) {
      return {
        data: null,
        error: "User not found",
        success: false,
      };
    }

    if (!user.isActive) {
      return {
        data: null,
        error: "Account is disabled",
        success: false,
      };
    }

    // In real implementation, verify password hash
    if (password !== "admin123") {
      return {
        data: null,
        error: "Invalid password",
        success: false,
      };
    }

    // Update last login
    user.lastLogin = new Date().toISOString();

    // Create session
    const session = {
      id: Date.now().toString(),
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
      refreshToken: `refresh_${Date.now()}`,
      accessToken: `access_${Date.now()}`,
    };

    currentSession = session;

    return {
      data: {
        user,
        session,
      },
      error: null,
      success: true,
    };
  }

  try {
    console.log("🔐 Authenticating with backend...");

    // Supabase authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username.includes("@") ? username : `${username}@medcure.com`,
      password: password,
    });

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    // Get user profile from our users table
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", data.user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      // Create basic profile if not exists
      const newProfile = {
        auth_id: data.user.id,
        email: data.user.email,
        username: data.user.email.split("@")[0],
        firstName: "User",
        lastName: "Profile",
        role: "user",
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const { data: createdProfile } = await supabase
        .from("users")
        .insert([newProfile])
        .select()
        .single();

      return {
        data: {
          user: createdProfile,
          session: data.session,
        },
        error: null,
        success: true,
      };
    }

    // Update last login
    await supabase
      .from("users")
      .update({ lastLogin: new Date().toISOString() })
      .eq("id", userProfile.id);

    return {
      data: {
        user: userProfile,
        session: data.session,
      },
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Login error:", error);
    return {
      data: null,
      error: error.message,
      success: false,
    };
  }
}

/**
 * User logout
 * @returns {Promise<Object>} Logout result
 */
export async function logout() {
  if (await shouldUseMockAPI()) {
    console.log("🔐 Mock logout");
    currentSession = null;
    return {
      error: null,
      success: true,
    };
  }

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        error: error.message,
        success: false,
      };
    }

    return {
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Logout error:", error);
    return {
      error: error.message,
      success: false,
    };
  }
}

/**
 * Get current user session
 * @returns {Promise<Object>} Current session data
 */
export async function getCurrentSession() {
  if (await shouldUseMockAPI()) {
    console.log("🔐 Getting mock session");

    if (!currentSession) {
      return {
        data: null,
        error: "No active session",
        success: false,
      };
    }

    // Check if session expired
    if (new Date() > new Date(currentSession.expiresAt)) {
      currentSession = null;
      return {
        data: null,
        error: "Session expired",
        success: false,
      };
    }

    const user = mockUsers.find((u) => u.id === currentSession.userId);

    return {
      data: {
        user,
        session: currentSession,
      },
      error: null,
      success: true,
    };
  }

  try {
    const { data: sessionData, error } = await supabase.auth.getSession();

    if (error || !sessionData.session) {
      return {
        data: null,
        error: error?.message || "No active session",
        success: false,
      };
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", sessionData.session.user.id)
      .single();

    if (profileError) {
      return {
        data: null,
        error: "User profile not found",
        success: false,
      };
    }

    return {
      data: {
        user: userProfile,
        session: sessionData.session,
      },
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Session check error:", error);
    return {
      data: null,
      error: error.message,
      success: false,
    };
  }
}

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Registration result
 */
export async function register(userData) {
  const {
    email,
    password,
    firstName,
    lastName,
    role = "user",
    permissions = [],
  } = userData;

  if (await shouldUseMockAPI()) {
    console.log("🔐 Mock user registration");
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if user exists
    const existingUser = mockUsers.find((u) => u.email === email);
    if (existingUser) {
      return {
        data: null,
        error: "User already exists",
        success: false,
      };
    }

    const newUser = {
      id: mockUsers.length + 1,
      username: email.split("@")[0],
      email,
      firstName,
      lastName,
      role,
      permissions,
      isActive: true,
      lastLogin: null,
      createdAt: new Date().toISOString(),
      profileAvatar: null,
      jobTitle: "",
      phone: "",
      preferences: {
        theme: "light",
        notifications: true,
        language: "en",
      },
    };

    mockUsers.push(newUser);

    return {
      data: newUser,
      error: null,
      success: true,
    };
  }

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
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
      permissions,
      isActive: true,
      createdAt: new Date().toISOString(),
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
    console.error("❌ Registration error:", error);
    return {
      data: null,
      error: error.message,
      success: false,
    };
  }
}

/**
 * Update user profile
 * @param {number} userId - User ID
 * @param {Object} updates - Profile updates
 * @returns {Promise<Object>} Update result
 */
export async function updateUserProfile(userId, updates) {
  if (await shouldUseMockAPI()) {
    console.log("🔐 Mock profile update");
    await new Promise((resolve) => setTimeout(resolve, 300));

    const userIndex = mockUsers.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return {
        data: null,
        error: "User not found",
        success: false,
      };
    }

    mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates };

    return {
      data: mockUsers[userIndex],
      error: null,
      success: true,
    };
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
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
    console.error("❌ Profile update error:", error);
    return {
      data: null,
      error: error.message,
      success: false,
    };
  }
}

/**
 * Change user password
 * @param {Object} passwordData - Password change data
 * @returns {Promise<Object>} Password change result
 */
export async function changePassword(passwordData) {
  const { currentPassword, newPassword } = passwordData;

  if (await shouldUseMockAPI()) {
    console.log("🔐 Mock password change");
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock password validation
    if (currentPassword !== "admin123") {
      return {
        error: "Current password is incorrect",
        success: false,
      };
    }

    return {
      error: null,
      success: true,
    };
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        error: error.message,
        success: false,
      };
    }

    return {
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Password change error:", error);
    return {
      error: error.message,
      success: false,
    };
  }
}

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<Object>} Reset request result
 */
export async function requestPasswordReset(email) {
  if (await shouldUseMockAPI()) {
    console.log("🔐 Mock password reset request");
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = mockUsers.find((u) => u.email === email);
    if (!user) {
      return {
        error: "User not found",
        success: false,
      };
    }

    return {
      error: null,
      success: true,
    };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return {
        error: error.message,
        success: false,
      };
    }

    return {
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Password reset error:", error);
    return {
      error: error.message,
      success: false,
    };
  }
}

/**
 * Get all users (admin only)
 * @returns {Promise<Object>} Users list
 */
export async function getAllUsers() {
  if (await shouldUseMockAPI()) {
    console.log("🔐 Getting mock users list");
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      data: mockUsers,
      error: null,
      success: true,
    };
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
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
 * Check user permissions
 * @param {Object} user - User object
 * @param {string} permission - Permission to check
 * @returns {boolean} Whether user has permission
 */
export function hasPermission(user, permission) {
  if (!user || !user.permissions) return false;

  // Admin role has all permissions
  if (user.role === "administrator" || user.permissions.includes("all")) {
    return true;
  }

  return user.permissions.includes(permission);
}

/**
 * Validate current session and refresh if needed
 * @returns {Promise<Object>} Session validation result
 */
export async function validateSession() {
  if (await shouldUseMockAPI()) {
    return getCurrentSession();
  }

  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    if (!data.session) {
      return {
        data: null,
        error: "No valid session",
        success: false,
      };
    }

    // Get updated user profile
    const { data: userProfile } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", data.session.user.id)
      .single();

    return {
      data: {
        user: userProfile,
        session: data.session,
      },
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Session validation error:", error);
    return {
      data: null,
      error: error.message,
      success: false,
    };
  }
}

// Export all functions
export default {
  login,
  logout,
  getCurrentSession,
  register,
  updateUserProfile,
  changePassword,
  requestPasswordReset,
  getAllUsers,
  hasPermission,
  validateSession,
};
