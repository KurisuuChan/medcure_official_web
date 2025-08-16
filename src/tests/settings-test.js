/**
 * Settings Test Script
 * Quick test to verify settings operations are working
 */

import { testSettingsOperations } from "../services/settingsService.js";

async function runSettingsTest() {
  console.log("🧪 Running Settings Test...");
  console.log("=" .repeat(50));

  try {
    const startTime = Date.now();
    const result = await testSettingsOperations();
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️  Test completed in ${duration}ms`);
    console.log("📊 Test Result:", result);

    if (result.success) {
      console.log("✅ Settings backend test PASSED");
      console.log("📋 Operations tested:", result.operations);
      if (result.tests) {
        console.log("🔍 Detailed test results:");
        Object.entries(result.tests).forEach(([test, passed]) => {
          console.log(`  ${passed ? "✅" : "❌"} ${test}`);
        });
      }
    } else {
      console.log("❌ Settings backend test FAILED");
      console.log("💥 Error:", result.error);
    }

    return result.success;
  } catch (error) {
    console.error("🚨 Test script error:", error);
    return false;
  }
}

// Auto-run if this file is executed directly
// runSettingsTest(); // Uncomment to auto-run

export { runSettingsTest };
