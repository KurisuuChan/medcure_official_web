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
    // Try to get from Supabase first
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
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
        localStorage.setItem("medcure_user_profile", JSON.stringify(profile));
        return profile;
      } else {
        // Create default profile in database
        const defaultProfile = {
          id: user.id,
          full_name: user.user_metadata?.full_name || "",
          avatar_url: user.user_metadata?.avatar_url || "",
          email: user.email,
          phone: "",
          address: "",
        };

        await supabase.from("user_profiles").upsert({
          user_id: user.id,
          full_name: defaultProfile.full_name,
          avatar_url: defaultProfile.avatar_url,
          phone: defaultProfile.phone,
          address: defaultProfile.address,
        });

        localStorage.setItem(
          "medcure_user_profile",
          JSON.stringify(defaultProfile)
        );
        return defaultProfile;
      }
    }

    // Fallback to localStorage for demo purposes
    const stored = localStorage.getItem("medcure_user_profile");
    if (stored && stored !== "[object Object]") {
      try {
        return JSON.parse(stored);
      } catch (parseError) {
        console.warn(
          "Failed to parse user profile, using defaults:",
          parseError
        );
        localStorage.removeItem("medcure_user_profile"); // Clear corrupted data
      }
    }

    // Default profile
    const defaultProfile = {
      id: "demo-user",
      full_name: "",
      avatar_url: "",
      email: "admin@medcure.com",
      phone: "",
      address: "",
    };

    // Save default profile
    localStorage.setItem(
      "medcure_user_profile",
      JSON.stringify(defaultProfile)
    );
    return defaultProfile;
  } catch (error) {
    console.error("Error getting user profile:", error);

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem("medcure_user_profile");
      if (stored && stored !== "[object Object]") {
        return JSON.parse(stored);
      }
    } catch (parseError) {
      console.error("Error parsing stored profile:", parseError);
      localStorage.removeItem("medcure_user_profile"); // Clear corrupted data
    }

    // Return default profile
    const defaultProfile = {
      id: "demo-user",
      full_name: "",
      avatar_url: "",
      email: "admin@medcure.com",
      phone: "",
      address: "",
    };

    // Save default profile
    localStorage.setItem(
      "medcure_user_profile",
      JSON.stringify(defaultProfile)
    );
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
    // Try to update Supabase database first
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Update database
        const { error } = await supabase.from("user_profiles").upsert({
          user_id: user.id,
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
          phone: profileData.phone,
          address: profileData.address,
        });

        if (!error) {
          // Also update auth metadata if needed
          if (profileData.full_name || profileData.avatar_url) {
            await supabase.auth.updateUser({
              data: {
                full_name: profileData.full_name,
                avatar_url: profileData.avatar_url,
              },
            });
          }

          // Cache in localStorage
          const updatedProfile = {
            id: user.id,
            full_name: profileData.full_name,
            avatar_url: profileData.avatar_url,
            email: user.email,
            phone: profileData.phone || "",
            address: profileData.address || "",
          };

          localStorage.setItem(
            "medcure_user_profile",
            JSON.stringify(updatedProfile)
          );
          return updatedProfile;
        } else {
          throw error;
        }
      }
    } catch (authError) {
      console.warn(
        "Supabase database not available, using localStorage:",
        authError.message
      );
    }

    // Fallback to localStorage for demo purposes
    const currentProfile = await getUserProfile();
    const updatedProfile = {
      ...currentProfile,
      ...profileData,
    };

    const jsonString = JSON.stringify(updatedProfile);
    localStorage.setItem("medcure_user_profile", jsonString);
    return updatedProfile;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw new Error("Failed to update profile");
  }
}

/**
 * Upload and update profile picture
 * @param {File} file - Image file to upload
 * @returns {Promise<Object>} Result with avatar_url
 */
