// =====================================================
// Simplified Notification Service - Direct Database Access
// No external functions needed - fail-safe approach
// =====================================================

import { supabase } from "@/config/supabase";

class SimpleNotificationService {
  // Get user notifications directly from table
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
      let query = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters safely
      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      } else {
        query = query.is("user_id", null);
      }

      if (category) {
        query = query.eq("category", category);
      }

      if (type) {
        query = query.eq("type", type);
      }

      if (unreadOnly) {
        query = query.eq("is_read", false);
      }

      if (!includeArchived) {
        query = query.eq("is_archived", false);
      }

      // Add expiry filter
      query = query.or("expires_at.is.null,expires_at.gt.now()");

      const { data, error } = await query;

      if (error) {
        console.warn("Notification query failed:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn("Failed to fetch notifications:", error);
      return [];
    }
  }

  // Get recent notifications for header dropdown
  async getRecentNotifications(limit = 5) {
    return await this.getUserNotifications({
      limit,
      unreadOnly: false,
      includeArchived: false,
    });
  }

  // Get unread count
  async getUnreadCount(userId = null) {
    try {
      let query = supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false)
        .eq("is_archived", false);

      if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
      } else {
        query = query.is("user_id", null);
      }

      // Add expiry filter
      query = query.or("expires_at.is.null,expires_at.gt.now()");

      const { count, error } = await query;

      if (error) {
        console.warn("Unread count query failed:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.warn("Failed to get unread count:", error);
      return 0;
    }
  }

  // Get notification statistics
  async getNotificationStats(userId = null) {
    try {
      // Get basic counts in parallel
      const [totalResult, unreadResult, archivedResult] = await Promise.all([
        supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .apply((query) =>
            userId
              ? query.or(`user_id.eq.${userId},user_id.is.null`)
              : query.is("user_id", null)
          ),

        supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("is_read", false)
          .eq("is_archived", false)
          .apply((query) =>
            userId
              ? query.or(`user_id.eq.${userId},user_id.is.null`)
              : query.is("user_id", null)
          ),

        supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("is_archived", true)
          .apply((query) =>
            userId
              ? query.or(`user_id.eq.${userId},user_id.is.null`)
              : query.is("user_id", null)
          ),
      ]);

      return {
        total_count: totalResult.count || 0,
        unread_count: unreadResult.count || 0,
        archived_count: archivedResult.count || 0,
        critical_count: 0, // Can be calculated if needed
        category_stats: {},
        type_stats: {},
      };
    } catch (error) {
      console.warn("Failed to get notification stats:", error);
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
      let query = supabase.from("notifications").update({
        is_read: true,
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (markAll) {
        if (userId) {
          query = query.or(`user_id.eq.${userId},user_id.is.null`);
        } else {
          query = query.is("user_id", null);
        }
      } else if (notificationIds && notificationIds.length > 0) {
        query = query.in("id", notificationIds);
      } else {
        return 0;
      }

      const { data, error } = await query.select("id");

      if (error) {
        console.warn("Mark as read failed:", error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.warn("Failed to mark as read:", error);
      return 0;
    }
  }

  // Archive notifications
  async archiveNotifications(
    notificationIds = null,
    userId = null,
    archiveAllRead = false
  ) {
    try {
      let query = supabase.from("notifications").update({
        is_archived: true,
        updated_at: new Date().toISOString(),
      });

      if (archiveAllRead) {
        query = query.eq("is_read", true);
        if (userId) {
          query = query.or(`user_id.eq.${userId},user_id.is.null`);
        } else {
          query = query.is("user_id", null);
        }
      } else if (notificationIds && notificationIds.length > 0) {
        query = query.in("id", notificationIds);
      } else {
        return 0;
      }

      const { data, error } = await query.select("id");

      if (error) {
        console.warn("Archive failed:", error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.warn("Failed to archive notifications:", error);
      return 0;
    }
  }

  // Create a simple notification
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
      const notificationData = {
        title,
        message,
        type,
        category,
        priority,
        user_id: userId,
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId,
        metadata: JSON.stringify(metadata),
        expires_at: expiresAt,
        is_read: false,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("notifications")
        .insert([notificationData])
        .select("id")
        .single();

      if (error) {
        console.warn("Create notification failed:", error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.warn("Failed to create notification:", error);
      return null;
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
      let query = supabase.from("notifications").delete();

      if (deleteArchived) {
        query = query.eq("is_archived", true);
        if (userId) {
          query = query.or(`user_id.eq.${userId},user_id.is.null`);
        }
      } else if (notificationIds && notificationIds.length > 0) {
        query = query.in("id", notificationIds);
      } else if (olderThanDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        query = query.lt("created_at", cutoffDate.toISOString());
        if (userId) {
          query = query.or(`user_id.eq.${userId},user_id.is.null`);
        }
      } else {
        return 0;
      }

      const { data, error } = await query.select("id");

      if (error) {
        console.warn("Delete notifications failed:", error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.warn("Failed to delete notifications:", error);
      return 0;
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
      console.warn("Failed to subscribe to notifications:", error);
      return () => {};
    }
  }

  // Helper methods for common notification types
  async createLowStockAlert(product) {
    return await this.createNotification({
      title: "Low Stock Alert",
      message: `${product.name} is running low (${
        product.stock || product.total_stock
      } units remaining)`,
      type: "warning",
      category: "inventory",
      priority: 2,
      relatedEntityType: "product",
      relatedEntityId: product.id,
      metadata: {
        product_name: product.name,
        current_stock: product.stock || product.total_stock,
        product_id: product.id,
      },
    });
  }

  async createOutOfStockAlert(product) {
    return await this.createNotification({
      title: "Out of Stock",
      message: `${product.name} is out of stock`,
      type: "error",
      category: "inventory",
      priority: 3,
      relatedEntityType: "product",
      relatedEntityId: product.id,
      metadata: {
        product_name: product.name,
        product_id: product.id,
      },
    });
  }

  async createSaleCompletedNotification(sale) {
    return await this.createNotification({
      title: "Sale Completed",
      message: `Sale #${sale.id} completed for ${sale.total}`,
      type: "success",
      category: "sales",
      priority: 1,
      relatedEntityType: "sale",
      relatedEntityId: sale.id,
      metadata: {
        sale_id: sale.id,
        total: sale.total,
      },
    });
  }

  // Utility methods
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

  formatNotificationTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }
}

// Export singleton instance
export const simpleNotificationService = new SimpleNotificationService();
export default simpleNotificationService;
