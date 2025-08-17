import React, { useState, useEffect, useCallback } from "react";
import {
  Settings as SettingsIcon,
  Save,
  Palette,
  Bell,
  Shield,
  Database,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Globe,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Users,
  Building,
  Calendar,
  Image,
  Camera,
  Zap,
  Brush,
  UserCheck,
} from "lucide-react";
import BackendStatus from "../components/BackendStatus";
import {
  getSettings,
  updateSettings,
  resetSettings,
  exportSettings,
  importSettings,
  validateSettings,
  testSettingsOperations,
  uploadLogo,
  updateBranding,
  updateProfile,
  uploadAvatar,
} from "../services/settingsService";
import { useNotification } from "../hooks/useNotification";
import { useBranding } from "../hooks/useBranding";
import { handleImageSrc } from "../utils/imageUtils";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const { showNotification } = useNotification();
  const { refreshSettings } = useBranding();

  const [settings, setSettings] = useState({
    // General Settings
    businessName: "MedCure Pharmacy",
    businessAddress: "123 Health Street, Medical District, City",
    businessPhone: "+63 912 345 6789",
    businessEmail: "contact@medcure.com",
    primaryColor: "#2563eb",
    timezone: "Asia/Manila",
    currency: "PHP",
    language: "en",

    // Branding Settings
    brandingName: "MedCure",
    companyLogo: "",
    logoUrl: "",
    brandColor: "#2563eb",
    accentColor: "#3b82f6",
    headerStyle: "modern",
    sidebarStyle: "minimal",

    // Profile Settings
    profileName: "Admin User",
    profileEmail: "admin@medcure.com",
    profileRole: "Administrator",
    profileAvatar: "",
    profilePhone: "+63 912 345 6789",
    displayName: "Admin",
    userInitials: "AU",

    // Notification Settings
    lowStockThreshold: 10,
    criticalStockThreshold: 5,
    expiryAlertDays: 30,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    dailyReports: true,
    weeklyReports: true,

    // Security Settings
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,

    // Backup Settings
    autoBackup: true,
    backupFrequency: "daily",
    backupRetention: 30,
    cloudBackup: false,
  });

  const handleSettingChange = (key, value) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };

      // Clear any existing validation error for this field
      if (validationErrors[key]) {
        setValidationErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[key];
          return newErrors;
        });
      }

      return newSettings;
    });
  };

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getSettings();
      if (result.success && result.data) {
        // Use default settings as base, then merge with loaded data
        const defaultSettings = {
          // General Settings
          businessName: "MedCure Pharmacy",
          businessAddress: "123 Health Street, Medical District, City",
          businessPhone: "+63 912 345 6789",
          businessEmail: "contact@medcure.com",
          primaryColor: "#2563eb",
          timezone: "Asia/Manila",
          currency: "PHP",
          language: "en",
          // Notification Settings
          lowStockThreshold: 10,
          criticalStockThreshold: 5,
          expiryAlertDays: 30,
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          dailyReports: true,
          weeklyReports: true,
          // Security Settings
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          twoFactorAuth: false,
          sessionTimeout: 30,
          passwordExpiry: 90,
          // Backup Settings
          autoBackup: true,
          backupFrequency: "daily",
          backupRetention: 30,
          cloudBackup: false,
        };

        const loadedSettings = { ...defaultSettings, ...result.data };
        setSettings(loadedSettings);
      } else {
        showNotification("Failed to load settings", "error");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      showNotification("Error loading settings", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async (section) => {
    setIsSaving(true);
    try {
      // Validate settings before saving
      const validation = validateSettings(settings);
      if (!validation.isValid) {
        const errorMap = {};
        validation.errors.forEach((error) => {
          // Extract field name from error message (simple approach)
          const field = error.toLowerCase().includes("business name")
            ? "businessName"
            : error.toLowerCase().includes("business email")
            ? "businessEmail"
            : error.toLowerCase().includes("business phone")
            ? "businessPhone"
            : error.toLowerCase().includes("low stock")
            ? "lowStockThreshold"
            : error.toLowerCase().includes("critical stock")
            ? "criticalStockThreshold"
            : error.toLowerCase().includes("expiry alert")
            ? "expiryAlertDays"
            : error.toLowerCase().includes("session timeout")
            ? "sessionTimeout"
            : error.toLowerCase().includes("password expiry")
            ? "passwordExpiry"
            : error.toLowerCase().includes("backup retention")
            ? "backupRetention"
            : "general";
          errorMap[field] = error;
        });

        setValidationErrors(errorMap);
        showNotification(`Validation failed: ${validation.errors[0]}`, "error");
        return;
      }

      // Clear validation errors on successful validation
      setValidationErrors({});

      const result = await updateSettings(settings, section);
      if (result.success) {
        showNotification(`${section} settings saved successfully`, "success");
      } else {
        showNotification(`Failed to save ${section} settings`, "error");
      }
    } catch (error) {
      console.error(`Error saving ${section} settings:`, error);
      showNotification(`Error saving ${section} settings`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      setIsLoading(true);
      try {
        const result = await resetSettings();
        if (result.success) {
          setSettings(result.data);
          showNotification("Settings reset to defaults", "success");
        } else {
          showNotification("Failed to reset settings", "error");
        }
      } catch (error) {
        console.error("Error resetting settings:", error);
        showNotification("Error resetting settings", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportSettings();
      if (result.success) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `medcure-settings-${
          new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification("Settings exported successfully", "success");
      } else {
        showNotification("Failed to export settings", "error");
      }
    } catch (error) {
      console.error("Error exporting settings:", error);
      showNotification("Error exporting settings", "error");
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      const result = await importSettings(importData);
      if (result.success) {
        setSettings(result.data);
        showNotification("Settings imported successfully", "success");
      } else {
        showNotification("Failed to import settings", "error");
      }
    } catch (error) {
      console.error("Error importing settings:", error);
      showNotification(
        "Error importing settings - Invalid file format",
        "error"
      );
    }
    // Reset file input
    event.target.value = "";
  };

  const handleTestConnection = async () => {
    console.log("🔧 Starting settings test connection...");
    setIsTesting(true);
    try {
      showNotification("Testing backend connection...", "info");

      console.log("🔧 Calling testSettingsOperations...");
      const result = await testSettingsOperations();
      console.log("🔧 Test result:", result);

      if (result.success) {
        showNotification("Backend connection successful!", "success");
      } else {
        showNotification(`Connection test failed: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      showNotification("Connection test failed", "error");
    } finally {
      console.log("🔧 Test connection completed, setting loading to false");
      setIsTesting(false);
    }
  };

  // Handle logo upload
  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      showNotification("Uploading logo...", "info");

      const result = await uploadLogo(file);
      if (result.success) {
        handleSettingChange("logoUrl", result.data.url);
        handleSettingChange("companyLogo", result.data.filename);
        showNotification("Logo uploaded successfully!", "success");
        // Refresh the branding context to show changes immediately
        await refreshSettings();
      } else {
        showNotification(`Failed to upload logo: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      showNotification("Error uploading logo", "error");
    } finally {
      setIsLoading(false);
      event.target.value = "";
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      showNotification("Uploading avatar...", "info");

      const result = await uploadAvatar(file);
      if (result.success) {
        handleSettingChange("profileAvatar", result.data.url);
        showNotification("Avatar uploaded successfully!", "success");
        // Refresh the branding context to show changes immediately
        await refreshSettings();
      } else {
        showNotification(`Failed to upload avatar: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      showNotification("Error uploading avatar", "error");
    } finally {
      setIsLoading(false);
      event.target.value = "";
    }
  };

  // Handle branding save
  const handleBrandingSave = async () => {
    try {
      setIsSaving(true);

      const brandingData = {
        brandingName: settings.brandingName,
        companyLogo: settings.companyLogo,
        logoUrl: settings.logoUrl,
        brandColor: settings.brandColor,
        accentColor: settings.accentColor,
        headerStyle: settings.headerStyle,
        sidebarStyle: settings.sidebarStyle,
      };

      const result = await updateBranding(brandingData);
      if (result.success) {
        showNotification("Branding settings saved successfully!", "success");
        // Refresh the branding context to show changes immediately
        await refreshSettings();
      } else {
        showNotification(
          `Failed to save branding settings: ${result.error}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error saving branding:", error);
      showNotification("Error saving branding settings", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle profile save
  const handleProfileSave = async () => {
    try {
      setIsSaving(true);

      const profileData = {
        profileName: settings.profileName,
        profileEmail: settings.profileEmail,
        profileRole: settings.profileRole,
        profileAvatar: settings.profileAvatar,
        profilePhone: settings.profilePhone,
        displayName: settings.displayName,
        userInitials: settings.userInitials,
      };

      const result = await updateProfile(profileData);
      if (result.success) {
        showNotification("Profile settings saved successfully!", "success");
        // Refresh the branding context to show changes immediately
        await refreshSettings();
      } else {
        showNotification(
          `Failed to save profile settings: ${result.error}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      showNotification("Error saving profile settings", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to get input class names with validation styling
  const getInputClassName = (
    fieldName,
    baseClassName = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
  ) => {
    if (validationErrors[fieldName]) {
      return `${baseClassName} border-red-300 focus:border-red-500`;
    }
    return `${baseClassName} border-gray-300 focus:border-blue-500`;
  };

  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "branding", label: "Branding", icon: Brush },
    { id: "profile", label: "Profile", icon: UserCheck },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "backup", label: "Backup & Data", icon: Database },
    { id: "backend", label: "Backend Status", icon: Database },
  ];

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-gray-100">
            <SettingsIcon size={32} className="text-gray-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
            <p className="text-gray-500 mt-1">
              Configure your pharmacy management system
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64">
          <nav className="space-y-2">
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
        <div className="flex-1">
          {/* General Settings */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  General Settings
                </h2>
                <p className="text-gray-600 mb-6">
                  Manage your business information and appearance preferences
                </p>
              </div>

              {/* Business Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Building size={20} />
                  Business Information
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={settings.businessName || ""}
                      onChange={(e) =>
                        handleSettingChange("businessName", e.target.value)
                      }
                      className={getInputClassName("businessName")}
                    />
                    {validationErrors.businessName && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors.businessName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={settings.businessPhone}
                      onChange={(e) =>
                        handleSettingChange("businessPhone", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Address
                    </label>
                    <textarea
                      value={settings.businessAddress}
                      onChange={(e) =>
                        handleSettingChange("businessAddress", e.target.value)
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={settings.businessEmail || ""}
                      onChange={(e) =>
                        handleSettingChange("businessEmail", e.target.value)
                      }
                      className={getInputClassName("businessEmail")}
                    />
                    {validationErrors.businessEmail && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors.businessEmail}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Appearance */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Palette size={20} />
                  Appearance
                </h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) =>
                          handleSettingChange("primaryColor", e.target.value)
                        }
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) =>
                          handleSettingChange("primaryColor", e.target.value)
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) =>
                        handleSettingChange("language", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="fil">Filipino</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) =>
                        handleSettingChange("timezone", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Asia/Manila">Asia/Manila</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSave("general")}
                disabled={isSaving || isLoading}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold ${
                  isSaving || isLoading
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <Save size={18} />
                {isSaving ? "Saving..." : "Save General Settings"}
              </button>
            </div>
          )}

          {/* Branding Settings */}
          {activeTab === "branding" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Branding Settings
                </h2>
                <p className="text-gray-600 mb-6">
                  Customize your application branding, logo, and visual identity
                </p>
              </div>

              {/* Logo Upload */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Image size={20} />
                  Company Logo
                </h3>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white">
                      {settings.logoUrl ? (
                        <img
                          src={handleImageSrc(settings.logoUrl, "logo")}
                          alt="Company Logo"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <div className="text-center">
                          <Image
                            size={32}
                            className="mx-auto text-gray-400 mb-2"
                          />
                          <p className="text-xs text-gray-500">No logo</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Logo
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={isLoading}
                        />
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                          <Upload size={16} />
                          Choose Logo
                        </button>
                      </div>
                      {settings.logoUrl && (
                        <button
                          onClick={() => {
                            handleSettingChange("logoUrl", "");
                            handleSettingChange("companyLogo", "");
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Recommended size: 200x200px. Supports JPEG, PNG, GIF,
                      WebP. Max size: 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Branding Identity */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Brush size={20} />
                  Brand Identity
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Branding Name
                    </label>
                    <input
                      type="text"
                      value={settings.brandingName || ""}
                      onChange={(e) =>
                        handleSettingChange("brandingName", e.target.value)
                      }
                      placeholder="e.g., MedCure"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This name appears in the header and sidebar
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.brandColor || "#2563eb"}
                        onChange={(e) =>
                          handleSettingChange("brandColor", e.target.value)
                        }
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.brandColor || "#2563eb"}
                        onChange={(e) =>
                          handleSettingChange("brandColor", e.target.value)
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.accentColor || "#3b82f6"}
                        onChange={(e) =>
                          handleSettingChange("accentColor", e.target.value)
                        }
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.accentColor || "#3b82f6"}
                        onChange={(e) =>
                          handleSettingChange("accentColor", e.target.value)
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Header Style
                    </label>
                    <select
                      value={settings.headerStyle || "modern"}
                      onChange={(e) =>
                        handleSettingChange("headerStyle", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="modern">Modern</option>
                      <option value="classic">Classic</option>
                      <option value="minimal">Minimal</option>
                      <option value="compact">Compact</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Layout Preferences */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Zap size={20} />
                  Layout Preferences
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sidebar Style
                    </label>
                    <select
                      value={settings.sidebarStyle || "minimal"}
                      onChange={(e) =>
                        handleSettingChange("sidebarStyle", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="minimal">Minimal</option>
                      <option value="expanded">Expanded</option>
                      <option value="compact">Compact</option>
                      <option value="icons-only">Icons Only</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBrandingSave}
                disabled={isSaving || isLoading}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold ${
                  isSaving || isLoading
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <Save size={18} />
                {isSaving ? "Saving..." : "Save Branding Settings"}
              </button>
            </div>
          )}

          {/* Profile Settings */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Profile Settings
                </h2>
                <p className="text-gray-600 mb-6">
                  Manage your personal profile information and avatar
                </p>
              </div>

              {/* Profile Avatar */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Camera size={20} />
                  Profile Avatar
                </h3>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center bg-white overflow-hidden">
                      {settings.profileAvatar ? (
                        <img
                          src={handleImageSrc(settings.profileAvatar, "avatar")}
                          alt="Profile Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <User
                            size={24}
                            className="mx-auto text-gray-400 mb-1"
                          />
                          <p className="text-xs text-gray-500">Avatar</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Avatar
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={isLoading}
                        />
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                          <Upload size={16} />
                          Choose Avatar
                        </button>
                      </div>
                      {settings.profileAvatar && (
                        <button
                          onClick={() =>
                            handleSettingChange("profileAvatar", "")
                          }
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Recommended size: 150x150px. Supports JPEG, PNG, GIF,
                      WebP. Max size: 2MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <UserCheck size={20} />
                  Personal Information
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={settings.profileName || ""}
                      onChange={(e) =>
                        handleSettingChange("profileName", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={settings.displayName || ""}
                      onChange={(e) =>
                        handleSettingChange("displayName", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={settings.profileEmail || ""}
                      onChange={(e) =>
                        handleSettingChange("profileEmail", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={settings.profilePhone || ""}
                      onChange={(e) =>
                        handleSettingChange("profilePhone", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      value={settings.profileRole || ""}
                      onChange={(e) =>
                        handleSettingChange("profileRole", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User Initials
                    </label>
                    <input
                      type="text"
                      value={settings.userInitials || ""}
                      onChange={(e) =>
                        handleSettingChange(
                          "userInitials",
                          e.target.value.substring(0, 3).toUpperCase()
                        )
                      }
                      maxLength="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum 3 characters for avatar display
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProfileSave}
                disabled={isSaving || isLoading}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold ${
                  isSaving || isLoading
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <Save size={18} />
                {isSaving ? "Saving..." : "Save Profile Settings"}
              </button>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Notification Settings
                </h2>
                <p className="text-gray-600 mb-6">
                  Configure alerts and notification preferences
                </p>
              </div>

              {/* Stock Alerts */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Stock Alerts
                </h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={settings.lowStockThreshold}
                      onChange={(e) =>
                        handleSettingChange(
                          "lowStockThreshold",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Alert when stock falls below this number
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Critical Stock Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={settings.criticalStockThreshold}
                      onChange={(e) =>
                        handleSettingChange(
                          "criticalStockThreshold",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Critical alert threshold
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Alert (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={settings.expiryAlertDays}
                      onChange={(e) =>
                        handleSettingChange(
                          "expiryAlertDays",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Alert before product expires
                    </p>
                  </div>
                </div>
              </div>

              {/* Notification Channels */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Bell size={20} />
                  Notification Channels
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Mail size={20} className="text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-800">
                          Email Notifications
                        </p>
                        <p className="text-sm text-gray-500">
                          Receive alerts via email
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) =>
                          handleSettingChange(
                            "emailNotifications",
                            e.target.checked
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Phone size={20} className="text-green-500" />
                      <div>
                        <p className="font-medium text-gray-800">
                          SMS Notifications
                        </p>
                        <p className="text-sm text-gray-500">
                          Receive alerts via SMS
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.smsNotifications}
                        onChange={(e) =>
                          handleSettingChange(
                            "smsNotifications",
                            e.target.checked
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Bell size={20} className="text-purple-500" />
                      <div>
                        <p className="font-medium text-gray-800">
                          Push Notifications
                        </p>
                        <p className="text-sm text-gray-500">
                          Browser push notifications
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.pushNotifications}
                        onChange={(e) =>
                          handleSettingChange(
                            "pushNotifications",
                            e.target.checked
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSave("notifications")}
                disabled={isSaving || isLoading}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold ${
                  isSaving || isLoading
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <Save size={18} />
                {isSaving ? "Saving..." : "Save Notification Settings"}
              </button>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Security Settings
                </h2>
                <p className="text-gray-600 mb-6">
                  Manage password and authentication settings
                </p>
              </div>

              {/* Password Change */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Shield size={20} />
                  Change Password
                </h3>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={settings.currentPassword}
                        onChange={(e) =>
                          handleSettingChange("currentPassword", e.target.value)
                        }
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={settings.newPassword}
                      onChange={(e) =>
                        handleSettingChange("newPassword", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={settings.confirmPassword}
                      onChange={(e) =>
                        handleSettingChange("confirmPassword", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Security Options */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users size={20} />
                  Security Options
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <p className="font-medium text-gray-800">
                        Two-Factor Authentication
                      </p>
                      <p className="text-sm text-gray-500">
                        Add an extra layer of security
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.twoFactorAuth}
                        onChange={(e) =>
                          handleSettingChange("twoFactorAuth", e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="240"
                        value={settings.sessionTimeout}
                        onChange={(e) =>
                          handleSettingChange(
                            "sessionTimeout",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password Expiry (days)
                      </label>
                      <input
                        type="number"
                        min="30"
                        max="365"
                        value={settings.passwordExpiry}
                        onChange={(e) =>
                          handleSettingChange(
                            "passwordExpiry",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSave("security")}
                disabled={isSaving || isLoading}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold ${
                  isSaving || isLoading
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <Save size={18} />
                {isSaving ? "Saving..." : "Save Security Settings"}
              </button>
            </div>
          )}

          {/* Backup Settings */}
          {activeTab === "backup" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Backup & Data Management
                </h2>
                <p className="text-gray-600 mb-6">
                  Configure data backup and export options
                </p>
              </div>

              {/* Backup Configuration */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Database size={20} />
                  Automatic Backup
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <p className="font-medium text-gray-800">
                        Enable Auto Backup
                      </p>
                      <p className="text-sm text-gray-500">
                        Automatically backup data at scheduled intervals
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoBackup}
                        onChange={(e) =>
                          handleSettingChange("autoBackup", e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Backup Frequency
                      </label>
                      <select
                        value={settings.backupFrequency}
                        onChange={(e) =>
                          handleSettingChange("backupFrequency", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="hourly">Every Hour</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Retention Period (days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={settings.backupRetention}
                        onChange={(e) =>
                          handleSettingChange(
                            "backupRetention",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Manual Backup & Export */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Download size={20} />
                  Manual Operations
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleExport}
                    disabled={isLoading || isSaving}
                    className="flex items-center gap-2 p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download size={20} className="text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-800">
                        Create Backup Now
                      </p>
                      <p className="text-sm text-gray-500">
                        Export current settings
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={isLoading || isSaving}
                    className="flex items-center gap-2 p-4 bg-white border border-red-300 rounded-lg hover:bg-red-50 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={20} className="text-red-500" />
                    <div>
                      <p className="font-medium text-red-800">Reset Settings</p>
                      <p className="text-sm text-red-500">
                        Restore all defaults
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={isLoading || isSaving}
                    className="flex items-center gap-2 p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download size={20} className="text-purple-500" />
                    <div>
                      <p className="font-medium text-gray-800">
                        Export Settings
                      </p>
                      <p className="text-sm text-gray-500">
                        Download settings as JSON
                      </p>
                    </div>
                  </button>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      disabled={isLoading || isSaving}
                    />
                    <button className="flex items-center gap-2 p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-left w-full disabled:opacity-50 disabled:cursor-not-allowed">
                      <Upload size={20} className="text-green-500" />
                      <div>
                        <p className="font-medium text-gray-800">
                          Import Settings
                        </p>
                        <p className="text-sm text-gray-500">
                          Upload settings JSON file
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSave("backup")}
                disabled={isSaving || isLoading}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold ${
                  isSaving || isLoading
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <Save size={18} />
                {isSaving ? "Saving..." : "Save Backup Settings"}
              </button>
            </div>
          )}

          {/* Backend Status Tab */}
          {activeTab === "backend" && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Database size={20} />
                    Settings Backend Test
                  </h3>
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                      isTesting
                        ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    <CheckCircle size={16} />
                    {isTesting ? "Testing..." : "Test Connection"}
                  </button>
                </div>
                <p className="text-gray-600 text-sm">
                  Test the settings backend connection to ensure your settings
                  can be saved and retrieved properly.
                </p>
              </div>

              {/* Settings Analytics */}
              <div className="bg-white p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Settings size={20} />
                  Settings Configuration Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-800">
                      Business Info
                    </div>
                    <div className="text-blue-600 mt-1">
                      {(settings.businessName || "").length > 0 ? "✓" : "✗"}{" "}
                      Name: {settings.businessName || "Not set"}
                    </div>
                    <div className="text-blue-600">
                      {(settings.businessEmail || "").length > 0 ? "✓" : "✗"}{" "}
                      Email: {settings.businessEmail || "Not set"}
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-800">
                      Stock Alerts
                    </div>
                    <div className="text-green-600 mt-1">
                      Low Stock: {settings.lowStockThreshold || 0} items
                    </div>
                    <div className="text-green-600">
                      Critical: {settings.criticalStockThreshold || 0} items
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="font-medium text-purple-800">Security</div>
                    <div className="text-purple-600 mt-1">
                      2FA: {settings.twoFactorAuth ? "Enabled" : "Disabled"}
                    </div>
                    <div className="text-purple-600">
                      Session: {settings.sessionTimeout || 30} minutes
                    </div>
                  </div>
                </div>
              </div>

              <BackendStatus />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
