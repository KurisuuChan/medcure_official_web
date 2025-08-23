import { supabase } from "../config/supabase.js";

/**
 * Authentication Service for MedCure
 * Handles authentication for storage uploads and database operations
 */

let currentSession = null;

/**
 * Initialize session for storage uploads
 * Handles both anonymous auth and fallback modes
 */
export async function initializeAnonymousSession() {
  try {
    console.log("🔐 Initializing session for storage...");

    // Check if we already have a session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      console.log("✅ Existing session found:", session.user.id);
      currentSession = session;
      return session;
    }

    // Try to create anonymous user session (if enabled in Supabase)
    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        if (error.message.includes("Anonymous sign-ins are disabled")) {
          console.log("ℹ️ Anonymous auth disabled - using fallback mode");
          return null; // This is OK - we'll use permissive policies
        }
        throw error;
      }

      console.log("✅ Anonymous session created:", data.user.id);
      currentSession = data.session;
      return data.session;
    } catch {
      console.log("ℹ️ Anonymous auth not available - using fallback mode");
      return null; // Continue without auth if policies are permissive
    }
  } catch (error) {
    console.log("ℹ️ Auth initialization skipped:", error.message);
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

// Auto-initialize when service is imported
initializeAuth().catch(console.error);
