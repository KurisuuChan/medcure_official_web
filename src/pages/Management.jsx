import React, { useState } from "react";
import {
  Plus,
  Upload,
  Download,
  Archive,
  Search,
  Filter,
  Package,
  Eye,
  Edit,
  Grid3X3,
  List,
  MoreVertical,
  PackageX,
  Settings,
} from "lucide-react";
import { useProducts } from "../hooks/useProducts.js";
import { getCategories } from "../services/productService.js";
import { ProductModal } from "../components/modals/ProductModal.jsx";
import { ProductViewModal } from "../components/modals/ProductViewModal.jsx";
import { ImportModal } from "../components/modals/ImportModal.jsx";
import { ExportModal } from "../components/modals/ExportModal.jsx";
import { FilterModal } from "../components/modals/FilterModal.jsx";
import { BulkActionsModal } from "../components/modals/BulkActionsModal.jsx";
import {
  ConfirmationModal,
  ArchiveProductModal,
} from "../components/modals/ConfirmationModal.jsx";
import { exportProductsToCSV } from "../utils/csvUtils.js";
import {
  generateProductCatalogPDF,
  generateLowStockReportPDF,
  generateInventoryValuationPDF,
} from "../utils/pdfUtils.js";
import { useNotification } from "../hooks/useNotification.js";

