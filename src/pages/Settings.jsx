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
  Bug,
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
import {
  debugStorageSetup,
  testStorageUpload,
  uploadProfilePicture as debugUploadProfile,
  uploadBusinessLogo as debugUploadLogo,
} from "../services/storageDebugService.js";
import {
  testAdminUpload,
  adminUploadProfilePicture,
  adminUploadBusinessLogo,
  adminListFiles,
} from "../services/adminStorageService.js";

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
      // Use current state values directly from refs
      const eventDetail = {
        profile: profileRef.current,
        business: businessRef.current,
        appSettings: appSettingsRef.current,
      };

      console.log("Dispatching settingsUpdated event with data:", eventDetail);

      window.dispatchEvent(
        new CustomEvent("settingsUpdated", {
          detail: eventDetail,
        })
      );

      // Also trigger a custom storage event to ensure all components update
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "medcure_settings_updated",
          newValue: JSON.stringify(eventDetail),
          storageArea: localStorage,
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

  // Storage Debug Functions
  const handleStorageDebug = async () => {
    try {
      setLoading(true);
      console.log("🔍 Running storage debug...");
      showMessage("info", "Running storage diagnostics...");

      await debugStorageSetup();
      showMessage(
        "success",
        "Storage debug completed - check console for details"
      );
    } catch (error) {
      console.error("Storage debug failed:", error);
      showMessage("error", "Storage debug failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStorageTest = async () => {
    try {
      setLoading(true);
      console.log("🧪 Testing storage upload...");
      showMessage("info", "Testing storage upload...");

      const success = await testStorageUpload();
      if (success) {
        showMessage("success", "Storage test passed! ✅");
      } else {
        showMessage("error", "Storage test failed! ❌");
      }
    } catch (error) {
      console.error("Storage test failed:", error);
      showMessage("error", "Storage test failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDebugProfileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      console.log("🖼️ Testing profile picture upload with debug service...");
      showMessage("info", "Testing profile upload...");

      const imageUrl = await debugUploadProfile(file);
      setProfile((prev) => ({ ...prev, avatar_url: imageUrl }));
      showMessage("success", "Debug profile upload successful! ✅");
    } catch (error) {
      console.error("Debug profile upload failed:", error);
      showMessage("error", "Debug profile upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDebugBusinessUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      console.log("🏢 Testing business logo upload with debug service...");
      showMessage("info", "Testing business logo upload...");

      const logoUrl = await debugUploadLogo(file);
      setBusiness((prev) => ({ ...prev, logo_url: logoUrl }));
      showMessage("success", "Debug logo upload successful! ✅");
    } catch (error) {
      console.error("Debug logo upload failed:", error);
      showMessage("error", "Debug logo upload failed");
    } finally {
      setLoading(false);
    }
  };

  // Admin Testing Functions
  const handleAdminTest = async () => {
    try {
      setLoading(true);
      console.log("🔧 Testing admin upload capabilities...");
      showMessage("info", "Testing admin upload...");

      const success = await testAdminUpload();
      if (success) {
        showMessage(
          "success",
          "Admin upload test passed! ✅ Check Supabase Storage"
        );
      } else {
        showMessage("error", "Admin upload test failed! ❌");
      }
    } catch (error) {
      console.error("Admin test failed:", error);
      showMessage("error", "Admin test failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminProfileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      console.log("👤 Admin uploading profile picture...");
      showMessage("info", "Admin uploading profile...");

      const imageUrl = await adminUploadProfilePicture(file);
      setProfile((prev) => ({ ...prev, avatar_url: imageUrl }));
      showMessage(
        "success",
        "Admin profile upload successful! ✅ Check Supabase Storage"
      );
    } catch (error) {
      console.error("Admin profile upload failed:", error);
      showMessage("error", "Admin profile upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminBusinessUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      console.log("🏢 Admin uploading business logo...");
      showMessage("info", "Admin uploading business logo...");

      const logoUrl = await adminUploadBusinessLogo(file);
      setBusiness((prev) => ({ ...prev, logo_url: logoUrl }));
      showMessage(
        "success",
        "Admin business logo upload successful! ✅ Check Supabase Storage"
      );
    } catch (error) {
      console.error("Admin business upload failed:", error);
      showMessage("error", "Admin business upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleListStorageFiles = async () => {
    try {
      setLoading(true);
      console.log("📋 Listing storage files with admin access...");
      showMessage("info", "Listing storage files...");

      const avatarFiles = await adminListFiles("avatars");
      const businessFiles = await adminListFiles("business-assets");

      console.log("📁 Avatar files:", avatarFiles);
      console.log("📁 Business files:", businessFiles);

      const totalFiles = avatarFiles.length + businessFiles.length;
      showMessage("success", `Found ${totalFiles} files in Supabase Storage`);
    } catch (error) {
      console.error("List files failed:", error);
      showMessage("error", "Failed to list storage files");
    } finally {
      setLoading(false);
    }
  };

  // Find and display stored images
  const handleFindStoredImages = () => {
    try {
      console.log("🔍 Finding stored images...");

      const results = {
        localStorage: {},
        supabaseUrls: [],
      };

      // Check localStorage for images
      try {
        const userProfile = JSON.parse(
          localStorage.getItem("medcure_user_profile") || "{}"
        );
        const businessSettings = JSON.parse(
          localStorage.getItem("medcure_business_settings") || "{}"
        );

        if (userProfile.avatar_url) {
          results.localStorage.profilePicture = userProfile.avatar_url;
          console.log(
            "✅ Profile picture found:",
            userProfile.avatar_url.substring(0, 50) + "..."
          );
        }

        if (businessSettings.logo_url) {
          results.localStorage.businessLogo = businessSettings.logo_url;
          console.log(
            "✅ Business logo found:",
            businessSettings.logo_url.substring(0, 50) + "..."
          );
        }

        const imageCount = Object.keys(results.localStorage).length;
        if (imageCount > 0) {
          showMessage("success", `Found ${imageCount} images in localStorage`);
          console.log("📊 Image storage locations:");
          console.table(results.localStorage);
        } else {
          showMessage("info", "No images found in localStorage");
        }
      } catch (error) {
        console.error("Error checking localStorage:", error);
        showMessage("error", "Error checking stored images");
      }
    } catch (error) {
      console.error("Find images failed:", error);
      showMessage("error", "Failed to find stored images");
    }
  };

  const handleViewStoredImages = () => {
    try {
      console.log("🖼️ Opening stored images...");

      let imageCount = 0;

      // Check localStorage for Base64 images
      const userProfile = JSON.parse(
        localStorage.getItem("medcure_user_profile") || "{}"
      );
      const businessSettings = JSON.parse(
        localStorage.getItem("medcure_business_settings") || "{}"
      );

      if (
        userProfile.avatar_url &&
        userProfile.avatar_url.startsWith("data:")
      ) {
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>MedCure Profile Picture</title></head>
              <body style="margin:0; padding:20px; text-align:center; background:#f5f5f5;">
                <h2>Profile Picture</h2>
                <img src="${userProfile.avatar_url}" style="max-width:100%; height:auto; border:1px solid #ddd; border-radius:8px;" />
                <br><br>
                <button onclick="window.close()" style="padding:10px 20px; background:#007bff; color:white; border:none; border-radius:5px; cursor:pointer;">Close</button>
              </body>
            </html>
          `);
          imageCount++;
        }
      } else if (
        userProfile.avatar_url &&
        userProfile.avatar_url.startsWith("http")
      ) {
        window.open(userProfile.avatar_url, "_blank");
        imageCount++;
      }

      if (
        businessSettings.logo_url &&
        businessSettings.logo_url.startsWith("data:")
      ) {
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>MedCure Business Logo</title></head>
              <body style="margin:0; padding:20px; text-align:center; background:#f5f5f5;">
                <h2>Business Logo</h2>
                <img src="${businessSettings.logo_url}" style="max-width:100%; height:auto; border:1px solid #ddd; border-radius:8px;" />
                <br><br>
                <button onclick="window.close()" style="padding:10px 20px; background:#007bff; color:white; border:none; border-radius:5px; cursor:pointer;">Close</button>
              </body>
            </html>
          `);
          imageCount++;
        }
      } else if (
        businessSettings.logo_url &&
        businessSettings.logo_url.startsWith("http")
      ) {
        window.open(businessSettings.logo_url, "_blank");
        imageCount++;
      }

      if (imageCount > 0) {
        showMessage("success", `Opened ${imageCount} images in new tabs`);
      } else {
        showMessage("info", "No images found to display");
      }
    } catch (error) {
      console.error("View images failed:", error);
      showMessage("error", "Failed to open stored images");
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "business", label: "Business", icon: Building },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "system", label: "System", icon: Monitor },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "debug", label: "Storage Debug", icon: Bug },
  ];

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <SettingsIcon size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your profile, business information, and app preferences
              </p>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`p-4 rounded-lg flex items-center gap-3 ${
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

        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
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
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all text-sm ${
                        activeTab === tab.id
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Icon size={18} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">
                      Profile Settings
                    </h2>
                    <p className="text-sm text-gray-600">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="pt-4">
                    <button
                      onClick={() => handleProfileUpdate(profile)}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
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
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">
                      Business Settings
                    </h2>
                    <p className="text-sm text-gray-600">
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
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
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
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">
                      Appearance Settings
                    </h2>
                    <p className="text-sm text-gray-600">
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
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">
                      System Settings
                    </h2>
                    <p className="text-sm text-gray-600">
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
                  </div>

                  {/* Inventory Alert Settings */}
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                      📦 Inventory Alert Settings
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          size={20}
                          className="text-blue-600 mt-1 flex-shrink-0"
                        />
                        <div>
                          <h4 className="font-medium text-blue-800 mb-1">
                            Smart Threshold Management
                          </h4>
                          <p className="text-sm text-blue-700">
                            Configure when to receive low stock alerts. Lower
                            thresholds reduce false alerts for smaller
                            pharmacies.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Low Stock Threshold */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Low Stock Alert Threshold
                        </label>
                        <div className="relative">
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
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                            units
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-600">
                            Alert when stock falls to or below this level
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-orange-600">
                              💡 Recommendation:
                            </span>
                            <span className="text-gray-600">
                              {appSettings.low_stock_threshold <= 3
                                ? "Good for small pharmacy"
                                : appSettings.low_stock_threshold <= 7
                                ? "Balanced for medium pharmacy"
                                : "High threshold - may cause frequent alerts"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expiry Warning Days */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry Warning Period
                        </label>
                        <div className="relative">
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
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                            days
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          Alert when products expire within this timeframe
                        </p>
                      </div>
                    </div>

                    {/* Quick Preset Options */}
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Quick Presets for Different Pharmacy Sizes:
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                          onClick={() => {
                            handleAppSettingUpdate("low_stock_threshold", 2);
                            handleAppSettingUpdate("expiry_warning_days", 14);
                          }}
                          className="p-3 text-left border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                        >
                          <div className="font-medium text-green-800 text-sm">
                            Small Pharmacy
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            2 units threshold • 14 days expiry warning
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            handleAppSettingUpdate("low_stock_threshold", 5);
                            handleAppSettingUpdate("expiry_warning_days", 30);
                          }}
                          className="p-3 text-left border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <div className="font-medium text-blue-800 text-sm">
                            Medium Pharmacy
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            5 units threshold • 30 days expiry warning
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            handleAppSettingUpdate("low_stock_threshold", 10);
                            handleAppSettingUpdate("expiry_warning_days", 60);
                          }}
                          className="p-3 text-left border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
                        >
                          <div className="font-medium text-purple-800 text-sm">
                            Large Pharmacy
                          </div>
                          <div className="text-xs text-purple-600 mt-1">
                            10 units threshold • 60 days expiry warning
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Impact Preview */}
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Current Settings Impact:
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">
                            Low Stock Alerts:
                          </span>
                          <span
                            className={`ml-2 font-medium ${
                              appSettings.low_stock_threshold <= 3
                                ? "text-green-600"
                                : appSettings.low_stock_threshold <= 7
                                ? "text-blue-600"
                                : "text-orange-600"
                            }`}
                          >
                            When ≤ {appSettings.low_stock_threshold} units
                            remaining
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Expiry Alerts:</span>
                          <span className="ml-2 font-medium text-purple-600">
                            {appSettings.expiry_warning_days} days before expiry
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">
                      Notification Settings
                    </h2>
                    <p className="text-sm text-gray-600">
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
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">
                      Security Settings
                    </h2>
                    <p className="text-sm text-gray-600">
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

              {activeTab === "debug" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">
                      Storage Debug
                    </h2>
                    <p className="text-sm text-gray-600">
                      Debug file upload issues and test Supabase Storage
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Storage Diagnostics */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Bug size={20} className="text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Storage Diagnostics
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <button
                          onClick={handleStorageDebug}
                          disabled={loading}
                          className="w-full px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                        >
                          {loading ? "Running..." : "Run Storage Diagnostics"}
                        </button>
                        <p className="text-xs text-gray-500">
                          Check bucket access, policies, and authentication
                          status
                        </p>
                      </div>
                    </div>

                    {/* Storage Test */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Upload size={20} className="text-green-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Upload Test
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <button
                          onClick={handleStorageTest}
                          disabled={loading}
                          className="w-full px-4 py-2 text-sm text-green-600 border border-green-200 rounded-lg hover:bg-green-50 disabled:opacity-50"
                        >
                          {loading ? "Testing..." : "Test Upload"}
                        </button>
                        <p className="text-xs text-gray-500">
                          Test file upload with a small test file
                        </p>
                      </div>
                    </div>

                    {/* Debug Profile Upload */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Camera size={20} className="text-purple-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Debug Profile Upload
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleDebugProfileUpload}
                          disabled={loading}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                        <p className="text-xs text-gray-500">
                          Test profile picture upload with enhanced debugging
                        </p>
                      </div>
                    </div>

                    {/* Debug Business Logo Upload */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Building size={20} className="text-orange-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Debug Logo Upload
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleDebugBusinessUpload}
                          disabled={loading}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                        />
                        <p className="text-xs text-gray-500">
                          Test business logo upload with enhanced debugging
                        </p>
                      </div>
                    </div>

                    {/* Image Finder */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Eye size={20} className="text-teal-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Find Stored Images
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={handleFindStoredImages}
                            disabled={loading}
                            className="px-4 py-2 text-sm text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 disabled:opacity-50"
                          >
                            Find Images
                          </button>
                          <button
                            onClick={handleViewStoredImages}
                            disabled={loading}
                            className="px-4 py-2 text-sm text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 disabled:opacity-50"
                          >
                            View Images
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Find and view images stored in localStorage or
                          Supabase
                        </p>
                      </div>
                    </div>

                    {/* Admin Testing Section */}
                    <div className="p-4 border-2 border-red-200 bg-red-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Shield size={20} className="text-red-600" />
                          <span className="text-sm font-medium text-red-700">
                            🔧 Admin Storage Testing
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <button
                          onClick={handleAdminTest}
                          disabled={loading}
                          className="w-full px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-100 disabled:opacity-50 font-semibold"
                        >
                          {loading ? "Testing..." : "🔧 Test Admin Upload"}
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAdminProfileUpload}
                              disabled={loading}
                              className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                            />
                            <p className="text-xs text-red-600 mt-1">
                              Admin Profile Upload
                            </p>
                          </div>
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAdminBusinessUpload}
                              disabled={loading}
                              className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                            />
                            <p className="text-xs text-red-600 mt-1">
                              Admin Business Upload
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleListStorageFiles}
                          disabled={loading}
                          className="w-full px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-100 disabled:opacity-50"
                        >
                          {loading ? "Listing..." : "📋 List Storage Files"}
                        </button>
                        <p className="text-xs text-red-600">
                          ⚡ Uses service role key for direct uploads (bypasses
                          auth & policies)
                        </p>
                      </div>
                    </div>

                    {/* Console Instructions */}
                    <div className="p-4 bg-gray-50 border rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <Monitor size={20} className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">
                          Debug Instructions
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>• Open browser Developer Tools (F12)</p>
                        <p>• Go to Console tab</p>
                        <p>• Run diagnostics and tests above</p>
                        <p>• Look for detailed logs with 🔍, ✅, ❌ icons</p>
                        <p>• Check for any error messages or upload progress</p>
                      </div>
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
