import { supabase } from "../config/supabase.js";

/**
 * Authentication Service for MedCure Role-Based Access
 * Handles admin and employee/cashier login with role management
 */

// Current user state
let currentUser = null;
let userRole = null;

/**
 * Sign in user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Login result with user and role
 */
export async function signIn(email, password) {
  try {
    console.log("🔐 Attempting login for:", email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      console.error("❌ Login failed:", error);
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("No user data received");
    }

    console.log("✅ Login successful:", data.user.email);

    // Fetch user profile from database
    const userProfile = await fetchUserProfile(data.user.id);

    // Determine role from profile or fallback
    const role = userProfile?.role || getUserRole(data.user);

    // Store current user info
    currentUser = data.user;
    userRole = role;

    // Create complete user profile for the frontend
    const completeProfile = {
      id: data.user.id,
      email: data.user.email,
      role: role,
      full_name:
        userProfile?.full_name ||
        data.user.user_metadata?.full_name ||
        getDefaultName(role),
      display_name:
        userProfile?.full_name ||
        data.user.user_metadata?.full_name ||
        getDefaultName(role),
      avatar_url: userProfile?.profile_image_url || null,
      role_color: getRoleColor(role),
      login_time: new Date().toISOString(),
    };

    // Store in localStorage for persistence if in a browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(
        "medcure_current_user",
        JSON.stringify(completeProfile)
      );
      localStorage.setItem(
        "medcure_user_profile",
        JSON.stringify(completeProfile)
      );
    }

    console.log("👤 User profile loaded:", completeProfile);

    // Dispatch auth state change event for immediate UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent("authStateChanged", {
          detail: {
            user: data.user,
            role: role,
            profile: completeProfile,
            action: "SIGNED_IN",
            timestamp: new Date().toISOString(),
          },
        })
      );
    }

    return {
      success: true,
      user: data.user,
      role: role,
      profile: completeProfile,
      session: data.session,
    };
  } catch (error) {
    console.error("❌ Sign in error:", error);
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
  try {
    console.log("🚪 Signing out user...");

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("❌ Sign out error:", error);
    }

    // Clear local state
    currentUser = null;
    userRole = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem("medcure_current_user");
    }

    console.log("✅ User signed out successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Sign out failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current user session
 */
export async function getCurrentUser() {
  try {
    // First check if we have an active session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.log("ℹ️ No active session found");
      return null;
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.warn("⚠️ Get user error:", error);
      return null;
    }

    if (user) {
      currentUser = user;

      // Fetch user profile from database
      const userProfile = await fetchUserProfile(user.id);
      const role = userProfile?.role || getUserRole(user);
      userRole = role;

      // Create complete profile
      const completeProfile = {
        id: user.id,
        email: user.email,
        role: role,
        full_name:
          userProfile?.full_name ||
          user.user_metadata?.full_name ||
          getDefaultName(role),
        display_name:
          userProfile?.full_name ||
          user.user_metadata?.full_name ||
          getDefaultName(role),
        avatar_url: userProfile?.profile_image_url || null,
        role_color: getRoleColor(role),
      };

      // Update localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(
          "medcure_current_user",
          JSON.stringify(completeProfile)
        );
        localStorage.setItem(
          "medcure_user_profile",
          JSON.stringify(completeProfile)
        );
      }

      return {
        user,
        role: role,
        profile: completeProfile,
      };
    }

    // Check localStorage for persisted user
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedUser = localStorage.getItem("medcure_current_user");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          return {
            user: userData,
            role: userData.role,
            profile: userData,
          };
        } catch {
          localStorage.removeItem("medcure_current_user");
        }
      }
    }

    return null;
  } catch (error) {
    console.error("❌ Get current user error:", error);
    return null;
  }
}

/**
 * Determine user role based on email or metadata
 * @param {Object} user - Supabase user object
 * @returns {string} User role ('admin' or 'employee')
 */
function getUserRole(user) {
  // Check user metadata first
  if (user.user_metadata?.role) {
    return user.user_metadata.role;
  }

  // Check app metadata
  if (user.app_metadata?.role) {
    return user.app_metadata.role;
  }

  // Determine role by email pattern
  const email = user.email?.toLowerCase();

  if (email === "admin@medcure.com" || email?.includes("admin")) {
    return "admin";
  }

  if (email?.includes("cashier") || email?.includes("employee")) {
    return "employee";
  }

  // Default to employee for safety
  return "employee";
}

