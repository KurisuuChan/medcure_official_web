import React, { useState } from "react";
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
} from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [showPassword, setShowPassword] = useState(false);
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
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (section) => {
    // Simulate save operation
    console.log(`Saving ${section} settings:`, settings);
    // Here you would typically make an API call
  };

  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "backup", label: "Backup & Data", icon: Database },
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
                      value={settings.businessName}
                      onChange={(e) =>
                        handleSettingChange("businessName", e.target.value)
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
                      value={settings.businessEmail}
                      onChange={(e) =>
                        handleSettingChange("businessEmail", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
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
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                <Save size={18} />
                Save General Settings
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
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                <Save size={18} />
                Save Notification Settings
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
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                <Save size={18} />
                Save Security Settings
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
                  <button className="flex items-center gap-2 p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                    <Download size={20} className="text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-800">
                        Create Backup Now
                      </p>
                      <p className="text-sm text-gray-500">
                        Generate immediate backup
                      </p>
                    </div>
                  </button>
                  <button className="flex items-center gap-2 p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                    <Upload size={20} className="text-green-500" />
                    <div>
                      <p className="font-medium text-gray-800">
                        Restore Backup
                      </p>
                      <p className="text-sm text-gray-500">
                        Upload and restore data
                      </p>
                    </div>
                  </button>
                  <button className="flex items-center gap-2 p-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                    <Download size={20} className="text-purple-500" />
                    <div>
                      <p className="font-medium text-gray-800">Export Data</p>
                      <p className="text-sm text-gray-500">
                        Export to CSV/Excel
                      </p>
                    </div>
                  </button>
                  <button className="flex items-center gap-2 p-4 bg-white border border-red-300 rounded-lg hover:bg-red-50 text-left">
                    <Trash2 size={20} className="text-red-500" />
                    <div>
                      <p className="font-medium text-red-800">Clear Old Data</p>
                      <p className="text-sm text-red-500">
                        Remove archived records
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleSave("backup")}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                <Save size={18} />
                Save Backup Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
