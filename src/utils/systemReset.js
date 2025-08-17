/**
 * System Reset Utility
 * Provides functionality to reset the system to a fresh state
 */

import { supabase } from "../lib/supabase.js";
import { clearMockData, restoreMockData } from "./mockApi.js";

/**
 * Simple mock check for reset operations
 */
function isUsingMockMode() {
  return import.meta.env.VITE_USE_MOCK_API === "true";
}

/**
 * Clear all localStorage data - COMPREHENSIVE VERSION
 */
export function clearLocalStorage() {
  try {
    console.log("🧹 Starting comprehensive localStorage clear...");
    
    // Clear ALL MedCure-related data (comprehensive list)
    const keysToRemove = [
      // User and session data
      "medcure_user_session",
      "medcure_user_preferences",
      "medcure_user_profile",
      "medcure_user_settings",
      
      // Branding and customization
      "medcure_branding_settings",
      "medcure_theme_settings", 
      "medcure_brand_color",
      "medcure_company_logo",
      "medcure_profile_avatar",
      "medcure_logo_url",
      "medcure_brand_name",
      
      // Application data
      "medcure_recent_searches",
      "medcure_notifications",
      "medcure_draft_transactions",
      "medcure_cart_items",
      "medcure_filters",
      "medcure_dashboard_settings",
      "medcure_export_history",
      
      // Business data
      "medcure_contacts",
      "medcure_customers", 
      "medcure_suppliers",
      "medcure_products",
      "medcure_inventory",
      "medcure_sales",
      "medcure_transactions",
      "medcure_reports",
      "medcure_analytics",
      
      // System settings
      "medcure_system_settings",
      "medcure_backup_settings",
      "medcure_security_settings",
      "medcure_notification_settings",
      
      // Mock data keys
      "medcure_mock_products",
      "medcure_mock_categories",
      "medcure_mock_transactions",
      "medcure_mock_contacts",
      "medcure_mock_notifications",
      "medcure_mock_reports",
      "medcure_mock_archived_items",
      "medcure_mock_settings",
      "medcure_mock_branding",
      "medcure_mock_profile",
      "medcure_mock_theme",
      "medcure_mock_is_reset",
      
      // Settings variations
      "medcure-mock-settings",
      "medcure-settings",
      "medcure-branding",
      "medcure-profile",
      "medcure-theme",
      "medcure-contacts",
      "medcure-reports",
    ];

    // Remove specific keys
    let clearedCount = 0;
    keysToRemove.forEach((key) => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        clearedCount++;
        console.log(`🗑️ Cleared: ${key}`);
      }
    });

    // Clear any remaining MedCure keys (dynamic scan)
    const allKeys = Object.keys(localStorage);
    allKeys.forEach((key) => {
      if (key.toLowerCase().includes("medcure") || 
          key.toLowerCase().includes("pharmacy") ||
          key.toLowerCase().includes("pos") ||
          key.toLowerCase().includes("inventory") ||
          key.startsWith("medcure_") ||
          key.startsWith("medcure-")) {
        localStorage.removeItem(key);
        clearedCount++;
        console.log(`🗑️ Dynamic clear: ${key}`);
      }
    });

    console.log(`✅ Local storage cleared (${clearedCount} items removed)`);
    return { success: true, message: `Local storage cleared successfully (${clearedCount} items)` };
  } catch (error) {
    console.error("❌ Failed to clear local storage:", error);
    return { success: false, error: "Failed to clear local storage" };
  }
}

/**
 * Clear all sessionStorage data
 */
export function clearSessionStorage() {
  try {
    // Clear specific session data
    const keysToRemove = [
      "medcure_temp_session",
      "medcure_current_transaction",
      "medcure_search_cache",
      "medcure_modal_state",
    ];

    keysToRemove.forEach((key) => {
      sessionStorage.removeItem(key);
    });

    // Clear any remaining MedCure session keys
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("medcure_")) {
        sessionStorage.removeItem(key);
      }
    });

    console.log("✅ Session storage cleared");
    return { success: true, message: "Session storage cleared successfully" };
  } catch (error) {
    console.error("❌ Failed to clear session storage:", error);
    return { success: false, error: "Failed to clear session storage" };
  }
}

