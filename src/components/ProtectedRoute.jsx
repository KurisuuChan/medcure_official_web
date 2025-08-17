import React from "react";
import { useAuth } from "../hooks/useAuth";
import Login from "../pages/Login";

export default function ProtectedRoute({ children }) {
  const { user, login, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading MedCure...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={login} />;
  }

  return children;
}
