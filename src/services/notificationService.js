/**
 * MedCure Notification Service
 * Handles all notification operations with backend integration
 */

import { supabase, TABLES } from "../lib/supabase.js";
import { shouldUseMockAPI } from "./backendService.js";

// Mock notification data for fallback
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "warning",
    title: "Low Stock Alert",
    message: "Paracetamol 500mg is running low. Only 8 units remaining.",
    created_at: "2024-08-16T14:30:00Z",
    is_read: false,
    category: "Inventory",
    priority: 3,
  },
  {
    id: 2,
    type: "error",
    title: "Out of Stock",
    message:
      "Vitamin C 1000mg is now out of stock. Please reorder immediately.",
    created_at: "2024-08-16T12:15:00Z",
    is_read: false,
    category: "Inventory",
    priority: 4,
  },
  {
    id: 3,
    type: "info",
    title: "New Product Added",
    message: "Aspirin 81mg has been successfully added to inventory.",
    created_at: "2024-08-16T10:45:00Z",
    is_read: true,
    category: "System",
    priority: 1,
  },
  {
    id: 4,
    type: "success",
    title: "Sale Completed",
    message: "Transaction #1248 completed successfully. Total: ₱1,250.00",
    created_at: "2024-08-16T09:20:00Z",
    is_read: true,
    category: "Sales",
    priority: 2,
  },
  {
    id: 5,
    type: "warning",
    title: "Expiry Alert",
    message:
      "Amoxicillin 500mg expires in 30 days. Consider promotional pricing.",
    created_at: "2024-08-15T16:30:00Z",
    is_read: true,
    category: "Inventory",
    priority: 3,
  },
  {
    id: 6,
    type: "info",
    title: "Daily Report",
    message: "Your daily sales report is now available for download.",
    created_at: "2024-08-15T18:00:00Z",
    is_read: true,
    category: "Reports",
    priority: 1,
  },
  {
    id: 7,
    type: "error",
    title: "Payment Failed",
    message:
      "Payment processing failed for transaction #1247. Manual review required.",
    created_at: "2024-08-15T14:22:00Z",
    is_read: false,
    category: "Sales",
    priority: 4,
  },
  {
    id: 8,
    type: "success",
    title: "Backup Completed",
    message: "Daily database backup completed successfully.",
    created_at: "2024-08-15T02:00:00Z",
    is_read: true,
    category: "System",
    priority: 1,
  },
];

/**
 * Check if should use mock mode for notifications
 * @returns {Promise<boolean>}
 */
async function isMockMode() {
  return await shouldUseMockAPI();
}

/**
 * Get all notifications with filtering options
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Notifications data with metadata
 */
