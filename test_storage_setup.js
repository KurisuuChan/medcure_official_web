// Quick test script to verify Supabase Storage is working
// Run this in your browser console after implementing the fixes

import { supabase } from "./src/config/supabase.js";
import { testStorageUpload } from "./src/services/storageDebugService.js";
import {
  checkStorageAccess,
  initializeAnonymousSession,
} from "./src/services/authService.js";

async function runStorageTests() {
  console.log("🧪 Running MedCure Storage Tests...");
  console.log("=====================================");

  // Test 1: Check Supabase connection
  console.log("\n1️⃣ Testing Supabase Connection...");
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error("❌ Connection failed:", error);
      return false;
    }
    console.log(
      "✅ Connected! Available buckets:",
      buckets?.map((b) => b.name)
    );
  } catch (error) {
    console.error("❌ Connection error:", error);
    return false;
  }

  // Test 2: Check authentication
  console.log("\n2️⃣ Testing Authentication...");
  try {
    const hasAccess = await checkStorageAccess();
    if (!hasAccess) {
      console.warn("⚠️ Storage access limited, trying anonymous auth...");
      await initializeAnonymousSession();
    }
    console.log("✅ Authentication ready");
  } catch (error) {
    console.error("❌ Auth error:", error);
  }

  // Test 3: Test file upload
  console.log("\n3️⃣ Testing File Upload...");
  try {
    const uploadSuccess = await testStorageUpload();
    if (uploadSuccess) {
      console.log("✅ Upload test successful!");
    } else {
      console.error("❌ Upload test failed");
      return false;
    }
  } catch (error) {
    console.error("❌ Upload error:", error);
    return false;
  }

  // Test 4: Check bucket contents
  console.log("\n4️⃣ Checking Bucket Contents...");
  try {
    const { data: avatarFiles } = await supabase.storage
      .from("avatars")
      .list("test", { limit: 5 });
    const { data: businessFiles } = await supabase.storage
      .from("business-assets")
      .list("", { limit: 5 });

    console.log("📁 Avatar bucket files:", avatarFiles?.length || 0);
    console.log("📁 Business assets files:", businessFiles?.length || 0);

    if (avatarFiles?.length > 0) {
      console.log("✅ Files found in avatars bucket");
    }
  } catch (error) {
    console.warn("⚠️ Could not list bucket contents:", error);
  }

  console.log("\n🎉 Storage tests completed!");
  console.log("=====================================");
  console.log("✅ Your Supabase Storage is ready for image uploads!");
  console.log("Now go to Settings → Profile and upload a profile picture!");

  return true;
}

// Auto-run the tests
runStorageTests().catch(console.error);

// Also export for manual testing
window.testMedCureStorage = runStorageTests;