/**
 * Reset database to initial state (only in backend mode)
 */
export async function resetDatabase() {
  if (isUsingMockMode()) {
    console.log(
      "ℹ️ Mock mode detected - clearing mock data instead of database"
    );
    try {
      clearMockData();
      return {
        success: true,
        message: "Mock data cleared successfully (system reset to empty state)",
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to clear mock data",
        details: error.message,
      };
    }
  }

  try {
    console.log("🔄 Starting database reset...");

    // Clear all tables in correct order (respecting foreign key constraints)
    const tables = [
      "sales_transaction_items",
      "sales_transactions",
      "inventory_movements",
      "products",
      "contacts",
      "users",
      "notifications",
      "settings",
    ];

    const results = [];

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).delete().neq("id", 0); // Delete all records

        if (error) {
          console.warn(`⚠️ Warning clearing ${table}:`, error.message);
          results.push({ table, status: "warning", message: error.message });
        } else {
          console.log(`✅ Cleared table: ${table}`);
          results.push({
            table,
            status: "success",
            message: "Cleared successfully",
          });
        }
      } catch (tableError) {
        console.warn(`⚠️ Could not clear ${table}:`, tableError.message);
        results.push({ table, status: "error", message: tableError.message });
      }
    }

    console.log("✅ Database reset completed");
    return {
      success: true,
      message: "Database reset completed",
      details: results,
    };
  } catch (error) {
    console.error("❌ Database reset failed:", error);
    return {
      success: false,
      error: "Database reset failed",
      details: error.message,
    };
  }
}

/**
 * Reset system settings to defaults
 */
