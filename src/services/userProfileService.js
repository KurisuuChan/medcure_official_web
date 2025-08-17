/**
 * User Profile Service - Backend Integration
 * Handles user profile management, preferences, and personal data
 */

import { supabase } from "../lib/supabase.js";
import { shouldUseMockAPI } from "./backendService.js";
import { hasPermission, PERMISSIONS } from "./roleService.js";

// Mock profile database for development
let mockProfiles = new Map();

// Initialize mock data
mockProfiles.set(1, {
  id: 1,
  userId: 1,
  firstName: "Admin",
  lastName: "User",
  email: "admin@medcure.com",
  phone: "+63 912 345 6789",
  avatar: null,
  jobTitle: "System Administrator",
  department: "Administration",
  employeeId: "EMP001",
  dateHired: "2024-01-01",
  salary: 50000,
  licenseNumber: null,
  address: {
    street: "123 Admin Street",
    city: "Manila",
    province: "Metro Manila",
    zipCode: "1000",
  },
  emergencyContact: {
    name: "Emergency Contact",
    phone: "+63 912 345 6700",
    relationship: "Spouse",
  },
  preferences: {
    theme: "light",
    notifications: true,
    language: "en",
    timezone: "Asia/Manila",
  },
  lastUpdated: new Date().toISOString(),
});

/**
 * Get user profile by user ID
 */
export async function getUserProfile(currentUser, userId) {
  // Permission check
  if (
    !hasPermission(currentUser, PERMISSIONS.USER_READ) &&
    currentUser.id !== userId
  ) {
    return {
      success: false,
      error: "Insufficient permissions to view user profile",
    };
  }

  if (shouldUseMockAPI()) {
    const profile = mockProfiles.get(parseInt(userId));
    if (!profile) {
      return {
        success: false,
        error: "User profile not found",
      };
    }

    return {
      success: true,
      data: profile,
    };
  }

  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select(
        `
        *,
        auth_users:user_id (
          email,
          created_at
        )
      `
      )
      .eq("user_id", userId)
      .single();

    if (error) {
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
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(currentUser, userId, updates) {
  // Permission check
  if (
    !hasPermission(currentUser, PERMISSIONS.USER_UPDATE) &&
    currentUser.id !== userId
  ) {
    return {
      success: false,
      error: "Insufficient permissions to update user profile",
    };
  }

  if (shouldUseMockAPI()) {
    const profile = mockProfiles.get(parseInt(userId));
    if (!profile) {
      return {
        success: false,
        error: "User profile not found",
      };
    }

    const updatedProfile = {
      ...profile,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    mockProfiles.set(parseInt(userId), updatedProfile);

    return {
      success: true,
      data: updatedProfile,
    };
  }

  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
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
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(currentUser, userId, preferences) {
  // Users can only update their own preferences unless they have admin permissions
  if (
    !hasPermission(currentUser, PERMISSIONS.USER_UPDATE) &&
    currentUser.id !== userId
  ) {
    return {
      success: false,
      error: "Insufficient permissions to update preferences",
    };
  }

  if (shouldUseMockAPI()) {
    const profile = mockProfiles.get(parseInt(userId));
    if (!profile) {
      return {
        success: false,
        error: "User profile not found",
      };
    }

    profile.preferences = {
      ...profile.preferences,
      ...preferences,
    };
    profile.lastUpdated = new Date().toISOString();

    return {
      success: true,
      data: profile.preferences,
    };
  }

  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        preferences: preferences,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("preferences")
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data.preferences,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Upload user avatar
 */
export async function uploadUserAvatar(currentUser, userId, avatarFile) {
  // Users can only update their own avatar unless they have admin permissions
  if (
    !hasPermission(currentUser, PERMISSIONS.USER_UPDATE) &&
    currentUser.id !== userId
  ) {
    return {
      success: false,
      error: "Insufficient permissions to upload avatar",
    };
  }

  if (shouldUseMockAPI()) {
    // Mock avatar upload
    const avatarUrl = `https://ui-avatars.com/api/?name=${currentUser.firstName}+${currentUser.lastName}&background=random`;

    const profile = mockProfiles.get(parseInt(userId));
    if (profile) {
      profile.avatar = avatarUrl;
      profile.lastUpdated = new Date().toISOString();
    }

    return {
      success: true,
      data: { avatarUrl },
    };
  }

  try {
    const fileExt = avatarFile.name.split(".").pop();
    const fileName = `${userId}/avatar.${fileExt}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, avatarFile, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      return {
        success: false,
        error: uploadError.message,
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(fileName);

    // Update user profile with avatar URL
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ avatar: publicUrl })
      .eq("user_id", userId);

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      };
    }

    return {
      success: true,
      data: { avatarUrl: publicUrl },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get user activity log
 */
export async function getUserActivityLog(currentUser, userId, options = {}) {
  // Permission check
  if (
    !hasPermission(currentUser, PERMISSIONS.USER_READ) &&
    currentUser.id !== userId
  ) {
    return {
      success: false,
      error: "Insufficient permissions to view activity log",
    };
  }

  const { limit = 50, offset = 0 } = options;

  if (shouldUseMockAPI()) {
    // Mock activity log
    const activities = [
      {
        id: 1,
        userId: userId,
        action: "login",
        description: "User logged in",
        timestamp: new Date().toISOString(),
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
      },
      {
        id: 2,
        userId: userId,
        action: "profile_update",
        description: "Profile updated",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0...",
      },
    ];

    return {
      success: true,
      data: activities.slice(offset, offset + limit),
      total: activities.length,
    };
  }

  try {
    const { data, error, count } = await supabase
      .from("user_activity_logs")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

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
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Log user activity
 */
export async function logUserActivity(
  userId,
  action,
  description,
  metadata = {}
) {
  if (shouldUseMockAPI()) {
    // Mock activity logging
    console.log(
      `Activity logged for user ${userId}: ${action} - ${description}`
    );
    return {
      success: true,
      message: "Activity logged successfully",
    };
  }

  try {
    const { error } = await supabase.from("user_activity_logs").insert([
      {
        user_id: userId,
        action,
        description,
        metadata,
        ip_address: metadata.ipAddress,
        user_agent: metadata.userAgent,
      },
    ]);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Activity logged successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get user sessions
 */
export async function getUserSessions(currentUser, userId) {
  // Permission check
  if (
    !hasPermission(currentUser, PERMISSIONS.USER_READ) &&
    currentUser.id !== userId
  ) {
    return {
      success: false,
      error: "Insufficient permissions to view user sessions",
    };
  }

  if (shouldUseMockAPI()) {
    // Mock session data
    const sessions = [
      {
        id: 1,
        userId: userId,
        deviceName: "Chrome on Windows",
        ipAddress: "192.168.1.1",
        location: "Manila, Philippines",
        lastActive: new Date().toISOString(),
        isCurrentSession: true,
      },
    ];

    return {
      success: true,
      data: sessions,
    };
  }

  try {
    const { data, error } = await supabase
      .from("user_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("last_active", { ascending: false });

    if (error) {
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
    return {
      success: false,
      error: error.message,
    };
  }
}

export default {
  getUserProfile,
  updateUserProfile,
  updateUserPreferences,
  uploadUserAvatar,
  getUserActivityLog,
  logUserActivity,
  getUserSessions,
};
