import React from "react";
import { Bell, Clock, Settings, Calendar, AlertTriangle } from "lucide-react";

export default function NotificationHistory() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 text-center">
        {/* Coming Soon Container */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12">
          {/* Header Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center">
                <Bell size={48} className="text-blue-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <Settings size={16} className="text-white animate-spin" />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Notification History
              </h1>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium mb-6">
                <Clock size={16} />
                Coming Soon
              </div>
            </div>

            <p className="text-lg text-gray-600 leading-relaxed max-w-lg mx-auto">
              We're working hard to bring you a comprehensive notification
              system that will help you stay on top of all your pharmacy
              operations.
            </p>

            {/* Features Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle size={16} className="text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-blue-900">Stock Alerts</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Get notified when products are running low or out of stock
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar size={16} className="text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-900">
                    Expiry Warnings
                  </h3>
                </div>
                <p className="text-sm text-green-700">
                  Receive alerts for products approaching expiration dates
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Bell size={16} className="text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-purple-900">
                    System Updates
                  </h3>
                </div>
                <p className="text-sm text-purple-700">
                  Stay informed about system maintenance and new features
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Settings size={16} className="text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-orange-900">
                    Custom Alerts
                  </h3>
                </div>
                <p className="text-sm text-orange-700">
                  Configure personalized notifications for your workflow
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">
                What's Coming:
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Real-time notification system</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Email and SMS notifications</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Advanced filtering and search</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span>Bulk actions and management</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span>Notification history and analytics</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Need immediate notifications? Check your current alerts in the{" "}
                <span className="font-medium text-blue-600">Dashboard</span> or{" "}
                <span className="font-medium text-blue-600">Inventory</span>{" "}
                pages.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
