/**
 * Audit Service - Backend Integration
 * Handles audit logging, compliance tracking, and system monitoring
 */

import { supabase } from "../lib/supabase.js";
import { shouldUseMockAPI } from "./backendService.js";
import { hasPermission, PERMISSIONS } from "./roleService.js";

// Mock audit log database for development
let mockAuditLogs = [];
let auditLogIdCounter = 1;

// Audit event types
export const AUDIT_EVENTS = {
  // Authentication
  LOGIN: "auth.login",
  LOGOUT: "auth.logout",
  PASSWORD_RESET: "auth.password_reset",
  PASSWORD_CHANGE: "auth.password_change",
  ACCOUNT_LOCKED: "auth.account_locked",

  // User Management
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
  USER_ACTIVATED: "user.activated",
  USER_DEACTIVATED: "user.deactivated",
  ROLE_CHANGED: "user.role_changed",

  // Profile Management
  PROFILE_UPDATED: "profile.updated",
  AVATAR_UPLOADED: "profile.avatar_uploaded",
  PREFERENCES_UPDATED: "profile.preferences_updated",

  // Product Management
  PRODUCT_CREATED: "product.created",
  PRODUCT_UPDATED: "product.updated",
  PRODUCT_DELETED: "product.deleted",
  PRODUCT_ARCHIVED: "product.archived",
  STOCK_UPDATED: "product.stock_updated",

  // Sales & POS
  SALE_CREATED: "sale.created",
  SALE_REFUNDED: "sale.refunded",
  PAYMENT_PROCESSED: "payment.processed",
  TRANSACTION_VOIDED: "transaction.voided",

  // Inventory
  INVENTORY_ADJUSTED: "inventory.adjusted",
  STOCK_ALERT: "inventory.stock_alert",
  REORDER_CREATED: "inventory.reorder_created",

  // Reports & Analytics
  REPORT_GENERATED: "report.generated",
  DATA_EXPORTED: "data.exported",
  DATA_IMPORTED: "data.imported",

  // System
  SYSTEM_BACKUP: "system.backup",
  SYSTEM_RESTORE: "system.restore",
  SETTINGS_UPDATED: "system.settings_updated",
  MAINTENANCE_MODE: "system.maintenance_mode",
};

// Initialize mock data
mockAuditLogs.push({
  id: auditLogIdCounter++,
  userId: 1,
  userName: "Admin User",
  userRole: "admin",
  event: AUDIT_EVENTS.LOGIN,
  category: "authentication",
  description: "User logged in successfully",
  details: {
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    location: "Manila, Philippines",
  },
  timestamp: new Date().toISOString(),
  severity: "info",
});

/**
 * Log an audit event
 */