export async function updateProfilePicture(file) {
  try {
    let imageUrl;

    // Try to upload to Supabase Storage if available
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Upload to Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/avatar.${fileExt}`;

        const { error } = await supabase.storage
          .from("avatars")
          .upload(fileName, file, { upsert: true });

        if (!error) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("avatars").getPublicUrl(fileName);

          imageUrl = publicUrl;
          console.log("Profile picture uploaded to Supabase:", imageUrl);
        } else {
          throw error;
        }
      } else {
        throw new Error("No authenticated user");
      }
    } catch (authError) {
      console.warn(
        "Supabase storage not available, using local URL:",
        authError.message
      );
      // Fallback to local URL
      imageUrl = URL.createObjectURL(file);
      console.log("Using local blob URL for profile picture:", imageUrl);
    }

    // Update profile with new image URL
    await updateUserProfile({ avatar_url: imageUrl });
    return { avatar_url: imageUrl };
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
    // Try to get from Supabase first
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
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
        localStorage.setItem(
          "medcure_business_settings",
          JSON.stringify(settings)
        );
        return settings;
      } else {
        // Create default business settings in database
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

        await supabase.from("business_settings").upsert({
          user_id: user.id,
          ...defaultSettings,
        });

        localStorage.setItem(
          "medcure_business_settings",
          JSON.stringify(defaultSettings)
        );
        return defaultSettings;
      }
    }

    // Fallback to localStorage
    const stored = localStorage.getItem("medcure_business_settings");
    if (stored && stored !== "[object Object]") {
      try {
        return JSON.parse(stored);
      } catch (parseError) {
        console.warn(
          "Failed to parse business settings, using defaults:",
          parseError
        );
        localStorage.removeItem("medcure_business_settings"); // Clear corrupted data
      }
    }

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

    // Save default settings
    localStorage.setItem(
      "medcure_business_settings",
      JSON.stringify(defaultSettings)
    );
    return defaultSettings;
  } catch (error) {
    console.error("Error getting business settings:", error);
    return {
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
  }
}

/**
 * Update business settings
 * @param {Object} businessData - Business data to update
 * @returns {Promise<Object>} Updated business settings
 */
export async function updateBusinessSettings(businessData) {
  try {
    // Try to update Supabase database first
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Update database
        const { error } = await supabase.from("business_settings").upsert({
          user_id: user.id,
          ...businessData,
        });

        if (!error) {
          // Get current settings and merge with updates
          const currentSettings = await getBusinessSettings();
          const updatedSettings = { ...currentSettings, ...businessData };

          // Cache in localStorage
          localStorage.setItem(
            "medcure_business_settings",
            JSON.stringify(updatedSettings)
          );
          return updatedSettings;
        } else {
          throw error;
        }
      }
    } catch (authError) {
      console.warn(
        "Supabase database not available, using localStorage:",
        authError.message
      );
    }

    // Fallback to localStorage
    const currentSettings = await getBusinessSettings();
    const updatedSettings = { ...currentSettings, ...businessData };

    // Ensure we're storing valid JSON
    const jsonString = JSON.stringify(updatedSettings);
    localStorage.setItem("medcure_business_settings", jsonString);

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
    let logoUrl;

    // Try to upload to Supabase Storage if available
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Upload to Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `business/logo.${fileExt}`;

        const { error } = await supabase.storage
          .from("business-assets")
          .upload(fileName, file, { upsert: true });

        if (!error) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("business-assets").getPublicUrl(fileName);

          logoUrl = publicUrl;
          console.log("Business logo uploaded to Supabase:", logoUrl);
        } else {
          throw error;
        }
      } else {
        throw new Error("No authenticated user");
      }
    } catch (authError) {
      console.warn(
        "Supabase storage not available, using local URL:",
        authError.message
      );
      // Fallback to local URL
      logoUrl = URL.createObjectURL(file);
      console.log("Using local blob URL for business logo:", logoUrl);
    }

    // Update business settings
    await updateBusinessSettings({ logo_url: logoUrl });

    return { logo_url: logoUrl };
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
    // Try to get from Supabase first
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
        localStorage.setItem("medcure_app_settings", JSON.stringify(settings));
        return settings;
      } else {
        // Create default app settings in database
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

        await supabase.from("app_settings").upsert({
          user_id: user.id,
          ...defaultSettings,
        });

        localStorage.setItem(
          "medcure_app_settings",
          JSON.stringify(defaultSettings)
        );
        return defaultSettings;
      }
    }

    // Fallback to localStorage
    const stored = localStorage.getItem("medcure_app_settings");
    if (stored && stored !== "[object Object]") {
      try {
        return JSON.parse(stored);
      } catch (parseError) {
        console.warn(
          "Failed to parse app settings, using defaults:",
          parseError
        );
        localStorage.removeItem("medcure_app_settings"); // Clear corrupted data
      }
    }

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

    // Save default settings
    localStorage.setItem(
      "medcure_app_settings",
      JSON.stringify(defaultSettings)
    );
    return defaultSettings;
  } catch (error) {
    console.error("Error getting app settings:", error);
    return {
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
    // Try to update Supabase database first
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Update database
        const { error } = await supabase.from("app_settings").upsert({
          user_id: user.id,
          [key]: value,
        });

        if (!error) {
          // Get current settings and merge with updates
          const currentSettings = await getAppSettings();
          const updatedSettings = { ...currentSettings, [key]: value };

          // Cache in localStorage
          localStorage.setItem(
            "medcure_app_settings",
            JSON.stringify(updatedSettings)
          );
          return updatedSettings;
        } else {
          throw error;
        }
      }
    } catch (authError) {
      console.warn(
        "Supabase database not available, using localStorage:",
        authError.message
      );
    }

    // Fallback to localStorage
    const currentSettings = await getAppSettings();
    const updatedSettings = { ...currentSettings, [key]: value };

    // Ensure we're storing valid JSON
    const jsonString = JSON.stringify(updatedSettings);
    localStorage.setItem("medcure_app_settings", jsonString);

    return updatedSettings;
  } catch (error) {
    console.error("Error updating app setting:", error);
    throw new Error("Failed to update app setting");
  }
}
