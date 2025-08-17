/**
 * MedCure Notifications Hook
 * Custom React hook for managing notification state and operations
 */

import { useState, useEffect, useCallback } from "react";
import {
  getNotifications,
  getNotificationStats,
  markNotificationAsRead,
  markMultipleAsRead,
  deleteNotification,
  deleteMultipleNotifications,
  createNotification,
} from "../services/notificationService";
import { useNotification } from "./useNotification";

export function useNotifications(initialFilters = {}) {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    byCategory: {},
    byType: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const { showNotification } = useNotification();

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getNotifications(filters);

      if (response.success) {
        setNotifications(response.data);
        // Update unread count in stats
        setStats((prev) => ({
          ...prev,
          total: response.total,
          unread: response.unread,
          read: response.total - response.unread,
        }));
      } else {
        throw new Error(response.error || "Failed to fetch notifications");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err.message);
      showNotification("Failed to load notifications", "error");
    } finally {
      setLoading(false);
    }
  }, [filters, showNotification]);

  // Fetch notification statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await getNotificationStats();

      if (response.success) {
        setStats(response.data);
      } else {
        console.warn("Failed to fetch notification stats:", response.error);
      }
    } catch (err) {
      console.error("Error fetching notification stats:", err);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        const response = await markNotificationAsRead(notificationId);

        if (response.success) {
          // Update local state
          setNotifications((prev) =>
            prev.map((notification) =>
              notification.id === notificationId
                ? {
                    ...notification,
                    is_read: true,
                    read_at: new Date().toISOString(),
                  }
                : notification
            )
          );

          // Update stats
          setStats((prev) => ({
            ...prev,
            unread: Math.max(0, prev.unread - 1),
            read: prev.read + 1,
          }));

          showNotification("Notification marked as read", "success");
        } else {
          throw new Error(
            response.error || "Failed to mark notification as read"
          );
        }
      } catch (err) {
        console.error("Error marking notification as read:", err);
        showNotification("Failed to mark notification as read", "error");
      }
    },
    [showNotification]
  );

  // Mark multiple notifications as read
  const markMultipleRead = useCallback(
    async (notificationIds) => {
      try {
        const response = await markMultipleAsRead(notificationIds);

        if (response.success) {
          const unreadCount = notifications.filter(
            (n) => notificationIds.includes(n.id) && !n.is_read
          ).length;

          // Update local state
          setNotifications((prev) =>
            prev.map((notification) =>
              notificationIds.includes(notification.id)
                ? {
                    ...notification,
                    is_read: true,
                    read_at: new Date().toISOString(),
                  }
                : notification
            )
          );

          // Update stats
          setStats((prev) => ({
            ...prev,
            unread: Math.max(0, prev.unread - unreadCount),
            read: prev.read + unreadCount,
          }));

          showNotification(
            `${notificationIds.length} notifications marked as read`,
            "success"
          );
        } else {
          throw new Error(
            response.error || "Failed to mark notifications as read"
          );
        }
      } catch (err) {
        console.error("Error marking notifications as read:", err);
        showNotification("Failed to mark notifications as read", "error");
      }
    },
    [notifications, showNotification]
  );

  // Delete notification
  const deleteNotificationItem = useCallback(
    async (notificationId) => {
      try {
        const response = await deleteNotification(notificationId);

        if (response.success) {
          const deletedNotification = notifications.find(
            (n) => n.id === notificationId
          );

          // Update local state
          setNotifications((prev) =>
            prev.filter((n) => n.id !== notificationId)
          );

          // Update stats
          setStats((prev) => ({
            ...prev,
            total: Math.max(0, prev.total - 1),
            unread:
              deletedNotification && !deletedNotification.is_read
                ? Math.max(0, prev.unread - 1)
                : prev.unread,
            read:
              deletedNotification && deletedNotification.is_read
                ? Math.max(0, prev.read - 1)
                : prev.read,
          }));

          showNotification("Notification deleted", "success");
        } else {
          throw new Error(response.error || "Failed to delete notification");
        }
      } catch (err) {
        console.error("Error deleting notification:", err);
        showNotification("Failed to delete notification", "error");
      }
    },
    [notifications, showNotification]
  );

  // Delete multiple notifications
  const deleteMultiple = useCallback(
    async (notificationIds) => {
      try {
        const response = await deleteMultipleNotifications(notificationIds);

        if (response.success) {
          const deletedNotifications = notifications.filter((n) =>
            notificationIds.includes(n.id)
          );
          const unreadDeleted = deletedNotifications.filter(
            (n) => !n.is_read
          ).length;
          const readDeleted = deletedNotifications.filter(
            (n) => n.is_read
          ).length;

          // Update local state
          setNotifications((prev) =>
            prev.filter((n) => !notificationIds.includes(n.id))
          );

          // Update stats
          setStats((prev) => ({
            ...prev,
            total: Math.max(0, prev.total - notificationIds.length),
            unread: Math.max(0, prev.unread - unreadDeleted),
            read: Math.max(0, prev.read - readDeleted),
          }));

          showNotification(
            `${notificationIds.length} notifications deleted`,
            "success"
          );
        } else {
          throw new Error(response.error || "Failed to delete notifications");
        }
      } catch (err) {
        console.error("Error deleting notifications:", err);
        showNotification("Failed to delete notifications", "error");
      }
    },
    [notifications, showNotification]
  );

  // Create new notification
  const addNotification = useCallback(
    async (notificationData) => {
      try {
        const response = await createNotification(notificationData);

        if (response.success) {
          // Add to local state
          setNotifications((prev) => [response.data, ...prev]);

          // Update stats
          setStats((prev) => ({
            ...prev,
            total: prev.total + 1,
            unread: prev.unread + 1,
          }));

          return response;
        } else {
          throw new Error(response.error || "Failed to create notification");
        }
      } catch (err) {
        console.error("Error creating notification:", err);
        showNotification("Failed to create notification", "error");
        return { success: false, error: err.message };
      }
    },
    [showNotification]
  );

  // Update filters and refresh data
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchStats()]);
  }, [fetchNotifications, fetchStats]);

  // Load data on mount and when filters change
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Load stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Helper functions for filtering
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter((n) => !n.is_read);
  }, [notifications]);

  const getNotificationsByCategory = useCallback(
    (category) => {
      return notifications.filter(
        (n) => n.category && n.category.toLowerCase() === category.toLowerCase()
      );
    },
    [notifications]
  );

  const getNotificationsByType = useCallback(
    (type) => {
      return notifications.filter((n) => n.type === type);
    },
    [notifications]
  );

  const getCriticalNotifications = useCallback(() => {
    return notifications.filter((n) => n.priority >= 3 && !n.is_read);
  }, [notifications]);

  return {
    // Data
    notifications,
    stats,
    loading,
    error,
    filters,

    // Actions
    markAsRead,
    markMultipleRead,
    deleteNotificationItem,
    deleteMultiple,
    addNotification,
    updateFilters,
    refresh,

    // Helpers
    getUnreadNotifications,
    getNotificationsByCategory,
    getNotificationsByType,
    getCriticalNotifications,
  };
}

export default useNotifications;
