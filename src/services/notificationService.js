// =====================================================
// Notification Service for MedCure
// Handles all notification operations with Supabase
// =====================================================

import { supabase } from "@/config/supabase";

class NotificationService {
  // Create a new notification
  async createNotification({
    title,
    message,
    type = "info",
    category = "system",
    priority = 1,
    userId = null,
    relatedEntityType = null,
    relatedEntityId = null,
    metadata = {},
    expiresAt = null,
  }) {
    try {
      const { data, error } = await supabase.rpc("create_notification", {
        p_title: title,
        p_message: message,
        p_type: type,
        p_category: category,
        p_priority: priority,
        p_user_id: userId,
        p_related_entity_type: relatedEntityType,
        p_related_entity_id: relatedEntityId,
        p_metadata: metadata,
        p_expires_at: expiresAt,
      });

      if (error) {
        console.error("Error creating notification:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Failed to create notification:", error);
      throw error;
    }
  }

  // Create notification from template
  async createFromTemplate({
    templateName,
    templateData = {},
    userId = null,
    relatedEntityType = null,
    relatedEntityId = null,
    expiresAt = null,
  }) {
    try {
      const { data, error } = await supabase.rpc(
        "create_notification_from_template",
        {
          template_name: templateName,
          template_data: templateData,
          p_user_id: userId,
          p_related_entity_type: relatedEntityType,
          p_related_entity_id: relatedEntityId,
          p_expires_at: expiresAt,
        }
      );

      if (error) {
        console.error("Error creating notification from template:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Failed to create notification from template:", error);
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications({
    userId = null,
    limit = 50,
    offset = 0,
    category = null,
    type = null,
    unreadOnly = false,
    includeArchived = false,
  } = {}) {
    try {
      const { data, error } = await supabase.rpc("get_user_notifications", {
        p_user_id: userId,
        p_limit: limit,
        p_offset: offset,
        p_category: category,
        p_type: type,
        p_unread_only: unreadOnly,
        p_include_archived: includeArchived,
      });

      if (error) {
        console.error("Error fetching notifications:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      return [];
    }
  }

  // Get recent notifications for header dropdown
  async getRecentNotifications(limit = 5) {
    try {
      return await this.getUserNotifications({
        limit,
        unreadOnly: false,
        includeArchived: false,
      });
    } catch (error) {
      console.error("Failed to fetch recent notifications:", error);
      return [];
    }
  }

  // Get unread notifications count
  async getUnreadCount(userId = null) {
    try {
      const { data, error } = await supabase.rpc("get_notification_stats", {
        p_user_id: userId,
      });

      if (error) {
        console.error("Error fetching notification stats:", error);
        return 0;
      }

      return data?.[0]?.unread_count || 0;
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
      return 0;
    }
  }

  // Get notification statistics
  async getNotificationStats(userId = null) {
    try {
      const { data, error } = await supabase.rpc("get_notification_stats", {
        p_user_id: userId,
      });

      if (error) {
        console.error("Error fetching notification stats:", error);
        throw error;
      }

      return (
        data?.[0] || {
          total_count: 0,
          unread_count: 0,
          archived_count: 0,
          critical_count: 0,
          category_stats: {},
          type_stats: {},
        }
      );
    } catch (error) {
      console.error("Failed to fetch notification stats:", error);
      return {
        total_count: 0,
        unread_count: 0,
        archived_count: 0,
        critical_count: 0,
        category_stats: {},
        type_stats: {},
      };
    }
  }

  // Mark notifications as read
  async markAsRead(notificationIds = null, userId = null, markAll = false) {
    try {
      const { data, error } = await supabase.rpc("mark_notifications_read", {
        notification_ids: notificationIds,
        p_user_id: userId,
        mark_all: markAll,
      });

      if (error) {
        console.error("Error marking notifications as read:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
      throw error;
    }
  }

  // Archive notifications
  async archiveNotifications(
    notificationIds = null,
    userId = null,
    archiveAllRead = false
  ) {
    try {
      const { data, error } = await supabase.rpc("archive_notifications", {
        notification_ids: notificationIds,
        p_user_id: userId,
        archive_all_read: archiveAllRead,
      });

      if (error) {
        console.error("Error archiving notifications:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Failed to archive notifications:", error);
      throw error;
    }
  }

  // Delete notifications
  async deleteNotifications({
    notificationIds = null,
    userId = null,
    deleteArchived = false,
    olderThanDays = null,
  } = {}) {
    try {
      const { data, error } = await supabase.rpc("delete_notifications", {
        notification_ids: notificationIds,
        p_user_id: userId,
        delete_archived: deleteArchived,
        older_than_days: olderThanDays,
      });

      if (error) {
        console.error("Error deleting notifications:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Failed to delete notifications:", error);
      throw error;
    }
  }

  // Subscribe to real-time notifications
  subscribeToNotifications(userId = null, callback) {
    try {
      let channel;

      if (userId) {
        // Subscribe to user-specific notifications
        channel = supabase
          .channel("user-notifications")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${userId}`,
            },
            callback
          )
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: "user_id=is.null",
            },
            callback
          );
      } else {
        // Subscribe to all system notifications
        channel = supabase.channel("all-notifications").on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
          },
          callback
        );
      }

      channel.subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error("Failed to subscribe to notifications:", error);
      return () => {};
    }
  }

  // Utility methods for common notification types

  // Low stock alert
  async createLowStockAlert(product) {
    return await this.createFromTemplate({
      templateName: "low_stock",
      templateData: {
        product_name: product.name,
        current_stock: product.total_stock.toString(),
        product_id: product.id.toString(),
      },
      relatedEntityType: "product",
      relatedEntityId: product.id,
    });
  }

  // Out of stock alert
  async createOutOfStockAlert(product) {
    return await this.createFromTemplate({
      templateName: "out_of_stock",
      templateData: {
        product_name: product.name,
        product_id: product.id.toString(),
      },
      relatedEntityType: "product",
      relatedEntityId: product.id,
    });
  }

  // Expiry warning
  async createExpiryWarning(product, daysUntilExpiry) {
    return await this.createFromTemplate({
      templateName: "expiry_warning",
      templateData: {
        product_name: product.name,
        days_until_expiry: daysUntilExpiry.toString(),
        product_id: product.id.toString(),
      },
      relatedEntityType: "product",
      relatedEntityId: product.id,
    });
  }

  // Sale completed notification
  async createSaleCompletedNotification(sale) {
    return await this.createFromTemplate({
      templateName: "sale_completed",
      templateData: {
        sale_id: sale.id.toString(),
        total: sale.total.toString(),
      },
      relatedEntityType: "sale",
      relatedEntityId: sale.id,
    });
  }

  // Product added notification
  async createProductAddedNotification(product) {
    return await this.createFromTemplate({
      templateName: "product_added",
      templateData: {
        product_name: product.name,
        product_id: product.id.toString(),
      },
      relatedEntityType: "product",
      relatedEntityId: product.id,
    });
  }

  // System update notification
  async createSystemUpdateNotification(message) {
    return await this.createNotification({
      title: "System Update",
      message,
      type: "info",
      category: "system",
      priority: 1,
    });
  }

  // Backup completed notification
  async createBackupCompletedNotification() {
    return await this.createFromTemplate({
      templateName: "backup_completed",
      templateData: {},
    });
  }

  // Get notification display configuration
  getNotificationDisplayConfig(type) {
    const configs = {
      error: {
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        iconColor: "text-red-600",
        badgeColor: "bg-red-500",
      },
      warning: {
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        iconColor: "text-amber-600",
        badgeColor: "bg-amber-500",
      },
      success: {
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        iconColor: "text-green-600",
        badgeColor: "bg-green-500",
      },
      info: {
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        iconColor: "text-blue-600",
        badgeColor: "bg-blue-500",
      },
    };

    return configs[type] || configs.info;
  }

  // Format notification time
  formatNotificationTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }

  // Get notification icon based on type and category
  getNotificationIcon(type, category) {
    // Icon mapping based on type and category
    const iconMap = {
      error: "AlertTriangle",
      warning: "AlertTriangle",
      success: "CheckCircle",
      info: "Info",
    };

    // Category-specific icons
    if (category === "inventory") {
      return type === "error" || type === "warning"
        ? "Package"
        : "PackageCheck";
    }

    if (category === "sales") {
      return type === "success" ? "TrendingUp" : "CreditCard";
    }

    if (category === "system") {
      return "Settings";
    }

    return iconMap[type] || "Info";
  }

  // Clean up old notifications (for maintenance)
  async cleanupOldNotifications() {
    try {
      const { data, error } = await supabase.rpc("cleanup_old_notifications");

      if (error) {
        console.error("Error cleaning up notifications:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Failed to cleanup notifications:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export const notificationService = new NotificationService();
export default notificationService;
