import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  Server,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Monitor,
  Activity,
  Zap,
  Shield,
  Loader2,
} from "lucide-react";
import backendService from "../services/backendService";
import { useNotification } from "../hooks/useNotification";

export default function BackendStatus() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    checkSystemHealth();
  }, [checkSystemHealth]);

  const checkSystemHealth = useCallback(async () => {
    try {
      setLoading(true);
      
      const [healthResult, statsResult] = await Promise.all([
        backendService.checkBackendHealth(),
        backendService.getSystemStats(),
      ]);

      setHealthStatus(healthResult);
      setSystemStats(statsResult.data);

      if (healthResult.status === "healthy") {
        showNotification("Backend services are operational", "success");
      } else if (healthResult.status === "unavailable") {
        showNotification("Running in mock mode - backend not configured", "info");
      } else {
        showNotification("Backend services have issues", "warning");
      }

    } catch (error) {
      console.error("Error checking system health:", error);
      showNotification("Failed to check system health", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkSystemHealth();
    setRefreshing(false);
  };

  const handleMigration = async () => {
    try {
      setLoading(true);
      showNotification("Starting backend migration...", "info");

      const result = await backendService.migrateToBackend();

      if (result.success) {
        showNotification("Successfully migrated to backend!", "success");
        await checkSystemHealth();
      } else {
        showNotification(result.message, "warning");
      }

    } catch (error) {
      console.error("Migration error:", error);
      showNotification("Migration failed: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="text-green-500" size={24} />;
      case "unavailable":
        return <AlertTriangle className="text-yellow-500" size={24} />;
      case "error":
        return <XCircle className="text-red-500" size={24} />;
      default:
        return <Monitor className="text-gray-500" size={24} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-50 border-green-200";
      case "unavailable":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "error":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 size={48} className="mx-auto mb-4 text-blue-500 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Checking Backend Status
            </h3>
            <p className="text-gray-500">Please wait while we check system health...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <Database size={32} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Backend Status</h1>
              <p className="text-gray-500 mt-1">
                Monitor and manage backend service connectivity
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh Status
          </button>
        </div>

        {/* System Status Overview */}
        {healthStatus && (
          <div className={`p-6 rounded-lg border-2 ${getStatusColor(healthStatus.status)}`}>
            <div className="flex items-center gap-4 mb-4">
              {getStatusIcon(healthStatus.status)}
              <div>
                <h2 className="text-xl font-semibold">
                  System Status: {healthStatus.status.charAt(0).toUpperCase() + healthStatus.status.slice(1)}
                </h2>
                <p className="text-sm opacity-80">{healthStatus.message}</p>
              </div>
            </div>

            {healthStatus.error && (
              <div className="mt-4 p-4 bg-white bg-opacity-50 rounded-lg">
                <p className="text-sm font-medium">Error Details:</p>
                <p className="text-sm opacity-80">{healthStatus.error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {healthStatus?.services && Object.entries(healthStatus.services).map(([service, status]) => (
          <div key={service} className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${status ? 'bg-green-100' : 'bg-red-100'}`}>
                {service === 'database' && <Database size={20} className={status ? 'text-green-600' : 'text-red-600'} />}
                {service === 'products' && <Activity size={20} className={status ? 'text-green-600' : 'text-red-600'} />}
                {service === 'sales' && <Zap size={20} className={status ? 'text-green-600' : 'text-red-600'} />}
                {service === 'archived' && <Shield size={20} className={status ? 'text-green-600' : 'text-red-600'} />}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 capitalize">{service}</h3>
                <p className={`text-sm ${status ? 'text-green-600' : 'text-red-600'}`}>
                  {status ? 'Operational' : 'Unavailable'}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  status ? 'bg-green-500 w-full' : 'bg-red-500 w-0'
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* System Statistics */}
      {systemStats && (
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Monitor size={24} />
            System Statistics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{systemStats.totalProducts}</div>
              <div className="text-sm text-blue-800">Total Products</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{systemStats.activeProducts}</div>
              <div className="text-sm text-green-800">Active Products</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{systemStats.archivedProducts}</div>
              <div className="text-sm text-yellow-800">Archived Products</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{systemStats.totalTransactions}</div>
              <div className="text-sm text-purple-800">Total Transactions</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{systemStats.archivedTransactions}</div>
              <div className="text-sm text-red-800">Archived Transactions</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Settings size={16} className="text-gray-600" />
              <span className="font-medium text-gray-800">Current Mode</span>
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              systemStats.mode === 'backend' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              <Server size={14} />
              {systemStats.mode === 'backend' ? 'Live Backend' : 'Mock Mode'}
            </div>
          </div>
        </div>
      )}

      {/* Migration Actions */}
      {healthStatus?.status === "unavailable" && (
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Backend Configuration</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Mock Mode Active</h3>
              <p className="text-yellow-700 text-sm mb-4">
                The system is currently running in mock mode. To enable backend functionality, 
                configure your Supabase environment variables.
              </p>
              
              <div className="bg-white p-4 rounded border text-sm font-mono">
                <div className="text-gray-600">Required environment variables:</div>
                <div className="mt-2 space-y-1">
                  <div>VITE_SUPABASE_URL=your_supabase_project_url</div>
                  <div>VITE_SUPABASE_ANON_KEY=your_supabase_anon_key</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {healthStatus?.status === "healthy" && systemStats?.mode === "mock" && (
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Backend Migration</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Backend Ready</h3>
              <p className="text-green-700 text-sm mb-4">
                Your backend is configured and ready. You can migrate from mock mode to live backend.
              </p>
              
              <button
                onClick={handleMigration}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Database size={16} />
                Migrate to Backend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
