/**
 * MedCure User Profile & Branding Service
 * Handles user profile data, branding settings, and company information
 */

import { supabase } from "../lib/supabase";
import { shouldUseMockAPI } from "../utils/backendStatus";

// Mock branding/profile data
const mockBrandingData = {
  // Company/Pharmacy Information
  companyName: "MedCure Pharmacy",
  companySlogan: "Your Health, Our Priority",
  companyLogo: null,
  companyAddress: "123 Main Street, Manila, Philippines",
  companyPhone: "+63 2 123 4567",
  companyEmail: "info@medcure.ph",
  licenseNumber: "PH-PHARMACY-2024-001",

  // User Profile
  firstName: "Admin",
  lastName: "User",
  jobTitle: "System Administrator",
  profileAvatar: null,
  email: "admin@medcure.com",
  phone: "+63 912 345 6789",

  // Theme & Branding
  primaryColor: "#3B82F6",
  secondaryColor: "#10B981",
  accentColor: "#F59E0B",
  theme: "light",

  // Business Settings
  businessHours: {
    monday: { open: "08:00", close: "20:00", closed: false },
    tuesday: { open: "08:00", close: "20:00", closed: false },
    wednesday: { open: "08:00", close: "20:00", closed: false },
    thursday: { open: "08:00", close: "20:00", closed: false },
    friday: { open: "08:00", close: "20:00", closed: false },
    saturday: { open: "09:00", close: "18:00", closed: false },
    sunday: { open: "10:00", close: "16:00", closed: false },
  },

  // System Preferences
  currency: "PHP",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  timezone: "Asia/Manila",

  // Notification Preferences
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  lowStockAlerts: true,
  expiryAlerts: true,
  salesNotifications: true,

  // Receipt Settings
  receiptHeader: "MedCure Pharmacy",
  receiptFooter: "Thank you for choosing MedCure!",
  receiptLogo: null,
  printReceiptByDefault: true,

  // Security Settings
  sessionTimeout: 24, // hours
  requirePasswordChange: false,
  passwordExpiryDays: 90,
  enableTwoFactor: false,

  // Last Updated
  updatedAt: new Date().toISOString(),
};

/**
 * Get user profile and branding data
 */
export async function getBrandingProfile(userId = null) {
  if (shouldUseMockAPI()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: mockBrandingData,
        });
      }, 300);
    });
  }

  try {
    // Get user profile
    let userProfile = {};
    if (userId) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select(
          "first_name, last_name, email, phone, job_title, profile_avatar"
        )
        .eq("id", userId)
        .single();

      if (!userError && userData) {
        userProfile = {
          firstName: userData.first_name,
          lastName: userData.last_name,
          email: userData.email,
          phone: userData.phone,
          jobTitle: userData.job_title,
          profileAvatar: userData.profile_avatar,
        };
      }
    }

    // Get company/branding settings
    const { data: brandingData, error: brandingError } = await supabase
      .from("settings")
      .select("data")
      .eq("key", "branding")
      .single();

    let settings = {};
    if (!brandingError && brandingData) {
      settings = brandingData.data;
    }

    return {
      success: true,
      data: {
        ...mockBrandingData, // Use defaults
        ...settings, // Override with database settings
        ...userProfile, // Override with user profile
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to get branding profile",
    };
  }
}

/**
 * Update branding settings
 */
export async function updateBrandingSettings(updates) {
  if (shouldUseMockAPI()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        Object.assign(mockBrandingData, updates, {
          updatedAt: new Date().toISOString(),
        });

        resolve({
          success: true,
          data: mockBrandingData,
        });
      }, 500);
    });
  }

  try {
    // Check if settings record exists
    const { data: existing } = await supabase
      .from("settings")
      .select("id")
      .eq("key", "branding")
      .single();

    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from("settings")
        .update({ data: updatedData })
        .eq("key", "branding")
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data.data,
      };
    } else {
      // Create new record
      const { data, error } = await supabase
        .from("settings")
        .insert({
          key: "branding",
          data: updatedData,
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data.data,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to update branding settings",
    };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, profileUpdates) {
  if (shouldUseMockAPI()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        Object.assign(mockBrandingData, profileUpdates, {
          updatedAt: new Date().toISOString(),
        });

        resolve({
          success: true,
          data: mockBrandingData,
        });
      }, 500);
    });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .update({
        first_name: profileUpdates.firstName,
        last_name: profileUpdates.lastName,
        email: profileUpdates.email,
        phone: profileUpdates.phone,
        job_title: profileUpdates.jobTitle,
        profile_avatar: profileUpdates.profileAvatar,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: {
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        jobTitle: data.job_title,
        profileAvatar: data.profile_avatar,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to update user profile",
    };
  }
}

