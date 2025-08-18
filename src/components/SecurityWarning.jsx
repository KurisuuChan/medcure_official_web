import React from "react";
import { AlertTriangle } from "lucide-react";

export default function SecurityWarning() {
  // Only show if using service role
  const isUsingServiceRole =
    import.meta.env.VITE_SUPABASE_ANON_KEY?.length > 200;

  if (!isUsingServiceRole) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="text-red-500" size={24} />
        <div>
          <h3 className="font-bold text-red-800">🚨 SECURITY WARNING</h3>
          <p className="text-red-700 text-sm">
            You're using service_role key in frontend! This exposes superuser
            database access.
            <br />
            <strong>
              Switch to anon role with proper permissions for production!
            </strong>
          </p>
        </div>
      </div>
    </div>
  );
}
