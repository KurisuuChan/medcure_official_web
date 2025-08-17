// Test script to verify backend connectivity
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://smgmuwddxwqjtstqmorl.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtZ211d2RkeHdxanRzdHFtb3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzM2MjIsImV4cCI6MjA3MDkwOTYyMn0.GVl9rY9a4aGeq4LL7kXJQVKIppflAq8oZHr2lLoQG4g";

console.log("Testing Supabase connection...");

const supabase = createClient(supabaseUrl, supabaseKey);

// Test basic connection
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .limit(1);

    if (error) {
      console.error("Supabase error:", error);
      return false;
    }

    console.log("Supabase connection successful:", data);
    return true;
  } catch (err) {
    console.error("Connection test failed:", err);
    return false;
  }
}

testConnection();
