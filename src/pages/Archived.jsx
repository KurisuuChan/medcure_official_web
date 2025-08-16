import React, { useState, useEffect } from "react";
import {
  Archive,
  RotateCcw,
  Trash2,
  Search,
  Filter,
  Package,
  Calendar,
  User,
  Tag,
  MoreVertical,
  Eye,
  ExternalLink,
  CheckCircle,
  Loader2,
} from "lucide-react";
import useArchived from "../hooks/useArchived";
import { useNotification } from "../hooks/useNotification";

export default function Archived() {
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [searchTimeout, setSearchTimeout] = useState(null);

  const {
    archivedItems,
    stats,
    loading,
    error,
    handleRestoreItem,
    handleDeleteItem,
    handleBulkRestore,
    handleBulkDelete,
    updateFilters,
    clearError,
  } = useArchived();

  const { showNotification } = useNotification();

  // Handle search input change with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout
    const newTimeout = setTimeout(() => {
      updateFilters({ search: value, page: 1 });
    }, 300);

    setSearchTimeout(newTimeout);
  };

  // Handle filter type change
  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilterType(value);
    updateFilters({ type: value, page: 1 });
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Clear error when component mounts
  useEffect(() => {
    if (error) {
      showNotification(error, "error");
      clearError();
    }
  }, [error, showNotification, clearError]);

  const getTypeIcon = (type) => {
    switch (type) {
      case "product":
        return <Package size={20} className="text-blue-500" />;
      case "transaction":
        return <Tag size={20} className="text-green-500" />;
      case "supplier":
        return <ExternalLink size={20} className="text-purple-500" />;
      case "employee":
        return <User size={20} className="text-orange-500" />;
      default:
        return <Archive size={20} className="text-gray-500" />;
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case "product":
        return "bg-blue-100 text-blue-800";
      case "transaction":
        return "bg-green-100 text-green-800";
      case "supplier":
        return "bg-purple-100 text-purple-800";
      case "employee":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === archivedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(archivedItems.map((item) => item.id));
    }
  };

  const handleSingleRestore = async (id, type) => {
    const result = await handleRestoreItem(id, type);
    if (result.success) {
      showNotification("Item restored successfully!", "success");
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
    } else {
      showNotification(result.error || "Failed to restore item", "error");
    }
  };

  const handleSingleDelete = async (id, type) => {
    const result = await handleDeleteItem(id, type);
    if (result.success) {
      showNotification("Item permanently deleted!", "success");
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
    } else {
      showNotification(result.error || "Failed to delete item", "error");
    }
  };

  const handleBulkRestoreSelected = async () => {
    const itemsToRestore = archivedItems
      .filter((item) => selectedItems.includes(item.id))
      .map((item) => ({ id: item.id, type: item.type }));

    const result = await handleBulkRestore(itemsToRestore);
    if (result.success) {
      const { success, errors } = result.data;
      showNotification(
        `${success.length} items restored successfully!`,
        "success"
      );
      if (errors.length > 0) {
        showNotification(`${errors.length} items failed to restore`, "warning");
      }
      setSelectedItems([]);
    } else {
      showNotification(result.error || "Failed to restore items", "error");
    }
  };

  const handleBulkDeleteSelected = async () => {
    const itemsToDelete = archivedItems
      .filter((item) => selectedItems.includes(item.id))
      .map((item) => ({ id: item.id, type: item.type }));

    const result = await handleBulkDelete(itemsToDelete);
    if (result.success) {
      const { success, errors } = result.data;
      showNotification(
        `${success.length} items permanently deleted!`,
        "success"
      );
      if (errors.length > 0) {
        showNotification(`${errors.length} items failed to delete`, "warning");
      }
      setSelectedItems([]);
    } else {
      showNotification(result.error || "Failed to delete items", "error");
    }
  };

  const typeStats = {
    products: stats.products || 0,
    transactions: stats.transactions || 0,
    suppliers: stats.suppliers || 0,
    employees: stats.employees || 0,
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2
              size={48}
              className="mx-auto mb-4 text-blue-500 animate-spin"
            />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Loading archived items...
            </h3>
            <p className="text-gray-500">
              Please wait while we fetch your data
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-gray-100">
            <Archive size={32} className="text-gray-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Archived Items</h1>
            <p className="text-gray-500 mt-1">
              Manage and restore archived products, transactions, and records
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Products</p>
              <p className="text-2xl font-bold text-blue-800">
                {typeStats.products}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Tag size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600">Transactions</p>
              <p className="text-2xl font-bold text-green-800">
                {typeStats.transactions}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ExternalLink size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-purple-600">Suppliers</p>
              <p className="text-2xl font-bold text-purple-800">
                {typeStats.suppliers}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <User size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-orange-600">Employees</p>
              <p className="text-2xl font-bold text-orange-800">
                {typeStats.employees}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-4 p-4 mb-6 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="font-semibold text-gray-800 flex-grow">
            {selectedItems.length} selected
          </p>
          <button
            onClick={handleBulkRestoreSelected}
            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200 transition-colors"
          >
            <RotateCcw size={16} /> Restore Selected
          </button>
          <button
            onClick={handleBulkDeleteSelected}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-colors"
          >
            <Trash2 size={16} /> Delete Permanently
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 py-4 border-t border-b border-gray-200 mb-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search archived items..."
              value={searchInput}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={handleFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="product">Products</option>
            <option value="transaction">Transactions</option>
            <option value="supplier">Suppliers</option>
            <option value="employee">Employees</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter size={16} />
            More Filters
          </button>
          {archivedItems.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <CheckCircle size={16} />
              {selectedItems.length === archivedItems.length
                ? "Deselect All"
                : "Select All"}
            </button>
          )}
        </div>
      </div>

      {/* Archived Items */}
      {archivedItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archivedItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="p-2 bg-gray-50 rounded-lg">
                    {getTypeIcon(item.type)}
                  </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <MoreVertical size={16} />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 flex-1">
                    {item.name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadgeColor(
                      item.type
                    )}`}
                  >
                    {item.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{item.description}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar size={14} />
                    Archived: {item.archivedDate}
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <User size={14} />
                    By: {item.archivedBy}
                  </div>
                  {!!item.originalStock && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Package size={14} />
                      Stock: {item.originalStock} units
                    </div>
                  )}
                  {!!item.amount && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Tag size={14} />
                      Amount: {item.amount}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-500 mb-3">
                  <strong>Reason:</strong> {item.reason}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSingleRestore(item.id, item.type)}
                    className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 flex-1 transition-colors"
                  >
                    <RotateCcw size={14} />
                    Restore
                  </button>
                  <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleSingleDelete(item.id, item.type)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Archive size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No archived items found
          </h3>
          <p className="text-gray-500 mb-6">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Pagination */}
      {archivedItems.length > 0 && (
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {archivedItems.length} of{" "}
            {stats.total || archivedItems.length} archived items
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              Previous
            </button>
            <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              1
            </button>
            <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
