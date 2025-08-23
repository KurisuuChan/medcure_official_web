import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import FullLayout from "@/layouts/FullLayout";
import Dashboard from "@/pages/Dashboard";
import Management from "@/pages/Management";
import Archived from "@/pages/Archived";
import Pos from "@/pages/POS";
import Contacts from "@/pages/Contacts";
import NotificationHistory from "@/pages/NotificationHistory";
import Financials from "@/pages/Financials";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";

// Import localStorage utilities for development
import "@/utils/clearLocalStorage.js";

// Import authentication service for storage initialization
import { initializeAuth } from "@/services/authService.js";

const branding = { name: "MedCure Admin" };

export default function App({ userInfo, onLogout }) {
  // Initialize authentication on app startup
  useEffect(() => {
    console.log("🚀 Initializing MedCure App...");
    initializeAuth().catch((error) => {
      console.warn("Auth initialization failed:", error);
    });
  }, []);

  return (
    <ProtectedRoute>
      <Routes>
        <Route
          element={
            <FullLayout
              branding={branding}
              user={userInfo}
              onLogout={onLogout}
            />
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<Management />} />
          <Route path="management" element={<Management />} />
          <Route path="archived" element={<Archived />} />
          <Route path="point-of-sales" element={<Pos />} />
          <Route path="pos" element={<Pos />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="notifications" element={<NotificationHistory />} />
          <Route
            path="notification-history"
            element={<NotificationHistory />}
          />
          <Route path="financials" element={<Financials />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
}
