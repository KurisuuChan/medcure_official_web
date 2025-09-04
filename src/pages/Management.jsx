import React, { useState } from "react";
import {
  Plus,
  Upload,
  Download,
  Search,
  Package,
  Edit,
  Archive,
  Grid3X3,
  List,
  MoreVertical,
  PackageX,
  AlertCircle,
  Loader,
  Eye,
  ShoppingCart,
  RotateCcw,
  Filter,
  ChevronDown,
} from "lucide-react";

// Import real backend hooks and components
import {
  useProducts,
  useAddProduct,
  useUpdateProduct,
  useBulkAddProducts,
  useSearchProducts,
} from "../hooks/useProducts.js";
import { useArchiveProduct } from "../hooks/useArchive.js";
import ProductModal from "../components/modals/ProductModal.jsx";
import ImportModal from "../components/modals/ImportModal.jsx";
import ExportModal from "../components/ExportModal.jsx";
import ArchiveReasonModal from "../components/modals/ArchiveReasonModal.jsx";
import ViewProductModal from "../components/modals/ViewProductModal.jsx";
import BulkStockUpdateModal from "../components/modals/BulkStockUpdateModal.jsx";
import StockReorderSuggestions from "../components/modals/StockReorderSuggestions.jsx";
import { formatCurrency } from "../utils/formatters.js";
import { useNotification } from "../hooks/useNotification.js";
import { normalizeProductData, getStockStatus, getExpiryStatus } from "../services/stockService.js";

