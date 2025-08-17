// Test script to add sample notifications and verify backend integration
const {
  notificationService,
} = require("./src/services/notificationService.js");

async function testNotificationSystem() {
  console.log("🔔 Testing Notification System...");

  try {
    // Test creating notifications
    console.log("\n📝 Creating test notifications...");

    const sampleNotifications = [
      {
        title: "Stock Alert",
        message: "Paracetamol 500mg is running low (15 units remaining)",
        type: "warning",
        category: "inventory",
        priority: 2,
        reference_type: "product",
        reference_id: 1,
      },
      {
        title: "Sale Completed",
        message: "Transaction #1234 completed successfully - ₱750.00",
        type: "success",
        category: "sales",
        priority: 1,
        reference_type: "transaction",
        reference_id: 1234,
      },
      {
        title: "Critical Stock Alert",
        message: "Amoxicillin 500mg is out of stock!",
        type: "error",
        category: "inventory",
        priority: 4,
        reference_type: "product",
        reference_id: 2,
      },
    ];

    for (const notification of sampleNotifications) {
      try {
        const created = await notificationService.createNotification(
          notification
        );
        console.log(`✅ Created: ${created.title}`);
      } catch (error) {
        console.log(`❌ Failed to create notification: ${error.message}`);
      }
    }

    // Test fetching notifications
    console.log("\n📋 Fetching notifications...");
    const notifications = await notificationService.getNotifications();
    console.log(`📊 Found ${notifications.length} notifications`);

    // Test fetching stats
    console.log("\n📈 Fetching notification stats...");
    const stats = await notificationService.getNotificationStats();
    console.log("📊 Stats:", {
      total: stats.total,
      unread: stats.unread,
      byType: stats.byType,
      byCategory: stats.byCategory,
    });

    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testNotificationSystem();
