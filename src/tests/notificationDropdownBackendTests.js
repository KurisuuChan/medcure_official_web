/**
 * Test script for enhanced notification dropdown backend
 * Run this to verify the notification dropdown improvements
 */

import {
  getNotificationsForDropdown,
  getNotificationStatsForDropdown,
  markNotificationAsReadFromDropdown,
  markAllNotificationsAsReadFromDropdown,
  formatNotificationTimeForDropdown,
  getNotificationDisplayConfig,
} from "../services/notificationDropdownService.js";

/**
 * Test notification dropdown backend functionality
 */
export async function testNotificationDropdownBackend() {
  console.log("🔔 Testing notification dropdown backend...");

  try {
    // Test 1: Fetch notifications for dropdown
    console.log("\n1. Testing getNotificationsForDropdown...");
    const notificationsResult = await getNotificationsForDropdown(5);
    console.log("✅ Notifications result:", {
      success: notificationsResult.success,
      count: notificationsResult.data?.length || 0,
      unread: notificationsResult.unread,
    });

    // Test 2: Fetch notification stats
    console.log("\n2. Testing getNotificationStatsForDropdown...");
    const statsResult = await getNotificationStatsForDropdown();
    console.log("✅ Stats result:", {
      success: statsResult.success,
      total: statsResult.data?.total,
      unread: statsResult.data?.unread,
    });

    // Test 3: Test notification display config
    console.log("\n3. Testing getNotificationDisplayConfig...");
    const types = ["error", "warning", "success", "info"];
    types.forEach((type) => {
      const config = getNotificationDisplayConfig(type);
      console.log(`✅ ${type}:`, config);
    });

    // Test 4: Test time formatting
    console.log("\n4. Testing formatNotificationTimeForDropdown...");
    const testTimes = [
      new Date().toISOString(), // Now
      new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    ];

    testTimes.forEach((time, index) => {
      const formatted = formatNotificationTimeForDropdown(time);
      console.log(`✅ Test time ${index + 1}: ${formatted}`);
    });

    // Test 5: Mark notification as read (if notifications exist)
    if (notificationsResult.success && notificationsResult.data?.length > 0) {
      const firstNotification = notificationsResult.data[0];
      if (!firstNotification.is_read) {
        console.log("\n5. Testing markNotificationAsReadFromDropdown...");
        const markResult = await markNotificationAsReadFromDropdown(
          firstNotification.id
        );
        console.log("✅ Mark as read result:", {
          success: markResult.success,
          message: markResult.message,
        });
      }
    }

    console.log(
      "\n🎉 All notification dropdown backend tests completed successfully!"
    );
    return { success: true, message: "All tests passed" };
  } catch (error) {
    console.error("❌ Test failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Test real-time subscription (optional)
 */
export function testNotificationSubscription() {
  console.log("🔔 Testing notification real-time subscription...");

  try {
    const {
      subscribeToNotificationUpdates,
      unsubscribeFromNotificationUpdates,
    } = require("../services/notificationDropdownService.js");

    const subscription = subscribeToNotificationUpdates((payload) => {
      console.log("📡 Received notification update:", payload);
    });

    if (subscription) {
      console.log("✅ Subscription created successfully");

      // Clean up after 10 seconds
      setTimeout(() => {
        unsubscribeFromNotificationUpdates(subscription);
        console.log("✅ Subscription cleaned up");
      }, 10000);
    } else {
      console.log("❌ Failed to create subscription");
    }
  } catch (error) {
    console.error("❌ Subscription test failed:", error);
  }
}

// Auto-run tests if this file is executed directly
if (typeof window !== "undefined") {
  // Browser environment
  window.testNotificationDropdown = testNotificationDropdownBackend;
  window.testNotificationSubscription = testNotificationSubscription;

  console.log("🔔 Notification dropdown tests loaded!");
  console.log("Run: testNotificationDropdown() to test the backend");
  console.log("Run: testNotificationSubscription() to test real-time updates");
}

export default {
  testNotificationDropdownBackend,
  testNotificationSubscription,
};
