import React from "react";
import PropTypes from "prop-types";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Outlet } from "react-router-dom";

export default function FullLayout({ branding, user }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-800">
      <Sidebar branding={branding} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

FullLayout.propTypes = {
  branding: PropTypes.shape({ name: PropTypes.string }),
  user: PropTypes.object,
};
