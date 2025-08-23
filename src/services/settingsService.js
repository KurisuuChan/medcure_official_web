import { supabase } from "../config/supabase.js";
import { ensureSession, getCurrentUserId } from "./authService.js";
import {
  adminUploadProfilePicture,
  adminUploadBusinessLogo,
} from "./adminStorageService.js";

/**
 * Settings Service for MedCure - Enhanced with better persistence
 * Handles user profile, business settings, and file uploads with reliable fallbacks
 */

// Storage keys for localStorage fallbacks
const STORAGE_KEYS = {
  USER_PROFILE: "medcure_user_profile",
  BUSINESS_SETTINGS: "medcure_business_settings",
  APP_SETTINGS: "medcure_app_settings",
};

/**
 * Safe localStorage operations with error handling
 */
const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item || item === "[object Object]" || item === "undefined") {
        return null;
      }
      return JSON.parse(item);
    } catch (error) {
      console.warn(`Failed to parse ${key} from localStorage:`, error);
      localStorage.removeItem(key); // Clear corrupted data
      return null;
    }
  },

  set: (key, value) => {
    try {
      if (value && typeof value === "object") {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      }
      return false;
    } catch (error) {
      console.warn(`Failed to save ${key} to localStorage:`, error);
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove ${key} from localStorage:`, error);
    }
  },
};

/**
 * Check and create storage buckets if they don't exist
 */
async function ensureStorageBuckets() {
  try {
    // Check if avatars bucket exists
    const { data: avatarsBucket } = await supabase.storage.getBucket("avatars");
    if (!avatarsBucket) {
      console.log("Creating avatars bucket...");
      await supabase.storage.createBucket("avatars", { public: true });
    }

    // Check if business-assets bucket exists
    const { data: businessBucket } = await supabase.storage.getBucket(
      "business-assets"
    );
    if (!businessBucket) {
      console.log("Creating business-assets bucket...");
      await supabase.storage.createBucket("business-assets", { public: true });
    }

    return true;
  } catch (error) {
    console.warn("Could not create storage buckets:", error);
    return false;
  }
}

/**
 * Convert file to base64 for persistent storage
 * @param {File} file - File to convert
 * @returns {Promise<string>} Base64 data URL
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get current user profile
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfile() {
  try {
    // Try to get from Supabase first
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        console.log("Authenticated user found:", user.id);

        // Get profile from database
        const { data: profileData, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!error && profileData) {
          const profile = {
            id: user.id,
            full_name: profileData.full_name || "",
            avatar_url: profileData.avatar_url || "",
            email: user.email,
            phone: profileData.phone || "",
            address: profileData.address || "",
          };

          // Cache in localStorage
          storage.set(STORAGE_KEYS.USER_PROFILE, profile);
          console.log("Profile loaded from database:", profile);
          return profile;
        } else {
          console.log(
            "No profile found in database, creating default profile for user:",
            user.id
          );

          // Create default profile in database
          const profileForDb = {
            id: user.id,
            full_name: user.user_metadata?.full_name || "",
            avatar_url: user.user_metadata?.avatar_url || "",
            email: user.email,
            phone: "",
            address: "",
          };

          // Try to create in database
          try {
            const { error: insertError } = await supabase
              .from("user_profiles")
              .upsert({
                user_id: user.id,
                full_name: profileForDb.full_name,
                avatar_url: profileForDb.avatar_url,
                phone: profileForDb.phone,
                address: profileForDb.address,
              });

            if (insertError) {
              console.warn(
                "Could not create user profile in database:",
                insertError
              );
            } else {
              console.log("Created new profile in database for user:", user.id);
            }
          } catch (insertError) {
            console.warn(
              "Could not create user profile in database:",
              insertError
            );
          }

          storage.set(STORAGE_KEYS.USER_PROFILE, profileForDb);
          return profileForDb;
        }
      } else {
        console.log("No authenticated user found, using localStorage fallback");
      }
    } catch (authError) {
      console.warn(
        "Database not available or auth error, using localStorage fallback:",
        authError
      );
    }

    // Fallback to localStorage
    const storedProfile = storage.get(STORAGE_KEYS.USER_PROFILE);
    if (storedProfile) {
      console.log("Using stored profile from localStorage:", storedProfile);
      return storedProfile;
    }

    // Default profile for demo/fallback mode
    const defaultProfile = {
      id: "demo-user",
      full_name: "",
      avatar_url: "",
      email: "admin@medcure.com",
      phone: "",
      address: "",
    };

    // Save and return default profile
    storage.set(STORAGE_KEYS.USER_PROFILE, defaultProfile);
    console.log("Using default profile:", defaultProfile);
    return defaultProfile;
  } catch (error) {
    console.error("Error getting user profile:", error);

    // Final fallback - check localStorage one more time
    const storedProfile = storage.get(STORAGE_KEYS.USER_PROFILE);
    if (storedProfile) {
      return storedProfile;
    }

    // Return and save default profile
    const defaultProfile = {
      id: "demo-user",
      full_name: "",
      avatar_url: "",
      email: "admin@medcure.com",
      phone: "",
      address: "",
    };

    storage.set(STORAGE_KEYS.USER_PROFILE, defaultProfile);
    return defaultProfile;
  }
}

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated profile
 */
export async function updateUserProfile(profileData) {
  try {
    console.log("Updating user profile with data:", profileData);

    // Get current profile
    const currentProfile = await getUserProfile();
    const updatedProfile = { ...currentProfile, ...profileData };

    // Try to update database first
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        console.log("Updating profile in database for user:", user.id);

        // Update database using upsert with conflict resolution
        const { data, error } = await supabase
          .from("user_profiles")
          .upsert(
            {
              user_id: user.id,
              full_name: updatedProfile.full_name,
              avatar_url: updatedProfile.avatar_url,
              phone: updatedProfile.phone || "",
              address: updatedProfile.address || "",
            },
            {
              onConflict: "user_id",
              ignoreDuplicates: false,
            }
          )
          .select()
          .single();

        if (!error) {
          console.log("Profile updated successfully in database:", data);

          // Also update auth metadata if needed
          if (updatedProfile.full_name || updatedProfile.avatar_url) {
            const { error: authError } = await supabase.auth.updateUser({
              data: {
                full_name: updatedProfile.full_name,
                avatar_url: updatedProfile.avatar_url,
              },
            });

            if (authError) {
              console.warn("Could not update auth metadata:", authError);
            } else {
              console.log("Auth metadata updated successfully");
            }
          }
        } else {
          console.warn(
            "Database update failed, proceeding with localStorage:",
            error
          );
        }
      } else {
        console.log("No authenticated user, updating localStorage only");
      }
    } catch (authError) {
      console.warn("Database not available, using localStorage:", authError);
    }

    // Always save to localStorage as a reliable fallback
    storage.set(STORAGE_KEYS.USER_PROFILE, updatedProfile);

    // Dispatch custom event for immediate UI updates
    window.dispatchEvent(
      new CustomEvent("settingsUpdated", {
        detail: { type: "profile", data: updatedProfile },
      })
    );

    console.log("Profile updated successfully:", updatedProfile);
    return updatedProfile;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw new Error("Failed to update profile");
  }
}

/**
 * Upload and update profile picture with authentication
 * @param {File} file - Image file to upload
 * @returns {Promise<Object>} Result with avatar_url
 */
export async function updateProfilePicture(file) {
  try {
    let imageUrl;

    // Try admin upload first (most reliable)
    try {
      console.log("🔧 Attempting admin profile picture upload...");
      imageUrl = await adminUploadProfilePicture(file);
      console.log("✅ Admin upload successful:", imageUrl);
    } catch (adminError) {
      console.warn(
        "⚠️ Admin upload failed, trying regular upload:",
        adminError.message
      );

      // Fallback to regular authenticated upload
      try {
        await ensureSession();
        console.log("Attempting regular Supabase profile picture upload...");

        await ensureStorageBuckets();
        const userId = await getCurrentUserId();

        const fileExt = file.name.split(".").pop() || "jpg";
        const fileName = `profiles/${userId}/avatar-${Date.now()}.${fileExt}`;

        console.log("Uploading profile picture to Supabase:", fileName);

        const { data, error } = await supabase.storage
          .from("avatars")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (!error && data) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("avatars").getPublicUrl(fileName);

          imageUrl = publicUrl;
          console.log(
            "✅ Profile picture uploaded to Supabase successfully:",
            imageUrl
          );
        } else {
          console.error("❌ Supabase upload error:", error);
          throw error;
        }
      } catch (storageError) {
        console.warn(
          "⚠️ Supabase storage not available, using base64 encoding:",
          storageError.message
        );
        // Fallback to base64 encoding for persistence
        imageUrl = await fileToBase64(file);
        console.log("📁 Using base64 encoded image for profile picture");
      }
    }

    // Update profile with new image URL
    await updateUserProfile({ avatar_url: imageUrl });
    return { avatar_url: imageUrl };
  } catch (error) {
    console.error("❌ Error uploading profile picture:", error);
    throw new Error("Failed to upload profile picture");
  }
}

/**
 * Get business settings
 * @returns {Promise<Object>} Business settings
 */
export async function getBusinessSettings() {
  try {
    // Default business settings
    const defaultSettings = {
      business_name: "MedCure Pharmacy",
      logo_url: "",
      tagline: "Your Trusted Healthcare Partner",
      address: "",
      phone: "",
      email: "",
      primary_color: "#2563eb",
      website: "",
      registration_number: "",
      tax_id: "",
    };

    // Try to get from Supabase first
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        console.log("Getting business settings for user:", user.id);

        // Get business settings from database
        const { data: businessData, error } = await supabase
          .from("business_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!error && businessData) {
          const settings = {
            business_name: businessData.business_name || "MedCure Pharmacy",
            logo_url: businessData.logo_url || "",
            tagline: businessData.tagline || "Your Trusted Healthcare Partner",
            address: businessData.address || "",
            phone: businessData.phone || "",
            email: businessData.email || "",
            primary_color: businessData.primary_color || "#2563eb",
            website: businessData.website || "",
            registration_number: businessData.registration_number || "",
            tax_id: businessData.tax_id || "",
          };

          // Cache in localStorage
          storage.set(STORAGE_KEYS.BUSINESS_SETTINGS, settings);
          console.log("Business settings loaded from database:", settings);
          return settings;
        } else {
          console.log(
            "No business settings found in database, creating defaults for user:",
            user.id
          );

          // Create default business settings in database
          try {
            const { error: insertError } = await supabase
              .from("business_settings")
              .upsert({
                user_id: user.id,
                ...defaultSettings,
              });

            if (insertError) {
              console.warn(
                "Could not create business settings in database:",
                insertError
              );
            } else {
              console.log(
                "Created default business settings in database for user:",
                user.id
              );
            }
          } catch (insertError) {
            console.warn(
              "Could not create business settings in database:",
              insertError
            );
          }

          storage.set(STORAGE_KEYS.BUSINESS_SETTINGS, defaultSettings);
          return defaultSettings;
        }
      } else {
        console.log(
          "No authenticated user found, using localStorage fallback for business settings"
        );
      }
    } catch (authError) {
      console.warn(
        "Database not available or auth error, using localStorage fallback:",
        authError
      );
    }

    // Fallback to localStorage
    const storedSettings = storage.get(STORAGE_KEYS.BUSINESS_SETTINGS);
    if (storedSettings) {
      console.log(
        "Using stored business settings from localStorage:",
        storedSettings
      );
      return storedSettings;
    }

    // Save and return default settings
    storage.set(STORAGE_KEYS.BUSINESS_SETTINGS, defaultSettings);
    console.log("Using default business settings:", defaultSettings);
    return defaultSettings;
  } catch (error) {
    console.error("Error getting business settings:", error);

    // Final fallback
    const storedSettings = storage.get(STORAGE_KEYS.BUSINESS_SETTINGS);
    if (storedSettings) {
      return storedSettings;
    }

    // Return default settings
    const defaultSettings = {
      business_name: "MedCure Pharmacy",
      logo_url: "",
      tagline: "Your Trusted Healthcare Partner",
      address: "",
      phone: "",
      email: "",
      primary_color: "#2563eb",
      website: "",
      registration_number: "",
      tax_id: "",
    };

    storage.set(STORAGE_KEYS.BUSINESS_SETTINGS, defaultSettings);
    return defaultSettings;
  }
}

/**
 * Update business settings
 * @param {Object} businessData - Business data to update
 * @returns {Promise<Object>} Updated business settings
 */
export async function updateBusinessSettings(businessData) {
  try {
    console.log("Updating business settings with data:", businessData);

    // Get current settings and merge with updates
    const currentSettings = await getBusinessSettings();
    const updatedSettings = { ...currentSettings, ...businessData };

    // Try to update database first
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        console.log(
          "Updating business settings in database for user:",
          user.id
        );

        // Update database using upsert with conflict resolution
        const { data, error } = await supabase
          .from("business_settings")
          .upsert(
            {
              user_id: user.id,
              ...updatedSettings,
            },
            {
              onConflict: "user_id",
              ignoreDuplicates: false,
            }
          )
          .select()
          .single();

        if (error) {
          console.warn(
            "Database update failed, proceeding with localStorage:",
            error
          );
        } else {
          console.log("Business settings updated successfully in database:", data);
        }
      } else {
        console.log("No authenticated user, updating localStorage only");
      }
    } catch (authError) {
      console.warn("Database not available, using localStorage:", authError);
    }

    // Always save to localStorage as a reliable fallback
    storage.set(STORAGE_KEYS.BUSINESS_SETTINGS, updatedSettings);

    // Dispatch custom event for immediate UI updates
    window.dispatchEvent(
      new CustomEvent("settingsUpdated", {
        detail: { type: "business", data: updatedSettings },
      })
    );

    console.log("Business settings updated successfully:", updatedSettings);
    return updatedSettings;
  } catch (error) {
    console.error("Error updating business settings:", error);
    throw new Error("Failed to update business settings");
  }
}

/**
 * Upload and update business logo with authentication
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} URL of uploaded logo
 */
export async function updateBusinessLogo(file) {
  try {
    let logoUrl;

    // Try admin upload first (most reliable)
    try {
      console.log("🔧 Attempting admin business logo upload...");
      logoUrl = await adminUploadBusinessLogo(file);
      console.log("✅ Admin logo upload successful:", logoUrl);
    } catch (adminError) {
      console.warn(
        "⚠️ Admin upload failed, trying regular upload:",
        adminError.message
      );

      // Fallback to regular authenticated upload
      try {
        await ensureSession();
        console.log("Attempting regular Supabase business logo upload...");

        await ensureStorageBuckets();

        const fileExt = file.name.split(".").pop() || "png";
        const fileName = `business/logo-${Date.now()}.${fileExt}`;

        console.log("Uploading business logo to Supabase:", fileName);

        const { data, error } = await supabase.storage
          .from("business-assets")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (!error && data) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("business-assets").getPublicUrl(fileName);

          logoUrl = publicUrl;
          console.log(
            "✅ Business logo uploaded to Supabase successfully:",
            logoUrl
          );
        } else {
          console.error("❌ Supabase logo upload error:", error);
          throw error;
        }
      } catch (storageError) {
        console.warn(
          "⚠️ Supabase storage not available, using base64 encoding:",
          storageError.message
        );
        // Fallback to base64 encoding for persistence
        logoUrl = await fileToBase64(file);
        console.log("📁 Using base64 encoded image for business logo");
      }
    }

    // Update business settings
    await updateBusinessSettings({ logo_url: logoUrl });
    return { logo_url: logoUrl };
  } catch (error) {
    console.error("❌ Error uploading business logo:", error);
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
    // Default app settings
    const defaultSettings = {
      theme: "light",
      currency: "PHP",
      timezone: "Asia/Manila",
      language: "en",
      notifications: true,
      sound_enabled: true,
      auto_backup: true,
      low_stock_threshold: 10,
      expiry_warning_days: 30,
    };

    // Try to get from Supabase first
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Get app settings from database
        const { data: appData, error } = await supabase
          .from("app_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!error && appData) {
          const settings = {
            theme: appData.theme || "light",
            currency: appData.currency || "PHP",
            timezone: appData.timezone || "Asia/Manila",
            language: appData.language || "en",
            notifications: appData.notifications ?? true,
            sound_enabled: appData.sound_enabled ?? true,
            auto_backup: appData.auto_backup ?? true,
            low_stock_threshold: appData.low_stock_threshold || 10,
            expiry_warning_days: appData.expiry_warning_days || 30,
          };

          // Cache in localStorage
          storage.set(STORAGE_KEYS.APP_SETTINGS, settings);
          return settings;
        } else {
          // Create default app settings in database
          try {
            await supabase.from("app_settings").upsert({
              user_id: user.id,
              ...defaultSettings,
            });
          } catch (insertError) {
            console.warn(
              "Could not create app settings in database:",
              insertError
            );
          }

          storage.set(STORAGE_KEYS.APP_SETTINGS, defaultSettings);
          return defaultSettings;
        }
      }
    } catch (authError) {
      console.warn(
        "Database not available, using localStorage fallback:",
        authError
      );
    }

    // Fallback to localStorage
    const storedSettings = storage.get(STORAGE_KEYS.APP_SETTINGS);
    if (storedSettings) {
      return storedSettings;
    }

    // Save and return default settings
    storage.set(STORAGE_KEYS.APP_SETTINGS, defaultSettings);
    return defaultSettings;
  } catch (error) {
    console.error("Error getting app settings:", error);

    // Final fallback
    const storedSettings = storage.get(STORAGE_KEYS.APP_SETTINGS);
    if (storedSettings) {
      return storedSettings;
    }

    // Return default settings
    const defaultSettings = {
      theme: "light",
      currency: "PHP",
      timezone: "Asia/Manila",
      language: "en",
      notifications: true,
      sound_enabled: true,
      auto_backup: true,
      low_stock_threshold: 10,
      expiry_warning_days: 30,
    };

    storage.set(STORAGE_KEYS.APP_SETTINGS, defaultSettings);
    return defaultSettings;
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
    // Get current settings and merge with updates
    const currentSettings = await getAppSettings();
    const updatedSettings = { ...currentSettings, [key]: value };

    // Try to update database first
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Update database
        const { error } = await supabase.from("app_settings").upsert({
          user_id: user.id,
          ...updatedSettings,
        });

        if (error) {
          console.warn(
            "Database update failed, proceeding with localStorage:",
            error
          );
        }
      }
    } catch (authError) {
      console.warn("Database not available, using localStorage:", authError);
    }

    // Always save to localStorage as a reliable fallback
    storage.set(STORAGE_KEYS.APP_SETTINGS, updatedSettings);

    console.log(`App setting ${key} updated successfully:`, value);
    return updatedSettings;
  } catch (error) {
    console.error("Error updating app setting:", error);
    throw new Error("Failed to update app setting");
  }
}
