import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "your-supabase-url";
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "your-supabase-key";

// ⚠️ WARNING: Using service_role key in frontend is DANGEROUS!
// This configuration bypasses Row Level Security
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Log warning if using service role (but less intrusive for development)
if (supabaseKey.includes("service_role") || supabaseKey.length > 200) {
  console.info(
    "ℹ️ INFO: Using service_role key for development. Switch to anon key for production."
  );
}

// Export for testing purposes
export { supabaseUrl, supabaseKey };
