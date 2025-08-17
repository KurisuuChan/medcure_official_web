/**
 * MedCure Authentication Service
 * Handles user authentication, session management, and user profile operations
 */

import { supabase } from "../lib/supabase";
import { shouldUseMockAPI } from "../utils/backendStatus";

// Mock user data for development
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
];

// Default session duration (24 hours)
const SESSION_DURATION = 24 * 60 * 60 * 1000;

/**
 * Authenticate user with username/email and password
 */
export async function authenticateUser(credentials) {
  if (shouldUseMockAPI()) {
    // Mock authentication
    return new Promise((resolve) => {
      setTimeout(() => {
        const { username, password } = credentials;

        // Simple mock authentication
        if (
          (username === "admin" && password === "admin123") ||
          (username === "admin@medcure.com" && password === "admin123") ||
          (username === "pharmacist" && password === "pharma123") ||
          (username === "pharmacist@medcure.com" && password === "pharma123")
        ) {
          const user =
            mockUsers.find(
              (u) => u.username === username || u.email === username
            ) || mockUsers[0];

          const sessionToken = `mock_session_${user.id}_${Date.now()}`;
          const expiresAt = new Date(Date.now() + SESSION_DURATION);

          resolve({
            success: true,
            data: {
              user: {
                ...user,
                lastLogin: new Date().toISOString(),
              },
              session: {
                token: sessionToken,
                expiresAt: expiresAt.toISOString(),
                type: "mock",
              },
            },
          });
        } else {
          resolve({
            success: false,
            error: "Invalid username or password",
          });
        }
      }, 1000); // Simulate network delay
    });
  }

  try {
    // Backend authentication using Supabase
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .or(
        `username.eq.${credentials.username},email.eq.${credentials.username}`
      )
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "Invalid username or password",
      };
    }

    // In a real app, you'd verify the password hash here
    // For now, we'll use a simple check
    if (credentials.password !== "temp_password") {
      return {
        success: false,
        error: "Invalid username or password",
      };
    }

    // Update last login
    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", data.id);

    const sessionToken = `session_${data.id}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    return {
      success: true,
      data: {
        user: data,
        session: {
          token: sessionToken,
          expiresAt: expiresAt.toISOString(),
          type: "backend",
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Authentication failed",
    };
  }
}

/**
 * Get current user session
 */
export async function getCurrentSession() {
  if (shouldUseMockAPI()) {
    // Check localStorage for mock session
    const storedSession = localStorage.getItem("medcure_session");
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        const now = new Date();
        const expiresAt = new Date(session.expiresAt);

        if (now < expiresAt) {
          const userId = session.token.split("_")[2];
          const user =
            mockUsers.find((u) => u.id === parseInt(userId)) || mockUsers[0];

          return {
            success: true,
            data: {
              user,
              session,
            },
          };
        } else {
          // Session expired
          localStorage.removeItem("medcure_session");
          localStorage.removeItem("medcure_user");
        }
      } catch (error) {
        console.error("Failed to parse stored session:", error);
        localStorage.removeItem("medcure_session");
        localStorage.removeItem("medcure_user");
      }
    }

    return {
      success: false,
      error: "No valid session found",
    };
  }

  try {
    // Backend session validation
    const storedSession = localStorage.getItem("medcure_session");
    if (!storedSession) {
      return {
        success: false,
        error: "No session found",
      };
    }

    const session = JSON.parse(storedSession);
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);

    if (now >= expiresAt) {
      localStorage.removeItem("medcure_session");
      localStorage.removeItem("medcure_user");
      return {
        success: false,
        error: "Session expired",
      };
    }

    // Get user data from backend
    const userId = session.token.split("_")[1];
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "Invalid session",
      };
    }

    return {
      success: true,
      data: {
        user: data,
        session,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Session validation failed",
    };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, updates) {
  if (shouldUseMockAPI()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const userIndex = mockUsers.findIndex((u) => u.id === userId);
        if (userIndex !== -1) {
          mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates };
          resolve({
            success: true,
            data: mockUsers[userIndex],
          });
        } else {
          resolve({
            success: false,
            error: "User not found",
          });
        }
      }, 500);
    });
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
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Profile update failed",
    };
  }
}

/**
 * Logout user
 */
export async function logoutUser() {
  if (shouldUseMockAPI()) {
    localStorage.removeItem("medcure_session");
    localStorage.removeItem("medcure_user");
    return {
      success: true,
      message: "Logged out successfully",
    };
  }

  try {
    // Clear local storage
    localStorage.removeItem("medcure_session");
    localStorage.removeItem("medcure_user");

    // In a real backend, you might want to invalidate the session server-side
    return {
      success: true,
      message: "Logged out successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Logout failed",
    };
  }
}

/**
 * Change user password
 */
export async function changePassword(userId, oldPassword, newPassword) {
  if (shouldUseMockAPI()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock password change
        resolve({
          success: true,
          message: "Password changed successfully",
        });
      }, 1000);
    });
  }

  try {
    // In a real implementation, you'd verify the old password and hash the new one
    const { error } = await supabase
      .from("users")
      .update({
        password_hash: newPassword, // This should be properly hashed
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Password changed successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Password change failed",
    };
  }
}

/**
 * Get user permissions
 */
export async function getUserPermissions(userId) {
  if (shouldUseMockAPI()) {
    const user = mockUsers.find((u) => u.id === userId);
    return {
      success: true,
      data: user?.permissions || [],
    };
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("permissions")
      .eq("id", userId)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data.permissions || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to get permissions",
    };
  }
}

/**
 * Refresh session token
 */
export async function refreshSession() {
  const currentSession = await getCurrentSession();

  if (!currentSession.success) {
    return currentSession;
  }

  // Extend session expiry
  const newExpiresAt = new Date(Date.now() + SESSION_DURATION);
  const updatedSession = {
    ...currentSession.data.session,
    expiresAt: newExpiresAt.toISOString(),
  };

  localStorage.setItem("medcure_session", JSON.stringify(updatedSession));

  return {
    success: true,
    data: {
      user: currentSession.data.user,
      session: updatedSession,
    },
  };
}

export default {
  authenticateUser,
  getCurrentSession,
  updateUserProfile,
  logoutUser,
  changePassword,
  getUserPermissions,
  refreshSession,
};
