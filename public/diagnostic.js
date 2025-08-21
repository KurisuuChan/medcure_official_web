// Reports Backend Connection Diagnostic
// Copy and paste this into browser console at http://localhost:5173

console.log("🏥 MedCure Reports Backend Diagnostic");
console.log("=====================================");

async function diagnosticTest() {
  try {
    // 1. Check environment setup
    console.log("\n1️⃣ Environment Configuration:");
    const hasUrl = window.location.hostname === 'localhost';
    const viteEnv = typeof import !== 'undefined';
    console.log(`   Running on localhost: ${hasUrl ? '✅' : '❌'}`);
    console.log(`   Vite environment: ${viteEnv ? '✅' : '❌'}`);

    // 2. Test module imports
    console.log("\n2️⃣ Module Import Test:");
    try {
      const supabaseModule = await import('/src/config/supabase.js');
      console.log("   ✅ Supabase config imported");
      
      const { supabase } = supabaseModule;
      console.log("   ✅ Supabase client available");
      
      // Check client configuration
      if (supabase.supabaseUrl && supabase.supabaseKey) {
        console.log("   ✅ Supabase credentials configured");
      } else {
        console.log("   ⚠️ Supabase credentials may not be fully configured");
      }
      
    } catch (importError) {
      console.log("   ❌ Module import failed:", importError.message);
      return;
    }

    // 3. Test database connection
    console.log("\n3️⃣ Database Connection Test:");
    try {
      const { supabase } = await import('/src/config/supabase.js');
      
      // Simple ping test
      const { data: pingResult, error: pingError } = await supabase
        .from('products')
        .select('count', { count: 'exact', head: true });
      
      if (pingError) {
        console.log("   ❌ Database ping failed:", pingError.message);
        console.log("   ❌ Error code:", pingError.code);
        return;
      }
      
      console.log("   ✅ Database connection successful");
      
    } catch (dbError) {
      console.log("   ❌ Database connection error:", dbError.message);
      return;
    }

    // 4. Test products table
    console.log("\n4️⃣ Products Table Test:");
    try {
      const { supabase } = await import('/src/config/supabase.js');
      
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, stock, total_stock, selling_price, cost_price, category')
        .limit(3);
      
      if (productsError) {
        console.log("   ❌ Products query failed:", productsError.message);
        console.log("   ❌ Error details:", productsError);
      } else {
        console.log(`   ✅ Products table accessible`);
        console.log(`   ✅ Found ${products?.length || 0} products`);
        if (products && products.length > 0) {
          console.log("   📦 Sample product:", {
            id: products[0].id,
            name: products[0].name,
            stock: products[0].stock,
            category: products[0].category
          });
        }
      }
      
    } catch (error) {
      console.log("   ❌ Products test error:", error.message);
    }

    // 5. Test sales table
    console.log("\n5️⃣ Sales Table Test:");
    try {
      const { supabase } = await import('/src/config/supabase.js');
      
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('id, total, created_at')
        .limit(3);
      
      if (salesError) {
        console.log("   ❌ Sales query failed:", salesError.message);
      } else {
        console.log(`   ✅ Sales table accessible`);
        console.log(`   ✅ Found ${sales?.length || 0} sales records`);
      }
      
    } catch (error) {
      console.log("   ❌ Sales test error:", error.message);
    }

    // 6. Test report service
    console.log("\n6️⃣ Report Service Test:");
    try {
      const reportModule = await import('/src/services/reportService.js');
      console.log("   ✅ Report service imported");
      
      const { generateInventoryReport } = reportModule;
      
      // Test basic inventory report
      const report = await generateInventoryReport({
        includeLowStock: false,
        includeValuation: false
      });
      
      console.log("   ✅ Inventory report generated successfully");
      console.log("   📊 Report summary:", {
        totalProducts: report.summary.totalProducts,
        categories: report.categoryBreakdown?.length || 0,
        lastUpdated: report.summary.lastUpdated
      });
      
    } catch (error) {
      console.log("   ❌ Report service error:", error.message);
      console.log("   ❌ Error stack:", error.stack);
    }

    // 7. Test product service integration
    console.log("\n7️⃣ Product Service Integration Test:");
    try {
      const productModule = await import('/src/services/productService.js');
      const { getProducts } = productModule;
      
      const products = await getProducts();
      console.log("   ✅ Product service working");
      console.log(`   ✅ Retrieved ${products?.length || 0} products`);
      
    } catch (error) {
      console.log("   ❌ Product service error:", error.message);
    }

    console.log("\n🎉 Diagnostic Complete!");
    console.log("=====================================");
    
  } catch (globalError) {
    console.log("\n💥 Global diagnostic error:", globalError.message);
    console.log("Stack:", globalError.stack);
  }
}

// Run diagnostic
diagnosticTest();

// Make available globally for manual testing
window.runReportsDiagnostic = diagnosticTest;
