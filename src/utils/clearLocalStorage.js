/**
 * Utility script to clear corrupted localStorage data
 * This can be run from the browser console if localStorage corruption persists
 */

/**
 * Override localStorage.setItem to prevent corruption
 */
function protectLocalStorage() {
  if (typeof window === "undefined") return;

  const originalSetItem = localStorage.setItem;

  localStorage.setItem = function (key, value) {
    try {
      // Check if the value is corrupted before storing
      if (typeof value === "string") {
        if (
          value === "[object Object]" ||
          value === "undefined" ||
          value === "null" ||
          value.includes("[object Object]")
        ) {
          console.warn(
            `Preventing corrupted localStorage write for key: ${key}, value: ${value}`
          );
          return;
        }

        // If it's supposed to be JSON, validate it
        if (
          (value.startsWith("[") || value.startsWith("{")) &&
          key.includes("medcure")
        ) {
          try {
            JSON.parse(value);
          } catch (parseError) {
            console.warn(
              `Preventing invalid JSON write for key: ${key}`,
              parseError
            );
            return;
          }
        }
      }

      // Call original setItem if validation passes
      originalSetItem.call(this, key, value);
    } catch (error) {
      console.error(
        `Error in protected localStorage.setItem for key ${key}:`,
        error
      );
    }
  };

  console.log("🛡️ localStorage protection enabled");
}

/**
 * Clear all MedCure-related localStorage data
 */
export function clearMedCureLocalStorage() {
  try {
    const keys = Object.keys(localStorage);
    const medcureKeys = keys.filter(
      (key) => key.startsWith("medcure_") || key === "archived_items"
    );

    console.log("Found MedCure localStorage keys:", medcureKeys);

    medcureKeys.forEach((key) => {
      try {
        localStorage.removeItem(key);
        console.log(`✓ Cleared: ${key}`);
      } catch (error) {
        console.error(`✗ Failed to clear ${key}:`, error.message);
      }
    });

    console.log("✅ MedCure localStorage cleanup complete");
    return true;
  } catch (error) {
    console.error("❌ Failed to clear MedCure localStorage:", error);
    return false;
  }
}

/**
 * Clear ALL localStorage data (use with caution)
 */
export function clearAllLocalStorage() {
  try {
    const keyCount = localStorage.length;
    localStorage.clear();
    console.log(`✅ Cleared all ${keyCount} localStorage keys`);
    return true;
  } catch (error) {
    console.error("❌ Failed to clear all localStorage:", error);
    return false;
  }
}

/**
 * Inspect localStorage for corruption
 */
export function inspectLocalStorage() {
  try {
    const report = {
      totalKeys: localStorage.length,
      medcureKeys: [],
      corruptedKeys: [],
      validKeys: [],
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      try {
        const value = localStorage.getItem(key);

        if (key.startsWith("medcure_") || key === "archived_items") {
          report.medcureKeys.push(key);

          if (
            value === "[object Object]" ||
            value === "undefined" ||
            value === "null" ||
            value.includes("[object Object]")
          ) {
            report.corruptedKeys.push({
              key,
              issue: "corrupted_data",
              value: value.substring(0, 50) + "...",
            });
          } else if (value.startsWith("[") || value.startsWith("{")) {
            try {
              JSON.parse(value);
              report.validKeys.push(key);
            } catch (parseError) {
              report.corruptedKeys.push({
                key,
                issue: "invalid_json",
                error: parseError.message,
              });
            }
          } else {
            report.corruptedKeys.push({
              key,
              issue: "unexpected_format",
              value: value.substring(0, 50) + "...",
            });
          }
        }
      } catch (error) {
        report.corruptedKeys.push({
          key,
          issue: "access_error",
          error: error.message,
        });
      }
    }

    console.log("📊 localStorage Inspection Report:", report);
    return report;
  } catch (error) {
    console.error("❌ Failed to inspect localStorage:", error);
    return null;
  }
}

// Make functions available globally for console use
if (typeof window !== "undefined") {
  // Enable localStorage protection immediately
  protectLocalStorage();

  window.medcureUtils = {
    clearMedCureLocalStorage,
    clearAllLocalStorage,
    inspectLocalStorage,
    protectLocalStorage,
  };

  console.log("🔧 MedCure localStorage utilities available:");
  console.log("  - window.medcureUtils.clearMedCureLocalStorage()");
  console.log("  - window.medcureUtils.clearAllLocalStorage()");
  console.log("  - window.medcureUtils.inspectLocalStorage()");
  console.log("  - window.medcureUtils.protectLocalStorage() [auto-enabled]");
}
