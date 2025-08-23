import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "your-supabase-url";
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "your-supabase-key";

// For development/admin use, we'll use service_role key if available
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Use service_role key for admin operations in development
const effectiveKey = serviceRoleKey || supabaseKey;

// Create Supabase client with authentication enabled for storage uploads
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
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

// Create admin client with service role for admin operations (if available)
export const adminClient = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      db: {
        schema: "public",
      },
      global: {
        headers: {
          "x-client-info": "medcure-admin",
        },
      },
    })
  : supabase;

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