export default function Management() {
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showProductViewModal, setShowProductViewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showBulkActionsModal, setShowBulkActionsModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [productToArchive, setProductToArchive] = useState(null);
  const [categories, setCategories] = useState([]);
  const [currentFilters, setCurrentFilters] = useState({});
  const { addNotification } = useNotification();

  // Use products hook
  const {
    products,
    loading,
    error,
    addProduct,
    updateProduct,
    archiveProduct,
    importProductsFromCSV,
    applyFilters,
    getInventoryStats,
    refresh,
  } = useProducts();

  // Load categories
  React.useEffect(() => {
    const loadCategories = async () => {
      const { data } = await getCategories();
      if (data) {
        setCategories(data);
      }
    };
    loadCategories();
  }, []);

  // Combine search term with applied filters
  const allFilters = {
    ...currentFilters,
    search: searchTerm,
  };

  // Filter products based on search term and filters
  // The backend filtering is done in the useProducts hook via applyFilters
  // This is additional client-side filtering for immediate feedback
  const filteredProducts = products.filter((product) => {
    // If we have a search term, filter by it
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search) ||
        (product.generic_name &&
          product.generic_name.toLowerCase().includes(search));

      if (!matchesSearch) return false;
    }

    return true;
  });

  // Effect to apply backend filters when search term or filters change
  React.useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm || Object.keys(currentFilters).length > 0) {
        applyFilters(allFilters);
      }
      // Only clear selection if we actually have a search term or filters applied
      if (searchTerm || Object.keys(currentFilters).length > 0) {
        setSelectedItems([]);
      }
    }, 300); // Debounce search

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, currentFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    console.log("🔧 handleSelectAll called");
    console.log("🔧 Current selectedItems:", selectedItems);
    console.log("🔧 Current filteredProducts:", filteredProducts.length);
    console.log(
      "🔧 filteredProducts IDs:",
      filteredProducts.map((p) => p.id)
    );

    if (selectedItems.length === filteredProducts.length) {
      // If all are selected, deselect all
      console.log("🔧 Deselecting all items");
      setSelectedItems([]);
    } else {
      // If not all are selected, select all visible products
      const allIds = filteredProducts.map((product) => product.id);
      console.log("🔧 Selecting all items:", allIds);
      setSelectedItems(allIds);
    }
  };

  const isAllSelected =
    filteredProducts.length > 0 &&
    selectedItems.length === filteredProducts.length;
  const isIndeterminate =
    selectedItems.length > 0 && selectedItems.length < filteredProducts.length;

  // Debug logging
  React.useEffect(() => {
    console.log("Selection debug:", {
      selectedItems: selectedItems.length,
      filteredProducts: filteredProducts.length,
      isAllSelected,
      isIndeterminate,
    });
  }, [selectedItems, filteredProducts, isAllSelected, isIndeterminate]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleViewProduct = (product) => {
    setViewingProduct(product);
    setShowProductViewModal(true);
  };

  const handleArchiveProduct = (product) => {
    setProductToArchive(product);
    setShowArchiveModal(true);
  };

  const handleConfirmArchive = async () => {
    if (productToArchive) {
      await archiveProduct(productToArchive.id);
      setProductToArchive(null);
      setShowArchiveModal(false);
    }
  };

  const handleBulkActions = () => {
    setShowBulkActionsModal(true);
  };

  const handleBulkUpdate = async (selectedProducts, updateData) => {
    // Update each selected product
    for (const productId of selectedProducts) {
      await updateProduct(productId, updateData);
    }
    setSelectedItems([]);
    addNotification(
      `${selectedProducts.length} products updated successfully`,
      "success"
    );
  };

  const handleApplyFilters = (filters) => {
    setCurrentFilters(filters);
    applyFilters(filters);
  };

  const handleProductSubmit = async (productData) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
    } else {
      await addProduct(productData);
    }
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const handleBulkArchive = async () => {
    for (const id of selectedItems) {
      await archiveProduct(id);
    }
    setSelectedItems([]);
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleImport = async (productsArray) => {
    const result = await importProductsFromCSV(productsArray);
    setShowImportModal(false);
    return result;
  };

  const getStatusBadge = (status, stock, criticalLevel = 10) => {
    if (stock === 0) {
      return (
        <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
          Out of Stock
        </span>
      );
    } else if (stock <= criticalLevel) {
      return (
        <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded-full">
          Low Stock
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
          Available
        </span>
      );
    }
  };

  const inventoryStats = getInventoryStats();

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-100">
            <Package size={32} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Product Management
            </h1>
            <p className="text-gray-500 mt-1">
              Manage your pharmacy's inventory and product catalog
            </p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-4 p-4 mb-6 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="font-semibold text-blue-800 flex-grow">
            {selectedItems.length} selected
          </p>
          <button
            onClick={handleBulkActions}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200"
          >
            <Settings size={16} /> Bulk Actions
          </button>
          <button
            onClick={handleBulkArchive}
            className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-semibold hover:bg-orange-200"
          >
            <Archive size={16} /> Archive Selected
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
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilterModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter size={16} />
            Filters
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${
                viewMode === "grid" ? "bg-white shadow" : "hover:bg-gray-200"
              }`}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${
                viewMode === "list" ? "bg-white shadow" : "hover:bg-gray-200"
              }`}
            >
              <List size={16} />
            </button>
          </div>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download size={16} />
            Import
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Upload size={16} />
            Export PDF
          </button>
          <button
            onClick={handleAddProduct}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            Add Product
          </button>
        </div>
      </div>

      {/* Content */}
      {filteredProducts.length > 0 ? (
        viewMode === "grid" ? (
          <>
            {/* Grid view header with select all */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  {selectedItems.length > 0
                    ? `${selectedItems.length} of ${filteredProducts.length} selected`
                    : `Select all ${filteredProducts.length} products`}
                </span>
                {selectedItems.length > 0 && (
                  <button
                    onClick={() => setSelectedItems([])}
                    className="text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Clear selection
                  </button>
                )}
              </div>
              {selectedItems.length > 0 && (
                <button
                  onClick={handleBulkActions}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Settings size={14} />
                  Bulk Actions ({selectedItems.length})
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(product.id)}
                        onChange={() => handleSelectItem(product.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {product.name.charAt(0)}
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical size={20} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {product.category}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Stock</p>
                        <p className="font-semibold">
                          {product.total_stock} units
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Cost Price</p>
                        <p className="font-semibold">
                          ₱{product.cost_price.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Selling Price</p>
                        <p className="font-semibold">
                          ₱{product.selling_price.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Expiry</p>
                        <p className="font-semibold">
                          {product.expiry_date || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      {getStatusBadge(
                        product.status,
                        product.total_stock,
                        product.critical_level
                      )}
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleViewProduct(product)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleArchiveProduct(product)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                      >
                        <Archive size={14} />
                        Archive
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Table view header with selection info */}
            {selectedItems.length > 0 && (
              <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-blue-700">
                    {selectedItems.length} of {filteredProducts.length} products
                    selected
                  </span>
                  <button
                    onClick={() => setSelectedItems([])}
                    className="text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Clear selection
                  </button>
                </div>
                <button
                  onClick={handleBulkActions}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Settings size={14} />
                  Bulk Actions ({selectedItems.length})
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 text-left">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = isIndeterminate;
                        }}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">
                      Product
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-500">
                      Category
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-gray-500">
                      Stock
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-500">
                      Cost
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-500">
                      Price
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-gray-500">
                      Status
                    </th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(product.id)}
                          onChange={() => handleSelectItem(product.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {product.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {product.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {product.supplier}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {product.category}
                      </td>
                      <td className="py-4 px-4 text-center text-sm font-semibold">
                        <span
                          className={(() => {
                            if (product.total_stock === 0)
                              return "text-red-600";
                            if (
                              product.total_stock <=
                              (product.critical_level || 10)
                            )
                              return "text-orange-600";
                            return "text-gray-800";
                          })()}
                        >
                          {product.total_stock}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-medium">
                        ₱{product.cost_price.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-medium">
                        ₱{product.selling_price.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {getStatusBadge(
                          product.status,
                          product.total_stock,
                          product.critical_level
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewProduct(product)}
                            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleArchiveProduct(product)}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          >
                            <Archive size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      ) : (
        <div className="text-center py-12">
          <PackageX size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No products found
          </h3>
          <p className="text-gray-500 mb-6">
            Try adjusting your search or filters
          </p>
          <button className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={16} />
            Add Your First Product
          </button>
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(null);
        }}
        onSubmit={handleProductSubmit}
        product={editingProduct}
        categories={categories}
      />

      <ProductViewModal
        isOpen={showProductViewModal}
        onClose={() => {
          setShowProductViewModal(false);
          setViewingProduct(null);
        }}
        onEdit={handleEditProduct}
        product={viewingProduct}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        products={filteredProducts.length > 0 ? filteredProducts : products}
      />

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        categories={categories}
        currentFilters={currentFilters}
      />

      <BulkActionsModal
        isOpen={showBulkActionsModal}
        onClose={() => setShowBulkActionsModal(false)}
        selectedProducts={selectedItems}
        onBulkUpdate={handleBulkUpdate}
        onBulkArchive={handleBulkArchive}
        categories={categories}
      />

      <ArchiveProductModal
        isOpen={showArchiveModal}
        onClose={() => {
          setShowArchiveModal(false);
          setProductToArchive(null);
        }}
        onConfirm={handleConfirmArchive}
        productName={productToArchive?.name || ""}
      />
    </div>
  );
}
