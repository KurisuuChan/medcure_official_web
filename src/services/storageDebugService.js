// Enhanced storage upload service for debugging upload issues
import { supabase } from "../config/supabase.js";

/**
 * Debug storage configuration and test upload capability
 */
export async function debugStorageSetup() {
  console.log("🔍 Debugging Supabase Storage Setup...");

  try {
    // Test 1: Check bucket access
    console.log("📁 Testing bucket access...");
    const { data: buckets, error: bucketError } =
      await supabase.storage.listBuckets();

    if (bucketError) {
      console.error("❌ Cannot access storage buckets:", bucketError);
      return false;
    }

    console.log("✅ Available buckets:", buckets?.map((b) => b.name) || []);

    // Test 2: Check specific buckets
    const requiredBuckets = ["avatars", "business-assets"];
    const existingBuckets = buckets?.map((b) => b.name) || [];
    const missingBuckets = requiredBuckets.filter(
      (bucket) => !existingBuckets.includes(bucket)
    );

    if (missingBuckets.length > 0) {
      console.warn("⚠️ Missing buckets:", missingBuckets);
      return false;
    }

    // Test 3: Try to list files in avatars bucket
    console.log("📋 Testing bucket file listing...");
    const { data: files, error: listError } = await supabase.storage
      .from("avatars")
      .list("", { limit: 1 });

    if (listError) {
      console.error("❌ Cannot list files in avatars bucket:", listError);
      return false;
    }

    console.log("✅ Can access avatars bucket, files:", files?.length || 0);

    // Test 4: Check authentication
    console.log("🔐 Testing authentication...");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.warn("⚠️ Auth error:", authError);
    }

    if (user) {
      console.log("✅ User authenticated:", user.id);
    } else {
      console.log("ℹ️ No authenticated user (using anonymous/service mode)");
    }

    console.log("✅ Storage setup looks good!");
    return true;
  } catch (error) {
    console.error("❌ Storage debug failed:", error);
    return false;
  }
}

/**
 * Enhanced file upload with better error handling and debugging
 */
export async function uploadFileToStorage(file, bucketName, folder = "") {
  console.log(`🚀 Starting upload to ${bucketName}/${folder}...`);

  try {
    // Step 1: Validate file
    if (!file || !file.name) {
      throw new Error("Invalid file provided");
    }

    console.log("📄 File details:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Step 2: Check storage setup
    const setupOk = await debugStorageSetup();
    if (!setupOk) {
      throw new Error("Storage setup issues detected");
    }

    // Step 3: Generate file path
    const fileExt = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileName = folder
      ? `${folder}/${timestamp}-${randomId}.${fileExt}`
      : `${timestamp}-${randomId}.${fileExt}`;

    console.log("📁 Upload path:", fileName);

    // Step 4: Attempt upload
    console.log("⬆️ Uploading file...");
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("❌ Upload failed:", error);
      throw error;
    }

    console.log("✅ Upload successful:", data);

    // Step 5: Get public URL
    console.log("🔗 Getting public URL...");
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(fileName);

    console.log("✅ Public URL generated:", publicUrl);

    return {
      success: true,
      url: publicUrl,
      path: fileName,
      data: data,
    };
  } catch (error) {
    console.error("❌ Upload failed:", error);
    return {
      success: false,
      error: error.message,
      details: error,
    };
  }
}

/**
 * Upload profile picture with enhanced debugging
 */
export async function uploadProfilePicture(file) {
  console.log("🖼️ Uploading profile picture...");

  const result = await uploadFileToStorage(file, "avatars", "profiles");

  if (result.success) {
    console.log("✅ Profile picture uploaded successfully:", result.url);
    return result.url;
  } else {
    console.error("❌ Profile picture upload failed:", result.error);
    throw new Error(`Upload failed: ${result.error}`);
  }
}

/**
 * Upload business logo with enhanced debugging
 */
export async function uploadBusinessLogo(file) {
  console.log("🏢 Uploading business logo...");

  const result = await uploadFileToStorage(file, "business-assets", "logos");

  if (result.success) {
    console.log("✅ Business logo uploaded successfully:", result.url);
    return result.url;
  } else {
    console.error("❌ Business logo upload failed:", result.error);
    throw new Error(`Upload failed: ${result.error}`);
  }
}

/**
 * Test upload with a small test file
 */
export async function testStorageUpload() {
  console.log("🧪 Testing storage upload...");

  try {
    // Create a small test image file (1x1 pixel PNG)
    const testImageData =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    // Convert base64 to blob
    const response = await fetch(testImageData);
    const blob = await response.blob();

    const testFile = new File([blob], "test-upload.png", {
      type: "image/png",
    });

    console.log("📄 Test file details:", {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type,
    });

    const result = await uploadFileToStorage(testFile, "avatars", "test");

    if (result.success) {
      console.log("✅ Test upload successful! Your storage is working.");
      console.log("🔗 Test file URL:", result.url);
      return true;
    } else {
      console.error("❌ Test upload failed:", result.error);
      return false;
    }
  } catch (error) {
    console.error("❌ Test upload error:", error);
    return false;
  }
}
