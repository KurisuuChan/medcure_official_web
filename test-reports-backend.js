// Quick test script for reports backend connections
// Run this in browser console or node

console.log("🧪 Testing Reports Backend Connections...");

// Test environment variables
console.log("\n📋 Environment Check:");
console.log(
  "VITE_SUPABASE_URL:",
  import.meta.env?.VITE_SUPABASE_URL ? "✅ Set" : "❌ Missing"
);
console.log(
  "VITE_SUPABASE_ANON_KEY:",
  import.meta.env?.VITE_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"
);
console.log(
  "VITE_SUPABASE_SERVICE_ROLE_KEY:",
  import.meta.env?.VITE_SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Not set"
);

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    console.log("\n🔌 Testing Supabase Connection...");

    const { supabase } = await import("./src/config/supabase.js");

    // Test basic connection
    const { data, error } = await supabase
      .from("products")
      .select("count", { count: "exact", head: true });

    if (error) {
      console.log("❌ Supabase connection failed:", error.message);
      return false;
    }

    console.log("✅ Supabase connected successfully");
    return true;
  } catch (error) {
    console.log("❌ Supabase import/connection error:", error.message);
    return false;
  }
}

// Test database tables
async function testDatabaseTables() {
  try {
    console.log("\n📊 Testing Database Tables...");

    const { supabase } = await import("./src/config/supabase.js");

    // Test products table
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, stock, total_stock, selling_price, cost_price")
      .limit(3);

    if (productsError) {
      console.log("❌ Products table error:", productsError.message);
    } else {
      console.log(`✅ Products table: ${products?.length || 0} records found`);
      if (products?.length > 0) {
        console.log("   Sample product:", products[0]);
      }
    }

    // Test sales table
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select(
        `
        id, 
        total, 
        created_at,
        sale_items (
          id,
          quantity,
          unit_price
        )
      `
      )
      .limit(3);

    if (salesError) {
      console.log("❌ Sales table error:", salesError.message);
    } else {
      console.log(`✅ Sales table: ${sales?.length || 0} records found`);
      if (sales?.length > 0) {
        console.log("   Sample sale:", sales[0]);
      }
    }
  } catch (error) {
    console.log("❌ Database tables test error:", error.message);
  }
}

// Test report services
async function testReportServices() {
  try {
    console.log("\n📈 Testing Report Services...");

    const { generateInventoryReport } = await import(
      "./src/services/reportService.js"
    );

    // Test inventory report generation
    const inventoryReport = await generateInventoryReport({
      includeLowStock: false,
      includeValuation: false,
    });

    console.log("✅ Inventory report generated successfully");
    console.log("   Products count:", inventoryReport.summary.totalProducts);
    console.log("   Categories:", inventoryReport.categoryBreakdown.length);

    return true;
  } catch (error) {
    console.log("❌ Report services error:", error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting comprehensive backend test...\n");

  const supabaseOk = await testSupabaseConnection();

  if (supabaseOk) {
    await testDatabaseTables();
    await testReportServices();
  } else {
    console.log("⚠️ Skipping database tests due to connection failure");
  }

  console.log("\n✅ Backend test completed!");
}

// Export for manual running
if (typeof window !== "undefined") {
  window.testReportsBackend = runAllTests;
  console.log("💡 Run window.testReportsBackend() to test the backend");
}

// Auto-run if this script is loaded
runAllTests();
