import React, { useState } from "react";
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
  AlertCircle,
  Loader,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  useArchivedItems,
  useRestoreArchivedProduct,
  usePermanentlyDeleteArchivedItem,
  useSearchArchivedItems,
} from "../hooks/useArchive.js";
import { useNotification } from "../hooks/useNotification.js";
import { formatCurrency } from "../utils/formatters.js";

export default function Archived() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedItems, setSelectedItems] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'restore' or 'delete'
  const [selectedItem, setSelectedItem] = useState(null);

  const { addNotification } = useNotification();
  
  // Use real data hooks
  const { data: allArchivedItems = [], isLoading, error, refetch } = useArchivedItems();
  const { data: searchResults = [] } = useSearchArchivedItems(searchTerm);
  const restoreProduct = useRestoreArchivedProduct();
  const permanentlyDelete = usePermanentlyDeleteArchivedItem();

  // Use search results if searching, otherwise use all archived items
  const archivedItems = searchTerm ? searchResults : allArchivedItems;

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
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "transaction":
        return "bg-green-50 text-green-700 border border-green-200";
      case "supplier":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "employee":
        return "bg-orange-50 text-orange-700 border border-orange-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const filteredItems = archivedItems.filter((item) => {
    const matchesFilter = filterType === "all" || item.type === filterType;
    return matchesFilter;
  });

  const handleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  const handleSingleAction = (item, action) => {
    setSelectedItem(item);
    setActionType(action);
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedItem || !actionType) return;

    try {
      if (actionType === 'restore') {
        await restoreProduct.mutateAsync(selectedItem.id);
        addNotification(`"${selectedItem.name}" has been restored successfully`, "success");
      } else if (actionType === 'delete') {
        await permanentlyDelete.mutateAsync(selectedItem.id);
        addNotification(`"${selectedItem.name}" has been permanently deleted`, "success");
      }
    } catch (error) {
      addNotification(`Failed to ${actionType} item: ${error.message}`, "error");
    } finally {
      setShowConfirmModal(false);
      setSelectedItem(null);
      setActionType(null);
    }
  };

  const handleBulkRestore = async () => {
    try {
      for (const itemId of selectedItems) {
        await restoreProduct.mutateAsync(itemId);
      }
      addNotification(`${selectedItems.length} items restored successfully`, "success");
      setSelectedItems([]);
    } catch (error) {
      addNotification(`Failed to restore items: ${error.message}`, "error");
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const itemId of selectedItems) {
        await permanentlyDelete.mutateAsync(itemId);
      }
      addNotification(`${selectedItems.length} items permanently deleted`, "success");
      setSelectedItems([]);
    } catch (error) {
      addNotification(`Failed to delete items: ${error.message}`, "error");
    }
  };

  const typeStats = {
    products: archivedItems.filter((item) => item.type === "product").length,
    transactions: archivedItems.filter((item) => item.type === "transaction").length,
    suppliers: archivedItems.filter((item) => item.type === "supplier").length,
    employees: archivedItems.filter((item) => item.type === "employee").length,
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading archived items...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex items-center justify-center py-12">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <span className="ml-3 text-red-600">Error loading archived items: {error.message}</span>
          <button 
            onClick={() => refetch()} 
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
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
          <button className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200">
            <RotateCcw size={16} /> Restore
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200">
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
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
        </div>
      </div>

      {/* Archived Items */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
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
                  <button className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 flex-1">
                    <RotateCcw size={14} />
                    Restore
                  </button>
                  <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                    <Eye size={16} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
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
      {filteredItems.length > 0 && (
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {filteredItems.length} of {archivedItems.length} archived
            items
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
