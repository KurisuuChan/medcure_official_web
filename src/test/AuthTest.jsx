import React, { useState, useEffect } from "react";
import { signIn, signOut, getCurrentUser } from "../services/roleAuthService";
import { usePermissions } from "../hooks/usePermissions.js";
import { PermissionGate } from "../components/PermissionGate.jsx";
import { RoleBadge } from "../components/RoleBadge.jsx";
import {
  Shield,
  CreditCard,
  User,
  TestTube,
  Settings,
  BarChart,
} from "lucide-react";

/**
 * Authentication and Permission System Test Component
 * Tests the complete flow of login, role switching, and permission checking
 */
export default function AuthTest() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { hasPermission, userRole, isAdmin, isEmployee } = usePermissions();

  useEffect(() => {
    // Load current user on component mount
    const user = getCurrentUser();
    setCurrentUser(user);

    // Listen for auth state changes
    const handleAuthChange = () => {
      const updatedUser = getCurrentUser();
      setCurrentUser(updatedUser);
      setMessage(
        updatedUser ? `Logged in as ${updatedUser.role}` : "Logged out"
      );
    };

    window.addEventListener("authStateChanged", handleAuthChange);
    return () =>
      window.removeEventListener("authStateChanged", handleAuthChange);
  }, []);

  const handleLogin = async (role) => {
    setLoading(true);
    try {
      // Use predefined test accounts
      const credentials =
        role === "admin"
          ? { email: "admin@medcure.com", password: "123456" }
          : { email: "cashier@medcure.com", password: "123456" };

      const result = await signIn(credentials.email, credentials.password);

      if (result.success) {
        setCurrentUser(result.user);
        setMessage(`Successfully logged in as ${role}`);
      } else {
        setMessage(`Login failed: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      setCurrentUser(null);
      setMessage("Successfully logged out");
    } catch (error) {
      setMessage(`Logout failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <TestTube className="text-blue-600" />
          Authentication & Permission System Test
        </h1>

        {/* Current Status */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Current Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">User Status:</p>
              <p className="font-medium">
                {currentUser
                  ? `Logged in as ${currentUser.full_name}`
                  : "Not logged in"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Role:</p>
              <div className="flex items-center gap-2">
                {currentUser ? (
                  <RoleBadge role={userRole} />
                ) : (
                  <span className="text-gray-500">No role</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Login Buttons */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold">Login as Different Roles</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => handleLogin("admin")}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Shield size={16} />
              Login as Admin
            </button>
            <button
              onClick={() => handleLogin("employee")}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              <CreditCard size={16} />
              Login as Employee
            </button>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              <User size={16} />
              Logout
            </button>
          </div>
        </div>

        {/* Permission Tests */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold">Permission Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Admin Only Features */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Shield size={16} className="text-blue-600" />
                Admin Only Features
              </h3>
              <div className="space-y-2">
                <PermissionGate permission="settings.manage">
                  <div className="flex items-center gap-2 text-green-600">
                    <Settings size={16} />
                    <span className="text-sm">Settings Management</span>
                  </div>
                </PermissionGate>

                <PermissionGate permission="reports.financial">
                  <div className="flex items-center gap-2 text-green-600">
                    <BarChart size={16} />
                    <span className="text-sm">Financial Reports</span>
                  </div>
                </PermissionGate>

                <PermissionGate permission="debug.access">
                  <div className="flex items-center gap-2 text-green-600">
                    <TestTube size={16} />
                    <span className="text-sm">Debug Tools</span>
                  </div>
                </PermissionGate>

                {!isAdmin && (
                  <div className="text-red-500 text-sm italic">
                    Admin features not available for your role
                  </div>
                )}
              </div>
            </div>

            {/* Employee Features */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <CreditCard size={16} className="text-amber-600" />
                Employee Features
              </h3>
              <div className="space-y-2">
                <PermissionGate permission="pos.access">
                  <div className="flex items-center gap-2 text-green-600">
                    <CreditCard size={16} />
                    <span className="text-sm">POS System</span>
                  </div>
                </PermissionGate>

                <PermissionGate permission="inventory.view">
                  <div className="flex items-center gap-2 text-green-600">
                    <BarChart size={16} />
                    <span className="text-sm">View Inventory</span>
                  </div>
                </PermissionGate>

                {!hasPermission("pos.access") && (
                  <div className="text-red-500 text-sm italic">
                    Employee features not available for your role
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Permission Check Results */}
        {currentUser && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-3">
              Permission Check Results
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Is Admin:</span>
                <span
                  className={`ml-2 font-medium ${
                    isAdmin ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isAdmin ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="text-blue-600">Is Employee:</span>
                <span
                  className={`ml-2 font-medium ${
                    isEmployee ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isEmployee ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="text-blue-600">Settings Access:</span>
                <span
                  className={`ml-2 font-medium ${
                    hasPermission("settings.manage")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {hasPermission("settings.manage") ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="text-blue-600">POS Access:</span>
                <span
                  className={`ml-2 font-medium ${
                    hasPermission("pos.access")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {hasPermission("pos.access") ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">{message}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">
            Test Instructions
          </h3>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Click "Login as Admin" to test admin permissions</li>
            <li>Verify that all admin features are visible and accessible</li>
            <li>Click "Login as Employee" to test employee permissions</li>
            <li>Verify that only employee features are visible</li>
            <li>Check that profile updates immediately without page reload</li>
            <li>Test logout functionality</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
