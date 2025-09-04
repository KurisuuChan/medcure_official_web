import React, { useState, useEffect } from "react";
import {
  Archive, Search, Package, Calendar, User, AlertCircle, CheckCircle,
  Eye, RefreshCw, RotateCcw, ChevronDown, FileText, Clock, Tag,
  ExternalLink, Trash2,
} from "lucide-react";
import {
  useArchivedProducts, useRestoreArchivedProduct,
  usePermanentlyDeleteArchivedItem, useBulkPermanentlyDeleteArchivedItems,
} from "../hooks/useArchive.js";
import { useNotification } from "../hooks/useNotification.js";
import { formatCurrency, formatDate } from "../utils/formatters.js";

// Helper component for stat cards
const StatCard = ({ icon, label, value, color }) => (
  <div className={`bg-${color}-50 rounded-xl p-4 border border-${color}-200 flex items-center gap-4`}>
    <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <p className={`text-sm text-${color}-600 font-medium`}>{label}</p>
      <p className={`text-2xl font-bold text-${color}-900`}>{value}</p>
    </div>
  </div>
);

// Helper component for detail rows in the expanded view
const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-baseline">
    <span className="text-gray-600">{label}:</span>
    <span className="font-medium text-gray-800 text-right">{value}</span>
  </div>
);

