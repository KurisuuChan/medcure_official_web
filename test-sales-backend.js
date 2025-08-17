#!/usr/bin/env node

/**
 * Sales Backend Integration Test
 * Tests POS/Sales system with real backend
 */

import {
  createSale,
  getSalesTransactions,
  getSalesSummary,
} from "./src/services/salesService.js";
import { getProducts } from "./src/services/productService.js";
import { isMockMode } from "./src/utils/mockApi.js";

console.log("🚀 Testing Sales/POS Backend Integration...\n");

async function testSalesBackend() {
  try {
    // Check if we're in mock mode
    const mockMode = await isMockMode();
    console.log(`📊 Mock Mode: ${mockMode ? "ENABLED" : "DISABLED"}`);

    if (mockMode) {
      console.log("⚠️  Still in mock mode! Sales testing skipped.");
      return;
    }

    console.log("✅ Backend mode enabled for sales\n");

    // Test 1: Get Products for POS
    console.log("🔍 Test 1: Fetching products for POS...");
    const productsResult = await getProducts();

    if (productsResult.error) {
      console.error("❌ Products fetch failed:", productsResult.error);
      return;
    } else {
      console.log(
        `✅ Products available for POS: ${
          productsResult.data?.length || 0
        } items`
      );
    }

    // Test 2: Get Existing Sales Transactions
    console.log("\n🔍 Test 2: Checking existing sales transactions...");
    const salesResult = await getSalesTransactions();

    if (salesResult.error) {
      console.error("❌ Sales fetch failed:", salesResult.error);
    } else {
      console.log(
        `✅ Existing transactions: ${
          salesResult.data?.length || 0
        } transactions`
      );
    }

    // Test 3: Get Sales Summary
    console.log("\n🔍 Test 3: Getting sales summary...");
    const summaryResult = await getSalesSummary("today");

    if (summaryResult.error) {
      console.error("❌ Sales summary failed:", summaryResult.error);
    } else {
      console.log(`✅ Today's sales summary:`, summaryResult.data);
    }

    // Test 4: Create a Test Sale (Optional - only if products available)
    if (productsResult.data && productsResult.data.length > 0) {
      console.log("\n🔍 Test 4: Creating test sale transaction...");

      const testProduct = productsResult.data[0]; // Use first product
      const testSale = {
        cart: [
          {
            id: testProduct.id,
            name: testProduct.name,
            price: testProduct.selling_price,
            quantity: 1,
            total: testProduct.selling_price,
          },
        ],
        discount: 0,
        isPwdSenior: false,
        customerInfo: {
          name: "Test Customer",
        },
      };

      const saleResult = await createSale(testSale);

      if (saleResult.error) {
        console.error("❌ Test sale failed:", saleResult.error);
      } else {
        console.log(`✅ Test sale created:`, {
          transactionNumber: saleResult.data?.transaction_number,
          totalAmount: saleResult.data?.total_amount,
          status: saleResult.data?.status,
        });
      }
    }

    console.log("\n🎉 Sales backend test completed!");
  } catch (error) {
    console.error("💥 Sales test failed with error:", error.message);
  }
}

testSalesBackend();
