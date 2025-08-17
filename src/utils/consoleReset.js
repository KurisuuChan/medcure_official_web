/**
 * Browser Console Reset Commands
 * Quick reset commands you can run in the browser console
 */

import {
  clearLocalStorage,
  clearSessionStorage,
  resetDatabase,
  resetSystemSettings,
  performCompleteReset,
  quickDevReset,
} from "./systemReset.js";

// Make reset functions available globally in console
if (typeof window !== "undefined") {
  window.MedCureReset = {
    // Quick commands
    quickReset: quickDevReset,
    clearStorage: () => {
      clearLocalStorage();
      clearSessionStorage();
      console.log("✅ Storage cleared! Refresh the page.");
    },

    // Full reset (requires confirmation)
    fullReset: async () => {
      const confirm = window.confirm(
        "⚠️ This will delete ALL data permanently!\n\nAre you sure you want to continue?"
      );

      if (confirm) {
        const result = await performCompleteReset({
          clearStorage: true,
          resetDatabase: true,
          resetSettings: true,
          createDemo: false,
          confirmReset: true,
          forceReload: true,
        });

        console.log(result);
        if (result.success) {
          console.log(
            "✅ Full reset complete! Page will reload automatically."
          );
        }
      } else {
        console.log("❌ Reset cancelled.");
      }
    },

    // Reset with demo data
    resetWithDemo: async () => {
      const confirm = window.confirm(
        "⚠️ This will delete ALL data and create demo data!\n\nAre you sure you want to continue?"
      );

      if (confirm) {
        const result = await performCompleteReset({
          clearStorage: true,
          resetDatabase: true,
          resetSettings: true,
          createDemo: true,
          confirmReset: true,
          forceReload: true,
        });

        console.log(result);
        if (result.success) {
          console.log(
            "✅ Reset with demo data complete! Page will reload automatically."
          );
        }
      } else {
        console.log("❌ Reset cancelled.");
      }
    },

    // Individual functions
    clearLocalStorage,
    clearSessionStorage,
    resetDatabase,
    resetSystemSettings,

    // Help
    help: () => {
      console.log(`
🔧 MedCure Reset Commands:

Quick Reset (Development):
  MedCureReset.quickReset()        - Clear storage + reset settings (keeps DB)

Storage Only:
  MedCureReset.clearStorage()      - Clear localStorage + sessionStorage only

Complete Reset:
  MedCureReset.fullReset()         - ⚠️ DELETE EVERYTHING (requires confirmation)
  MedCureReset.resetWithDemo()     - ⚠️ Reset + create demo data (requires confirmation)

Individual Functions:
  MedCureReset.clearLocalStorage()
  MedCureReset.clearSessionStorage()
  MedCureReset.resetDatabase()
  MedCureReset.resetSystemSettings()

Usage Examples:
  MedCureReset.quickReset()        // Most common for development
  MedCureReset.clearStorage()      // Just clear cache/preferences
  MedCureReset.fullReset()         // Nuclear option
  MedCureReset.help()              // Show this help

⚠️ Always backup important data before running reset commands!
      `);
    },
  };

  // Show help on first load
  console.log(
    "🔧 MedCure Reset commands loaded! Type MedCureReset.help() for instructions."
  );
}

export default window.MedCureReset;