export async function logAuditEvent(eventData) {
  const {
    userId,
    userName,
    userRole,
    event,
    category,
    description,
    details = {},
    severity = "info",
    resourceId = null,
    resourceType = null,
  } = eventData;

  const auditEntry = {
    userId,
    userName,
    userRole,
    event,
    category,
    description,
    details,
    severity,
    resourceId,
    resourceType,
    timestamp: new Date().toISOString(),
  };

  const isMockAPI = await shouldUseMockAPI();

  if (isMockAPI) {
    auditEntry.id = auditLogIdCounter++;
    mockAuditLogs.unshift(auditEntry);

    // Keep only last 1000 entries in mock
    if (mockAuditLogs.length > 1000) {
      mockAuditLogs = mockAuditLogs.slice(0, 1000);
    }

    console.log("Audit Event Logged:", auditEntry);
    return {
      success: true,
      data: auditEntry,
    };
  }

  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .insert([
        {
          user_id: userId,
          user_name: userName,
          user_role: userRole,
          event,
          category,
          description,
          details,
          severity,
          resource_id: resourceId,
          resource_type: resourceType,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Failed to log audit event:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Failed to log audit event:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Apply filters to mock audit logs
 */
function applyMockFilters(logs, filters) {
  const { userId, event, category, severity, startDate, endDate } = filters;

  return logs.filter((log) => {
    if (userId && log.userId !== userId) return false;
    if (event && log.event !== event) return false;
    if (category && log.category !== category) return false;
    if (severity && log.severity !== severity) return false;
    if (startDate && new Date(log.timestamp) < new Date(startDate))
      return false;
    if (endDate && new Date(log.timestamp) > new Date(endDate)) return false;
    return true;
  });
}

/**
 * Sort mock audit logs
 */
function sortMockLogs(logs, sortBy, sortOrder) {
  return logs.sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    if (sortOrder === "desc") {
      return bValue > aValue ? 1 : -1;
    }
    return aValue > bValue ? 1 : -1;
  });
}

/**
 * Build Supabase query with filters
 */
function buildAuditQuery(filters) {
  const { userId, event, category, severity, startDate, endDate } = filters;

  let query = supabase.from("audit_logs").select("*", { count: "exact" });

  if (userId) query = query.eq("user_id", userId);
  if (event) query = query.eq("event", event);
  if (category) query = query.eq("category", category);
  if (severity) query = query.eq("severity", severity);
  if (startDate) query = query.gte("created_at", startDate);
  if (endDate) query = query.lte("created_at", endDate);

  return query;
}

/**
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs(currentUser, filters = {}) {
  // Permission check
  if (!hasPermission(currentUser, PERMISSIONS.AUDIT_READ)) {
    return {
      success: false,
      error: "Insufficient permissions to view audit logs",
    };
  }

  const {
    limit = 50,
    offset = 0,
    sortBy = "timestamp",
    sortOrder = "desc",
  } = filters;

  const isMockAPI = await shouldUseMockAPI();

  if (isMockAPI) {
    const filteredLogs = applyMockFilters(mockAuditLogs, filters);
    const sortedLogs = sortMockLogs(filteredLogs, sortBy, sortOrder);
    const total = sortedLogs.length;
    const paginatedLogs = sortedLogs.slice(offset, offset + limit);

    return {
      success: true,
      data: paginatedLogs,
      total,
      pagination: {
        offset,
        limit,
        hasMore: offset + limit < total,
      },
    };
  }

  try {
    const query = buildAuditQuery(filters)
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data,
      total: count,
      pagination: {
        offset,
        limit,
        hasMore: offset + limit < count,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get audit statistics
 */
export async function getAuditStatistics(currentUser, filters = {}) {
  // Permission check
  if (!hasPermission(currentUser, PERMISSIONS.AUDIT_READ)) {
    return {
      success: false,
      error: "Insufficient permissions to view audit statistics",
    };
  }

  const { startDate = null, endDate = null } = filters;

  const isMockAPI = await shouldUseMockAPI();

  if (isMockAPI) {
    let filteredLogs = [...mockAuditLogs];

    if (startDate) {
      filteredLogs = filteredLogs.filter(
        (log) => new Date(log.timestamp) >= new Date(startDate)
      );
    }
    if (endDate) {
      filteredLogs = filteredLogs.filter(
        (log) => new Date(log.timestamp) <= new Date(endDate)
      );
    }

    const stats = {
      totalEvents: filteredLogs.length,
      eventsByCategory: {},
      eventsBySeverity: {},
      eventsToday: filteredLogs.filter((log) => {
        const logDate = new Date(log.timestamp);
        const today = new Date();
        return logDate.toDateString() === today.toDateString();
      }).length,
      uniqueUsers: new Set(filteredLogs.map((log) => log.userId)).size,
      topEvents: {},
    };

    // Calculate category distribution
    filteredLogs.forEach((log) => {
      stats.eventsByCategory[log.category] =
        (stats.eventsByCategory[log.category] || 0) + 1;
      stats.eventsBySeverity[log.severity] =
        (stats.eventsBySeverity[log.severity] || 0) + 1;
      stats.topEvents[log.event] = (stats.topEvents[log.event] || 0) + 1;
    });

    return {
      success: true,
      data: stats,
    };
  }

  try {
    // This would require more complex SQL queries in a real implementation
    // For now, we'll use a simplified approach
    let query = supabase.from("audit_logs").select("*");

    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const stats = {
      totalEvents: data.length,
      eventsByCategory: {},
      eventsBySeverity: {},
      eventsToday: 0,
      uniqueUsers: new Set(),
      topEvents: {},
    };

    const today = new Date().toDateString();

    data.forEach((log) => {
      stats.eventsByCategory[log.category] =
        (stats.eventsByCategory[log.category] || 0) + 1;
      stats.eventsBySeverity[log.severity] =
        (stats.eventsBySeverity[log.severity] || 0) + 1;
      stats.topEvents[log.event] = (stats.topEvents[log.event] || 0) + 1;
      stats.uniqueUsers.add(log.user_id);

      if (new Date(log.created_at).toDateString() === today) {
        stats.eventsToday++;
      }
    });

    stats.uniqueUsers = stats.uniqueUsers.size;

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Export audit logs
 */
export async function exportAuditLogs(
  currentUser,
  filters = {},
  format = "csv"
) {
  // Permission check
  if (!hasPermission(currentUser, PERMISSIONS.AUDIT_EXPORT)) {
    return {
      success: false,
      error: "Insufficient permissions to export audit logs",
    };
  }

  const logsResult = await getAuditLogs(currentUser, {
    ...filters,
    limit: 10000,
  });

  if (!logsResult.success) {
    return logsResult;
  }

  const logs = logsResult.data;

  if (format === "csv") {
    const headers = [
      "Timestamp",
      "User",
      "Role",
      "Event",
      "Category",
      "Description",
      "Severity",
    ];
    const csvRows = [headers.join(",")];

    logs.forEach((log) => {
      const row = [
        log.timestamp,
        log.userName,
        log.userRole,
        log.event,
        log.category,
        `"${log.description.replace(/"/g, '""')}"`,
        log.severity,
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");

    return {
      success: true,
      data: {
        content: csvContent,
        filename: `audit_logs_${new Date().toISOString().split("T")[0]}.csv`,
        contentType: "text/csv",
      },
    };
  }

  if (format === "json") {
    return {
      success: true,
      data: {
        content: JSON.stringify(logs, null, 2),
        filename: `audit_logs_${new Date().toISOString().split("T")[0]}.json`,
        contentType: "application/json",
      },
    };
  }

  return {
    success: false,
    error: "Unsupported export format",
  };
}

/**
 * Delete old audit logs (data retention)
 */
export async function cleanupAuditLogs(currentUser, retentionDays = 365) {
  // Permission check
  if (!hasPermission(currentUser, PERMISSIONS.AUDIT_DELETE)) {
    return {
      success: false,
      error: "Insufficient permissions to delete audit logs",
    };
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const isMockAPI = await shouldUseMockAPI();

  if (isMockAPI) {
    const beforeCount = mockAuditLogs.length;
    mockAuditLogs = mockAuditLogs.filter(
      (log) => new Date(log.timestamp) >= cutoffDate
    );
    const deletedCount = beforeCount - mockAuditLogs.length;

    return {
      success: true,
      data: {
        deletedCount,
        cutoffDate: cutoffDate.toISOString(),
      },
    };
  }

  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .delete()
      .lt("created_at", cutoffDate.toISOString());

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Log the cleanup action
    await logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      event: AUDIT_EVENTS.SYSTEM_BACKUP,
      category: "system",
      description: `Audit logs cleanup completed. Deleted records older than ${retentionDays} days`,
      details: {
        retentionDays,
        cutoffDate: cutoffDate.toISOString(),
        deletedCount: data?.length || 0,
      },
      severity: "info",
    });

    return {
      success: true,
      data: {
        deletedCount: data?.length || 0,
        cutoffDate: cutoffDate.toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Helper function to automatically log common events
export const auditHelpers = {
  /**
   * Log authentication events
   */
  logAuth: (user, event, details = {}) => {
    return logAuditEvent({
      userId: user?.id,
      userName: user?.name || "Unknown",
      userRole: user?.role || "unknown",
      event,
      category: "authentication",
      description: getEventDescription(event, details),
      details,
      severity: getSeverityForEvent(event),
    });
  },

  /**
   * Log user management events
   */
  logUserManagement: (currentUser, targetUser, event, details = {}) => {
    return logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      event,
      category: "user_management",
      description: `${getEventDescription(event, details)} for user: ${
        targetUser.name
      }`,
      details: {
        ...details,
        targetUserId: targetUser.id,
        targetUserName: targetUser.name,
      },
      severity: getSeverityForEvent(event),
      resourceId: targetUser.id,
      resourceType: "user",
    });
  },

  /**
   * Log product events
   */
  logProduct: (user, product, event, details = {}) => {
    return logAuditEvent({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      event,
      category: "product",
      description: `${getEventDescription(event, details)} for product: ${
        product.name
      }`,
      details: { ...details, productId: product.id, productName: product.name },
      severity: getSeverityForEvent(event),
      resourceId: product.id,
      resourceType: "product",
    });
  },
};

// Helper functions
function getEventDescription(event) {
  const descriptions = {
    [AUDIT_EVENTS.LOGIN]: "User logged in",
    [AUDIT_EVENTS.LOGOUT]: "User logged out",
    [AUDIT_EVENTS.PASSWORD_RESET]: "Password reset requested",
    [AUDIT_EVENTS.USER_CREATED]: "User account created",
    [AUDIT_EVENTS.USER_UPDATED]: "User account updated",
    [AUDIT_EVENTS.PRODUCT_CREATED]: "Product created",
    [AUDIT_EVENTS.SALE_CREATED]: "Sale transaction created",
  };

  return descriptions[event] || `Event: ${event}`;
}

function getSeverityForEvent(event) {
  const criticalEvents = [
    AUDIT_EVENTS.ACCOUNT_LOCKED,
    AUDIT_EVENTS.USER_DELETED,
    AUDIT_EVENTS.SYSTEM_RESTORE,
  ];

  const warningEvents = [
    AUDIT_EVENTS.PASSWORD_RESET,
    AUDIT_EVENTS.ROLE_CHANGED,
    AUDIT_EVENTS.TRANSACTION_VOIDED,
  ];

  if (criticalEvents.includes(event)) return "critical";
  if (warningEvents.includes(event)) return "warning";
  return "info";
}

export default {
  logAuditEvent,
  getAuditLogs,
  getAuditStatistics,
  exportAuditLogs,
  cleanupAuditLogs,
  auditHelpers,
  AUDIT_EVENTS,
};