export default function Management() {
  const [viewMode, setViewMode] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showBulkArchiveModal, setShowBulkArchiveModal] = useState(false);
  const [productToArchive, setProductToArchive] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [showBulkStockModal, setShowBulkStockModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    category: "all",
    status: "all",
    expiry: "all"
  });
  
  const handleViewProduct = (product) => {
    setViewingProduct(product);
    setShowViewModal(true);
  };

  const { data: products = [], isLoading, error, refetch } = useProducts();
  const { data: searchResults = [] } = useSearchProducts(searchTerm);
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const archiveProduct = useArchiveProduct();
  const bulkAddProducts = useBulkAddProducts();
  const { addNotification } = useNotification();

  const getFilteredProducts = () => {
    let filtered = searchTerm.length >= 2 ? searchResults : products;
    
    if (activeFilters.category !== "all") {
      filtered = filtered.filter(product => 
        product.category?.toLowerCase() === activeFilters.category.toLowerCase()
      );
    }
    
    if (activeFilters.status !== "all") {
      filtered = filtered.filter(product => {
        const normalizedProduct = normalizeProductData(product);
        const stockStatus = getStockStatus(normalizedProduct);
        return stockStatus.status === activeFilters.status;
      });
    }
    
    if (activeFilters.expiry !== "all") {
      filtered = filtered.filter(product => {
        const normalizedProduct = normalizeProductData(product);
        const expiryStatus = getExpiryStatus(normalizedProduct);
        return activeFilters.expiry === "critical" 
          ? (expiryStatus.status === "expired" || expiryStatus.status === "critical")
          : expiryStatus.status === activeFilters.expiry;
      });
    }
    
    return filtered;
  };

  const displayProducts = getFilteredProducts();
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => ({ ...prev, [filterType]: value }));
    setShowFilterDropdown(false);
  };

  const clearFilters = () => {
    setActiveFilters({ category: "all", status: "all", expiry: "all" });
  };

  const activeFilterCount = Object.values(activeFilters).filter(v => v !== "all").length;

  const handleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === displayProducts.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(displayProducts.map((p) => p.id));
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, updates: productData });
        addNotification("Product updated successfully", "success");
      } else {
        await addProduct.mutateAsync(productData);
        addNotification("Product added successfully", "success");
      }
      setShowProductModal(false);
      setEditingProduct(null);
    } catch (error) {
      addNotification(error.message || "Failed to save product", "error");
    }
  };

  const handleArchiveProduct = (product) => {
    setProductToArchive(product);
    setShowArchiveModal(true);
  };

  const confirmArchiveProduct = async (reason) => {
    if (!productToArchive) return;
    try {
      await archiveProduct.mutateAsync({ product: productToArchive, reason, archivedBy: "Admin User" });
      addNotification(`"${productToArchive.name}" has been archived successfully`, "success");
      setSelectedItems((prev) => prev.filter((id) => id !== productToArchive.id));
    } catch (error) {
      addNotification(error.message || "Failed to archive product", "error");
    }
  };

  const handleBulkArchive = () => {
    if (selectedItems.length === 0) return;
    setShowBulkArchiveModal(true);
  };

  const confirmBulkArchive = async (reason) => {
    if (selectedItems.length === 0) return;
    try {
      const selectedProducts = products.filter((product) => selectedItems.includes(product.id));
      await Promise.all(
        selectedProducts.map((product) =>
          archiveProduct.mutateAsync({ product, reason: `Bulk: ${reason}`, archivedBy: "Admin User" })
        )
      );
      addNotification(`${selectedItems.length} products archived successfully`, "success");
      setSelectedItems([]);
    } catch {
      addNotification("Failed to archive some products", "error");
    }
  };

  const handleImport = async (productsData) => {
    try {
      await bulkAddProducts.mutateAsync(productsData);
      addNotification(`${productsData.length} products imported successfully`, "success");
      setShowImportModal(false);
    } catch (error) {
      addNotification(error.message || "Failed to import products", "error");
    }
  };

  const handleBulkStockUpdate = () => {
    if (selectedItems.length === 0) {
      addNotification("Please select products to update stock", "warning");
      return;
    }
    setShowBulkStockModal(true);
  };

  const handleReorderSuggestions = () => {
    const lowStockProducts = products.filter((p) => p.total_stock <= (p.low_stock_threshold || 10));
    if (lowStockProducts.length === 0) {
      addNotification("All products have adequate stock levels", "info");
      return;
    }
    setShowReorderModal(true);
  };

  const handleExport = () => setShowExportModal(true);

  if (error) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Failed to Load Products</h3>
          <p className="text-gray-500 mb-6">{error.message}</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                <Package size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Product Management</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1 leading-relaxed">Manage your pharmacy's inventory and product catalog</p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <button onClick={handleReorderSuggestions} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 shadow-sm transition-all duration-200 font-medium text-sm">
                <ShoppingCart size={18} />
                <span>Smart Reorder</span>
              </button>
            </div>
          </div>

          {/* Action Bar */}
          {selectedItems.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-2 flex-grow">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <p className="font-semibold text-blue-800">{selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={handleBulkStockUpdate} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm shadow-sm transition-colors">
                  <RotateCcw size={16} /> Update Stock
                </button>
                <button onClick={handleBulkArchive} disabled={archiveProduct.isPending} className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 text-sm shadow-sm transition-colors">
                  <Archive size={16} /> {archiveProduct.isPending ? "Archiving..." : "Archive Selected"}
                </button>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all text-sm"/>
              </div>
              <div className="relative flex-shrink-0">
                <button onClick={() => setShowFilterDropdown(!showFilterDropdown)} className={`flex items-center gap-2 px-4 py-3 border rounded-xl hover:bg-gray-50 font-medium text-sm min-w-[120px] justify-center ${activeFilterCount > 0 ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-300 text-gray-700 bg-white'}`}>
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                  {activeFilterCount > 0 && <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center font-bold">{activeFilterCount}</span>}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 animate-in slide-in-from-top-2 duration-200">
                    <div className="p-5 space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">Category</label>
                        <select value={activeFilters.category} onChange={(e) => handleFilterChange('category', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50">
                          <option value="all">All Categories</option>
                          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">Stock Status</label>
                        <select value={activeFilters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50">
                          <option value="all">All Status</option>
                          <option value="out">🔴 Out of Stock</option>
                          <option value="critical">🟠 Critical Stock</option>
                          <option value="low">🟡 Low Stock</option>
                          <option value="good">🟢 In Stock</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-3">Expiry Status</label>
                        <select value={activeFilters.expiry} onChange={(e) => handleFilterChange('expiry', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50">
                          <option value="all">All Products</option>
                          <option value="critical">⚠️ Critical/Expired</option>
                          <option value="warning">📅 Expiring Soon</option>
                          <option value="good">✅ Good</option>
                        </select>
                      </div>
                      {activeFilterCount > 0 && (
                        <div className="pt-4 border-t border-gray-200">
                          <button onClick={clearFilters} className="w-full px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg font-medium">Clear All Filters</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setViewMode("grid")} className={`p-2.5 rounded-lg ${viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "hover:bg-gray-200 text-gray-600"}`} title="Grid View"><Grid3X3 size={16} /></button>
                <button onClick={() => setViewMode("list")} className={`p-2.5 rounded-lg ${viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "hover:bg-gray-200 text-gray-600"}`} title="List View"><List size={16} /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 text-sm font-medium"><Download size={16} /><span className="hidden sm:inline">Import</span></button>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 text-sm font-medium"><Upload size={16} /><span className="hidden sm:inline">Export</span></button>
                <button onClick={handleAddProduct} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-sm text-sm font-medium"><Plus size={16} />Add Product</button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <Loader size={48} className="mx-auto mb-4 text-blue-500 animate-spin" />
              <p className="text-gray-600">Loading products...</p>
            </div>
          )}

          {/* Content */}
          {!isLoading && displayProducts.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayProducts.map((product) => {
                  const normalizedProduct = normalizeProductData(product);
                  const stockStatus = getStockStatus(normalizedProduct);
                  const expiryStatus = getExpiryStatus(normalizedProduct);
                  const cardBorder = expiryStatus.status === "expired" ? "border-red-200 bg-red-50/30" : expiryStatus.status === "critical" ? "border-orange-200 bg-orange-50/30" : expiryStatus.status === "warning" ? "border-yellow-200 bg-yellow-50/30" : "border-gray-200 hover:border-blue-200";

                  return (
                    <div key={product.id} className={`bg-white border rounded-2xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${cardBorder}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={selectedItems.includes(product.id)} onChange={() => handleSelectItem(product.id)} className="rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"/>
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">{product.name.charAt(0)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${stockStatus.status === "out" ? "bg-red-500" : stockStatus.status === "critical" ? "bg-red-400" : stockStatus.status === "low" ? "bg-yellow-500" : "bg-green-500"}`} title={`Stock: ${stockStatus.status}`}/>
                          <button className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><MoreVertical size={18} /></button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg cursor-help leading-tight" title={normalizedProduct.expiry_date ? `Expires: ${new Date(normalizedProduct.expiry_date).toLocaleDateString()} (${expiryStatus.daysUntilExpiry} days remaining)` : 'No expiry'}>{product.name}</h3>
                          <p className="text-sm text-gray-600 font-medium">{product.category}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500 mb-1">Stock</p>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${stockStatus.status === "out" ? "bg-red-500" : stockStatus.status === "critical" ? "bg-red-400" : stockStatus.status === "low" ? "bg-yellow-500" : "bg-green-500"}`}/>
                              <span className="font-semibold text-gray-900">{normalizedProduct.total_stock || 0}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Cost Price</p>
                            <p className="font-semibold text-gray-900">{product.cost_price ? formatCurrency(product.cost_price) : "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Selling Price</p>
                            <p className="font-semibold text-gray-900">{formatCurrency(product.price)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Status</p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${expiryStatus.status === "expired" ? "bg-red-100 text-red-800" : expiryStatus.status === "critical" ? "bg-orange-100 text-orange-800" : expiryStatus.status === "warning" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                              {expiryStatus.status.charAt(0).toUpperCase() + expiryStatus.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                          <button onClick={() => handleViewProduct(product)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"><Eye size={14} />View</button>
                          <button onClick={() => handleEditProduct(product)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200"><Edit size={14} />Edit</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="py-4 px-4 text-left"><input type="checkbox" checked={selectedItems.length === displayProducts.length && displayProducts.length > 0} onChange={handleSelectAll} className="rounded-md border-gray-300 text-blue-600 focus:ring-blue-500"/></th>
                        <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">Product</th>
                        <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">Category</th>
                        <th className="py-4 px-4 text-center text-sm font-semibold text-gray-700">Stock</th>
                        <th className="py-4 px-4 text-right text-sm font-semibold text-gray-700">Cost</th>
                        <th className="py-4 px-4 text-right text-sm font-semibold text-gray-700">Price</th>
                        <th className="py-4 px-4 text-center text-sm font-semibold text-gray-700">Status</th>
                        <th className="py-4 px-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {displayProducts.map((product) => {
                        const normalizedProduct = normalizeProductData(product);
                        const stockStatus = getStockStatus(normalizedProduct);
                        const expiryStatus = getExpiryStatus(normalizedProduct);
                        const rowClasses = `hover:bg-gray-50 transition-colors ${expiryStatus.status === "expired" ? "bg-red-50/50" : expiryStatus.status === "critical" ? "bg-red-50/30" : expiryStatus.status === "warning" ? "bg-amber-50/30" : ""}`;

                        return (
                          <tr key={product.id} className={rowClasses}>
                            <td className="py-4 px-4"><input type="checkbox" checked={selectedItems.includes(product.id)} onChange={() => handleSelectItem(product.id)} className="rounded-md border-gray-300 text-blue-600 focus:ring-blue-500"/></td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">{product.name.charAt(0)}</div>
                                <div>
                                  <p className="font-semibold text-gray-900 cursor-help" title={normalizedProduct.expiry_date ? `Expires: ${new Date(normalizedProduct.expiry_date).toLocaleDateString()} (${expiryStatus.daysUntilExpiry} days remaining)` : 'No expiry'}>{product.name}</p>
                                  <p className="text-sm text-gray-600">{product.manufacturer || "No manufacturer"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-700 font-medium">{product.category}</td>
                            <td className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${stockStatus.status === "out" ? "bg-red-500" : stockStatus.status === "critical" ? "bg-red-400" : stockStatus.status === "low" ? "bg-yellow-500" : "bg-green-500"}`}/>
                                <span className="text-sm font-semibold text-gray-900">{normalizedProduct.total_stock || 0}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right text-sm font-semibold text-gray-900">{product.cost_price ? formatCurrency(product.cost_price) : "N/A"}</td>
                            <td className="py-4 px-4 text-right text-sm font-semibold text-gray-900">{formatCurrency(product.price)}</td>
                            <td className="py-4 px-4 text-center"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${expiryStatus.status === "expired" ? "bg-red-100 text-red-800" : expiryStatus.status === "critical" ? "bg-orange-100 text-orange-800" : expiryStatus.status === "warning" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>{expiryStatus.status.charAt(0).toUpperCase() + expiryStatus.status.slice(1)}</span></td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => handleViewProduct(product)} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View"><Eye size={16} /></button>
                                <button onClick={() => handleEditProduct(product)} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit size={16} /></button>
                                <button onClick={() => handleArchiveProduct(product)} className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg" title="Archive"><Archive size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            !isLoading && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <PackageX size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">{searchTerm ? `No products match "${searchTerm}". Try adjusting your search or filters.` : "Get started by adding your first product to the inventory."}</p>
                <button onClick={handleAddProduct} className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
                  <Plus size={20} /> Add Your First Product
                </button>
              </div>
            )
          )}

          {/* Modals */}
          <ProductModal
            isOpen={showProductModal}
            onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
            onSubmit={handleSaveProduct}
            product={editingProduct}
            categories={["Prescription Drugs", "Over-the-Counter", "Vitamins & Supplements", "Personal Care", "Medical Devices", "First Aid", "Baby Care", "Other"]}
          />
          <ViewProductModal isOpen={showViewModal} onClose={() => setShowViewModal(false)} product={viewingProduct} />
          <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={handleImport} isLoading={bulkAddProducts.isPending} />
          <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} products={displayProducts} />
          <ArchiveReasonModal
            isOpen={showArchiveModal}
            onClose={() => { setShowArchiveModal(false); setProductToArchive(null); }}
            onConfirm={confirmArchiveProduct}
            product={productToArchive}
            isLoading={archiveProduct.isPending}
          />
          <ArchiveReasonModal
            isOpen={showBulkArchiveModal}
            onClose={() => setShowBulkArchiveModal(false)}
            onConfirm={confirmBulkArchive}
            product={{ name: `${selectedItems.length} Selected Products`, total_stock: selectedItems.length, category: "Multiple Categories" }}
            isLoading={archiveProduct.isPending}
          />
          <BulkStockUpdateModal
            isOpen={showBulkStockModal}
            onClose={() => setShowBulkStockModal(false)}
            products={products.filter((p) => selectedItems.includes(p.id))}
            onUpdateSuccess={() => { refetch(); setSelectedItems([]); }}
          />
          <StockReorderSuggestions isOpen={showReorderModal} onClose={() => setShowReorderModal(false)} products={products} />
        </div>
      </div>
    </div>
  );
}