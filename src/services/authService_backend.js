/**
 * Authentication Service - Backend Integration
 * Handles user authentication, session management, and security
 */

import { supabase } from "../lib/supabase.js";
import { shouldUseMockAPI } from "./backendService.js";
import { PERMISSIONS } from "./roleService.js";

// Mock session storage for development
let mockSession = null;
let mockTokens = new Map();

/**
 * Sign in user with email and password
 */
export async function signIn(credentials) {
  if (shouldUseMockAPI()) {
    // Mock authentication for development
    const { email, password } = credentials;

    // Simple mock validation
    if (email === "admin@medcure.com" && password === "admin123") {
      mockSession = {
        user: {
          id: 1,
          email: "admin@medcure.com",
          firstName: "Admin",
          lastName: "User",
          role: "administrator",
          permissions: [PERMISSIONS.ADMIN_ALL],
          isActive: true,
          lastLogin: new Date().toISOString(),
        },
        accessToken: "mock_access_token_" + Date.now(),
        refreshToken: "mock_refresh_token_" + Date.now(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      return {
        success: true,
        data: mockSession,
      };
    }

    return {
      success: false,
      error: "Invalid credentials",
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Get user profile data
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", data.user.id)
      .single();

    if (profileError) {
      console.warn("Could not fetch user profile:", profileError);
    }

    return {
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          ...userProfile,
        },
        session: data.session,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  if (shouldUseMockAPI()) {
    mockSession = null;
    return {
      success: true,
      message: "Signed out successfully",
    };
  }

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Signed out successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get current user session
 */
export async function getCurrentSession() {
  if (shouldUseMockAPI()) {
    return {
      success: !!mockSession,
      data: mockSession,
    };
  }

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (!session) {
      return {
        success: false,
        error: "No active session",
      };
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    return {
      success: true,
      data: {
        user: {
          id: session.user.id,
          email: session.user.email,
          ...userProfile,
        },
        session,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Register new user
 */
export async function register(userData) {
  if (shouldUseMockAPI()) {
    // Mock registration for development
    const newUser = {
      id: Date.now(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || "cashier",
      permissions: [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: newUser,
    };
  }

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (authError) {
      return {
        success: false,
        error: authError.message,
      };
    }

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .insert([
        {
          user_id: authData.user.id,
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role,
          phone: userData.phone,
          job_title: userData.jobTitle,
          department: userData.department,
          employee_id: userData.employeeId,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (profileError) {
      return {
        success: false,
        error: profileError.message,
      };
    }

    return {
      success: true,
      data: {
        id: authData.user.id,
        email: authData.user.email,
        ...profileData,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Reset user password
 */
export async function resetPassword(email) {
  if (shouldUseMockAPI()) {
    return {
      success: true,
      message: "Password reset email sent (mock)",
    };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Password reset email sent",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword) {
  if (shouldUseMockAPI()) {
    return {
      success: true,
      message: "Password updated successfully (mock)",
    };
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Password updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verify user session token
 */
export async function verifyToken(token) {
  if (shouldUseMockAPI()) {
    return {
      success: mockTokens.has(token),
      data: mockTokens.get(token),
    };
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export default {
  signIn,
  signOut,
  getCurrentSession,
  register,
  resetPassword,
  updatePassword,
  verifyToken,
};