/**
 * Fetch user profile from database
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User profile data
 */
async function fetchUserProfile(userId) {
  try {
    console.log("📋 Fetching user profile for:", userId);

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.warn("⚠️ User profile not found in database:", error.message);
      
      // If it's a missing table error, return null gracefully
      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        console.warn("⚠️ user_profiles table doesn't exist - using fallback profile");
        return null;
      }
      
      return null;
    }

    console.log("✅ User profile fetched:", data);
    return data;
  } catch (error) {
    console.warn("⚠️ Failed to fetch user profile:", error);
    return null;
  }
}

/**
 * Get default name for role
 * @param {string} role - User role
 * @returns {string} Default display name
 */
function getDefaultName(role) {
  switch (role) {
    case "admin":
      return "Admin User";
    case "employee":
    case "cashier":
      return "Cashier User";
    default:
      return "MedCure User";
  }
}

/**
 * Get role color for UI theming
 * @param {string} role - User role
 * @returns {string} CSS color value
 */
function getRoleColor(role) {
  switch (role) {
    case "admin":
      return "#dc2626"; // red-600
    case "employee":
    case "cashier":
      return "#059669"; // emerald-600
    default:
      return "#3b82f6"; // blue-600
  }
}

/**
 * Check if current user is admin
 * @returns {boolean} True if user is admin
 */
export function isAdmin() {
  return userRole === "admin";
}

/**
 * Check if current user is employee/cashier
 * @returns {boolean} True if user is employee
 */
export function isEmployee() {
  return userRole === "employee";
}

/**
 * Get current user role
 * @returns {string|null} Current user role
 */
export function getCurrentRole() {
  return userRole;
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export function isAuthenticated() {
  return currentUser !== null;
}

/**
 * Create default admin user (for development)
 */
export async function createAdminUser() {
  try {
    console.log("👤 Creating admin user...");

    const { data, error } = await supabase.auth.admin.createUser({
      email: "admin@medcure.com",
      password: "123456",
      email_confirm: true,
      user_metadata: {
        role: "admin",
        full_name: "MedCure Administrator",
      },
    });

    if (error) {
      console.error("❌ Admin user creation failed:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ Admin user created successfully");
    return { success: true, user: data.user };
  } catch (error) {
    console.error("❌ Create admin user error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Auth state change listener
 */
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log("🔄 Auth state changed:", event);

  if (event === "SIGNED_IN" && session?.user) {
    currentUser = session.user;

    // Fetch complete user profile
    const userProfile = await fetchUserProfile(session.user.id);
    const role = userProfile?.role || getUserRole(session.user);
    userRole = role;

    const completeProfile = {
      id: session.user.id,
      email: session.user.email,
      role: role,
      full_name:
        userProfile?.full_name ||
        session.user.user_metadata?.full_name ||
        getDefaultName(role),
      display_name:
        userProfile?.full_name ||
        session.user.user_metadata?.full_name ||
        getDefaultName(role),
      avatar_url: userProfile?.profile_image_url || null,
      role_color: getRoleColor(role),
      login_time: new Date().toISOString(),
    };

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(
        "medcure_current_user",
        JSON.stringify(completeProfile)
      );
      localStorage.setItem(
        "medcure_user_profile",
        JSON.stringify(completeProfile)
      );
    }

    console.log("👤 User signed in:", session.user.email, "Role:", role);

    // Dispatch detailed auth state change event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent("authStateChanged", {
          detail: {
            user: session.user,
            role: role,
            profile: completeProfile,
            action: "SIGNED_IN",
            timestamp: new Date().toISOString(),
          },
        })
      );
    }
  }

  if (event === "SIGNED_OUT") {
    currentUser = null;
    userRole = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem("medcure_current_user");
      localStorage.removeItem("medcure_user_profile");
    }
    console.log("🚪 User signed out");

    // Dispatch sign out event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent("authStateChanged", {
          detail: {
            user: null,
            role: null,
            profile: null,
            action: "SIGNED_OUT",
            timestamp: new Date().toISOString(),
          },
        })
      );
    }
  }
});

// Initialize auth state on service load
getCurrentUser().catch(console.error);
