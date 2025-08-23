import React, { useState } from "react";
import { Shield, UserCheck, CreditCard, User } from "lucide-react";
import { getRoleProfiles, updateRoleProfile } from "../utils/roleUtils.js";

/**
 * Demo Component: Role Switcher
 * Quick way to test different role profiles
 */
export default function RoleProfileDemo() {
  const [profiles] = useState(getRoleProfiles());

  const demoRoles = [
    {
      key: "admin",
      label: "Administrator",
      icon: Shield,
      color: "#3b82f6",
      description: "Full system access",
    },
    {
      key: "manager",
      label: "Store Manager",
      icon: UserCheck,
      color: "#10b981",
      description: "Management functions",
    },
    {
      key: "cashier",
      label: "Cashier",
      icon: CreditCard,
      color: "#f59e0b",
      description: "Point of sale operations",
    },
    {
      key: "pharmacist",
      label: "Pharmacist",
      icon: User,
      color: "#8b5cf6",
      description: "Medical consultation",
    },
  ];

  const handleRoleDemo = (roleKey) => {
    const profile = profiles[roleKey];
    if (profile) {
      // Simulate profile update for demo purposes
      updateRoleProfile(roleKey, {
        ...profile,
        full_name: profile.full_name || `Demo ${profile.display_name}`,
      });

      // Update user profile to demo role
      const userProfile = {
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        email: `${roleKey}@medcure.com`,
      };

      localStorage.setItem("medcure_user_profile", JSON.stringify(userProfile));

      // Dispatch update event
      window.dispatchEvent(
        new CustomEvent("settingsUpdated", {
          detail: { profile: userProfile },
        })
      );

      alert(
        `Switched to ${profile.display_name} profile!\\nCheck the header to see the changes.`
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          🎭 Role Profile Demo
        </h3>
        <p className="text-sm text-gray-600">
          Click a role below to see how the profile changes in the header
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {demoRoles.map((role) => {
          const Icon = role.icon;
          const profile = profiles[role.key];

          return (
            <button
              key={role.key}
              onClick={() => handleRoleDemo(role.key)}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-left"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: role.color }}
              >
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800 text-sm">
                  {role.label}
                </div>
                <div className="text-xs text-gray-500">
                  {profile?.full_name || `Demo ${role.label}`}
                </div>
                <div className="text-xs text-gray-400">{role.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-xs text-blue-800 font-medium mb-1">
          💡 How it works:
        </div>
        <div className="text-xs text-blue-700">
          Each role can have its own profile photo and name. Go to Settings →
          Role Profiles to customize each role's appearance.
        </div>
      </div>
    </div>
  );
}
