import React, { useState } from "react";
import {
  Archive,
  Search,
  Package,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Eye,
  RefreshCw,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { 
  useArchivedItems, 
  useRestoreArchivedProduct 
} from "../hooks/useArchive.js";
import { useNotification } from "../hooks/useNotification.js";
import { formatCurrency, formatDate } from "../utils/formatters.js";

export default function Archived() {
  const { addNotification } = useNotification();
  const { data: archivedItems = [], isLoading, error, refetch } = useArchivedItems();
  const restoreProduct = useRestoreArchivedProduct();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all"); // all, week, month, year
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, name
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedItems, setExpandedItems] = useState([]);

  // Handle restore functionality
  const handleRestore = async (item) => {
    if (window.confirm(`Are you sure you want to restore "${item.name}"?`)) {
      try {
        await restoreProduct.mutateAsync(item.id);
        addNotification(`"${item.name}" has been restored successfully`, "success");
        setSelectedItems((prev) => prev.filter((id) => id !== item.id));
      } catch (error) {
        addNotification(error.message || "Failed to restore product", "error");
      }
    }
  };

  const handleBulkRestore = async () => {
    if (selectedItems.length === 0) return;
    
    if (window.confirm(`Are you sure you want to restore ${selectedItems.length} products?`)) {
      try {
        await Promise.all(
          selectedItems.map((id) => restoreProduct.mutateAsync(id))
        );
        addNotification(`${selectedItems.length} products restored successfully`, "success");
        setSelectedItems([]);
      } catch (error) {
        addNotification(error.message || "Failed to restore some products", "error");
      }
    }
  };

  // Filter and sort archived items
  const filteredItems = archivedItems.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.archived_by?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    const archiveDate = new Date(item.archived_date);
    const now = new Date();
    
    switch (filterBy) {
      case "week":
        return (now - archiveDate) <= 7 * 24 * 60 * 60 * 1000;
      case "month":
        return (now - archiveDate) <= 30 * 24 * 60 * 60 * 1000;
      case "year":
        return (now - archiveDate) <= 365 * 24 * 60 * 60 * 1000;
      default:
        return true;
    }
  }).sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return new Date(a.archived_date) - new Date(b.archived_date);
      case "name":
        return a.name?.localeCompare(b.name) || 0;
      default: // newest
        return new Date(b.archived_date) - new Date(a.archived_date);
    }
  });

  const handleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedItems(prev => 
      prev.length === filteredItems.length ? [] : filteredItems.map(item => item.id)
    );
  };

  const handleRefresh = () => {
    refetch();
    addNotification("Archive data refreshed", "success");
  };

  const toggleExpanded = (id) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const getArchiveReasonBadge = (reason) => {
    const lowerReason = reason?.toLowerCase() || "";
    
    if (lowerReason.includes("bulk")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    } else if (lowerReason.includes("expired")) {
      return "bg-red-50 text-red-700 border-red-200";
    } else if (lowerReason.includes("manual")) {
      return "bg-green-50 text-green-700 border-green-200";
    } else {
      return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStockStatusColor = (stock) => {
    if (!stock || stock === 0) return "text-red-600";
    if (stock <= 10) return "text-orange-600";
    return "text-green-600";
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-md">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Archive</h3>
          <p className="text-gray-600 mb-4">Unable to load archived products</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                <Archive size={24} className="text-gray-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Archived Products</h1>
                <p className="text-gray-600 mt-1">
                  Products that have been archived from inventory management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Package size={20} className="text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Archived</p>
                  <p className="text-xl font-semibold text-gray-900">{filteredItems.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">This Month</p>
                  <p className="text-xl font-semibold text-blue-900">
                    {filteredItems.filter(item => {
                      const archiveDate = new Date(item.archived_date);
                      const now = new Date();
                      return (now - archiveDate) <= 30 * 24 * 60 * 60 * 1000;
                    }).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-green-600" />
                <div>
                  <p className="text-sm text-green-600">Available for Restore</p>
                  <p className="text-xl font-semibold text-green-900">{filteredItems.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by product name, reason, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              >
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Product Name</option>
              </select>
            </div>
          </div>

          {selectedItems.length > 0 && (
            <div className="mt-4 flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium text-blue-900">
                {selectedItems.length} items selected
              </span>
              <button 
                onClick={handleBulkRestore}
                disabled={restoreProduct.isPending}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RotateCcw size={14} />
                {restoreProduct.isPending ? "Restoring..." : "Restore Selected"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw size={32} className="mx-auto mb-4 text-gray-400 animate-spin" />
              <p className="text-gray-600">Loading archived products...</p>
            </div>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Select All ({filteredItems.length})
                  </span>
                </label>
              </div>
            </div>

            {/* Table Content */}
            <div className="divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const isExpanded = expandedItems.includes(item.id);
                return (
                  <div key={item.id} className="hover:bg-gray-50 transition-colors">
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                            <Package size={20} className="text-gray-600" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getArchiveReasonBadge(item.reason)}`}>
                                {item.reason?.includes("bulk") ? "Bulk" : 
                                 item.reason?.includes("expired") ? "Expired" :
                                 item.reason?.includes("manual") ? "Manual" : "Other"}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Package size={14} />
                                {item.category || "Uncategorized"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {formatDate(item.archived_date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <User size={14} />
                                {item.archived_by || "System"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(item.selling_price || 0)}
                            </div>
                            <div className={`text-xs font-medium ${getStockStatusColor(item.total_stock)}`}>
                              Stock: {item.total_stock || 0}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => toggleExpanded(item.id)}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <ChevronDown size={16} className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={() => handleRestore(item)}
                              disabled={restoreProduct.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors disabled:opacity-50"
                            >
                              <RotateCcw size={14} />
                              {restoreProduct.isPending ? "Restoring..." : "Restore"}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 ml-16 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Product Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Cost Price:</span>
                                  <span className="font-medium">{formatCurrency(item.cost_price || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Selling Price:</span>
                                  <span className="font-medium">{formatCurrency(item.selling_price || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Stock Level:</span>
                                  <span className={`font-medium ${getStockStatusColor(item.total_stock)}`}>
                                    {item.total_stock || 0} units
                                  </span>
                                </div>
                                {item.expiry_date && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Expiry Date:</span>
                                    <span className="font-medium">{formatDate(item.expiry_date)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Archive Information</h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-gray-600">Reason:</span>
                                  <p className="mt-1 p-2 bg-white rounded border text-gray-800">{item.reason}</p>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Archived Date:</span>
                                  <span className="font-medium">{formatDate(item.archived_date)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Archived By:</span>
                                  <span className="font-medium">{item.archived_by || "System"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Archive size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Archived Products</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterBy !== "all" 
                ? "No archived products match your current filters" 
                : "No products have been archived yet"}
            </p>
            {(searchTerm || filterBy !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterBy("all");
                }}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
