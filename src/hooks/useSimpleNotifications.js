// =====================================================
// Simplified useNotifications Hook - Fail-safe approach
// Uses direct database queries with graceful fallbacks
// =====================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { simpleNotificationService } from "@/services/simpleNotificationService";

export const useSimpleNotifications = (userId = null) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState({
    total_count: 0,
    unread_count: 0,
    archived_count: 0,
    critical_count: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  // Load notifications with error handling
  const loadNotifications = useCallback(
    async (options = {}) => {
      try {
        setLoading(true);
        setError(null);

        // Run queries in parallel with fallbacks
        const [notificationsData, statsData] = await Promise.allSettled([
          simpleNotificationService.getUserNotifications({
            userId,
            ...options,
          }),
          simpleNotificationService.getNotificationStats(userId),
        ]);

        // Handle notifications result
        if (notificationsData.status === "fulfilled") {
          setNotifications(notificationsData.value);
        } else {
          console.warn("Notifications query failed:", notificationsData.reason);
          setNotifications([]);
        }

        // Handle stats result
        if (statsData.status === "fulfilled") {
          setStats(statsData.value);
          setUnreadCount(statsData.value.unread_count);
        } else {
          console.warn("Stats query failed:", statsData.reason);
          // Fallback: calculate unread count from loaded notifications
          const unread =
            notificationsData.status === "fulfilled"
              ? notificationsData.value.filter((n) => !n.is_read).length
              : 0;
          setUnreadCount(unread);
          setStats({
            total_count:
              notificationsData.status === "fulfilled"
                ? notificationsData.value.length
                : 0,
            unread_count: unread,
            archived_count: 0,
            critical_count: 0,
          });
        }
      } catch (err) {
        console.warn("Error loading notifications:", err);
        setError("Failed to load notifications");
        // Set safe defaults
        setNotifications([]);
        setUnreadCount(0);
        setStats({
          total_count: 0,
          unread_count: 0,
          archived_count: 0,
          critical_count: 0,
        });
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
        const recent = await simpleNotificationService.getRecentNotifications(
          limit
        );
        setNotifications(recent);

        // Update unread count
        const count = await simpleNotificationService.getUnreadCount(userId);
        setUnreadCount(count);

        return recent;
      } catch (err) {
        console.warn("Error loading recent notifications:", err);
        return [];
      }
    },
    [userId]
  );

  // Mark as read with optimistic updates
  const markAsRead = useCallback(
    async (notificationIds = null, markAll = false) => {
      try {
        // Optimistic update
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
          setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
        }

        // Update database
        const updatedCount = await simpleNotificationService.markAsRead(
          notificationIds,
          userId,
          markAll
        );

        // If database update failed, revert optimistic update
        if (updatedCount === 0 && (markAll || notificationIds?.length > 0)) {
          console.warn("Mark as read failed, reverting optimistic update");
          await loadNotifications(); // Reload to get correct state
        }

        return updatedCount;
      } catch (err) {
        console.warn("Error marking as read:", err);
        // Revert optimistic update
        await loadNotifications();
        throw err;
      }
    },
    [userId, loadNotifications]
  );

  // Archive notifications
  const archiveNotifications = useCallback(
    async (notificationIds = null, archiveAllRead = false) => {
      try {
        const archivedCount =
          await simpleNotificationService.archiveNotifications(
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
        }

        return archivedCount;
      } catch (err) {
        console.warn("Error archiving notifications:", err);
        throw err;
      }
    },
    [userId]
  );

  // Create notification
  const createNotification = useCallback(
    async (notificationData) => {
      try {
        const notificationId =
          await simpleNotificationService.createNotification({
            userId,
            ...notificationData,
          });

        if (notificationId) {
          // Refresh notifications to include the new one
          await loadNotifications();
        }

        return notificationId;
      } catch (err) {
        console.warn("Error creating notification:", err);
        throw err;
      }
    },
    [userId, loadNotifications]
  );

  // Subscribe to real-time notifications with error handling
  useEffect(() => {
    const handleNewNotification = (payload) => {
      try {
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
      } catch (err) {
        console.warn("Error handling new notification:", err);
      }
    };

    try {
      // Subscribe to real-time updates
      unsubscribeRef.current =
        simpleNotificationService.subscribeToNotifications(
          userId,
          handleNewNotification
        );
    } catch (err) {
      console.warn("Failed to subscribe to notifications:", err);
    }

    return () => {
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch (err) {
          console.warn("Error unsubscribing from notifications:", err);
        }
      }
    };
  }, [userId]);

  // Load initial data with retry logic
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    const loadWithRetry = async () => {
      try {
        await loadNotifications();
      } catch (err) {
        retryCount++;
        if (retryCount < maxRetries) {
          console.warn(
            `Retrying notification load (${retryCount}/${maxRetries})`
          );
          setTimeout(loadWithRetry, 1000 * retryCount); // Exponential backoff
        } else {
          console.error("Failed to load notifications after retries");
        }
      }
    };

    loadWithRetry();
  }, [loadNotifications]);

  // Refresh notifications
  const refresh = useCallback(() => {
    return loadNotifications();
  }, [loadNotifications]);

  // Utility functions
  const getNotificationsByCategory = useCallback(
    (category) => {
      return notifications.filter((n) => n.category === category);
    },
    [notifications]
  );

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter((n) => !n.is_read);
  }, [notifications]);

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
    createNotification,
    refresh,

    // Utilities
    getNotificationsByCategory,
    getUnreadNotifications,

    // Service reference for direct access if needed
    service: simpleNotificationService,
  };
};

export default useSimpleNotifications;
