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

    // Get user role from metadata or email
    const role = getUserRole(data.user);

    // Store current user info
    currentUser = data.user;
    userRole = role;

    // Store in localStorage for persistence
    localStorage.setItem(
      "medcure_current_user",
      JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        role: role,
        login_time: new Date().toISOString(),
      })
    );

    console.log("👤 User role determined:", role);

    return {
      success: true,
      user: data.user,
      role: role,
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
    localStorage.removeItem("medcure_current_user");

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
    const { data: { session } } = await supabase.auth.getSession();
    
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
      userRole = getUserRole(user);
      return {
        user,
        role: userRole,
      };
    }

    // Check localStorage for persisted user
    const storedUser = localStorage.getItem("medcure_current_user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        return {
          user: userData,
          role: userData.role,
        };
      } catch {
        localStorage.removeItem("medcure_current_user");
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
supabase.auth.onAuthStateChange((event, session) => {
  console.log("🔄 Auth state changed:", event);

  if (event === "SIGNED_IN" && session?.user) {
    currentUser = session.user;
    userRole = getUserRole(session.user);

    localStorage.setItem(
      "medcure_current_user",
      JSON.stringify({
        id: session.user.id,
        email: session.user.email,
        role: userRole,
        login_time: new Date().toISOString(),
      })
    );

    console.log("👤 User signed in:", session.user.email, "Role:", userRole);
  }

  if (event === "SIGNED_OUT") {
    currentUser = null;
    userRole = null;
    localStorage.removeItem("medcure_current_user");
    console.log("🚪 User signed out");
  }
});

// Initialize auth state on service load
getCurrentUser().catch(console.error);
