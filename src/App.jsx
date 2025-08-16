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
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import { MockApiStatus } from "./components/MockApiStatus";

const user = { name: "Admin User", role: "Administrator", initials: "AU" };

export default function App() {
  return (
    <>
      <MockApiStatus />
      <Routes>
        <Route element={<FullLayout user={user} />}>
          <Route index element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="management" element={<Management />} />
          <Route path="archived" element={<Archived />} />
          <Route path="point-of-sales" element={<Pos />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="notifications" element={<NotificationHistory />} />
          <Route path="financials" element={<Financials />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </>
  );
}
