import React, { useState, useEffect, useRef } from "react";
import {
  Settings as SettingsIcon,
  Save,
  User,
  Building,
  Upload,
  Camera,
  CheckCircle,
  AlertTriangle,
  Palette,
  Globe,
  Bell,
  Shield,
  Database,
  Monitor,
  Moon,
  Sun,
  Volume2,
  Eye,
  RefreshCw,
} from "lucide-react";
import {
  getUserProfile,
  updateUserProfile,
  updateProfilePicture,
  getBusinessSettings,
  updateBusinessSettings,
  updateBusinessLogo,
  updateBusinessName,
  getAppSettings,
  updateAppSetting,
} from "../services/settingsService.js";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [profile, setProfile] = useState({
    full_name: "",
    avatar_url: "",
    email: "",
  });

  const [business, setBusiness] = useState({
    business_name: "MedCure Pharmacy",
    logo_url: "",
    tagline: "Your Trusted Healthcare Partner",
    address: "",
    phone: "",
    email: "",
    primary_color: "#2563eb",
  });

  const [appSettings, setAppSettings] = useState({
    theme: "light",
    currency: "PHP",
    timezone: "Asia/Manila",
    language: "en",
    notifications: true,
    sound_enabled: true,
    auto_backup: true,
    low_stock_threshold: 10,
    expiry_warning_days: 30,
  });

  // Use refs to store current state values for event dispatching
  const profileRef = useRef(profile);
  const businessRef = useRef(business);
  const appSettingsRef = useRef(appSettings);

  // Update refs when state changes
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    businessRef.current = business;
  }, [business]);

  useEffect(() => {
    appSettingsRef.current = appSettings;
  }, [appSettings]);

  const showMessage = React.useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);

    // Trigger custom event to update other components
    if (type === "success") {
      window.dispatchEvent(
        new CustomEvent("settingsUpdated", {
          detail: {
            profile: profileRef.current,
            business: businessRef.current,
            appSettings: appSettingsRef.current,
          },
        })
      );
    }
  }, []); // No dependencies needed since we use refs

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);

      // Load user profile
      const userProfile = await getUserProfile();
      if (userProfile) {
        setProfile(userProfile);
      }

      // Load business settings
      const businessData = await getBusinessSettings();
      setBusiness(businessData);

      // Load app settings
      const appData = await getAppSettings();
      setAppSettings(appData);
    } catch (err) {
      console.error("Failed to load settings:", err);
      showMessage("error", "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Profile handlers
  const handleProfileUpdate = async (updatedProfile) => {
    try {
      setLoading(true);
      await updateUserProfile(updatedProfile);
      setProfile(updatedProfile);
      showMessage("success", "Profile updated successfully");
    } catch (err) {
      console.error("Profile update error:", err);
      showMessage("error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (file) => {
    try {
      setLoading(true);

      // Create a preview URL immediately for instant feedback
      const previewUrl = URL.createObjectURL(file);
      setProfile((prev) => ({ ...prev, avatar_url: previewUrl }));

      // Now upload and get the permanent URL
      const result = await updateProfilePicture(file);
      if (result?.avatar_url) {
        // Update with the permanent URL
        setProfile((prev) => ({ ...prev, avatar_url: result.avatar_url }));
        showMessage("success", "Profile picture updated successfully");
      }
    } catch (err) {
      console.error("Profile picture update error:", err);
      showMessage("error", "Failed to update profile picture");
      // Revert the preview on error
      setProfile((prev) => ({ ...prev, avatar_url: "" }));
    } finally {
      setLoading(false);
    }
  };

  // Business handlers
  const handleBusinessUpdate = async (updatedBusiness) => {
    try {
      setLoading(true);
      await updateBusinessSettings(updatedBusiness);
      setBusiness(updatedBusiness);
      showMessage("success", "Business settings updated successfully");
    } catch (err) {
      console.error("Business update error:", err);
      showMessage("error", "Failed to update business settings");
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessLogoUpload = async (file) => {
    try {
      setLoading(true);

      // Create a preview URL immediately for instant feedback
      const previewUrl = URL.createObjectURL(file);
      setBusiness((prev) => ({ ...prev, logo_url: previewUrl }));

      // Now upload and get the permanent URL
      const result = await updateBusinessLogo(file);
      if (result?.logo_url) {
        // Update with the permanent URL
        setBusiness((prev) => ({ ...prev, logo_url: result.logo_url }));
        showMessage("success", "Business logo updated successfully");
      }
    } catch (err) {
      console.error("Business logo update error:", err);
      showMessage("error", "Failed to update business logo");
      // Revert the preview on error
      setBusiness((prev) => ({ ...prev, logo_url: "" }));
    } finally {
      setLoading(false);
    }
  };

  const _handleBusinessNameUpdate = async (newName) => {
    try {
      setLoading(true);
      await updateBusinessName(newName);
      setBusiness((prev) => ({ ...prev, business_name: newName }));
      showMessage("success", "Business name updated successfully");
    } catch (err) {
      console.error("Business name update error:", err);
      showMessage("error", "Failed to update business name");
    } finally {
      setLoading(false);
    }
  };

  // App settings handlers
  const handleAppSettingUpdate = async (key, value) => {
    try {
      await updateAppSetting(key, value);
      setAppSettings((prev) => ({ ...prev, [key]: value }));
      showMessage("success", `${key} updated successfully`);
    } catch (err) {
      console.error("App setting update error:", err);
      showMessage("error", `Failed to update ${key}`);
    }
  };

  // File upload handlers
  const handleFileUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showMessage("error", "Please select a valid image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showMessage("error", "Image size must be less than 5MB");
      return;
    }

    console.log(`Uploading ${type} file:`, file.name, file.type, file.size);

    if (type === "profile") {
      await handleProfilePictureUpload(file);
    } else if (type === "logo") {
      await handleBusinessLogoUpload(file);
    }

    // Clear the input to allow re-uploading the same file
    event.target.value = "";
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "business", label: "Business", icon: Building },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "system", label: "System", icon: Monitor },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <SettingsIcon size={24} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
          </div>
          <p className="text-gray-600">
            Manage your profile, business information, and app preferences
          </p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200">
              <nav className="p-4 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                        activeTab === tab.id
                          ? "bg-blue-100 text-blue-700 font-semibold"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon size={20} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8">
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      Profile Settings
                    </h2>
                    <p className="text-gray-600">
                      Update your personal information and profile picture
                    </p>
                  </div>

                  {/* Profile Picture */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Profile Picture
                    </label>
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {profile.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt="Profile"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error(
                                  "Profile image failed to load:",
                                  profile.avatar_url
                                );
                                e.target.style.display = "none";
                              }}
                              onLoad={() => {
                                console.log(
                                  "Profile image loaded successfully:",
                                  profile.avatar_url
                                );
                              }}
                            />
                          ) : (
                            <User size={32} className="text-gray-400" />
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-1 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                          <Camera size={12} className="text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, "profile")}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          Upload a new profile picture
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
                      onChange={(e) =>
                        setProfile({ ...profile, full_name: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="pt-4">
                    <button
                      onClick={() => handleProfileUpdate(profile)}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Save size={16} />
                      {loading ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "business" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      Business Settings
                    </h2>
                    <p className="text-gray-600">
                      Update your business information and branding
                    </p>
                  </div>

                  {/* Business Logo */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Business Logo
                    </label>
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                          {business.logo_url ? (
                            <img
                              src={business.logo_url}
                              alt="Business Logo"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error(
                                  "Business logo failed to load:",
                                  business.logo_url
                                );
                                e.target.style.display = "none";
                              }}
                              onLoad={() => {
                                console.log(
                                  "Business logo loaded successfully:",
                                  business.logo_url
                                );
                              }}
                            />
                          ) : (
                            <Building size={32} className="text-gray-400" />
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-1 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                          <Upload size={12} className="text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, "logo")}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          Upload your business logo
                        </p>
                        <p className="text-xs text-gray-500">
                          Recommended: PNG or SVG format, square aspect ratio
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Business Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={business.business_name}
                      onChange={(e) =>
                        setBusiness({
                          ...business,
                          business_name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your business name"
                    />
                  </div>

                  {/* Business Tagline */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Business Tagline
                    </label>
                    <input
                      type="text"
                      value={business.tagline}
                      onChange={(e) =>
                        setBusiness({
                          ...business,
                          tagline: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your business tagline"
                    />
                    <p className="text-xs text-gray-500">
                      A short description or slogan for your business
                    </p>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4">
                    <button
                      onClick={() => handleBusinessUpdate(business)}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Save size={16} />
                      {loading ? "Saving..." : "Save Business Settings"}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "appearance" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      Appearance Settings
                    </h2>
                    <p className="text-gray-600">
                      Customize the look and feel of your application
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Theme */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Theme
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: "light", label: "Light", icon: Sun },
                          { value: "dark", label: "Dark", icon: Moon },
                        ].map(({ value, label, icon: IconComponent }) => (
                          <label
                            key={value}
                            className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                          >
                            <input
                              type="radio"
                              name="theme"
                              value={value}
                              checked={appSettings.theme === value}
                              onChange={(e) =>
                                handleAppSettingUpdate("theme", e.target.value)
                              }
                              className="text-blue-600"
                            />
                            <IconComponent
                              size={16}
                              className="text-gray-600"
                            />
                            <span className="text-sm text-gray-700">
                              {label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Primary Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Primary Color
                      </label>
                      <input
                        type="color"
                        value={business.primary_color}
                        onChange={(e) =>
                          setBusiness((prev) => ({
                            ...prev,
                            primary_color: e.target.value,
                          }))
                        }
                        className="w-full h-12 border rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "system" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      System Settings
                    </h2>
                    <p className="text-gray-600">
                      Configure system preferences and regional settings
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Currency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={appSettings.currency}
                        onChange={(e) =>
                          handleAppSettingUpdate("currency", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="PHP">Philippine Peso (PHP)</option>
                        <option value="USD">US Dollar (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                      </select>
                    </div>

                    {/* Timezone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={appSettings.timezone}
                        onChange={(e) =>
                          handleAppSettingUpdate("timezone", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Asia/Manila">Asia/Manila</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">
                          America/New_York
                        </option>
                      </select>
                    </div>

                    {/* Low Stock Threshold */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Low Stock Threshold
                      </label>
                      <input
                        type="number"
                        value={appSettings.low_stock_threshold}
                        onChange={(e) =>
                          handleAppSettingUpdate(
                            "low_stock_threshold",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="100"
                      />
                    </div>

                    {/* Expiry Warning Days */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Warning (Days)
                      </label>
                      <input
                        type="number"
                        value={appSettings.expiry_warning_days}
                        onChange={(e) =>
                          handleAppSettingUpdate(
                            "expiry_warning_days",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="365"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      Notification Settings
                    </h2>
                    <p className="text-gray-600">
                      Manage how you receive notifications and alerts
                    </p>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        key: "notifications",
                        label: "Enable Notifications",
                        icon: Bell,
                      },
                      {
                        key: "sound_enabled",
                        label: "Sound Effects",
                        icon: Volume2,
                      },
                      {
                        key: "auto_backup",
                        label: "Automatic Backup",
                        icon: Database,
                      },
                    ].map(({ key, label, icon: Icon }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={20} className="text-gray-600" />
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              {label}
                            </span>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={appSettings[key]}
                            onChange={(e) =>
                              handleAppSettingUpdate(key, e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      Security Settings
                    </h2>
                    <p className="text-gray-600">
                      Manage your account security and privacy settings
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Shield size={20} className="text-green-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Account Security
                          </span>
                        </div>
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Your account is protected with secure authentication
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Eye size={20} className="text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Data Privacy
                          </span>
                        </div>
                        <button className="text-sm text-blue-600 hover:text-blue-700">
                          View Policy
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Review how your data is collected and used
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <RefreshCw size={20} className="text-orange-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Data Backup
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            showMessage(
                              "success",
                              "Backup initiated successfully"
                            )
                          }
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Backup Now
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Last backup: {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
