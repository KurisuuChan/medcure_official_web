import { supabase } from "../src/config/supabase.js";

async function testDatabase() {
  try {
    console.log("Testing database connection...");

    // Test products table
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .limit(5);

    console.log("Products query result:", {
      data: products,
      error: productsError,
    });

    // Test sales table
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("*")
      .limit(5);

    console.log("Sales query result:", { data: sales, error: salesError });

    // Test if tables exist
    if (productsError) {
      console.error("Products table error:", productsError.message);
    } else {
      console.log(`Found ${products?.length || 0} products`);
    }

    if (salesError) {
      console.error("Sales table error:", salesError.message);
    } else {
      console.log(`Found ${sales?.length || 0} sales`);
    }
  } catch (error) {
    console.error("Database test failed:", error);
  }
}

testDatabase();
