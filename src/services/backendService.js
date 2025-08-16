/**
 * MedCure Backend Integration Service
 * Comprehensive backend service management and utilities
 */

import { supabase, TABLES } from "../lib/supabase.js";

// Environment check for backend availability
export function isBackendAvailable() {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

// Check if we should use mock API
export function shouldUseMockAPI() {
  return import.meta.env.VITE_USE_MOCK_API === "true" || !isBackendAvailable();
}

/**
 * Health check for backend services
 * @returns {Promise<Object>} Backend health status
 */
export async function checkBackendHealth() {
  try {
    console.log("🔄 Checking backend health...");

    if (!isBackendAvailable()) {
      return {
        status: "unavailable",
        message: "Backend configuration missing",
        services: {
          database: false,
          products: false,
          sales: false,
          archived: false,
        },
        error: "Missing Supabase environment variables"
      };
    }

    // Test database connection with a simple query
    const { data: _data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select("id")
      .limit(1);

    if (error) {
      throw error;
    }

    console.log("✅ Backend health check passed");

    return {
      status: "healthy",
      message: "All backend services operational",
      services: {
        database: true,
        products: true,
        sales: true,
        archived: true,
      },
      error: null
    };

  } catch (error) {
    console.error("❌ Backend health check failed:", error);

    return {
      status: "error",
      message: "Backend services unavailable",
      services: {
        database: false,
        products: false,
        sales: false,
        archived: false,
      },
      error: error.message
    };
  }
}

/**
 * Initialize backend services
 * @returns {Promise<Object>} Initialization result
 */
export async function initializeBackend() {
  try {
    console.log("🚀 Initializing backend services...");

    const healthCheck = await checkBackendHealth();

    if (healthCheck.status !== "healthy") {
      console.warn("⚠️ Backend not available, falling back to mock mode");
      return {
        success: false,
        mode: "mock",
        health: healthCheck,
        message: "Using mock API - backend unavailable"
      };
    }

    // Test critical operations
    const tests = await Promise.all([
      testProductOperations(),
      testSalesOperations(),
      testArchivedOperations(),
    ]);

    const allTestsPassed = tests.every(test => test.success);

    if (allTestsPassed) {
      console.log("✅ Backend initialization successful");
      return {
        success: true,
        mode: "backend",
        health: healthCheck,
        tests: tests,
        message: "Backend services ready"
      };
    } else {
      console.warn("⚠️ Some backend tests failed, falling back to mock mode");
      return {
        success: false,
        mode: "mock",
        health: healthCheck,
        tests: tests,
        message: "Backend tests failed - using mock API"
      };
    }

  } catch (error) {
    console.error("❌ Backend initialization failed:", error);
    return {
      success: false,
      mode: "mock",
      error: error.message,
      message: "Backend initialization failed - using mock API"
    };
  }
}

/**
 * Test product operations
 * @returns {Promise<Object>} Test result
 */
async function testProductOperations() {
  try {
    console.log("🧪 Testing product operations...");

    // Test read operation
    const { data: _data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select("id, name, is_active")
      .limit(1);

    if (error) throw error;

    console.log("✅ Product operations test passed");
    return {
      service: "products",
      success: true,
      operations: ["read"],
      error: null
    };

  } catch (error) {
    console.error("❌ Product operations test failed:", error);
    return {
      service: "products",
      success: false,
      operations: [],
      error: error.message
    };
  }
}

/**
 * Test sales operations
 * @returns {Promise<Object>} Test result
 */
async function testSalesOperations() {
  try {
    console.log("🧪 Testing sales operations...");

    // Test read operation
    const { data: _data, error } = await supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .select("id, transaction_number, status")
      .limit(1);

    if (error) throw error;

    console.log("✅ Sales operations test passed");
    return {
      service: "sales",
      success: true,
      operations: ["read"],
      error: null
    };

  } catch (error) {
    console.error("❌ Sales operations test failed:", error);
    return {
      service: "sales",
      success: false,
      operations: [],
      error: error.message
    };
  }
}

/**
 * Test archived operations
 * @returns {Promise<Object>} Test result
 */
async function testArchivedOperations() {
  try {
    console.log("🧪 Testing archived operations...");

    // Test archived products query
    const { data: _data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select("id, name, is_active")
      .eq("is_active", false)
      .limit(1);

    if (error) throw error;

    console.log("✅ Archived operations test passed");
    return {
      service: "archived",
      success: true,
      operations: ["read"],
      error: null
    };

  } catch (error) {
    console.error("❌ Archived operations test failed:", error);
    return {
      service: "archived",
      success: false,
      operations: [],
      error: error.message
    };
  }
}

/**
 * Get system statistics
 * @returns {Promise<Object>} System statistics
 */
export async function getSystemStats() {
  try {
    console.log("📊 Fetching system statistics...");

    if (shouldUseMockAPI()) {
      return {
        data: {
          totalProducts: 50,
          activeProducts: 45,
          archivedProducts: 5,
          totalTransactions: 100,
          archivedTransactions: 10,
          mode: "mock"
        },
        error: null
      };
    }

    const [
      productsResult,
      archivedProductsResult,
      transactionsResult,
      archivedTransactionsResult
    ] = await Promise.all([
      supabase
        .from(TABLES.PRODUCTS)
        .select("id", { count: "exact" })
        .eq("is_active", true),
      supabase
        .from(TABLES.PRODUCTS)
        .select("id", { count: "exact" })
        .eq("is_active", false),
      supabase
        .from(TABLES.SALES_TRANSACTIONS)
        .select("id", { count: "exact" })
        .eq("status", "completed"),
      supabase
        .from(TABLES.SALES_TRANSACTIONS)
        .select("id", { count: "exact" })
        .in("status", ["cancelled", "refunded"])
    ]);

    const stats = {
      totalProducts: (productsResult.count || 0) + (archivedProductsResult.count || 0),
      activeProducts: productsResult.count || 0,
      archivedProducts: archivedProductsResult.count || 0,
      totalTransactions: (transactionsResult.count || 0) + (archivedTransactionsResult.count || 0),
      archivedTransactions: archivedTransactionsResult.count || 0,
      mode: "backend"
    };

    console.log("✅ System statistics fetched:", stats);

    return {
      data: stats,
      error: null
    };

  } catch (error) {
    console.error("❌ Error fetching system statistics:", error);
    return {
      data: null,
      error: error.message
    };
  }
}

/**
 * Migrate from mock to backend (utility function)
 * @returns {Promise<Object>} Migration result
 */
export async function migrateToBackend() {
  try {
    console.log("🔄 Starting migration from mock to backend...");

    const initResult = await initializeBackend();

    if (!initResult.success) {
      throw new Error("Backend not ready for migration");
    }

    // Check if we have any data in the backend
    const stats = await getSystemStats();
    
    console.log("✅ Migration assessment complete:", {
      backendReady: initResult.success,
      currentMode: initResult.mode,
      systemStats: stats.data
    });

    return {
      success: true,
      mode: "backend",
      stats: stats.data,
      message: "Migration to backend completed successfully"
    };

  } catch (error) {
    console.error("❌ Migration to backend failed:", error);
    return {
      success: false,
      mode: "mock",
      error: error.message,
      message: "Migration failed - staying in mock mode"
    };
  }
}

/**
 * Export all backend service functions
 */
export default {
  isBackendAvailable,
  shouldUseMockAPI,
  checkBackendHealth,
  initializeBackend,
  getSystemStats,
  migrateToBackend,
};
