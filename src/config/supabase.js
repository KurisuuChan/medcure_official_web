import { createClient } from "@supabase/supabase-js";

const getEnv = (key) => (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) || (typeof process !== 'undefined' && process.env[key]);

const supabaseUrl = getEnv("VITE_SUPABASE_URL") || "your-supabase-url";
const supabaseKey = getEnv("VITE_SUPABASE_ANON_KEY") || "your-supabase-key";

// For development/admin use, we'll use service_role key if available
const serviceRoleKey = getEnv("VITE_SUPABASE_SERVICE_ROLE_KEY");

// Use service_role key for admin operations in development
const effectiveKey = serviceRoleKey || supabaseKey;

// Create a SINGLE Supabase client with authentication enabled
export const supabase = createClient(supabaseUrl, effectiveKey, {
  auth: {
    autoRefreshToken: typeof import.meta !== 'undefined',
    persistSession: typeof import.meta !== 'undefined',
    detectSessionInUrl: typeof import.meta !== 'undefined',
    storageKey: "medcure-auth",
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "x-client-info": "medcure-web",
    },
  },
});

// Export the same client for admin operations to avoid multiple instances
export const adminClient = supabase;

// Log configuration status
if (serviceRoleKey) {
  console.info(
    "ℹ️ INFO: Using service_role key for development. Switch to anon key for production."
  );
} else {
  console.info("ℹ️ INFO: Using anon key for client operations.");
}

// Only log if there's an actual issue with keys
if (!supabaseUrl || supabaseUrl === "your-supabase-url") {
  console.error("❌ ERROR: VITE_SUPABASE_URL not configured properly");
}

if (!effectiveKey || effectiveKey === "your-supabase-key") {
  console.error("❌ ERROR: Supabase key not configured properly");
}

// Export for testing purposes
export { supabaseUrl, supabaseKey };
