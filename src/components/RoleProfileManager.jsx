import React, { useState, useEffect } from "react";
import {
  User,
  Camera,
  Save,
  UserCheck,
  Shield,
  CreditCard,
} from "lucide-react";
import {
  updateUserProfile,
  updateProfilePicture,
} from "../services/settingsService.js";

/**
 * Role-based Profile Manager
 * Allows different profile photos and names for different user roles
 */
export default function RoleProfileManager({
  currentUser,
  currentRole,
  onProfileUpdate,
}) {
  const [profiles, setProfiles] = useState({
    admin: {
      full_name: "Administrator",
      avatar_url: "",
      display_name: "System Admin",
      role_color: "#3b82f6", // blue
    },
    employee: {
      full_name: "Employee/Cashier",
      avatar_url: "",
      display_name: "Staff Member",
      role_color: "#f59e0b", // amber
    },
  });

  const [activeRole, setActiveRole] = useState(currentRole || "admin");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Load existing profiles from localStorage
  useEffect(() => {
    const loadProfiles = () => {
      try {
        const storedProfiles = localStorage.getItem("medcure_role_profiles");
        if (storedProfiles) {
          const parsedProfiles = JSON.parse(storedProfiles);
          setProfiles((prev) => ({ ...prev, ...parsedProfiles }));
        }

        // Load current user profile into their role
        const currentProfile = localStorage.getItem("medcure_user_profile");
        if (currentProfile && currentRole) {
          const profile = JSON.parse(currentProfile);
          setProfiles((prev) => ({
            ...prev,
            [currentRole]: {
              ...prev[currentRole],
              full_name: profile.full_name || prev[currentRole].full_name,
              avatar_url: profile.avatar_url || prev[currentRole].avatar_url,
            },
          }));
        }
      } catch (error) {
        console.warn("Failed to load role profiles:", error);
      }
    };

    loadProfiles();
  }, [currentRole]);

  // Save profiles to localStorage
  const saveProfiles = (updatedProfiles) => {
    try {
      localStorage.setItem(
        "medcure_role_profiles",
        JSON.stringify(updatedProfiles)
      );

      // Update current user profile if they're editing their own role
      if (activeRole === currentRole) {
        const currentRoleProfile = updatedProfiles[activeRole];
        const userProfile = {
          full_name: currentRoleProfile.full_name,
          avatar_url: currentRoleProfile.avatar_url,
          email: currentUser?.email || "",
        };
        localStorage.setItem(
          "medcure_user_profile",
          JSON.stringify(userProfile)
        );

        // Dispatch event to update UI
        window.dispatchEvent(
          new CustomEvent("settingsUpdated", {
            detail: { profile: userProfile },
          })
        );

        // Call parent callback
        if (onProfileUpdate) {
          onProfileUpdate(userProfile);
        }
      }
    } catch (error) {
      console.error("Failed to save role profiles:", error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleProfileUpdate = async (role, updatedData) => {
    try {
      setLoading(true);

      const updatedProfiles = {
        ...profiles,
        [role]: {
          ...profiles[role],
          ...updatedData,
        },
      };

      setProfiles(updatedProfiles);
      saveProfiles(updatedProfiles);

      // If updating current user's role, also update via settings service
      if (role === currentRole) {
        await updateUserProfile({
          full_name: updatedData.full_name,
          avatar_url: updatedData.avatar_url,
        });
      }

      showMessage(
        "success",
        `${profiles[role].display_name} profile updated successfully`
      );
    } catch (error) {
      console.error("Profile update error:", error);
      showMessage("error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (role, file) => {
    try {
      setLoading(true);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      const updatedProfiles = {
        ...profiles,
        [role]: {
          ...profiles[role],
          avatar_url: previewUrl,
        },
      };
      setProfiles(updatedProfiles);

      // If uploading for current user, use the settings service
      if (role === currentRole) {
        const result = await updateProfilePicture(file);
        if (result?.avatar_url) {
          updatedProfiles[role].avatar_url = result.avatar_url;
          setProfiles(updatedProfiles);
        }
      }

      saveProfiles(updatedProfiles);
      showMessage(
        "success",
        `${profiles[role].display_name} photo updated successfully`
      );
    } catch (error) {
      console.error("Avatar upload error:", error);
      showMessage("error", "Failed to update profile photo");

      // Revert preview on error
      setProfiles((prev) => ({
        ...prev,
        [role]: {
          ...prev[role],
          avatar_url: "",
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return Shield;
      case "employee":
        return CreditCard;
      case "cashier": // Legacy support
        return CreditCard;
      default:
        return User;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          Role-Based Profiles
        </h2>
        <p className="text-sm text-gray-600">
          Manage profile photos and names for different user roles
        </p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div
          className={`p-3 rounded-lg flex items-center gap-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Role Tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(profiles).map(([role, profile]) => {
          const Icon = getRoleIcon(role);
          const isActive = activeRole === role;
          const isCurrent = role === currentRole;

          return (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm font-medium ${
                isActive
                  ? "bg-blue-100 border-blue-300 text-blue-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={16} style={{ color: profile.role_color }} />
              {profile.display_name}
              {isCurrent && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-600 text-xs rounded">
                  You
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Profile Editor */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        {Object.entries(profiles).map(([role, profile]) => {
          if (role !== activeRole) return null;

          const Icon = getRoleIcon(role);
          const isCurrent = role === currentRole;

          return (
            <div key={role} className="space-y-6">
              {/* Role Header */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: profile.role_color }}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {profile.display_name}
                    {isCurrent && (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">
                        Current User
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {role} role settings
                  </p>
                </div>
              </div>

              {/* Profile Photo */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Profile Photo
                </label>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={`${profile.display_name} Profile`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={28} className="text-gray-400" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-1 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                      <Camera size={12} className="text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) handleAvatarUpload(role, file);
                        }}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Upload a profile photo for{" "}
                      {profile.display_name.toLowerCase()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Recommended: Square image, at least 200x200 pixels
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => {
                    const updatedProfiles = {
                      ...profiles,
                      [role]: {
                        ...profile,
                        full_name: e.target.value,
                      },
                    };
                    setProfiles(updatedProfiles);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Enter full name for ${profile.display_name.toLowerCase()}`}
                  disabled={loading}
                />
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profile.display_name}
                  onChange={(e) => {
                    const updatedProfiles = {
                      ...profiles,
                      [role]: {
                        ...profile,
                        display_name: e.target.value,
                      },
                    };
                    setProfiles(updatedProfiles);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Display name in the interface"
                  disabled={loading}
                />
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button
                  onClick={() => handleProfileUpdate(role, profile)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  <Save size={16} />
                  {loading
                    ? "Saving..."
                    : `Save ${profile.display_name} Profile`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
