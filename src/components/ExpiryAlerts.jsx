import React from "react";
import { AlertTriangle, Clock, Calendar, Package } from "lucide-react";
import { getExpiryStatus } from "../services/stockService.js";

const ExpiryAlerts = ({ expiringProducts = [], onViewDetails }) => {
  if (!expiringProducts.length) return null;

  // Categorize products by urgency
  const criticalProducts = expiringProducts.filter(p => {
    const status = getExpiryStatus(p);
    return status.status === "critical" || status.status === "expired";
  });

  const warningProducts = expiringProducts.filter(p => {
    const status = getExpiryStatus(p);
    return status.status === "warning";
  });

  return (
    <div className="space-y-4">
      {/* Critical Expiry Alert Banner */}
      {criticalProducts.length > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-xl shadow-lg border-l-4 border-red-700 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
            <div className="flex-1">
              <h3 className="font-bold text-lg">🚨 CRITICAL: Products Expiring Soon!</h3>
              <p className="text-red-100">
                {criticalProducts.length} product(s) expire within 7 days - Immediate action required!
              </p>
            </div>
            <button
              onClick={() => onViewDetails?.()}
              className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Warning Expiry Alert */}
      {warningProducts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-white p-4 rounded-xl shadow-lg border-l-4 border-amber-600">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5" />
            <div className="flex-1">
              <h3 className="font-semibold">⚠️ Products Expiring Within 30 Days</h3>
              <p className="text-amber-100">
                {warningProducts.length} product(s) need attention - Plan restocking soon
              </p>
            </div>
            <button
              onClick={() => onViewDetails?.()}
              className="bg-white text-amber-600 px-3 py-2 rounded-lg font-medium hover:bg-amber-50 transition-colors text-sm"
            >
              Review
            </button>
          </div>
        </div>
      )}

      {/* Detailed Expiry List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-800">Expiry Timeline</h3>
          </div>
        </div>
        
        <div className="max-h-64 overflow-y-auto">
          {expiringProducts.slice(0, 10).map((product) => {
            const expiryStatus = getExpiryStatus(product);
            const daysUntilExpiry = expiryStatus.daysUntilExpiry;
            
            return (
              <div
                key={product.id}
                className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  expiryStatus.status === "critical" || expiryStatus.status === "expired"
                    ? "bg-red-50 border-l-4 border-red-500"
                    : expiryStatus.status === "warning"
                    ? "bg-amber-50 border-l-4 border-amber-500"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className={`w-4 h-4 ${expiryStatus.color}`} />
                    <div>
                      <div className="font-medium text-gray-800">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        Expires: {new Date(product.expiry_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${expiryStatus.color}`}>
                      {daysUntilExpiry <= 0 
                        ? "EXPIRED" 
                        : `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      Stock: {product.total_stock || product.stock || 0}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {expiringProducts.length > 10 && (
          <div className="p-3 bg-gray-50 text-center">
            <button
              onClick={() => onViewDetails?.()}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View all {expiringProducts.length} expiring products →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpiryAlerts;
