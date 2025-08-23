import { adminClient } from "../config/supabase.js";

/**
 * Admin Storage Service - Uses service role for reliable uploads
 * This bypasses authentication requirements and provides admin-level access
 */

/**
 * Upload file with admin privileges (no auth required)
 * @param {File} file - File to upload
 * @param {string} bucketName - Target bucket name
 * @param {string} folder - Optional folder path
 * @returns {Promise<Object>} Upload result with URL
 */
export async function adminUploadFile(file, bucketName, folder = "") {
  try {
    console.log(`🔧 Admin upload to ${bucketName}/${folder}...`);

    // Validate file
    if (!file || !file.name) {
      throw new Error("Invalid file provided");
    }

    console.log("📄 File details:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Ensure buckets exist with admin privileges
    await ensureAdminBuckets();

    // Generate unique file path
    const fileExt = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileName = folder
      ? `${folder}/${timestamp}-${randomId}.${fileExt}`
      : `${timestamp}-${randomId}.${fileExt}`;

    console.log("📁 Admin upload path:", fileName);

    // Upload with admin client (bypasses auth and policies)
    const { data, error } = await adminClient.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("❌ Admin upload failed:", error);
      throw error;
    }

    console.log("✅ Admin upload successful:", data);

    // Get public URL
    const {
      data: { publicUrl },
    } = adminClient.storage.from(bucketName).getPublicUrl(fileName);

    console.log("🔗 Public URL:", publicUrl);

    return {
      success: true,
      url: publicUrl,
      path: fileName,
      data: data,
    };
  } catch (error) {
    console.error("❌ Admin upload error:", error);
    return {
      success: false,
      error: error.message,
      details: error,
    };
  }
}

/**
 * Ensure storage buckets exist with admin privileges
 */
async function ensureAdminBuckets() {
  try {
    console.log("🔧 Ensuring admin buckets exist...");

    const requiredBuckets = [
      { id: "avatars", name: "avatars" },
      { id: "business-assets", name: "business-assets" },
    ];

    for (const bucket of requiredBuckets) {
      // Check if bucket exists
      const { data: existingBucket } = await adminClient.storage.getBucket(
        bucket.id
      );

      if (!existingBucket) {
        console.log(`Creating ${bucket.name} bucket with admin privileges...`);
        const { error } = await adminClient.storage.createBucket(bucket.id, {
          public: true,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: ["image/*"],
        });

        if (error) {
          console.warn(`Could not create ${bucket.name} bucket:`, error);
        } else {
          console.log(`✅ Created ${bucket.name} bucket`);
        }
      }
    }

    return true;
  } catch (error) {
    console.warn("Admin bucket creation failed:", error);
    return false;
  }
}

/**
 * Admin upload for profile pictures
 * @param {File} file - Image file
 * @returns {Promise<string>} Public URL of uploaded image
 */
export async function adminUploadProfilePicture(file) {
  console.log("👤 Admin uploading profile picture...");

  const result = await adminUploadFile(file, "avatars", "profiles/admin");

  if (result.success) {
    console.log("✅ Admin profile picture uploaded:", result.url);
    return result.url;
  } else {
    console.error("❌ Admin profile upload failed:", result.error);
    throw new Error(`Admin upload failed: ${result.error}`);
  }
}

/**
 * Admin upload for business logos
 * @param {File} file - Image file
 * @returns {Promise<string>} Public URL of uploaded image
 */
export async function adminUploadBusinessLogo(file) {
  console.log("🏢 Admin uploading business logo...");

  const result = await adminUploadFile(file, "business-assets", "business");

  if (result.success) {
    console.log("✅ Admin business logo uploaded:", result.url);
    return result.url;
  } else {
    console.error("❌ Admin business upload failed:", result.error);
    throw new Error(`Admin upload failed: ${result.error}`);
  }
}

/**
 * Test admin upload capabilities
 */
export async function testAdminUpload() {
  try {
    console.log("🧪 Testing admin upload capabilities...");

    // Create test file
    const testContent = "Admin test upload from MedCure";
    const testFile = new File([testContent], "admin-test.txt", {
      type: "text/plain",
    });

    const result = await adminUploadFile(testFile, "avatars", "test");

    if (result.success) {
      console.log("✅ Admin upload test successful! 🎉");
      console.log("🔗 Test file URL:", result.url);
      return true;
    } else {
      console.error("❌ Admin upload test failed:", result.error);
      return false;
    }
  } catch (error) {
    console.error("❌ Admin test error:", error);
    return false;
  }
}

/**
 * List all files in a bucket (admin access)
 * @param {string} bucketName - Bucket to list
 * @param {string} folder - Optional folder path
 * @returns {Promise<Array>} List of files
 */
export async function adminListFiles(bucketName, folder = "") {
  try {
    console.log(`📋 Admin listing files in ${bucketName}/${folder}...`);

    const { data: files, error } = await adminClient.storage
      .from(bucketName)
      .list(folder);

    if (error) {
      console.error("❌ Admin list failed:", error);
      return [];
    }

    console.log(`✅ Found ${files.length} files`);
    return files || [];
  } catch (error) {
    console.error("❌ Admin list error:", error);
    return [];
  }
}

/**
 * Delete file with admin privileges
 * @param {string} bucketName - Bucket name
 * @param {string} filePath - File path to delete
 * @returns {Promise<boolean>} Success status
 */
export async function adminDeleteFile(bucketName, filePath) {
  try {
    console.log(`🗑️ Admin deleting ${bucketName}/${filePath}...`);

    const { error } = await adminClient.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error("❌ Admin delete failed:", error);
      return false;
    }

    console.log("✅ Admin delete successful");
    return true;
  } catch (error) {
    console.error("❌ Admin delete error:", error);
    return false;
  }
}
