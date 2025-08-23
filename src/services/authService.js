import { supabase } from "../config/supabase.js";

/**
 * Authentication Service for MedCure
 * Handles authentication for storage uploads and database operations
 * Compatible with role-based authentication system
 */

let currentSession = null;

/**
 * Initialize session for storage uploads
 * Uses existing authentication session if available
 */
export async function initializeAnonymousSession() {
  try {
    console.log("🔐 Checking existing authentication session...");

    // Check if we already have a session from role-based auth
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session && session.user) {
      console.log(
        "✅ Existing authenticated session found:",
        session.user.email || session.user.id
      );
      currentSession = session;
      return session;
    }

    // Don't try to create anonymous sessions - just use permissive policies
    console.log("ℹ️ No existing session - using permissive storage policies");
    return null;
  } catch (error) {
    console.log("ℹ️ Auth check skipped:", error.message);
    return null;
  }
}

/**
 * Get current session or create one if needed
 */
export async function ensureSession() {
  if (currentSession) {
    return currentSession;
  }

  return await initializeAnonymousSession();
}

/**
 * Get current user ID or generate a temporary one
 */
export async function getCurrentUserId() {
  try {
    const session = await ensureSession();

    if (session && session.user) {
      return session.user.id;
    }

    // Fallback: use a persistent anonymous ID
    let anonymousId = localStorage.getItem("medcure_anonymous_id");
    if (!anonymousId) {
      anonymousId =
        "anon_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
      localStorage.setItem("medcure_anonymous_id", anonymousId);
    }

    return anonymousId;
  } catch (error) {
    console.warn("Failed to get user ID:", error);
    return "fallback_user";
  }
}

/**
 * Check if storage operations are available
 */
export async function checkStorageAccess() {
  try {
    console.log("🔍 Checking storage access...");

    // Try to list buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error("❌ Storage access denied:", error);
      return false;
    }

    console.log("✅ Storage access confirmed. Buckets:", buckets?.length || 0);
    return true;
  } catch (error) {
    console.error("❌ Storage check failed:", error);
    return false;
  }
}

/**
 * Initialize auth on app startup
 */
export async function initializeAuth() {
  console.log("🚀 Initializing MedCure authentication...");

  // Check storage access first
  const hasStorageAccess = await checkStorageAccess();

  if (hasStorageAccess) {
    // Try to initialize session for better upload reliability
    await initializeAnonymousSession();
  }

  console.log("✅ Auth initialization complete");
}
