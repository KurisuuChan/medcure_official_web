// Test script to check localStorage persistence
console.log("=== TESTING LOCALSTORAGE PERSISTENCE ===");

// Check what's in localStorage
const mockSettings = localStorage.getItem("mockSettings");
console.log("Raw localStorage mockSettings:", mockSettings);

if (mockSettings) {
  try {
    const parsed = JSON.parse(mockSettings);
    console.log("Parsed mockSettings:", parsed);

    if (parsed.branding) {
      console.log("Branding data:", parsed.branding);
    }

    if (parsed.profile) {
      console.log("Profile data:", parsed.profile);
    }
  } catch (error) {
    console.error("Error parsing mockSettings:", error);
  }
} else {
  console.log("No mockSettings found in localStorage");
}

console.log("=== END TEST ===");
