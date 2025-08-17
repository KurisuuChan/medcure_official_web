#!/usr/bin/env node

/**
 * Backend Product Service Test
 * Quick test to verify product management backend is working
 */

import { getProducts, getCategories } from "./src/services/productService.js";
import { isMockMode } from "./src/utils/mockApi.js";

console.log("🚀 Testing Product Management Backend...\n");

async function testBackend() {
  try {
    // Check if we're in mock mode
    const mockMode = await isMockMode();
    console.log(`📊 Mock Mode: ${mockMode ? "ENABLED" : "DISABLED"}`);

    if (mockMode) {
      console.log("⚠️  Still in mock mode! Check VITE_USE_MOCK_API setting.");
      return;
    }

    console.log("✅ Backend mode enabled\n");

    // Test 1: Get Products
    console.log("🔍 Test 1: Fetching products...");
    const productsResult = await getProducts();

    if (productsResult.error) {
      console.error("❌ Products fetch failed:", productsResult.error);
    } else {
      console.log(
        `✅ Products loaded: ${productsResult.data?.length || 0} items`
      );
      if (productsResult.data?.length > 0) {
        console.log(`   First product: ${productsResult.data[0].name}`);
      }
    }

    // Test 2: Get Categories
    console.log("\n🔍 Test 2: Fetching categories...");
    const categoriesResult = await getCategories();

    if (categoriesResult.error) {
      console.error("❌ Categories fetch failed:", categoriesResult.error);
    } else {
      console.log(
        `✅ Categories loaded: ${categoriesResult.data?.length || 0} items`
      );
      if (categoriesResult.data?.length > 0) {
        console.log(
          `   Categories: ${categoriesResult.data
            .map((c) => c.name)
            .join(", ")}`
        );
      }
    }

    console.log("\n🎉 Backend test completed!");
  } catch (error) {
    console.error("💥 Test failed with error:", error.message);
  }
}

testBackend();