export async function resetSystemSettings() {
  try {
    console.log("🔄 Resetting system settings...");

    // Default settings
    const defaultSettings = {
      companyName: "MedCure Pharmacy",
      companyLogo: null,
      theme: "light",
      currency: "PHP",
      taxRate: 0.12,
      receiptHeader: "Thank you for choosing MedCure Pharmacy",
      receiptFooter: "Have a great day!",
      lowStockThreshold: 10,
      enableNotifications: true,
      enableBackup: false,
      backupFrequency: "daily",
      language: "en",
      timezone: "Asia/Manila",
    };

    // Reset settings in database
    if (!isUsingMockMode()) {
      // Reset settings in database
      const { error } = await supabase.from("settings").upsert([
        {
          id: 1,
          key: "system_settings",
          value: defaultSettings,
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.warn("⚠️ Warning resetting database settings:", error.message);
      }
    }

    // Reset local settings
    localStorage.setItem(
      "medcure_system_settings",
      JSON.stringify(defaultSettings)
    );

    console.log("✅ System settings reset to defaults");
    return {
      success: true,
      message: "System settings reset to defaults",
      settings: defaultSettings,
    };
  } catch (error) {
    console.error("❌ Failed to reset system settings:", error);
    return {
      success: false,
      error: "Failed to reset system settings",
    };
  }
}

/**
 * Create initial demo data (optional)
 */
export async function createDemoData() {
  try {
    console.log("🔄 Creating demo data...");

    if (isUsingMockMode()) {
      console.log("ℹ️ Mock mode detected - restoring mock demo data");
      try {
        restoreMockData();
        return {
          success: true,
          message: "Mock demo data restored successfully",
        };
      } catch (error) {
        return {
          success: false,
          error: "Failed to restore mock demo data",
          details: error.message,
        };
      }
    }

    // Create demo products
    const demoProducts = [
      {
        name: "Paracetamol 500mg",
        generic_name: "Paracetamol",
        category: "Pain Relief",
        barcode: "8901030815557",
        cost_price: 2.5,
        selling_price: 5.0,
        supplier: "PharmaCorp",
        description: "Pain and fever relief medication",
        total_stock: 100,
        reorder_level: 20,
        is_active: true,
      },
      {
        name: "Amoxicillin 250mg",
        generic_name: "Amoxicillin",
        category: "Antibiotics",
        barcode: "8901030825557",
        cost_price: 15.0,
        selling_price: 25.0,
        supplier: "MediSupply",
        description: "Antibiotic for bacterial infections",
        total_stock: 50,
        reorder_level: 10,
        is_active: true,
      },
    ];

    const { error: productsError } = await supabase
      .from("products")
      .insert(demoProducts);

    if (productsError) {
      console.warn("⚠️ Warning creating demo products:", productsError.message);
    } else {
      console.log("✅ Demo products created");
    }

    // Create demo user
    const demoUser = {
      username: "admin",
      email: "admin@medcure.com",
      first_name: "Admin",
      last_name: "User",
      role: "administrator",
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const { error: userError } = await supabase
      .from("users")
      .insert([demoUser]);

    if (userError) {
      console.warn("⚠️ Warning creating demo user:", userError.message);
    } else {
      console.log("✅ Demo user created");
    }

    console.log("✅ Demo data creation completed");
    return {
      success: true,
      message: "Demo data created successfully",
    };
  } catch (error) {
    console.error("❌ Failed to create demo data:", error);
    return {
      success: false,
      error: "Failed to create demo data",
    };
  }
}

/**
 * Complete system reset
 */
export async function performCompleteReset(options = {}) {
  const {
    clearStorage = true,
    resetDatabase: shouldResetDatabase = true,
    resetSettings: shouldResetSettings = true,
    createDemo = false,
    confirmReset = false,
    forceReload = false,
  } = options;

  if (!confirmReset) {
    return {
      success: false,
      error: "Reset not confirmed. This action cannot be undone.",
    };
  }

  console.log("🚨 STARTING COMPLETE SYSTEM RESET...");
  console.log("⚠️ This will remove ALL data and cannot be undone!");

  const results = {
    localStorage: { success: false },
    sessionStorage: { success: false },
    database: { success: false },
    settings: { success: false },
    demoData: { success: false },
  };

  try {
    // Step 1: Clear storage
    if (clearStorage) {
      console.log("\n🗂️ Clearing storage...");
      results.localStorage = clearLocalStorage();
      results.sessionStorage = clearSessionStorage();
    }

    // Step 2: Reset database/mock data
    if (shouldResetDatabase) {
      console.log("\n🗄️ Resetting database/mock data...");
      results.database = await resetDatabase();
    }

    // Step 3: Reset settings
    if (shouldResetSettings) {
      console.log("\n⚙️ Resetting settings...");
      results.settings = await resetSystemSettings();
    }

    // Step 4: Create demo data (optional)
    if (createDemo) {
      console.log("\n📊 Creating demo data...");
      results.demoData = await createDemoData();
    }

    console.log("\n✅ SYSTEM RESET COMPLETED!");

    // Force page reload for mock mode to ensure clean state
    if (isUsingMockMode() && forceReload) {
      console.log("🔄 Forcing page reload for clean mock state...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      console.log("🔄 Please refresh the page to see changes.");
    }

    return {
      success: true,
      message: "System reset completed successfully",
      results,
      shouldReload: isUsingMockMode(),
    };
  } catch (error) {
    console.error("❌ SYSTEM RESET FAILED:", error);
    return {
      success: false,
      error: "System reset failed",
      results,
    };
  }
}

/**
 * Quick reset for development
 */
export async function quickDevReset() {
  console.log("🚀 Quick development reset...");

  return await performCompleteReset({
    clearStorage: true,
    resetDatabase: false, // Keep DB for dev
    resetSettings: true,
    createDemo: false,
    confirmReset: true,
  });
}

export default {
  clearLocalStorage,
  clearSessionStorage,
  resetDatabase,
  resetSystemSettings,
  createDemoData,
  performCompleteReset,
  quickDevReset,
};
