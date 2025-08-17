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

  // Branding Settings
  brandingName: "MedCure",
  companyLogo: "",
  logoUrl: "",
  brandColor: "#2563eb",
  accentColor: "#3b82f6",
  headerStyle: "modern",
  sidebarStyle: "minimal",

  // Profile Settings
  profileName: "Admin User",
  profileEmail: "admin@medcure.com",
  profileRole: "Administrator",
  profileAvatar: "",
  profileBio: "System Administrator",
  profilePhone: "+63 912 345 6789",
  profileDepartment: "IT Administration",
  displayName: "Admin",
  userInitials: "AU",

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
  if (await isMockMode()) {
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
  if (await isMockMode()) {
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
  if (await isMockMode()) {
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
  if (await isMockMode()) {
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

    // Test validation
    const testSettings = { ...DEFAULT_SETTINGS };
    const validValidation = validateSettings(testSettings);
    if (!validValidation.isValid) {
      throw new Error("Valid settings validation failed");
    }

    // Test invalid settings validation
    const invalidSettings = {
      ...testSettings,
      businessName: "",
      lowStockThreshold: -1,
    };
    const invalidValidation = validateSettings(invalidSettings);
    if (invalidValidation.isValid) {
      throw new Error("Invalid settings validation should have failed");
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
      operations: ["get", "update", "validate"],
      message: "Settings backend operational",
      tests: {
        get: true,
        update: true,
        validateValid: true,
        validateInvalid: true,
      },
    };
  } catch (error) {
    console.error("❌ Settings operations test failed:", error);
    return {
      success: false,
      operations: [],
      error: error.message,
      tests: {
        get: false,
        update: false,
        validateValid: false,
        validateInvalid: false,
      },
    };
  }
}

// Validate settings data
export function validateSettings(settings) {
  const errors = [];

  // Validate business information
  if (!settings.businessName || settings.businessName.trim().length < 2) {
    errors.push("Business name must be at least 2 characters long");
  }

  if (!settings.businessEmail || !/\S+@\S+\.\S+/.test(settings.businessEmail)) {
    errors.push("Valid business email is required");
  }

  if (!settings.businessPhone || settings.businessPhone.trim().length < 10) {
    errors.push("Valid business phone number is required");
  }

  // Validate stock thresholds
  if (settings.lowStockThreshold < 1 || settings.lowStockThreshold > 1000) {
    errors.push("Low stock threshold must be between 1 and 1000");
  }

  if (
    settings.criticalStockThreshold < 0 ||
    settings.criticalStockThreshold >= settings.lowStockThreshold
  ) {
    errors.push(
      "Critical stock threshold must be less than low stock threshold"
    );
  }

  if (settings.expiryAlertDays < 1 || settings.expiryAlertDays > 365) {
    errors.push("Expiry alert days must be between 1 and 365");
  }

  // Validate security settings
  if (settings.sessionTimeout < 5 || settings.sessionTimeout > 480) {
    errors.push("Session timeout must be between 5 and 480 minutes");
  }

  if (settings.passwordExpiry < 30 || settings.passwordExpiry > 365) {
    errors.push("Password expiry must be between 30 and 365 days");
  }

  // Validate backup settings
  if (settings.backupRetention < 1 || settings.backupRetention > 365) {
    errors.push("Backup retention must be between 1 and 365 days");
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
}

// Get settings history (placeholder for future implementation)
export async function getSettingsHistory() {
  if (isMockMode()) {
    console.log("🔧 getSettingsHistory called - using mock mode");
    return {
      data: [
        {
          id: 1,
          data: DEFAULT_SETTINGS,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          version: "1.0",
        },
      ],
      error: null,
      success: true,
    };
  }

  console.log("🔄 getSettingsHistory called - using backend mode");

  try {
    const { data: history, error } = await supabase
      .from(TABLES.SETTINGS || "settings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("❌ Error fetching settings history:", error);
      throw error;
    }

    console.log("✅ Settings history fetched from backend");

    return {
      data: history || [],
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Error in getSettingsHistory:", error);
    return {
      data: [],
      error: error.message,
      success: false,
    };
  }
}

// Bulk update settings sections
export async function bulkUpdateSettings(sections) {
  if (isMockMode()) {
    console.log("🔧 bulkUpdateSettings called - using mock mode");
    return {
      data: { ...DEFAULT_SETTINGS, ...sections },
      error: null,
      success: true,
    };
  }

  console.log("🔄 bulkUpdateSettings called - using backend mode");

  try {
    // Get current settings first
    const currentResult = await getSettings();
    if (!currentResult.success) {
      throw new Error("Failed to get current settings");
    }

    // Merge all sections
    const updatedSettings = { ...currentResult.data };
    Object.keys(sections).forEach((section) => {
      Object.assign(updatedSettings, sections[section]);
    });

    // Validate settings
    const validation = validateSettings(updatedSettings);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    const result = await updateSettings(updatedSettings, "bulk");

    if (!result.success) {
      throw new Error(result.error);
    }

    console.log("✅ Bulk settings update completed");

    return {
      data: result.data,
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Error in bulkUpdateSettings:", error);
    return {
      data: null,
      error: error.message,
      success: false,
    };
  }
}

// Create settings snapshot
export async function createSettingsSnapshot(description = "") {
  try {
    console.log("📸 Creating settings snapshot...");

    const settingsResult = await getSettings();
    if (!settingsResult.success) {
      throw new Error("Failed to get settings for snapshot");
    }

    const snapshot = {
      id: `snapshot_${Date.now()}`,
      description:
        description || `Snapshot created on ${new Date().toISOString()}`,
      settings: settingsResult.data,
      created_at: new Date().toISOString(),
      version: "1.0",
    };

    console.log("✅ Settings snapshot created");

    return {
      data: snapshot,
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Error creating settings snapshot:", error);
    return {
      data: null,
      error: error.message,
      success: false,
    };
  }
}

// Compare settings versions
export function compareSettings(settings1, settings2) {
  const differences = {};
  const allKeys = new Set([
    ...Object.keys(settings1),
    ...Object.keys(settings2),
  ]);

  allKeys.forEach((key) => {
    if (settings1[key] !== settings2[key]) {
      differences[key] = {
        old: settings1[key],
        new: settings2[key],
      };
    }
  });

  return {
    hasDifferences: Object.keys(differences).length > 0,
    differences: differences,
    totalChanges: Object.keys(differences).length,
  };
}

// Upload logo file and update branding
export async function uploadLogo(file) {
  try {
    console.log("🖼️ Uploading logo file...");

    if (!file) {
      throw new Error("No file provided");
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Please upload a valid image file (JPEG, PNG, GIF, WebP)"
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error(
        "File size too large. Please upload an image smaller than 5MB"
      );
    }

    if (isMockMode()) {
      console.log("🔧 Mock mode: Simulating logo upload...");

      // Create a real data URL for preview in mock mode
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            success: true,
            data: {
              url: reader.result, // This will be a data: URL that can be displayed
              filename: file.name,
              size: file.size,
              type: file.type,
            },
            error: null,
          });
        };
        reader.readAsDataURL(file);
      });
    }

    // Backend implementation for real file upload
    console.log("🔄 Uploading to backend storage...");

    const fileExt = file.name.split(".").pop();
    const fileName = `logo_${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("logos")
      .upload(fileName, file);

    if (error) {
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("logos").getPublicUrl(fileName);

    console.log("✅ Logo uploaded successfully");

    return {
      success: true,
      data: {
        url: publicUrl,
        filename: fileName,
        size: file.size,
        type: file.type,
      },
      error: null,
    };
  } catch (error) {
    console.error("❌ Error uploading logo:", error);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
}

// Update branding settings
export async function updateBranding(brandingData) {
  try {
    console.log("🎨 Updating branding settings...");

    const brandingSettings = {
      brandingName: brandingData.brandingName || "",
      companyLogo: brandingData.companyLogo || "",
      logoUrl: brandingData.logoUrl || "",
      brandColor: brandingData.brandColor || "#2563eb",
      accentColor: brandingData.accentColor || "#3b82f6",
      headerStyle: brandingData.headerStyle || "modern",
      sidebarStyle: brandingData.sidebarStyle || "minimal",
      systemDescription:
        brandingData.systemDescription || "Pharmacy Management System",
    };

    const result = await updateSettings(brandingSettings, "branding");

    if (result.success) {
      console.log("✅ Branding settings updated successfully");
    }

    return result;
  } catch (error) {
    console.error("❌ Error updating branding:", error);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
}

// Update profile settings
export async function updateProfile(profileData) {
  try {
    console.log("👤 Updating profile settings...");

    const profileSettings = {
      profileName: profileData.profileName || "",
      profileEmail: profileData.profileEmail || "",
      profileRole: profileData.profileRole || "",
      profileAvatar: profileData.profileAvatar || "",
      profilePhone: profileData.profilePhone || "",
      displayName: profileData.displayName || "",
      userInitials: profileData.userInitials || "",
    };

    const result = await updateSettings(profileSettings, "profile");

    if (result.success) {
      console.log("✅ Profile settings updated successfully");
    }

    return result;
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
}

// Upload profile avatar
export async function uploadAvatar(file) {
  try {
    console.log("📸 Uploading avatar file...");

    if (!file) {
      throw new Error("No file provided");
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Please upload a valid image file (JPEG, PNG, GIF, WebP)"
      );
    }

    // Validate file size (max 2MB for avatars)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new Error(
        "File size too large. Please upload an image smaller than 2MB"
      );
    }

    if (isMockMode()) {
      console.log("🔧 Mock mode: Simulating avatar upload...");

      // Create a real data URL for preview in mock mode
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            success: true,
            data: {
              url: reader.result, // This will be a data: URL that can be displayed
              filename: file.name,
              size: file.size,
              type: file.type,
            },
            error: null,
          });
        };
        reader.readAsDataURL(file);
      });
    }

    // Backend implementation for real file upload
    console.log("🔄 Uploading to backend storage...");

    const fileExt = file.name.split(".").pop();
    const fileName = `avatar_${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file);

    if (error) {
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(fileName);

    console.log("✅ Avatar uploaded successfully");

    return {
      success: true,
      data: {
        url: publicUrl,
        filename: fileName,
        size: file.size,
        type: file.type,
      },
      error: null,
    };
  } catch (error) {
    console.error("❌ Error uploading avatar:", error);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
}

// Get branding settings
export async function getBrandingSettings() {
  try {
    console.log("🎨 Getting branding settings...");

    const result = await getSettings();
    if (!result.success) {
      throw new Error("Failed to get settings");
    }

    const brandingSettings = {
      brandingName: result.data.brandingName || "MedCure",
      companyLogo: result.data.companyLogo || "",
      logoUrl: result.data.logoUrl || "",
      brandColor: result.data.brandColor || "#2563eb",
      accentColor: result.data.accentColor || "#3b82f6",
      headerStyle: result.data.headerStyle || "modern",
      sidebarStyle: result.data.sidebarStyle || "minimal",
      systemDescription:
        result.data.systemDescription || "Pharmacy Management System",
    };

    return {
      success: true,
      data: brandingSettings,
      error: null,
    };
  } catch (error) {
    console.error("❌ Error getting branding settings:", error);
    return {
      success: false,
      data: null,
      error: error.message,
    };
  }
}

// Get profile settings
export async function getProfileSettings() {
  try {
    console.log("👤 Getting profile settings...");

    const result = await getSettings();
    if (!result.success) {
      throw new Error("Failed to get settings");
    }

    const profileSettings = {
      // Original format for settings form
      profileName: result.data.profileName || "Admin User",
      profileEmail: result.data.profileEmail || "admin@medcure.com",
      profileRole: result.data.profileRole || "Administrator",
      profileAvatar: result.data.profileAvatar || "",
      profilePhone: result.data.profilePhone || "+63 912 345 6789",
      displayName: result.data.displayName || "Admin",
      userInitials: result.data.userInitials || "AU",

      // Additional formats for components
      firstName: result.data.profileName
        ? result.data.profileName.split(" ")[0]
        : "Admin",
      lastName: result.data.profileName
        ? result.data.profileName.split(" ").slice(1).join(" ")
        : "User",
      email: result.data.profileEmail || "admin@medcure.com",
      jobTitle: result.data.profileRole || "Administrator",
    };

    return {
      success: true,
      data: profileSettings,
      error: null,
    };
  } catch (error) {
    console.error("❌ Error getting profile settings:", error);
    return {
      success: false,
      data: null,
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
  validateSettings,
  getSettingsHistory,
  bulkUpdateSettings,
  createSettingsSnapshot,
  compareSettings,
  uploadLogo,
  updateBranding,
  updateProfile,
  uploadAvatar,
  getBrandingSettings,
  getProfileSettings,
};
