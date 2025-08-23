import React, { useState, useEffect } from "react";
import Login from "./Login.jsx";
import { simpleGetCurrentUser, simpleSignOut } from "../services/simpleAuthService.js";

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log("🔍 Checking authentication...");
      setLoading(true);
      
      // Use simple auth service that doesn't require database tables
      const userInfo = await simpleGetCurrentUser();
      console.log("🔍 Auth check result:", userInfo);
      
      if (userInfo && userInfo.user) {
        setUser(userInfo.user);
        setRole(userInfo.role);
        console.log("✅ User authenticated:", userInfo.user.email, "Role:", userInfo.role);
      } else {
        console.log("ℹ️ No authenticated user found");
        setUser(null);
        setRole(null);
      }
    } catch (error) {
      console.error("❌ Authentication check failed:", error);
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
      console.log("✅ Authentication check completed");
    }
  };

  const handleLoginSuccess = (userInfo) => {
    setUser(userInfo.user);
    setRole(userInfo.role);
    console.log(
      "✅ User logged in:",
      userInfo.user.email,
      "Role:",
      userInfo.role
    );
  };

  const handleLogout = async () => {
    try {
      console.log("🔓 Starting logout process...");
      const result = await simpleSignOut();

      if (result.success) {
        setUser(null);
        setRole(null);
        console.log("👋 User logged out successfully");

        // Force reload to ensure clean state
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        console.error("❌ Logout failed:", result.error);
        alert("Logout failed: " + result.error);
      }
    } catch (error) {
      console.error("❌ Logout error:", error);
      alert("Logout failed: " + error.message);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading MedCure...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // User is authenticated, show the app without extra header
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main App Content */}
      <div>
        {React.cloneElement(children, {
          currentUser: user,
          currentRole: role,
          onLogout: handleLogout,
          userInfo: {
            name: user.email?.split("@")[0] || "User",
            role: role === "admin" ? "Administrator" : "Employee/Cashier",
            initials: user.email?.charAt(0).toUpperCase() || "U",
            email: user.email,
          },
        })}
      </div>
    </div>
  );
}
