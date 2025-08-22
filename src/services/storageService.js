import { supabase } from "../config/supabase.js";

/**
 * Storage Service for MedCure - Handle file uploads and management
 * Supports profile pictures, logos, branding assets, and product images
 */

// =====================================================
// CONFIGURATION
// =====================================================

const STORAGE_CONFIG = {
  buckets: {
    profiles: {
      name: "profiles",
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    },
    logos: {
      name: "logos",
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/svg+xml",
        "image/gif",
      ],
    },
    branding: {
      name: "branding",
      maxSize: 20 * 1024 * 1024, // 20MB
      allowedTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/svg+xml",
        "image/gif",
        "application/pdf",
      ],
    },
    products: {
      name: "products",
      maxSize: 15 * 1024 * 1024, // 15MB
      allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    },
  },
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @param {string} bucketType - Type of bucket (profiles, logos, branding, products)
 * @returns {object} Validation result
 */
function validateFile(file, bucketType) {
  const config = STORAGE_CONFIG.buckets[bucketType];

  if (!config) {
    return { valid: false, error: "Invalid bucket type" };
  }

  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (file.size > config.maxSize) {
    const sizeMB = (config.maxSize / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File size exceeds ${sizeMB}MB limit` };
  }

  if (!config.allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} not allowed` };
  }

  return { valid: true };
}

/**
 * Generate unique filename
 * @param {string} originalName - Original filename
 * @param {string} prefix - Optional prefix
 * @returns {string} Unique filename
 */
function generateUniqueFilename(originalName, prefix = "") {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const extension = originalName.split(".").pop();
  return `${prefix}${timestamp}_${random}.${extension}`;
}

// =====================================================
// PROFILE PICTURES
// =====================================================

/**
 * Upload profile picture for a user
 * @param {File} file - Image file
 * @param {string} userId - User ID
 * @returns {Promise<object>} Upload result with URL
 */
