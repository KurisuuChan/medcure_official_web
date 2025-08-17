// Notification Test Utilities
// Run these functions in browser console to test the notification system

// Function to create sample notifications
window.createSampleNotifications = async function () {
  const { notificationService } = await import(
    "./src/services/notificationService.js"
  );

  const sampleNotifications = [
    {
      title: "Low Stock Alert",
      message: "Paracetamol 500mg is running low. Only 15 units remaining.",
      type: "warning",
      category: "inventory",
      priority: 2,
      reference_type: "product",
      reference_id: 1,
    },
    {
      title: "Sale Completed",
      message: "Transaction #1234 completed successfully. Total: ₱750.00",
      type: "success",
      category: "sales",
      priority: 1,
      reference_type: "transaction",
      reference_id: 1234,
    },
    {
      title: "Out of Stock",
      message:
        "Amoxicillin 500mg is now out of stock. Please reorder immediately.",
      type: "error",
      category: "inventory",
      priority: 4,
      reference_type: "product",
      reference_id: 2,
    },
    {
      title: "Daily Report Generated",
      message:
        "Your daily sales report for " +
        new Date().toLocaleDateString() +
        " is ready for download.",
      type: "info",
      category: "reports",
      priority: 1,
      reference_type: "report",
      reference_id: Date.now(),
    },
  ];

  try {
    for (const notification of sampleNotifications) {
      const created = await notificationService.createNotification(
        notification
      );
      console.log("✅ Created notification:", created.title);
    }
    console.log("🎉 All sample notifications created successfully!");

    // Refresh the page to see the notifications
    window.location.reload();
  } catch (error) {
    console.error("❌ Error creating notifications:", error);
  }
};

// Function to test notification stats
window.testNotificationStats = async function () {
  const { notificationService } = await import(
    "./src/services/notificationService.js"
  );

  try {
    const stats = await notificationService.getNotificationStats();
    console.log("📊 Notification Stats:", stats);
    return stats;
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
  }
};

// Function to get all notifications
window.getAllNotifications = async function () {
  const { notificationService } = await import(
    "./src/services/notificationService.js"
  );

  try {
    const notifications = await notificationService.getNotifications();
    console.log("📋 All Notifications:", notifications);
    return notifications;
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
  }
};

console.log("🔔 Notification test utilities loaded!");
console.log("Available functions:");
console.log("- createSampleNotifications() - Creates sample notifications");
console.log("- testNotificationStats() - Shows notification statistics");
console.log("- getAllNotifications() - Gets all notifications");
