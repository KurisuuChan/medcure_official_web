import React from "react";

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reports</h2>
        <p className="text-sm text-gray-600">
          Generate analytical PDF / CSV exports (coming soon).
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h3 className="font-semibold mb-2">Inventory PDF</h3>
          <p className="text-sm text-gray-600 mb-4">
            Export a snapshot of current stock levels.
          </p>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            disabled
          >
            Generate (WIP)
          </button>
        </div>
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h3 className="font-semibold mb-2">Sales Summary</h3>
          <p className="text-sm text-gray-600 mb-4">
            Period revenue, discounts & average ticket size.
          </p>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
            disabled
          >
            Generate (WIP)
          </button>
        </div>
      </div>
    </div>
  );
}
