import { supabase } from "../config/supabase.js";

/**
 * Simple Authentication Service - Works without user_profiles table
 * Fallback for when database tables aren't set up yet
 */

// Current user state
let currentUser = null;
let userRole = null;

/**
 * Simple sign in that doesn't require database tables
 */
export async function simpleSignIn(email, password) {
  try {
    console.log("🔐 Simple sign in for:", email);

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

    // Determine role from email (simple fallback)
    const role = getSimpleRole(data.user.email);

    currentUser = data.user;
    userRole = role;

    // Create simple profile
    const profile = {
      id: data.user.id,
      email: data.user.email,
      role: role,
      full_name: getDefaultName(role),
      display_name: getDefaultName(role),
      avatar_url: null,
      role_color: getRoleColor(role),
    };

    // Store in localStorage
    localStorage.setItem("medcure_current_user", JSON.stringify(profile));
    localStorage.setItem("medcure_user_profile", JSON.stringify(profile));

    console.log("✅ Simple login successful:", profile);

    return {
      success: true,
      user: data.user,
      role: role,
      profile: profile,
    };
  } catch (error) {
    console.error("❌ Simple sign in error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Simple sign out
 */
export async function simpleSignOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("❌ Sign out error:", error);

    currentUser = null;
    userRole = null;
    localStorage.removeItem("medcure_current_user");
    localStorage.removeItem("medcure_user_profile");

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Simple get current user
 */
export async function simpleGetCurrentUser() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return null;
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const role = getSimpleRole(user.email);
    const profile = {
      id: user.id,
      email: user.email,
      role: role,
      full_name: getDefaultName(role),
      display_name: getDefaultName(role),
      avatar_url: null,
      role_color: getRoleColor(role),
    };

    currentUser = user;
    userRole = role;

    return {
      user,
      role,
      profile,
    };
  } catch (error) {
    console.error("❌ Get current user error:", error);
    return null;
  }
}

/**
 * Get simple role from email
 */
function getSimpleRole(email) {
  const lowerEmail = email?.toLowerCase();

  if (lowerEmail === "admin@medcure.com" || lowerEmail?.includes("admin")) {
    return "admin";
  }

  if (lowerEmail?.includes("cashier") || lowerEmail?.includes("employee")) {
    return "employee";
  }

  return "employee"; // Default to employee
}

/**
 * Get default name for role
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
 * Get role color
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
 * Check if user is admin
 */
export function isAdmin() {
  return userRole === "admin";
}

/**
 * Get current role
 */
export function getCurrentRole() {
  return userRole;
}
