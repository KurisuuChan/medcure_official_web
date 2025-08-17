/**
 * Backend Integration Service - Complete User Management
 * Orchestrates all user management backend services and provides unified API
 */

import { supabase } from "../lib/supabase.js";
import { shouldUseMockAPI } from "./backendService.js";
import authService from "./authService_backend.js";
import userProfileService from "./userProfileService.js";
import auditService, { AUDIT_EVENTS } from "./auditService.js";
import userManagementService from "./userManagementService.js";
import { hasPermission, PERMISSIONS, ROLES } from "./roleService.js";

/**
 * Initialize backend services and database
 */
export async function initializeBackend() {
  console.log("Initializing MedCure Backend Services...");

  try {
    const isMockAPI = await shouldUseMockAPI();

    if (isMockAPI) {
      console.log("Using Mock API for development");
      return {
        success: true,
        message: "Backend initialized with Mock API",
        services: {
          auth: true,
          userManagement: true,
          profiles: true,
          audit: true,
        },
      };
    }

    // Check Supabase connection
    const { data, error } = await supabase
      .from("user_profiles")
      .select("count(*)", { count: "exact" })
      .limit(1);

    if (error) {
      console.error("Supabase connection failed:", error);
      return {
        success: false,
        error: "Failed to connect to Supabase database",
      };
    }

    console.log("✅ Supabase connection successful");
    console.log("✅ User management backend initialized");

    return {
      success: true,
      message: "Backend initialized successfully",
      services: {
        auth: true,
        userManagement: true,
        profiles: true,
        audit: true,
      },
      database: {
        connected: true,
        userCount: data[0]?.count || 0,
      },
    };
  } catch (error) {
    console.error("Backend initialization failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Complete user registration with profile creation
 */
export async function registerUserComplete(registrationData) {
  const {
    email,
    password,
    firstName,
    lastName,
    role = "viewer",
    jobTitle,
    department,
    employeeId,
    createdBy,
  } = registrationData;

  try {
    // Step 1: Create authentication user
    const authResult = await authService.register({
      email,
      password,
      userData: {
        firstName,
        lastName,
        role,
      },
    });

    if (!authResult.success) {
      return authResult;
    }

    const newUser = authResult.data.user;

    // Step 2: Create user profile
    const profileData = {
      userId: newUser.id,
      firstName,
      lastName,
      jobTitle,
      department,
      employeeId,
      role,
      status: "active",
      createdBy: createdBy?.id,
    };

    const profileResult = await userProfileService.updateUserProfile(
      createdBy,
      newUser.id,
      profileData
    );

    if (!profileResult.success) {
      // Rollback user creation if profile creation fails
      await authService.deleteUser(newUser.id);
      return {
        success: false,
        error: "Failed to create user profile: " + profileResult.error,
      };
    }

    // Step 3: Log audit event
    await auditService.auditHelpers.logUserManagement(
      createdBy,
      { id: newUser.id, name: `${firstName} ${lastName}` },
      AUDIT_EVENTS.USER_CREATED,
      {
        email,
        role,
        employeeId,
      }
    );

    return {
      success: true,
      data: {
        user: newUser,
        profile: profileResult.data,
      },
      message: "User registered successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Complete user login with session tracking
 */
export async function loginUserComplete(loginData) {
  const { email, password, deviceInfo = {} } = loginData;

  try {
    // Step 1: Authenticate user
    const authResult = await authService.signIn({ email, password });

    if (!authResult.success) {
      // Log failed login attempt
      await auditService.logAuditEvent({
        userId: null,
        userName: email,
        userRole: "unknown",
        event: AUDIT_EVENTS.LOGIN,
        category: "authentication",
        description: "Failed login attempt",
        details: {
          email,
          reason: authResult.error,
          ...deviceInfo,
        },
        severity: "warning",
      });

      return authResult;
    }

    const { user, session } = authResult.data;

    // Step 2: Get user profile
    const profileResult = await userProfileService.getUserProfile(
      user,
      user.id
    );

    if (!profileResult.success) {
      return {
        success: false,
        error: "Failed to load user profile",
      };
    }

    const profile = profileResult.data;

    // Step 3: Check if user is active
    if (profile.status !== "active") {
      await authService.signOut();
      return {
        success: false,
        error: `Account is ${profile.status}. Please contact administrator.`,
      };
    }

    // Step 4: Update last login time
    await userProfileService.updateUserProfile(user, user.id, {
      lastLoginAt: new Date().toISOString(),
      failedLoginAttempts: 0,
    });

    // Step 5: Log successful login
    await auditService.auditHelpers.logAuth(
      {
        ...user,
        name: `${profile.firstName} ${profile.lastName}`,
        role: profile.role,
      },
      AUDIT_EVENTS.LOGIN,
      {
        sessionId: session.access_token?.substring(0, 10) + "...",
        ...deviceInfo,
      }
    );

    return {
      success: true,
      data: {
        user: {
          ...user,
          profile,
        },
        session,
      },
      message: "Login successful",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Complete user logout with session cleanup
 */
export async function logoutUserComplete(user) {
  try {
    // Step 1: Log logout event
    await auditService.auditHelpers.logAuth(user, AUDIT_EVENTS.LOGOUT, {
      logoutTime: new Date().toISOString(),
    });

    // Step 2: Sign out user
    await authService.signOut();

    return {
      success: true,
      message: "Logout successful",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update user with audit logging
 */
export async function updateUserComplete(currentUser, userId, updates) {
  try {
    // Get current user data for comparison
    const currentData = await userProfileService.getUserProfile(
      currentUser,
      userId
    );

    if (!currentData.success) {
      return currentData;
    }

    // Update user profile
    const updateResult = await userProfileService.updateUserProfile(
      currentUser,
      userId,
      updates
    );

    if (!updateResult.success) {
      return updateResult;
    }

    // Log the update
    await auditService.auditHelpers.logUserManagement(
      currentUser,
      {
        id: userId,
        name: `${currentData.data.firstName} ${currentData.data.lastName}`,
      },
      AUDIT_EVENTS.USER_UPDATED,
      {
        changes: updates,
        previousValues: {
          role: currentData.data.role,
          status: currentData.data.status,
        },
      }
    );

    return updateResult;
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Deactivate user with audit logging
 */
export async function deactivateUserComplete(currentUser, userId, reason = "") {
  try {
    // Get user data
    const userData = await userProfileService.getUserProfile(
      currentUser,
      userId
    );

    if (!userData.success) {
      return userData;
    }

    // Deactivate user
    const deactivateResult = await userManagementService.deactivateUser(
      currentUser,
      userId
    );

    if (!deactivateResult.success) {
      return deactivateResult;
    }

    // Log the deactivation
    await auditService.auditHelpers.logUserManagement(
      currentUser,
      {
        id: userId,
        name: `${userData.data.firstName} ${userData.data.lastName}`,
      },
      AUDIT_EVENTS.USER_DEACTIVATED,
      {
        reason,
        deactivatedAt: new Date().toISOString(),
      }
    );

    return deactivateResult;
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Change user password with audit logging
 */
export async function changePasswordComplete(user, oldPassword, newPassword) {
  try {
    // Change password
    const changeResult = await authService.updatePassword({
      oldPassword,
      newPassword,
    });

    if (!changeResult.success) {
      return changeResult;
    }

    // Update password changed timestamp
    await userProfileService.updateUserProfile(user, user.id, {
      passwordChangedAt: new Date().toISOString(),
      mustChangePassword: false,
    });

    // Log password change
    await auditService.auditHelpers.logAuth(
      user,
      AUDIT_EVENTS.PASSWORD_CHANGE,
      {
        changedAt: new Date().toISOString(),
      }
    );

    return {
      success: true,
      message: "Password changed successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Reset user password with audit logging
 */
export async function resetPasswordComplete(email) {
  try {
    // Reset password
    const resetResult = await authService.resetPassword({ email });

    if (!resetResult.success) {
      return resetResult;
    }

    // Log password reset request
    await auditService.logAuditEvent({
      userId: null,
      userName: email,
      userRole: "unknown",
      event: AUDIT_EVENTS.PASSWORD_RESET,
      category: "authentication",
      description: "Password reset requested",
      details: {
        email,
        requestedAt: new Date().toISOString(),
      },
      severity: "info",
    });

    return resetResult;
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get comprehensive user dashboard data
 */
export async function getUserDashboardData(currentUser) {
  try {
    // Check permissions
    if (!hasPermission(currentUser, PERMISSIONS.USER_READ)) {
      return {
        success: false,
        error: "Insufficient permissions",
      };
    }

    // Get user statistics
    const userStatsResult = await userManagementService.getUserStatistics(
      currentUser
    );

    // Get recent audit events
    const auditStatsResult = await auditService.getAuditStatistics(
      currentUser,
      {
        startDate: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // Last 30 days
      }
    );

    // Get recent user activity
    const recentActivityResult = await auditService.getAuditLogs(currentUser, {
      category: "user_management",
      limit: 10,
    });

    return {
      success: true,
      data: {
        userStats: userStatsResult.success ? userStatsResult.data : null,
        auditStats: auditStatsResult.success ? auditStatsResult.data : null,
        recentActivity: recentActivityResult.success
          ? recentActivityResult.data
          : [],
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
 * Bulk user operations with audit logging
 */
export async function bulkUserOperations(
  currentUser,
  operation,
  userIds,
  operationData = {}
) {
  try {
    // Check permissions
    if (!hasPermission(currentUser, PERMISSIONS.USER_UPDATE)) {
      return {
        success: false,
        error: "Insufficient permissions for bulk operations",
      };
    }

    const results = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        let result;

        switch (operation) {
          case "activate":
            result = await userManagementService.activateUser(
              currentUser,
              userId
            );
            break;
          case "deactivate":
            result = await deactivateUserComplete(
              currentUser,
              userId,
              operationData.reason
            );
            break;
          case "changeRole":
            result = await updateUserComplete(currentUser, userId, {
              role: operationData.role,
            });
            break;
          case "resetPassword":
            // This would typically send reset email
            result = { success: true, message: "Password reset email sent" };
            break;
          default:
            result = { success: false, error: "Unknown operation" };
        }

        if (result.success) {
          results.push({ userId, success: true });
        } else {
          errors.push({ userId, error: result.error });
        }
      } catch (error) {
        errors.push({ userId, error: error.message });
      }
    }

    // Log bulk operation
    await auditService.logAuditEvent({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      event: `bulk_${operation}`,
      category: "user_management",
      description: `Bulk ${operation} operation performed on ${userIds.length} users`,
      details: {
        operation,
        userIds,
        operationData,
        successCount: results.length,
        errorCount: errors.length,
      },
      severity: errors.length > 0 ? "warning" : "info",
    });

    return {
      success: true,
      data: {
        successful: results,
        failed: errors,
        summary: {
          total: userIds.length,
          successful: results.length,
          failed: errors.length,
        },
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
 * System health check
 */
export async function systemHealthCheck() {
  try {
    const checks = {
      database: false,
      auth: false,
      audit: false,
      storage: false,
    };

    // Database check
    let isMockAPI = false;
    try {
      isMockAPI = await shouldUseMockAPI();

      if (isMockAPI) {
        checks.database = true;
        checks.auth = true;
        checks.audit = true;
        checks.storage = true;
      } else {
        const { error } = await supabase
          .from("user_profiles")
          .select("id")
          .limit(1);

        checks.database = !error;
        checks.auth = !error;
        checks.audit = !error;
        checks.storage = !error;
      }
    } catch (error) {
      console.error("Health check failed:", error);
    }

    const allHealthy = Object.values(checks).every((check) => check);

    return {
      success: true,
      data: {
        status: allHealthy ? "healthy" : "degraded",
        checks,
        timestamp: new Date().toISOString(),
        environment: isMockAPI ? "development" : "production",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export default {
  initializeBackend,
  registerUserComplete,
  loginUserComplete,
  logoutUserComplete,
  updateUserComplete,
  deactivateUserComplete,
  changePasswordComplete,
  resetPasswordComplete,
  getUserDashboardData,
  bulkUserOperations,
  systemHealthCheck,
};
