import { useState, useEffect, useCallback, useRef } from "react";
import {
  getNotificationsForDropdown,
  getNotificationStatsForDropdown,
  markNotificationAsReadFromDropdown,
  markAllNotificationsAsReadFromDropdown,
  subscribeToNotificationUpdates,
  unsubscribeFromNotificationUpdates,
  formatNotificationTimeForDropdown,
  getNotificationDisplayConfig,
} from "../services/notificationDropdownService.js";

/**
 * Enhanced notification hook specifically for header dropdown
 * Provides optimized state management and real-time updates
 */
export function useNotificationDropdown() {
  // State
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    byType: { error: 0, warning: 0, info: 0, success: 0 },
    byCategory: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Refs
  const subscriptionRef = useRef(null);
  const refreshTimeoutRef = useRef(null);

  /**
   * Fetch notifications for dropdown
   */
  const fetchNotifications = useCallback(
    async (showLoading = false) => {
      try {
        if (showLoading) {
          setLoading(true);
        }
        setError(null);

        const response = await getNotificationsForDropdown(10); // Get 10 most recent

        if (response.success) {
          setNotifications(response.data || []);

          // Update stats with the unread count from response
          setStats((prevStats) => ({
            ...prevStats,
            unread: response.unread || 0,
            total: response.total || 0,
          }));
        } else {
          throw new Error(response.error || "Failed to fetch notifications");
        }
      } catch (err) {
        console.error("Error fetching notifications for dropdown:", err);
        setError(err.message);

        // Don't clear notifications on error, keep showing last known state
        if (notifications.length === 0) {
          setNotifications([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [notifications.length]
  );

  /**
   * Fetch notification stats for badge
   */
  const fetchStats = useCallback(async () => {
    try {
      const response = await getNotificationStatsForDropdown();

      if (response.success) {
        setStats(response.data);
      } else {
        console.error("Error fetching notification stats:", response.error);
      }
    } catch (err) {
      console.error("Error fetching notification stats:", err);
    }
  }, []);

  /**
   * Mark single notification as read
   */
  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        const response = await markNotificationAsReadFromDropdown(
          notificationId
        );

        if (response.success) {
          // Update local state immediately for better UX
          setNotifications((prev) =>
            prev.map((notification) =>
              notification.id === notificationId
                ? { ...notification, is_read: true }
                : notification
            )
          );

          // Update stats
          setStats((prev) => ({
            ...prev,
            unread: Math.max(0, prev.unread - 1),
            read: prev.read + 1,
          }));

          // Refresh data after a short delay to sync with backend
          clearTimeout(refreshTimeoutRef.current);
          refreshTimeoutRef.current = setTimeout(() => {
            fetchNotifications(false);
            fetchStats();
          }, 1000);

          return { success: true };
        } else {
          throw new Error(
            response.error || "Failed to mark notification as read"
          );
        }
      } catch (err) {
        console.error("Error marking notification as read:", err);
        return { success: false, error: err.message };
      }
    },
    [fetchNotifications, fetchStats]
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await markAllNotificationsAsReadFromDropdown();

      if (response.success) {
        // Update local state immediately
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, is_read: true }))
        );

        // Update stats
        setStats((prev) => ({
          ...prev,
          unread: 0,
          read: prev.total,
        }));

        // Refresh data after a short delay
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = setTimeout(() => {
          fetchNotifications(false);
          fetchStats();
        }, 1000);

        return { success: true, message: response.message };
      } else {
        throw new Error(
          response.error || "Failed to mark all notifications as read"
        );
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      return { success: false, error: err.message };
    }
  }, [fetchNotifications, fetchStats]);

  /**
   * Handle real-time notification updates
   */
  const handleNotificationUpdate = useCallback(
    (payload) => {
      console.log("🔔 Handling notification update:", payload);

      // Refresh notifications and stats when changes occur
      fetchNotifications(false);
      fetchStats();
    },
    [fetchNotifications, fetchStats]
  );

  /**
   * Open dropdown
   */
  const openDropdown = useCallback(() => {
    setIsOpen(true);

    // Refresh data when opening dropdown
    fetchNotifications(false);
  }, [fetchNotifications]);

  /**
   * Close dropdown
   */
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Toggle dropdown
   */
  const toggleDropdown = useCallback(() => {
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }, [isOpen, openDropdown, closeDropdown]);

  /**
   * Format notification time for display
   */
  const formatTime = useCallback((timestamp) => {
    return formatNotificationTimeForDropdown(timestamp);
  }, []);

  /**
   * Get notification display configuration
   */
  const getDisplayConfig = useCallback((type) => {
    return getNotificationDisplayConfig(type);
  }, []);

  /**
   * Refresh all data
   */
  const refresh = useCallback(() => {
    fetchNotifications(true);
    fetchStats();
  }, [fetchNotifications, fetchStats]);

  // Effects

  /**
   * Initial data load
   */
  useEffect(() => {
    fetchNotifications(true);
    fetchStats();
  }, [fetchNotifications, fetchStats]);

  /**
   * Set up real-time subscription
   */
  useEffect(() => {
    // Only set up subscription if not already active
    if (!subscriptionRef.current) {
      subscriptionRef.current = subscribeToNotificationUpdates(
        handleNotificationUpdate
      );
    }

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        unsubscribeFromNotificationUpdates(subscriptionRef.current);
        subscriptionRef.current = null;
      }

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [handleNotificationUpdate]);

  /**
   * Auto-refresh every 30 seconds when dropdown is open
   */
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        fetchNotifications(false);
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [isOpen, fetchNotifications]);

  // Derived values
  const hasUnread = stats.unread > 0;
  const unreadCount = stats.unread;
  const hasNotifications = notifications.length > 0;
  const isEmpty = !hasNotifications && !loading;

  return {
    // Data
    notifications,
    stats,
    unreadCount,

    // State
    loading,
    error,
    isOpen,
    hasUnread,
    hasNotifications,
    isEmpty,

    // Actions
    markAsRead,
    markAllAsRead,
    refresh,

    // Dropdown control
    openDropdown,
    closeDropdown,
    toggleDropdown,

    // Utilities
    formatTime,
    getDisplayConfig,
  };
}

export default useNotificationDropdown;
