import React from "react";
import { ScanLine, Clock, Wrench } from "lucide-react";

export default function Scanner() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-6">
            <ScanLine size={48} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Barcode Scanner
          </h1>
          <p className="text-gray-600 mb-6">
            Advanced barcode scanning functionality for quick product
            identification and inventory management.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="text-yellow-600" size={20} />
            <h3 className="font-semibold text-yellow-800">Coming Soon</h3>
          </div>
          <p className="text-yellow-700 text-sm">
            We're working hard to bring you an integrated barcode scanning
            system that will streamline your pharmacy operations.
          </p>
        </div>

        <div className="space-y-3 text-left bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Wrench size={16} />
            Planned Features:
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Real-time barcode scanning
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Automatic product lookup
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Inventory quantity updates
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Mobile device compatibility
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Batch scanning for inventory
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
