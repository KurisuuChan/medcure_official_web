import { supabase, TABLES } from "../lib/supabase.js";
import {
  mockGetSettings,
  mockUpdateSettings,
  mockResetSettings,
  mockExportSettings,
  mockImportSettings,
  isMockMode,
} from "../utils/mockApi.js";

/**
 * Settings Management API Service
 * Handles all settings-related database operations
 */

// Default settings structure
const DEFAULT_SETTINGS = {
  // General Settings
  businessName: "MedCure Pharmacy",
  businessAddress: "123 Health Street, Medical District, City",
  businessPhone: "+63 912 345 6789",
  businessEmail: "contact@medcure.com",
  primaryColor: "#2563eb",
  timezone: "Asia/Manila",
  currency: "PHP",
  language: "en",

  // Notification Settings
  lowStockThreshold: 10,
  criticalStockThreshold: 5,
  expiryAlertDays: 30,
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  dailyReports: true,
  weeklyReports: true,

  // Security Settings
  twoFactorAuth: false,
  sessionTimeout: 30,
  passwordExpiry: 90,

  // Backup Settings
  autoBackup: true,
  backupFrequency: "daily",
  backupRetention: 30,
  cloudBackup: false,
};

// Get all settings
export async function getSettings() {
  if (isMockMode()) {
    console.log("🔧 getSettings called - using mock mode");
    return await mockGetSettings();
  }

  console.log("🔄 getSettings called - using backend mode");

  try {
    const { data: settings, error } = await supabase
      .from(TABLES.SETTINGS || "settings")
      .select("*")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 means no rows returned
      console.error("❌ Error fetching settings:", error);
      throw error;
    }

    // If no settings exist, create default settings
    if (!settings) {
      console.log("🔄 No settings found, creating default settings");
      return await createDefaultSettings();
    }

    // Merge with defaults in case new settings were added
    const mergedSettings = { ...DEFAULT_SETTINGS, ...settings.data };

    console.log("✅ Settings fetched from backend");

    return {
      data: mergedSettings,
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Error in getSettings:", error);
    return {
      data: DEFAULT_SETTINGS,
      error: error.message,
      success: false,
    };
  }
}