export async function getNotifications(filters = {}) {
  const {
    category = null,
    type = null,
    isRead = null,
    priority = null,
    limit = 50,
    offset = 0,
  } = filters;

  if (await isMockMode()) {
    console.log("🔧 getNotifications called - using mock mode");

    let filteredNotifications = [...MOCK_NOTIFICATIONS];

    // Apply filters
    if (category) {
      filteredNotifications = filteredNotifications.filter(
        (n) => n.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (type) {
      filteredNotifications = filteredNotifications.filter(
        (n) => n.type === type
      );
    }

    if (isRead !== null) {
      filteredNotifications = filteredNotifications.filter(
        (n) => n.is_read === isRead
      );
    }

    if (priority !== null) {
      filteredNotifications = filteredNotifications.filter(
        (n) => n.priority === priority
      );
    }

    // Sort by created_at descending
    filteredNotifications.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    // Apply pagination
    const paginatedNotifications = filteredNotifications.slice(
      offset,
      offset + limit
    );

    return {
      data: paginatedNotifications,
      total: filteredNotifications.length,
      unread: MOCK_NOTIFICATIONS.filter((n) => !n.is_read).length,
      success: true,
      error: null,
    };
  }

  console.log("🔄 getNotifications called - using backend mode");

  try {
    let query = supabase
      .from(TABLES.NOTIFICATIONS)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq("category", category);
    }

    if (type) {
      query = query.eq("type", type);
    }

    if (isRead !== null) {
      query = query.eq("is_read", isRead);
    }

    if (priority !== null) {
      query = query.eq("priority", priority);
    }

    // Apply pagination
    if (limit) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      throw error;
    }

    // Get unread count separately
    const { count: unreadCount, error: unreadError } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);

    if (unreadError) {
      console.warn("Failed to get unread count:", unreadError);
    }

    return {
      data: notifications || [],
      total: count || 0,
      unread: unreadCount || 0,
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return {
      data: [],
      total: 0,
      unread: 0,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create a new notification
 * @param {Object} notificationData - Notification details
 * @returns {Promise<Object>} Creation result
 */
export async function createNotification(notificationData) {
  const {
    title,
    message,
    type = "info",
    category = "System",
    priority = 1,
    referenceType = null,
    referenceId = null,
    expiresAt = null,
    createdBy = "system",
  } = notificationData;

  if (await isMockMode()) {
    console.log("🔧 createNotification called - using mock mode");

    const newNotification = {
      id: Date.now(),
      title,
      message,
      type,
      category,
      priority,
      reference_type: referenceType,
      reference_id: referenceId,
      is_read: false,
      is_dismissed: false,
      expires_at: expiresAt,
      created_by: createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return {
      data: newNotification,
      success: true,
      error: null,
    };
  }

  console.log("🔄 createNotification called - using backend mode");

  try {
    const { data: notification, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .insert([
        {
          title,
          message,
          type,
          category,
          priority,
          reference_type: referenceType,
          reference_id: referenceId,
          expires_at: expiresAt,
          created_by: createdBy,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      data: notification,
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error creating notification:", error);
    return {
      data: null,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Mark a notification as read
 * @param {number} notificationId - Notification ID
 * @returns {Promise<Object>} Update result
 */
export async function markNotificationAsRead(notificationId) {
  if (await isMockMode()) {
    console.log("🔧 markNotificationAsRead called - using mock mode");
    return {
      success: true,
      error: null,
    };
  }

  console.log("🔄 markNotificationAsRead called - using backend mode");

  try {
    const { error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId);

    if (error) {
      throw error;
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Mark multiple notifications as read
 * @param {number[]} notificationIds - Array of notification IDs
 * @returns {Promise<Object>} Update result
 */
export async function markMultipleAsRead(notificationIds) {
  if (await isMockMode()) {
    console.log("🔧 markMultipleAsRead called - using mock mode");
    return {
      success: true,
      error: null,
    };
  }

  console.log("🔄 markMultipleAsRead called - using backend mode");

  try {
    const { error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .in("id", notificationIds);

    if (error) {
      throw error;
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete a notification
 * @param {number} notificationId - Notification ID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteNotification(notificationId) {
  if (await isMockMode()) {
    console.log("🔧 deleteNotification called - using mock mode");
    return {
      success: true,
      error: null,
    };
  }

  console.log("🔄 deleteNotification called - using backend mode");

  try {
    const { error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .delete()
      .eq("id", notificationId);

    if (error) {
      throw error;
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete multiple notifications
 * @param {number[]} notificationIds - Array of notification IDs
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteMultipleNotifications(notificationIds) {
  if (await isMockMode()) {
    console.log("🔧 deleteMultipleNotifications called - using mock mode");
    return {
      success: true,
      error: null,
    };
  }

  console.log("🔄 deleteMultipleNotifications called - using backend mode");

  try {
    const { error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .delete()
      .in("id", notificationIds);

    if (error) {
      throw error;
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get notification statistics
 * @returns {Promise<Object>} Statistics data
 */
export async function getNotificationStats() {
  if (await isMockMode()) {
    console.log("🔧 getNotificationStats called - using mock mode");

    const total = MOCK_NOTIFICATIONS.length;
    const unread = MOCK_NOTIFICATIONS.filter((n) => !n.is_read).length;
    const byCategory = MOCK_NOTIFICATIONS.reduce((acc, notification) => {
      acc[notification.category] = (acc[notification.category] || 0) + 1;
      return acc;
    }, {});

    return {
      data: {
        total,
        unread,
        read: total - unread,
        byCategory,
        byType: {
          info: MOCK_NOTIFICATIONS.filter((n) => n.type === "info").length,
          success: MOCK_NOTIFICATIONS.filter((n) => n.type === "success")
            .length,
          warning: MOCK_NOTIFICATIONS.filter((n) => n.type === "warning")
            .length,
          error: MOCK_NOTIFICATIONS.filter((n) => n.type === "error").length,
        },
      },
      success: true,
      error: null,
    };
  }

  console.log("🔄 getNotificationStats called - using backend mode");

  try {
    // Get total and read/unread counts
    const { count: total } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .select("*", { count: "exact", head: true });

    const { count: unread } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);

    // Get counts by category
    const { data: categoryData } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .select("category")
      .not("category", "is", null);

    const byCategory =
      categoryData?.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {}) || {};

    // Get counts by type
    const { data: typeData } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .select("type");

    const byType =
      typeData?.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {}) || {};

    return {
      data: {
        total: total || 0,
        unread: unread || 0,
        read: (total || 0) - (unread || 0),
        byCategory,
        byType,
      },
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    return {
      data: {
        total: 0,
        unread: 0,
        read: 0,
        byCategory: {},
        byType: {},
      },
      success: false,
      error: error.message,
    };
  }
}

/**
 * Clean up expired notifications
 * @returns {Promise<Object>} Cleanup result
 */
export async function cleanupExpiredNotifications() {
  if (await isMockMode()) {
    console.log("🔧 cleanupExpiredNotifications called - using mock mode");
    return {
      success: true,
      deletedCount: 0,
      error: null,
    };
  }

  console.log("🔄 cleanupExpiredNotifications called - using backend mode");

  try {
    const { data, error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select();

    if (error) {
      throw error;
    }

    return {
      success: true,
      deletedCount: data?.length || 0,
      error: null,
    };
  } catch (error) {
    console.error("Error cleaning up expired notifications:", error);
    return {
      success: false,
      deletedCount: 0,
      error: error.message,
    };
  }
}

// Notification generation helpers

/**
 * Generate a low stock notification
 * @param {Object} product - Product data
 * @returns {Promise<Object>} Creation result
 */
export async function generateLowStockNotification(product) {
  return await createNotification({
    title: "Low Stock Alert",
    message: `${product.name} is running low. Only ${product.total_stock} units remaining.`,
    type: "warning",
    category: "Inventory",
    priority: 3,
    referenceType: "product",
    referenceId: product.id,
  });
}

/**
 * Generate an out of stock notification
 * @param {Object} product - Product data
 * @returns {Promise<Object>} Creation result
 */
export async function generateOutOfStockNotification(product) {
  return await createNotification({
    title: "Out of Stock",
    message: `${product.name} is now out of stock. Please reorder immediately.`,
    type: "error",
    category: "Inventory",
    priority: 4,
    referenceType: "product",
    referenceId: product.id,
  });
}

/**
 * Generate an expiry alert notification
 * @param {Object} product - Product data
 * @param {number} daysUntilExpiry - Days until expiration
 * @returns {Promise<Object>} Creation result
 */
export async function generateExpiryAlertNotification(
  product,
  daysUntilExpiry
) {
  const urgency = daysUntilExpiry <= 7 ? "error" : "warning";
  const priority = daysUntilExpiry <= 7 ? 4 : 3;

  return await createNotification({
    title: "Expiry Alert",
    message: `${product.name} expires in ${daysUntilExpiry} days. Consider promotional pricing.`,
    type: urgency,
    category: "Inventory",
    priority,
    referenceType: "product",
    referenceId: product.id,
  });
}

/**
 * Generate a sale completion notification
 * @param {Object} transaction - Transaction data
 * @returns {Promise<Object>} Creation result
 */
export async function generateSaleNotification(transaction) {
  return await createNotification({
    title: "Sale Completed",
    message: `Transaction #${transaction.transaction_number} completed successfully. Total: ₱${transaction.total_amount}`,
    type: "success",
    category: "Sales",
    priority: 2,
    referenceType: "transaction",
    referenceId: transaction.id,
  });
}

export default {
  getNotifications,
  createNotification,
  markNotificationAsRead,
  markMultipleAsRead,
  deleteNotification,
  deleteMultipleNotifications,
  getNotificationStats,
  cleanupExpiredNotifications,
  generateLowStockNotification,
  generateOutOfStockNotification,
  generateExpiryAlertNotification,
  generateSaleNotification,
};