export async function uploadProfilePicture(file, userId) {
  try {
    const validation = validateFile(file, "profiles");
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Generate filename: userId/timestamp_random.ext
    const filename = generateUniqueFilename(file.name);
    const filepath = `${userId}/${filename}`;

    // Clean up old profile pictures first
    try {
      await cleanupOldProfilePictures(userId);
    } catch (cleanupError) {
      console.warn("Failed to cleanup old profile pictures:", cleanupError);
    }

    // Upload new file
    const { data, error } = await supabase.storage
      .from("profiles")
      .upload(filepath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("profiles")
      .getPublicUrl(filepath);

    return {
      success: true,
      data: {
        path: data.path,
        url: urlData.publicUrl,
        filename: filename,
      },
    };
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get profile picture URL
 * @param {string} userId - User ID
 * @param {string} filename - Optional specific filename
 * @returns {Promise<string|null>} Profile picture URL or null
 */
export async function getProfilePictureUrl(userId, filename = null) {
  try {
    if (filename) {
      const { data } = supabase.storage
        .from("profiles")
        .getPublicUrl(`${userId}/${filename}`);
      return data.publicUrl;
    }

    // Get the latest profile picture
    const { data: files, error } = await supabase.storage
      .from("profiles")
      .list(userId, {
        limit: 1,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error || !files || files.length === 0) {
      return null;
    }

    const { data } = supabase.storage
      .from("profiles")
      .getPublicUrl(`${userId}/${files[0].name}`);

    return data.publicUrl;
  } catch (error) {
    console.error("Error getting profile picture URL:", error);
    return null;
  }
}

/**
 * Cleanup old profile pictures for a user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Cleanup result
 */
export async function cleanupOldProfilePictures(userId) {
  try {
    const { data: files, error } = await supabase.storage
      .from("profiles")
      .list(userId);

    if (error || !files || files.length <= 1) {
      return { deleted: 0 };
    }

    // Keep only the latest file, delete the rest
    const sortedFiles = files.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    const filesToDelete = sortedFiles
      .slice(1)
      .map((file) => `${userId}/${file.name}`);

    if (filesToDelete.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from("profiles")
        .remove(filesToDelete);

      if (deleteError) throw deleteError;
    }

    return { deleted: filesToDelete.length };
  } catch (error) {
    console.error("Error cleaning up profile pictures:", error);
    throw error;
  }
}

// =====================================================
// LOGOS
// =====================================================

/**
 * Upload company logo
 * @param {File} file - Logo file
 * @param {string} logoType - Type of logo (main-logo, small-logo, etc.)
 * @returns {Promise<object>} Upload result
 */
export async function uploadLogo(file, logoType = "main-logo") {
  try {
    const validation = validateFile(file, "logos");
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const extension = file.name.split(".").pop();
    const filename = `${logoType}.${extension}`;

    const { data, error } = await supabase.storage
      .from("logos")
      .upload(filename, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("logos")
      .getPublicUrl(filename);

    // Update app settings with new logo URL
    await updateAppSetting("company_logo_url", urlData.publicUrl);

    return {
      success: true,
      data: {
        path: data.path,
        url: urlData.publicUrl,
        filename: filename,
      },
    };
  } catch (error) {
    console.error("Error uploading logo:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get logo URL
 * @param {string} logoType - Type of logo
 * @returns {Promise<string|null>} Logo URL
 */
export async function getLogoUrl(logoType = "main-logo") {
  try {
    // First try to get from app_settings
    const { data: settings } = await supabase
      .from("app_settings")
      .select("setting_value")
      .eq("setting_key", "company_logo_url")
      .single();

    if (settings?.setting_value) {
      return settings.setting_value;
    }

    // Fallback to direct storage check
    const { data } = supabase.storage
      .from("logos")
      .getPublicUrl(`${logoType}.png`);

    return data.publicUrl;
  } catch (error) {
    console.error("Error getting logo URL:", error);
    return null;
  }
}

// =====================================================
// BRANDING ASSETS
// =====================================================

/**
 * Upload branding asset
 * @param {File} file - Asset file
 * @param {string} assetName - Name for the asset
 * @returns {Promise<object>} Upload result
 */
export async function uploadBrandingAsset(file, assetName) {
  try {
    const validation = validateFile(file, "branding");
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const filename = generateUniqueFilename(file.name, `${assetName}_`);

    const { data, error } = await supabase.storage
      .from("branding")
      .upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("branding")
      .getPublicUrl(filename);

    return {
      success: true,
      data: {
        path: data.path,
        url: urlData.publicUrl,
        filename: filename,
      },
    };
  } catch (error) {
    console.error("Error uploading branding asset:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * List all branding assets
 * @returns {Promise<Array>} Array of branding assets
 */
export async function listBrandingAssets() {
  try {
    const { data: files, error } = await supabase.storage
      .from("branding")
      .list("", {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) throw error;

    return files.map((file) => ({
      name: file.name,
      size: file.metadata?.size,
      type: file.metadata?.mimetype,
      created_at: file.created_at,
      url: supabase.storage.from("branding").getPublicUrl(file.name).data
        .publicUrl,
    }));
  } catch (error) {
    console.error("Error listing branding assets:", error);
    return [];
  }
}

// =====================================================
// PRODUCT IMAGES
// =====================================================

/**
 * Upload product image
 * @param {File} file - Image file
 * @param {string} productId - Product ID
 * @returns {Promise<object>} Upload result
 */
export async function uploadProductImage(file, productId) {
  try {
    const validation = validateFile(file, "products");
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const filename = generateUniqueFilename(file.name, `product_${productId}_`);
    const filepath = `${productId}/${filename}`;

    const { data, error } = await supabase.storage
      .from("products")
      .upload(filepath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("products")
      .getPublicUrl(filepath);

    return {
      success: true,
      data: {
        path: data.path,
        url: urlData.publicUrl,
        filename: filename,
      },
    };
  } catch (error) {
    console.error("Error uploading product image:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Update app setting
 * @param {string} key - Setting key
 * @param {string} value - Setting value
 * @returns {Promise<boolean>} Success status
 */
async function updateAppSetting(key, value) {
  try {
    const { error } = await supabase.from("app_settings").upsert({
      setting_key: key,
      setting_value: value,
      updated_at: new Date().toISOString(),
    });

    return !error;
  } catch (error) {
    console.error("Error updating app setting:", error);
    return false;
  }
}

/**
 * Delete file from storage
 * @param {string} bucket - Bucket name
 * @param {string} filepath - File path
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFile(bucket, filepath) {
  try {
    const { error } = await supabase.storage.from(bucket).remove([filepath]);

    return !error;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
}

/**
 * Get storage usage statistics
 * @returns {Promise<object>} Storage statistics
 */
export async function getStorageStats() {
  try {
    const stats = {};

    for (const [bucketName, config] of Object.entries(STORAGE_CONFIG.buckets)) {
      const { data: files, error } = await supabase.storage
        .from(bucketName)
        .list("", { limit: 1000 });

      if (!error && files) {
        const totalSize = files.reduce(
          (sum, file) => sum + (file.metadata?.size || 0),
          0
        );
        stats[bucketName] = {
          fileCount: files.length,
          totalSize: totalSize,
          totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
          maxSizeMB: (config.maxSize / (1024 * 1024)).toFixed(1),
        };
      }
    }

    return stats;
  } catch (error) {
    console.error("Error getting storage stats:", error);
    return {};
  }
}

export default {
  uploadProfilePicture,
  getProfilePictureUrl,
  cleanupOldProfilePictures,
  uploadLogo,
  getLogoUrl,
  uploadBrandingAsset,
  listBrandingAssets,
  uploadProductImage,
  deleteFile,
  getStorageStats,
};
