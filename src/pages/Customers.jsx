import React from "react";
import { Users, Clock, Wrench } from "lucide-react";

export default function Customers() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
            <Users size={48} className="text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Customer Management
          </h1>
          <p className="text-gray-600 mb-6">
            Comprehensive customer relationship management system for your
            pharmacy patients and clients.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="text-yellow-600" size={20} />
            <h3 className="font-semibold text-yellow-800">Coming Soon</h3>
          </div>
          <p className="text-yellow-700 text-sm">
            We're developing a complete customer management solution to help you
            serve your patients better.
          </p>
        </div>

        <div className="space-y-3 text-left bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Wrench size={16} />
            Planned Features:
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Customer profiles & contact info
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Purchase history tracking
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Prescription management
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Loyalty programs
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Medication reminders
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Insurance & billing integration
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