export default function Archived() {
  const { addNotification } = useNotification();
  const { data: archivedItems = [], isLoading, error, refetch } = useArchivedProducts();
  const restoreProduct = useRestoreArchivedProduct();
  const deleteProduct = usePermanentlyDeleteArchivedItem();
  const bulkDeleteProducts = useBulkPermanentlyDeleteArchivedItems();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedItems, setExpandedItems] = useState([]);

  // --- Handlers for API actions ---
  const handleRestore = async (item) => {
    if (window.confirm(`Are you sure you want to restore "${item.name}"?`)) {
      try {
        await restoreProduct.mutateAsync({ productId: item.id, restoredBy: "Admin" });
        addNotification(`"${item.name}" has been restored.`, "success");
        setSelectedItems((prev) => prev.filter((id) => id !== item.id));
      } catch (err) {
        addNotification(err.message || "Failed to restore product.", "error");
      }
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`PERMANENTLY DELETE "${item.name}"? This cannot be undone.`)) {
      try {
        await deleteProduct.mutateAsync({ productId: item.id, deletedBy: "Admin" });
        addNotification(`"${item.name}" was permanently deleted.`, "success");
        setSelectedItems((prev) => prev.filter((id) => id !== item.id));
      } catch (err) {
        addNotification(err.message || "Failed to delete product.", "error");
      }
    }
  };

  const handleBulkRestore = async () => {
    if (selectedItems.length === 0) return;
    if (window.confirm(`Restore ${selectedItems.length} selected products?`)) {
      try {
        await Promise.all(
          selectedItems.map((id) => restoreProduct.mutateAsync({ productId: id, restoredBy: "Admin" }))
        );
        addNotification(`${selectedItems.length} products restored successfully.`, "success");
        setSelectedItems([]);
      } catch (err) {
        addNotification(err.message || "Failed to restore some products.", "error");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (window.confirm(`PERMANENTLY DELETE ${selectedItems.length} products? This cannot be undone.`)) {
      try {
        await bulkDeleteProducts.mutateAsync({ productIds: selectedItems, deletedBy: "Admin" });
        addNotification(`${selectedItems.length} products were permanently deleted.`, "success");
        setSelectedItems([]);
      } catch (err) {
        addNotification(err.message || "Failed to delete selected products.", "error");
      }
    }
  };
  
  // --- Filtering and Sorting Logic ---
  const filteredItems = (archivedItems || [])
    .filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      if (searchTerm && !(
        item.name?.toLowerCase().includes(searchLower) ||
        item.reason?.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower)
      )) return false;

      if (reasonFilter !== "all") {
        const lowerReason = item.reason?.toLowerCase() || "";
        const reasons = {
          expired: ["expired", "expiry"],
          damaged: ["damaged", "defective"],
          "low-demand": ["low demand", "slow moving"],
          recalled: ["recalled", "quality"],
          discontinued: ["discontinued", "obsolete"],
          bulk: ["bulk"],
        };
        if (reasonFilter === "other") {
          if (Object.values(reasons).flat().some(r => lowerReason.includes(r))) return false;
        } else if (!reasons[reasonFilter]?.some(r => lowerReason.includes(r))) {
          return false;
        }
      }

      if (filterBy !== 'all') {
        const archiveDate = new Date(item.archived_date);
        const now = new Date();
        const days = (now - archiveDate) / (1000 * 3600 * 24);
        if (filterBy === 'week' && days > 7) return false;
        if (filterBy === 'month' && days > 30) return false;
        if (filterBy === 'year' && days > 365) return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest": return new Date(a.archived_date) - new Date(b.archived_date);
        case "name": return a.name?.localeCompare(b.name) || 0;
        default: return new Date(b.archived_date) - new Date(a.archived_date);
      }
    });

  // --- UI State Handlers ---
  const handleSelectItem = (id) => {
    setSelectedItems((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };
  const handleSelectAll = () => {
    setSelectedItems(selectedItems.length === filteredItems.length ? [] : filteredItems.map((item) => item.id));
  };
  const toggleExpanded = (id) => {
    setExpandedItems((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const getArchiveReasonBadge = (reason) => {
    const lowerReason = reason?.toLowerCase() || "";
    if (lowerReason.includes("expired")) return { color: "bg-red-50 text-red-700 border-red-200", icon: <Clock size={12} />, label: "Expired" };
    if (lowerReason.includes("damaged")) return { color: "bg-orange-50 text-orange-700 border-orange-200", icon: <AlertCircle size={12} />, label: "Damaged" };
    if (lowerReason.includes("low demand")) return { color: "bg-blue-50 text-blue-700 border-blue-200", icon: <Package size={12} />, label: "Low Demand" };
    if (lowerReason.includes("recalled")) return { color: "bg-purple-50 text-purple-700 border-purple-200", icon: <ExternalLink size={12} />, label: "Quality Issue" };
    if (lowerReason.includes("discontinued")) return { color: "bg-gray-50 text-gray-700 border-gray-200", icon: <Archive size={12} />, label: "Discontinued" };
    if (lowerReason.includes("bulk")) return { color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: <Package size={12} />, label: "Bulk" };
    return { color: "bg-gray-50 text-gray-700 border-gray-200", icon: <Tag size={12} />, label: "Other" };
  };

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-semibold">Error Loading Archive</h3>
        <p className="text-gray-600 my-2">{error.message}</p>
        <button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Try Again</button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
              <Archive size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Archived Products</h1>
              <p className="text-sm text-gray-600 mt-1">Manage items removed from your main inventory.</p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <button onClick={() => refetch()} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>
        
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Package size={20} className="text-indigo-500" />} label="Total Archived" value={archivedItems.length} color="indigo" />
          <StatCard icon={<CheckCircle size={20} className="text-green-500" />} label="Restorable" value={archivedItems.length} color="green" />
          <StatCard icon={<Calendar size={20} className="text-blue-500" />} label="This Month" value={archivedItems.filter(item => (new Date() - new Date(item.archived_date)) / (1000*3600*24) <= 30).length} color="blue" />
          <StatCard icon={<Clock size={20} className="text-amber-500" />} label="Expired Items" value={archivedItems.filter(item => item.reason?.toLowerCase().includes("expired")).length} color="amber" />
        </div>

        {/* Filters and Search */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input type="text" placeholder="Search by name, reason, category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                <option value="all">All Time</option><option value="week">Last Week</option><option value="month">Last Month</option><option value="year">Last Year</option>
              </select>
              <select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                <option value="all">All Reasons</option><option value="expired">Expired</option><option value="damaged">Damaged</option><option value="low-demand">Low Demand</option><option value="recalled">Quality Issue</option><option value="discontinued">Discontinued</option><option value="bulk">Bulk</option><option value="other">Other</option>
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                <option value="newest">Newest First</option><option value="oldest">Oldest First</option><option value="name">Product Name</option>
              </select>
            </div>
          </div>
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium text-blue-900">{selectedItems.length} selected</span>
              <button onClick={handleBulkRestore} disabled={restoreProduct.isPending} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                <RotateCcw size={14} /> {restoreProduct.isPending ? "Restoring..." : "Restore"}
              </button>
              <button onClick={handleBulkDelete} disabled={bulkDeleteProducts.isPending} className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50">
                <Trash2 size={14} /> {bulkDeleteProducts.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16"><RefreshCw size={32} className="mx-auto mb-4 text-blue-500 animate-spin" /><p className="text-gray-600">Loading archived products...</p></div>
          ) : filteredItems.length > 0 ? (
            <>
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <label className="flex items-center w-fit">
                  <input type="checkbox" checked={selectedItems.length === filteredItems.length && filteredItems.length > 0} onChange={handleSelectAll} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="ml-3 text-sm font-medium text-gray-700">Select All ({filteredItems.length})</span>
                </label>
              </div>
              <div className="divide-y divide-gray-100">
                {filteredItems.map((item) => {
                  const isExpanded = expandedItems.includes(item.id);
                  const reasonBadge = getArchiveReasonBadge(item.reason);
                  return (
                    <div key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                          <input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => handleSelectItem(item.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0"><Package size={20} className="text-gray-500" /></div>
                          <div>
                            <h3 className="font-semibold text-gray-900" title={item.name}>{item.name}</h3>
                            <p className="text-sm text-gray-500">{item.category || "Uncategorized"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <span className={`hidden md:inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full border ${reasonBadge.color}`} title={item.reason || "No reason"}>{reasonBadge.icon}{reasonBadge.label}</span>
                          <button onClick={() => toggleExpanded(item.id)} className="p-2 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100"><ChevronDown size={16} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} /></button>
                          <button onClick={() => handleRestore(item)} disabled={restoreProduct.isPending} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50" title="Restore"><RotateCcw size={16} /></button>
                          <button onClick={() => handleDelete(item)} disabled={deleteProduct.isPending} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50" title="Permanently Delete"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="pb-4 px-6 ml-16">
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <DetailRow label="Archived Date" value={formatDate(item.archived_date)} />
                            <DetailRow label="Archived By" value={item.archived_by || "System"} />
                            <DetailRow label="Cost Price" value={formatCurrency(item.original_data?.cost_price || 0)} />
                            <DetailRow label="Selling Price" value={formatCurrency(item.original_data?.selling_price || 0)} />
                            <DetailRow label="Stock at Archive" value={`${item.original_stock || 0} units`} />
                            <DetailRow label="Brand" value={item.original_data?.brand_name || "N/A"} />
                            <div className="md:col-span-2 pt-2 mt-2 border-t border-gray-200">
                              <strong className="font-medium text-gray-600">Reason:</strong>
                              <p className="text-gray-800">{item.reason || "Not specified."}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Archive size={24} className="text-gray-400" /></div>
              <h3 className="text-lg font-semibold text-gray-900">No Archived Products Found</h3>
              <p className="text-gray-600 mt-2">
                {searchTerm || filterBy !== "all" || reasonFilter !== "all" ? "No items match your filters." : "Your archive is empty."}
              </p>
              {(searchTerm || filterBy !== "all" || reasonFilter !== "all") && (
                <button onClick={() => { setSearchTerm(""); setFilterBy("all"); setReasonFilter("all"); }} className="mt-4 text-blue-600 hover:underline font-medium">Clear filters</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}