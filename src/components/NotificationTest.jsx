import React from "react";
import { useSimpleNotifications } from "@/hooks/useSimpleNotifications";

/**
 * Notification Test Component - Verify notification system works
 */
export default function NotificationTest() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    createNotification,
    markAsRead,
    refresh,
  } = useSimpleNotifications();

  const handleCreateTestNotification = async () => {
    try {
      await createNotification({
        title: "Test Notification",
        message: "This is a test notification to verify the system works",
        type: "info",
        category: "system",
        priority: 1,
      });
      console.log("✅ Test notification created successfully");
    } catch (err) {
      console.error("❌ Failed to create test notification:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAsRead(null, true);
      console.log("✅ All notifications marked as read");
    } catch (err) {
      console.error("❌ Failed to mark all as read:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p>Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={refresh}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="font-medium text-green-900 mb-2">
          Notification System Status
        </h3>
        <p className="text-green-700">✅ System working properly</p>
        <p className="text-green-700">
          📬 {notifications.length} total notifications
        </p>
        <p className="text-green-700">🔔 {unreadCount} unread notifications</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleCreateTestNotification}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Test Notification
        </button>
        <button
          onClick={handleMarkAllRead}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Mark All Read
        </button>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Refresh
        </button>
      </div>

      {notifications.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Recent Notifications:</h4>
          {notifications.slice(0, 5).map((notification) => (
            <div
              key={notification.id}
              className={`p-3 border rounded ${
                notification.is_read
                  ? "bg-gray-50 border-gray-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="font-medium">{notification.title}</div>
              <div className="text-sm text-gray-600">
                {notification.message}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {notification.type} • {notification.category} •
                {notification.is_read ? " Read" : " Unread"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
