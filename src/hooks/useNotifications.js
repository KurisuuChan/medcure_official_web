// =====================================================
// useNotifications Hook
// Custom hook for managing real-time notifications
// =====================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { notificationService } from "@/services/notificationService";

export const useNotifications = (userId = null) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState({
    total_count: 0,
    unread_count: 0,
    archived_count: 0,
    critical_count: 0,
    category_stats: {},
    type_stats: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  // Load initial notifications
  const loadNotifications = useCallback(
    async (options = {}) => {
      try {
        setLoading(true);
        setError(null);

        const [notificationsData, statsData] = await Promise.all([
          notificationService.getUserNotifications({
            userId,
            ...options,
          }),
          notificationService.getNotificationStats(userId),
        ]);

        setNotifications(notificationsData);
        setStats(statsData);
        setUnreadCount(statsData.unread_count);
      } catch (err) {
        console.error("Error loading notifications:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Load recent notifications for header
  const loadRecentNotifications = useCallback(
    async (limit = 5) => {
      try {
        const recent = await notificationService.getRecentNotifications(limit);
        setNotifications(recent);

        // Also update unread count
        const count = await notificationService.getUnreadCount(userId);
        setUnreadCount(count);

        return recent;
      } catch (err) {
        console.error("Error loading recent notifications:", err);
        setError(err.message);
        return [];
      }
    },
    [userId]
  );

  // Mark notifications as read
  const markAsRead = useCallback(
    async (notificationIds = null, markAll = false) => {
      try {
        const updatedCount = await notificationService.markAsRead(
          notificationIds,
          userId,
          markAll
        );

        if (updatedCount > 0) {
          // Update local state
          if (markAll) {
            setNotifications((prev) =>
              prev.map((n) => ({ ...n, is_read: true }))
            );
            setUnreadCount(0);
          } else if (notificationIds) {
            setNotifications((prev) =>
              prev.map((n) =>
                notificationIds.includes(n.id) ? { ...n, is_read: true } : n
              )
            );
            setUnreadCount((prev) =>
              Math.max(0, prev - notificationIds.length)
            );
          }

          // Refresh stats
          const newStats = await notificationService.getNotificationStats(
            userId
          );
          setStats(newStats);
        }

        return updatedCount;
      } catch (err) {
        console.error("Error marking notifications as read:", err);
        setError(err.message);
        throw err;
      }
    },
    [userId]
  );

  // Archive notifications
  const archiveNotifications = useCallback(
    async (notificationIds = null, archiveAllRead = false) => {
      try {
        const archivedCount = await notificationService.archiveNotifications(
          notificationIds,
          userId,
          archiveAllRead
        );

        if (archivedCount > 0) {
          // Remove archived notifications from current list
          if (archiveAllRead) {
            setNotifications((prev) => prev.filter((n) => !n.is_read));
          } else if (notificationIds) {
            setNotifications((prev) =>
              prev.filter((n) => !notificationIds.includes(n.id))
            );
          }

          // Refresh stats
          const newStats = await notificationService.getNotificationStats(
            userId
          );
          setStats(newStats);
        }

        return archivedCount;
      } catch (err) {
        console.error("Error archiving notifications:", err);
        setError(err.message);
        throw err;
      }
    },
    [userId]
  );

  // Delete notifications
  const deleteNotifications = useCallback(
    async (options = {}) => {
      try {
        const deletedCount = await notificationService.deleteNotifications({
          userId,
          ...options,
        });

        if (deletedCount > 0) {
          // Refresh notifications
          await loadNotifications();
        }

        return deletedCount;
      } catch (err) {
        console.error("Error deleting notifications:", err);
        setError(err.message);
        throw err;
      }
    },
    [userId, loadNotifications]
  );

  // Create a new notification
  const createNotification = useCallback(
    async (notificationData) => {
      try {
        const notificationId = await notificationService.createNotification({
          userId,
          ...notificationData,
        });

        // Refresh notifications to include the new one
        await loadNotifications();

        return notificationId;
      } catch (err) {
        console.error("Error creating notification:", err);
        setError(err.message);
        throw err;
      }
    },
    [userId, loadNotifications]
  );

  // Subscribe to real-time notifications
  useEffect(() => {
    const handleNewNotification = (payload) => {
      const newNotification = payload.new;

      // Add to notifications list
      setNotifications((prev) => [newNotification, ...prev]);

      // Update unread count if it's unread
      if (!newNotification.is_read) {
        setUnreadCount((prev) => prev + 1);
      }

      // Update stats
      setStats((prev) => ({
        ...prev,
        total_count: prev.total_count + 1,
        unread_count: newNotification.is_read
          ? prev.unread_count
          : prev.unread_count + 1,
      }));
    };

    // Subscribe to real-time updates
    unsubscribeRef.current = notificationService.subscribeToNotifications(
      userId,
      handleNewNotification
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [userId]);

  // Load initial data
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Refresh notifications
  const refresh = useCallback(() => {
    return loadNotifications();
  }, [loadNotifications]);

  // Get notifications by category
  const getNotificationsByCategory = useCallback(
    (category) => {
      return notifications.filter((n) => n.category === category);
    },
    [notifications]
  );

  // Get notifications by type
  const getNotificationsByType = useCallback(
    (type) => {
      return notifications.filter((n) => n.type === type);
    },
    [notifications]
  );

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter((n) => !n.is_read);
  }, [notifications]);

  // Search notifications
  const searchNotifications = useCallback(
    (query) => {
      if (!query.trim()) return notifications;

      const lowerQuery = query.toLowerCase();
      return notifications.filter(
        (n) =>
          n.title.toLowerCase().includes(lowerQuery) ||
          n.message.toLowerCase().includes(lowerQuery) ||
          n.category.toLowerCase().includes(lowerQuery)
      );
    },
    [notifications]
  );

  return {
    // Data
    notifications,
    unreadCount,
    stats,
    loading,
    error,

    // Actions
    loadNotifications,
    loadRecentNotifications,
    markAsRead,
    archiveNotifications,
    deleteNotifications,
    createNotification,
    refresh,

    // Utilities
    getNotificationsByCategory,
    getNotificationsByType,
    getUnreadNotifications,
    searchNotifications,
  };
};

export default useNotifications;
