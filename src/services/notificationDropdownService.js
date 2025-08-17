/**
 * Enhanced Notification Dropdown Service
 * Specific backend integration for notification dropdown functionality
 */

import { supabase } from "../lib/supabase.js";
import {
  getNotifications,
  getNotificationStats,
  markNotificationAsRead,
  markMultipleAsRead,
} from "./notificationService.js";

/**
 * Get notifications specifically for dropdown display
 * Returns formatted data optimized for the header dropdown
 */
export async function getNotificationsForDropdown(limit = 5) {
  try {
    const response = await getNotifications({
      limit,
      orderBy: "created_at",
      orderDirection: "desc",
      includeRead: true,
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch notifications");
    }

    // Format notifications for dropdown display
    const formattedNotifications = response.data.map((notification) => ({
      ...notification,
      // Ensure consistent date format
      created_at: notification.created_at || new Date().toISOString(),
      // Ensure boolean read status
      is_read: Boolean(notification.is_read),
      // Add default values for missing fields
      title: notification.title || "Notification",
      message: notification.message || "No message",
      type: notification.type || "info",
      category: notification.category || "General",
      priority: notification.priority || 1,
    }));

    return {
      success: true,
      data: formattedNotifications,
      total: response.total || formattedNotifications.length,
      unread: formattedNotifications.filter((n) => !n.is_read).length,
    };
  } catch (error) {
    console.error("Error fetching notifications for dropdown:", error);

    // Return empty state on error
    return {
      success: false,
      error: error.message,
      data: [],
      total: 0,
      unread: 0,
    };
  }
}

/**
 * Get notification stats specifically for dropdown badge
 * Returns unread count and other stats for the notification bell
 */
export async function getNotificationStatsForDropdown() {
  try {
    const response = await getNotificationStats();

    if (!response.success) {
      throw new Error(response.error || "Failed to fetch notification stats");
    }

    return {
      success: true,
      data: {
        total: response.data.total || 0,
        unread: response.data.unread || 0,
        read: response.data.read || 0,
        byType: response.data.byType || {
          error: 0,
          warning: 0,
          info: 0,
          success: 0,
        },
        byCategory: response.data.byCategory || {},
      },
    };
  } catch (error) {
    console.error("Error fetching notification stats for dropdown:", error);

    // Return zero counts on error
    return {
      success: false,
      error: error.message,
      data: {
        total: 0,
        unread: 0,
        read: 0,
        byType: { error: 0, warning: 0, info: 0, success: 0 },
        byCategory: {},
      },
    };
  }
}

/**
 * Mark notification as read from dropdown
 * Optimized for dropdown interactions
 */
export async function markNotificationAsReadFromDropdown(notificationId) {
  try {
    const response = await markNotificationAsRead(notificationId);

    if (!response.success) {
      throw new Error(response.error || "Failed to mark notification as read");
    }

    return {
      success: true,
      message: "Notification marked as read",
      data: response.data,
    };
  } catch (error) {
    console.error("Error marking notification as read from dropdown:", error);

    return {
      success: false,
      error: error.message,
      message: "Failed to mark notification as read",
    };
  }
}

/**
 * Mark all notifications as read from dropdown
 * Optimized for "mark all as read" button
 */
export async function markAllNotificationsAsReadFromDropdown() {
  try {
    // First get all unread notification IDs
    const notificationsResponse = await getNotifications({
      limit: 100, // Get more to ensure we catch all unread
      isRead: false,
    });

    if (!notificationsResponse.success) {
      throw new Error("Failed to fetch unread notifications");
    }

    const unreadIds = notificationsResponse.data.map((n) => n.id);

    if (unreadIds.length === 0) {
      return {
        success: true,
        message: "No unread notifications to mark",
        data: { markedCount: 0 },
      };
    }

    const response = await markMultipleAsRead(unreadIds);

    if (!response.success) {
      throw new Error(response.error || "Failed to mark notifications as read");
    }

    return {
      success: true,
      message: `${unreadIds.length} notifications marked as read`,
      data: { markedCount: unreadIds.length },
    };
  } catch (error) {
    console.error(
      "Error marking all notifications as read from dropdown:",
      error
    );

    return {
      success: false,
      error: error.message,
      message: "Failed to mark all notifications as read",
    };
  }
}

/**
 * Real-time notification updates for dropdown
 * Sets up real-time subscription for notification changes
 */
export function subscribeToNotificationUpdates(callback) {
  try {
    console.log("🔔 Setting up real-time notification subscription...");

    const subscription = supabase
      .channel("notifications-dropdown")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log("🔔 Notification update received:", payload);

          // Call the callback with the update
          if (callback && typeof callback === "function") {
            callback(payload);
          }
        }
      )
      .subscribe((status) => {
        console.log("🔔 Notification subscription status:", status);
      });

    return subscription;
  } catch (error) {
    console.error("Error setting up notification subscription:", error);
    return null;
  }
}

/**
 * Clean up notification subscription
 */
export function unsubscribeFromNotificationUpdates(subscription) {
  try {
    if (subscription) {
      supabase.removeChannel(subscription);
      console.log("🔔 Notification subscription cleaned up");
    }
  } catch (error) {
    console.error("Error cleaning up notification subscription:", error);
  }
}

/**
 * Format notification time for dropdown display
 * Returns human-readable time strings
 */
export function formatNotificationTimeForDropdown(timestamp) {
  try {
    if (!timestamp) return "Just now";

    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now - notificationTime;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    // For older notifications, show actual date
    return notificationTime.toLocaleDateString();
  } catch (error) {
    console.error("Error formatting notification time:", error);
    return "Unknown";
  }
}

/**
 * Get notification icon and colors for dropdown display
 * Returns consistent styling for notification types
 */
export function getNotificationDisplayConfig(type) {
  const configs = {
    error: {
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-800",
      iconColor: "text-red-600",
      badgeColor: "bg-red-500",
    },
    warning: {
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-800",
      iconColor: "text-orange-600",
      badgeColor: "bg-orange-500",
    },
    success: {
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-800",
      iconColor: "text-green-600",
      badgeColor: "bg-green-500",
    },
    info: {
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
      iconColor: "text-blue-600",
      badgeColor: "bg-blue-500",
    },
  };

  return configs[type] || configs.info;
}

export default {
  getNotificationsForDropdown,
  getNotificationStatsForDropdown,
  markNotificationAsReadFromDropdown,
  markAllNotificationsAsReadFromDropdown,
  subscribeToNotificationUpdates,
  unsubscribeFromNotificationUpdates,
  formatNotificationTimeForDropdown,
  getNotificationDisplayConfig,
};
