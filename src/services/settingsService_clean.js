import { supabase } from "../config/supabase.js";

/**
 * Simple Settings Service for MedCure
 * Handles user profile, business settings, and file uploads
 */

/**
 * Get current user profile
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfile() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    return {
      id: user.id,
      full_name: user.user_metadata?.full_name || "",
      avatar_url: user.user_metadata?.avatar_url || "",
      email: user.email,
    };
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated profile
 */
export async function updateUserProfile(profileData) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: profileData.full_name,
        avatar_url: profileData.avatar_url,
      },
    });

    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw new Error("Failed to update profile");
  }
}

/**
 * Upload and update profile picture
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} URL of uploaded image
 */
export async function updateProfilePicture(file) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // For now, create a local URL. In production, upload to Supabase Storage
    const imageUrl = URL.createObjectURL(file);

    // Update user metadata
    await updateUserProfile({ avatar_url: imageUrl });

    return imageUrl;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw new Error("Failed to upload profile picture");
  }
}

/**
 * Get business settings
 * @returns {Promise<Object>} Business settings
 */
export async function getBusinessSettings() {
  try {
    const stored = localStorage.getItem("medcure_business_settings");
    if (stored) {
      return JSON.parse(stored);
    }

    return {
      business_name: "MedCure Pharmacy",
      logo_url: "",
      primary_color: "#2563eb",
    };
  } catch (error) {
    console.error("Error getting business settings:", error);
    return {
      business_name: "MedCure Pharmacy",
      logo_url: "",
      primary_color: "#2563eb",
    };
  }
}

/**
 * Update business settings
 * @param {Object} businessData - Business data to update
 * @returns {Promise<Object>} Updated business settings
 */
export async function updateBusinessSettings(businessData) {
  try {
    const currentSettings = await getBusinessSettings();
    const updatedSettings = { ...currentSettings, ...businessData };

    localStorage.setItem(
      "medcure_business_settings",
      JSON.stringify(updatedSettings)
    );

    return updatedSettings;
  } catch (error) {
    console.error("Error updating business settings:", error);
    throw new Error("Failed to update business settings");
  }
}

/**
 * Upload and update business logo
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} URL of uploaded logo
 */
export async function updateBusinessLogo(file) {
  try {
    // For now, create a local URL. In production, upload to Supabase Storage
    const logoUrl = URL.createObjectURL(file);

    // Update business settings
    await updateBusinessSettings({ logo_url: logoUrl });

    return logoUrl;
  } catch (error) {
    console.error("Error uploading business logo:", error);
    throw new Error("Failed to upload business logo");
  }
}

/**
 * Update business name
 * @param {string} businessName - New business name
 * @returns {Promise<Object>} Updated business settings
 */
export async function updateBusinessName(businessName) {
  try {
    return await updateBusinessSettings({ business_name: businessName });
  } catch (error) {
    console.error("Error updating business name:", error);
    throw new Error("Failed to update business name");
  }
}

/**
 * Get app settings
 * @returns {Promise<Object>} App settings
 */
export async function getAppSettings() {
  try {
    const stored = localStorage.getItem("medcure_app_settings");
    if (stored) {
      return JSON.parse(stored);
    }

    return {
      theme: "light",
      currency: "PHP",
      timezone: "Asia/Manila",
      language: "en",
      notifications: true,
    };
  } catch (error) {
    console.error("Error getting app settings:", error);
    return {
      theme: "light",
      currency: "PHP",
      timezone: "Asia/Manila",
    };
  }
}

/**
 * Update app setting
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 * @returns {Promise<Object>} Updated app settings
 */
export async function updateAppSetting(key, value) {
  try {
    const currentSettings = await getAppSettings();
    const updatedSettings = { ...currentSettings, [key]: value };

    localStorage.setItem(
      "medcure_app_settings",
      JSON.stringify(updatedSettings)
    );

    return updatedSettings;
  } catch (error) {
    console.error("Error updating app setting:", error);
    throw new Error("Failed to update app setting");
  }
}
