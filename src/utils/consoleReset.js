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

    // Full reset (requires confirmation) - COMPREHENSIVE VERSION
    fullReset: async () => {
      const confirm = window.confirm(
        "⚠️ COMPREHENSIVE RESET WARNING!\n\nThis will delete ALL data permanently including:\n" +
        "• All product data and inventory\n" +
        "• Contacts, customers, and suppliers\n" +
        "• Sales transactions and reports\n" +
        "• Notifications and message history\n" +
        "• All settings and preferences\n" +
        "• Branding, logos, and theme customization\n" +
        "• Profile pictures and user data\n" +
        "• All cached and stored data\n\n" +
        "This action CANNOT be undone!\n\nAre you absolutely sure?"
      );

      if (confirm) {
        console.log("🚨 Starting COMPREHENSIVE SYSTEM RESET...");
        console.log("📋 This will clear:");
        console.log("   • All mock data (products, sales, contacts)");
        console.log("   • All localStorage keys (47+ keys)");
        console.log("   • All sessionStorage data");
        console.log("   • All browser caches");
        console.log("   • Notifications and reports");
        console.log("   • Branding and customization");
        console.log("   • Profile and user data");
        
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
          console.log("✅ COMPREHENSIVE RESET COMPLETE!");
          console.log("🔄 Page will reload automatically for fresh start...");
        } else {
          console.error("❌ Reset failed:", result.error);
        }
      } else {
        console.log("❌ Comprehensive reset cancelled.");
      }
    },

    // Super comprehensive reset with extra verification
    nukeEverything: async () => {
      const confirm1 = window.confirm(
        "🚨 NUCLEAR OPTION ACTIVATED!\n\nThis is the most comprehensive reset possible.\n\nContinue?"
      );
      
      if (!confirm1) {
        console.log("❌ Nuclear reset cancelled at step 1.");
        return;
      }

      const confirm2 = window.confirm(
        "⚠️ FINAL WARNING!\n\nThis will:\n" +
        "• Clear ALL 47+ storage keys\n" +
        "• Reset ALL settings to factory defaults\n" +
        "• Clear ALL caches and browser data\n" +
        "• Remove ALL customization\n" +
        "• Delete ALL business data\n\n" +
        "Type 'YES DELETE EVERYTHING' in the next prompt to proceed."
      );

      if (!confirm2) {
        console.log("❌ Nuclear reset cancelled at step 2.");
        return;
      }

      const finalConfirm = window.prompt(
        "Type 'YES DELETE EVERYTHING' exactly to proceed with nuclear reset:"
      );

      if (finalConfirm === "YES DELETE EVERYTHING") {
        console.log("💥 NUCLEAR RESET INITIATED!");
        console.log("🧹 Clearing everything in existence...");
        
        // Use the most comprehensive clearing possible
        const result = await performCompleteReset({
          clearStorage: true,
          resetDatabase: true,
          resetSettings: true,
          createDemo: false,
          confirmReset: true,
          forceReload: true,
        });

        if (result.success) {
          console.log("💥 NUCLEAR RESET SUCCESSFUL!");
          console.log("🌱 System will restart with completely fresh state...");
        }
      } else {
        console.log("❌ Nuclear reset cancelled - incorrect confirmation.");
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
🔧 MedCure Reset Commands - COMPREHENSIVE EDITION:

Quick Reset (Development):
  MedCureReset.quickReset()        - Clear storage + reset settings (keeps DB)

Storage Only:
  MedCureReset.clearStorage()      - Clear localStorage + sessionStorage only

Complete Reset (⚠️ DESTRUCTIVE):
  MedCureReset.fullReset()         - 🚨 COMPREHENSIVE RESET - All data, settings, branding, notifications, contacts, reports
  MedCureReset.nukeEverything()    - 💥 NUCLEAR OPTION - Maximum destruction with triple confirmation
  MedCureReset.resetWithDemo()     - ⚠️ Reset + create demo data (requires confirmation)

Individual Functions:
  MedCureReset.clearLocalStorage()
  MedCureReset.clearSessionStorage()
  MedCureReset.resetDatabase()
  MedCureReset.resetSystemSettings()

What Gets Cleared in Comprehensive Reset:
  📊 All mock data (products, sales, inventory)
  👥 Contacts, customers, suppliers
  📈 Reports, analytics, transaction history  
  🔔 Notifications and message history
  🎨 Branding, logos, themes, customization
  👤 Profile pictures and user data
  ⚙️ All settings and preferences
  💾 47+ localStorage keys
  🗄️ All sessionStorage data
  🧹 Browser caches

Usage Examples:
  MedCureReset.quickReset()        // Most common for development
  MedCureReset.clearStorage()      // Just clear cache/preferences  
  MedCureReset.fullReset()         // Complete fresh start
  MedCureReset.nukeEverything()    // When you need maximum reset
  MedCureReset.help()              // Show this help

⚠️ ALWAYS backup important data before running comprehensive reset commands!
💡 Comprehensive resets clear ALL data including branding and customization!
      `);
    },
  };

  // Show help on first load
  console.log(
    "🔧 MedCure Reset commands loaded! Type MedCureReset.help() for instructions."
  );
}

export default window.MedCureReset;