/**
 * Upload profile avatar
 */
export async function uploadProfileAvatar(userId, file) {
  if (shouldUseMockAPI()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock file upload
        const mockUrl = URL.createObjectURL(file);
        mockBrandingData.profileAvatar = mockUrl;

        resolve({
          success: true,
          data: {
            url: mockUrl,
            filename: file.name,
          },
        });
      }, 1000);
    });
  }

  try {
    const fileName = `avatars/${userId}_${Date.now()}_${file.name}`;

    // Upload to Supabase storage (if configured)
    const { error } = await supabase.storage
      .from("profiles")
      .upload(fileName, file);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("profiles")
      .getPublicUrl(fileName);

    // Update user profile with new avatar URL
    await supabase
      .from("users")
      .update({ profile_avatar: urlData.publicUrl })
      .eq("id", userId);

    return {
      success: true,
      data: {
        url: urlData.publicUrl,
        filename: fileName,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to upload avatar",
    };
  }
}

/**
 * Upload company logo
 */
export async function uploadCompanyLogo(file) {
  if (shouldUseMockAPI()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUrl = URL.createObjectURL(file);
        mockBrandingData.companyLogo = mockUrl;

        resolve({
          success: true,
          data: {
            url: mockUrl,
            filename: file.name,
          },
        });
      }, 1000);
    });
  }

  try {
    const fileName = `logos/company_${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from("branding")
      .upload(fileName, file);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const { data: urlData } = supabase.storage
      .from("branding")
      .getPublicUrl(fileName);

    // Update branding settings with new logo
    const brandingUpdate = await updateBrandingSettings({
      companyLogo: urlData.publicUrl,
    });

    if (!brandingUpdate.success) {
      return brandingUpdate;
    }

    return {
      success: true,
      data: {
        url: urlData.publicUrl,
        filename: fileName,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to upload logo",
    };
  }
}

/**
 * Reset branding to defaults
 */
export async function resetBrandingToDefaults() {
  if (shouldUseMockAPI()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        Object.assign(mockBrandingData, {
          primaryColor: "#3B82F6",
          secondaryColor: "#10B981",
          accentColor: "#F59E0B",
          theme: "light",
          updatedAt: new Date().toISOString(),
        });

        resolve({
          success: true,
          data: mockBrandingData,
        });
      }, 500);
    });
  }

  try {
    const defaultSettings = {
      primaryColor: "#3B82F6",
      secondaryColor: "#10B981",
      accentColor: "#F59E0B",
      theme: "light",
      updatedAt: new Date().toISOString(),
    };

    return await updateBrandingSettings(defaultSettings);
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to reset branding",
    };
  }
}

/**
 * Get theme colors
 */
export async function getThemeColors() {
  const profile = await getBrandingProfile();

  if (!profile.success) {
    // Return default colors
    return {
      success: true,
      data: {
        primary: "#3B82F6",
        secondary: "#10B981",
        accent: "#F59E0B",
      },
    };
  }

  return {
    success: true,
    data: {
      primary: profile.data.primaryColor || "#3B82F6",
      secondary: profile.data.secondaryColor || "#10B981",
      accent: profile.data.accentColor || "#F59E0B",
    },
  };
}

export default {
  getBrandingProfile,
  updateBrandingSettings,
  updateUserProfile,
  uploadProfileAvatar,
  uploadCompanyLogo,
  resetBrandingToDefaults,
  getThemeColors,
};