// Create default settings
async function createDefaultSettings() {
  try {
    const { error } = await supabase
      .from(TABLES.SETTINGS || "settings")
      .insert([
        {
          data: DEFAULT_SETTINGS,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating default settings:", error);
      throw error;
    }

    console.log("✅ Default settings created in backend");

    return {
      data: DEFAULT_SETTINGS,
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Error in createDefaultSettings:", error);
    return {
      data: DEFAULT_SETTINGS,
      error: error.message,
      success: false,
    };
  }
}

// Update settings
export async function updateSettings(settingsData, section = "all") {
  if (isMockMode()) {
    console.log("🔧 updateSettings called - using mock mode");
    return await mockUpdateSettings(settingsData, section);
  }

  console.log("🔄 updateSettings called - using backend mode");

  try {
    // Get current settings first
    const currentResult = await getSettings();
    if (!currentResult.success) {
      throw new Error("Failed to get current settings");
    }

    // Merge new settings with current ones
    const updatedSettings = { ...currentResult.data, ...settingsData };

    // Check if settings record exists
    const { data: existingSettings } = await supabase
      .from(TABLES.SETTINGS || "settings")
      .select("id")
      .limit(1)
      .single();

    let result;

    if (existingSettings) {
      // Update existing settings
      result = await supabase
        .from(TABLES.SETTINGS || "settings")
        .update({
          data: updatedSettings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSettings.id)
        .select()
        .single();
    } else {
      // Create new settings record
      result = await supabase
        .from(TABLES.SETTINGS || "settings")
        .insert([
          {
            data: updatedSettings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();
    }

    if (result.error) {
      console.error("❌ Error updating settings:", result.error);
      throw result.error;
    }

    console.log(`✅ Settings ${section} updated in backend`);

    return {
      data: updatedSettings,
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Error in updateSettings:", error);
    return {
      data: null,
      error: error.message,
      success: false,
    };
  }
}

// Update specific setting
export async function updateSetting(key, value) {
  const settingsUpdate = { [key]: value };
  return await updateSettings(settingsUpdate, key);
}

// Reset settings to defaults
export async function resetSettings() {
  if (isMockMode()) {
    console.log("🔧 resetSettings called - using mock mode");
    return await mockResetSettings();
  }

  console.log("🔄 resetSettings called - using backend mode");

  try {
    const { error } = await supabase
      .from(TABLES.SETTINGS || "settings")
      .update({
        data: DEFAULT_SETTINGS,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error resetting settings:", error);
      throw error;
    }

    console.log("✅ Settings reset to defaults in backend");

    return {
      data: DEFAULT_SETTINGS,
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Error in resetSettings:", error);
    return {
      data: null,
      error: error.message,
      success: false,
    };
  }
}

// Export settings
export async function exportSettings() {
  if (isMockMode()) {
    console.log("🔧 exportSettings called - using mock mode");
    return await mockExportSettings();
  }

  console.log("🔄 exportSettings called - using backend mode");

  try {
    const settingsResult = await getSettings();

    if (!settingsResult.success) {
      throw new Error("Failed to get settings for export");
    }

    const exportData = {
      settings: settingsResult.data,
      exported_at: new Date().toISOString(),
      version: "1.0",
      application: "MedCure Pharmacy Management System",
    };

    console.log("✅ Settings exported from backend");

    return {
      data: exportData,
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Error in exportSettings:", error);
    return {
      data: null,
      error: error.message,
      success: false,
    };
  }
}

// Import settings
export async function importSettings(importData) {
  if (isMockMode()) {
    console.log("🔧 importSettings called - using mock mode");
    return await mockImportSettings(importData);
  }

  console.log("🔄 importSettings called - using backend mode");

  try {
    // Validate import data
    if (!importData?.settings) {
      throw new Error("Invalid import data format");
    }

    // Merge imported settings with defaults to ensure no missing keys
    const settingsToImport = { ...DEFAULT_SETTINGS, ...importData.settings };

    const result = await updateSettings(settingsToImport, "import");

    if (!result.success) {
      throw new Error(result.error);
    }

    console.log("✅ Settings imported to backend");

    return {
      data: result.data,
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Error in importSettings:", error);
    return {
      data: null,
      error: error.message,
      success: false,
    };
  }
}

// Create backup of current settings
export async function createSettingsBackup() {
  if (isMockMode()) {
    console.log("🔧 createSettingsBackup called - using mock mode");
    return await exportSettings();
  }

  console.log("🔄 createSettingsBackup called - using backend mode");

  try {
    const exportResult = await exportSettings();

    if (!exportResult.success) {
      throw new Error("Failed to export settings for backup");
    }

    // Store backup in database (if you have a backups table)
    // For now, just return the export data
    const backupData = {
      ...exportResult.data,
      backup_type: "settings",
      backup_id: `settings_backup_${Date.now()}`,
    };

    console.log("✅ Settings backup created");

    return {
      data: backupData,
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Error in createSettingsBackup:", error);
    return {
      data: null,
      error: error.message,
      success: false,
    };
  }
}

// Change password (placeholder - would integrate with auth system)
export async function changePassword(_currentPassword, _newPassword) {
  if (isMockMode()) {
    console.log("🔧 changePassword called - using mock mode");
    return {
      data: { message: "Password changed successfully (mock)" },
      error: null,
      success: true,
    };
  }

  console.log("🔄 changePassword called - using backend mode");

  try {
    // In a real implementation, this would integrate with Supabase Auth
    // For now, return a placeholder response
    console.log("⚠️ Password change not yet implemented with Supabase Auth");

    return {
      data: { message: "Password change feature coming soon" },
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Error in changePassword:", error);
    return {
      data: null,
      error: error.message,
      success: false,
    };
  }
}

// Test settings operations
export async function testSettingsOperations() {
  try {
    console.log("🧪 Testing settings operations...");

    // Test get settings
    const getResult = await getSettings();
    if (!getResult.success) {
      throw new Error("Get settings test failed");
    }

    // Test update settings
    const testUpdate = { testValue: "backend_test_" + Date.now() };
    const updateResult = await updateSettings(testUpdate);
    if (!updateResult.success) {
      throw new Error("Update settings test failed");
    }

    console.log("✅ Settings operations test passed");

    return {
      success: true,
      operations: ["get", "update"],
      message: "Settings backend operational",
    };
  } catch (error) {
    console.error("❌ Settings operations test failed:", error);
    return {
      success: false,
      operations: [],
      error: error.message,
    };
  }
}

export default {
  getSettings,
  updateSettings,
  updateSetting,
  resetSettings,
  exportSettings,
  importSettings,
  createSettingsBackup,
  changePassword,
  testSettingsOperations,
};
