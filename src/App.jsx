import React from "react";
import { Routes, Route } from "react-router-dom";
import FullLayout from "./layouts/FullLayout";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Management from "./pages/Management";
import Archived from "./pages/Archived";
import Pos from "./pages/POS";
import Contacts from "./pages/Contacts";
import NotificationHistory from "./pages/NotificationHistory";
import Financials from "./pages/Financials";
import ReportsFixed from "./pages/ReportsFixed";
import Settings from "./pages/Settings";
import SystemReset from "./pages/SystemReset";
import UserManagement from "./pages/UserManagement";
import { MockApiStatus } from "./components/MockApiStatus";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Load console reset commands for development
import "./utils/consoleReset.js";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProtectedRoute>
          <MockApiStatus />
          <Routes>
            <Route element={<FullLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="management" element={<Management />} />
              <Route path="archived" element={<Archived />} />
              <Route path="point-of-sales" element={<Pos />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="notifications" element={<NotificationHistory />} />
              <Route path="financials" element={<Financials />} />
              <Route path="reports" element={<ReportsFixed />} />
              <Route path="settings" element={<Settings />} />
              <Route path="user-management" element={<UserManagement />} />
              <Route path="system-reset" element={<SystemReset />} />
              <Route path="*" element={<Dashboard />} />
            </Route>
          </Routes>
        </ProtectedRoute>
      </AuthProvider>
    </ThemeProvider>
  );
}
