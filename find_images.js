// Image Location Helper - Add this to your browser console to find your images
// Or integrate into your Settings debug tab

/**
 * Find and display all stored images from MedCure
 */
function findMedCureImages() {
  console.log("🔍 Searching for MedCure images...");

  const results = {
    localStorage: {},
    supabaseUrls: [],
    summary: {},
  };

  // Check localStorage for Base64 images
  console.log("\n📱 Checking localStorage...");

  try {
    // Check user profile
    const userProfile = localStorage.getItem("medcure_user_profile");
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      if (profile.avatar_url) {
        results.localStorage.profilePicture = profile.avatar_url;
        if (profile.avatar_url.startsWith("data:")) {
          console.log("✅ Profile picture found in localStorage (Base64)");
        } else {
          console.log("✅ Profile picture URL found:", profile.avatar_url);
          results.supabaseUrls.push(profile.avatar_url);
        }
      }
    }

    // Check business settings
    const businessSettings = localStorage.getItem("medcure_business_settings");
    if (businessSettings) {
      const business = JSON.parse(businessSettings);
      if (business.logo_url) {
        results.localStorage.businessLogo = business.logo_url;
        if (business.logo_url.startsWith("data:")) {
          console.log("✅ Business logo found in localStorage (Base64)");
        } else {
          console.log("✅ Business logo URL found:", business.logo_url);
          results.supabaseUrls.push(business.logo_url);
        }
      }
    }

    // Summary
    console.log("\n📊 Summary:");
    console.log(
      `- Images in localStorage: ${Object.keys(results.localStorage).length}`
    );
    console.log(`- Supabase URLs found: ${results.supabaseUrls.length}`);

    if (Object.keys(results.localStorage).length > 0) {
      console.log("\n🖼️ Found images in localStorage:");
      Object.entries(results.localStorage).forEach(([type, url]) => {
        if (url.startsWith("data:")) {
          const mimeType = url.substring(5, url.indexOf(";"));
          const size = Math.round((url.length * 0.75) / 1024); // Approximate KB
          console.log(`  - ${type}: ${mimeType} (~${size}KB Base64)`);
        }
      });
    }

    if (results.supabaseUrls.length > 0) {
      console.log("\n🌐 Supabase URLs found:");
      results.supabaseUrls.forEach((url) => {
        console.log(`  - ${url}`);
      });
    }

    return results;
  } catch (error) {
    console.error("❌ Error searching for images:", error);
    return null;
  }
}

/**
 * Display Base64 images in new tabs
 */
function viewStoredImages() {
  console.log("🖼️ Opening stored images...");

  const results = findMedCureImages();
  if (!results) return;

  let imageCount = 0;

  Object.entries(results.localStorage).forEach(([type, url]) => {
    if (url && url.startsWith("data:")) {
      // Open Base64 image in new tab
      const newWindow = window.open();
      newWindow.document.write(`
        <html>
          <head><title>MedCure ${type}</title></head>
          <body style="margin:0; padding:20px; text-align:center; background:#f5f5f5;">
            <h2>MedCure ${type}</h2>
            <img src="${url}" style="max-width:100%; height:auto; border:1px solid #ddd; border-radius:8px;" />
            <br><br>
            <button onclick="window.close()" style="padding:10px 20px; background:#007bff; color:white; border:none; border-radius:5px; cursor:pointer;">Close</button>
          </body>
        </html>
      `);
      imageCount++;
    }
  });

  // Open Supabase URLs in new tabs
  results.supabaseUrls.forEach((url) => {
    if (url && !url.startsWith("data:")) {
      window.open(url, "_blank");
      imageCount++;
    }
  });

  if (imageCount === 0) {
    console.log("ℹ️ No images found to display");
    alert("No images found in storage");
  } else {
    console.log(`✅ Opened ${imageCount} images in new tabs`);
  }
}

/**
 * Get image storage statistics
 */
function getImageStorageStats() {
  console.log("📊 Getting image storage statistics...");

  const results = findMedCureImages();
  if (!results) return;

  const stats = {
    totalImages:
      Object.keys(results.localStorage).length + results.supabaseUrls.length,
    localStorageImages: Object.keys(results.localStorage).length,
    supabaseImages: results.supabaseUrls.length,
    localStorageSize: 0,
    details: [],
  };

  // Calculate localStorage usage
  Object.entries(results.localStorage).forEach(([type, url]) => {
    if (url && url.startsWith("data:")) {
      const sizeBytes = url.length * 0.75; // Base64 to bytes conversion
      const sizeKB = Math.round(sizeBytes / 1024);
      const sizeMB = Math.round((sizeBytes / (1024 * 1024)) * 100) / 100;

      stats.localStorageSize += sizeBytes;
      stats.details.push({
        type,
        storage: "localStorage",
        format: "Base64",
        sizeKB,
        sizeMB,
      });
    }
  });

  // Add Supabase URLs
  results.supabaseUrls.forEach((url) => {
    const type = url.includes("avatar") ? "Profile Picture" : "Business Logo";
    stats.details.push({
      type,
      storage: "Supabase",
      format: "URL",
      url,
    });
  });

  const totalLocalStorageMB =
    Math.round((stats.localStorageSize / (1024 * 1024)) * 100) / 100;

  console.log("\n📈 Storage Statistics:");
  console.log(`Total Images: ${stats.totalImages}`);
  console.log(
    `localStorage Images: ${stats.localStorageImages} (${totalLocalStorageMB}MB)`
  );
  console.log(`Supabase Images: ${stats.supabaseImages}`);

  console.log("\n📋 Details:");
  console.table(stats.details);

  return stats;
}

// Auto-run on script load
console.log("🚀 MedCure Image Finder Loaded!");
console.log("📝 Available functions:");
console.log("  - findMedCureImages() - Find all stored images");
console.log("  - viewStoredImages() - Open images in new tabs");
console.log("  - getImageStorageStats() - Get detailed statistics");
console.log("\n🔍 Running automatic search...");
findMedCureImages();
