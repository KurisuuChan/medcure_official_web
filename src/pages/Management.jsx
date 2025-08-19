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
import { formatCurrency, formatStockStatus } from "../utils/formatters.js";
import { useNotification } from "../hooks/useNotification.js";

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
  // Handle viewing product
  const handleViewProduct = (product) => {
    setViewingProduct(product);
    setShowViewModal(true);
  };

  // Real backend hooks
  const { data: products = [], isLoading, error, refetch } = useProducts();
  const { data: searchResults = [] } = useSearchProducts(searchTerm);
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const archiveProduct = useArchiveProduct();
  const bulkAddProducts = useBulkAddProducts();
  const { addNotification } = useNotification();

  // Use search results if searching, otherwise use all products
  const displayProducts = searchTerm.length >= 2 ? searchResults : products;

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

  // Handle adding new product
  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  // Handle editing product
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  // Handle product save (add or update)
  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          updates: productData,
        });
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

  // Handle product archiving
  const handleArchiveProduct = (product) => {
    setProductToArchive(product);
    setShowArchiveModal(true);
  };

  const confirmArchiveProduct = async (reason) => {
    if (!productToArchive) return;

    try {
      await archiveProduct.mutateAsync({
        product: productToArchive,
        reason,
        archivedBy: "Admin User",
      });
      addNotification(
        `"${productToArchive.name}" has been archived successfully`,
        "success"
      );
      setSelectedItems((prev) =>
        prev.filter((id) => id !== productToArchive.id)
      );
    } catch (error) {
      addNotification(error.message || "Failed to archive product", "error");
    }
  };

  // Handle bulk operations
  const handleBulkArchive = () => {
    if (selectedItems.length === 0) return;
    setShowBulkArchiveModal(true);
  };

  const confirmBulkArchive = async (reason) => {
    if (selectedItems.length === 0) return;

    try {
      const selectedProducts = products.filter((product) =>
        selectedItems.includes(product.id)
      );
      await Promise.all(
        selectedProducts.map((product) =>
          archiveProduct.mutateAsync({
            product,
            reason: `Bulk: ${reason}`,
            archivedBy: "Admin User",
          })
        )
      );
      addNotification(
        `${selectedItems.length} products archived successfully`,
        "success"
      );
      setSelectedItems([]);
    } catch {
      addNotification("Failed to archive some products", "error");
    }
  };

  // Handle CSV import
  const handleImport = async (productsData) => {
    try {
      await bulkAddProducts.mutateAsync(productsData);
      addNotification(
        `${productsData.length} products imported successfully`,
        "success"
      );
      setShowImportModal(false);
    } catch (error) {
      addNotification(error.message || "Failed to import products", "error");
    }
  };

  // Handle export - open export modal
  const handleExport = () => {
    setShowExportModal(true);
  };

  if (error) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Failed to Load Products
          </h3>
          <p className="text-gray-500 mb-6">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
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
            onClick={handleBulkArchive}
            disabled={archiveProduct.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-semibold hover:bg-orange-200 disabled:opacity-50"
          >
            <Archive size={16} />
            {archiveProduct.isPending ? "Archiving..." : "Archive Selected"}
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
            Export
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

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <Loader
            size={48}
            className="mx-auto mb-4 text-blue-500 animate-spin"
          />
          <p className="text-gray-600">Loading products...</p>
        </div>
      )}

      {/* Content */}
      {!isLoading && displayProducts.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayProducts.map((product) => {
              const stockStatus = formatStockStatus(product.stock);
              return (
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
                        <p className="font-semibold">{product.stock} pcs</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Cost Price</p>
                        <p className="font-semibold">
                          {product.cost_price
                            ? formatCurrency(product.cost_price)
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Selling Price</p>
                        <p className="font-semibold">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Variants</p>
                        <p className="font-semibold">
                          {product.pieces_per_sheet}x{product.sheets_per_box}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.bgColor} ${stockStatus.color}`}
                      >
                        {stockStatus.text}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleViewProduct(product)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-blue-600 rounded-lg text-sm hover:bg-blue-200"
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
                        className="flex items-center justify-center gap-2 px-3 py-2 border border-orange-300 text-orange-600 rounded-lg text-sm hover:bg-orange-50"
                      >
                        <Archive size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedItems.length === displayProducts.length &&
                        displayProducts.length > 0
                      }
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
                {displayProducts.map((product) => {
                  const stockStatus = formatStockStatus(product.stock);
                  return (
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
                              {product.manufacturer || "No manufacturer"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {product.category}
                      </td>
                      <td className="py-4 px-4 text-center text-sm font-semibold">
                        <span className={stockStatus.color}>
                          {product.stock} pcs
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-medium">
                        {product.cost_price
                          ? formatCurrency(product.cost_price)
                          : "N/A"}
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-medium">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.bgColor} ${stockStatus.color}`}
                        >
                          {stockStatus.text}
                        </span>
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
                            className="p-2 text-gray-400 hover:text-orange-600 rounded-lg hover:bg-orange-50"
                          >
                            <Archive size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : !isLoading ? (
        <div className="text-center py-12">
          <PackageX size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {searchTerm ? "No products found" : "No products yet"}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Start by adding your first product to the inventory"}
          </p>
          <button
            onClick={handleAddProduct}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            Add Your First Product
          </button>
        </div>
      ) : null}

      {/* Modals */}
      <ViewProductModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setViewingProduct(null);
        }}
        product={viewingProduct}
      />
      <ProductModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(null);
        }}
        onSubmit={handleSaveProduct}
        product={editingProduct}
        categories={[
          "Prescription Drugs",
          "Over-the-Counter",
          "Vitamins & Supplements",
          "Personal Care",
          "Medical Devices",
          "First Aid",
          "Baby Care",
          "Other",
        ]}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
        isLoading={bulkAddProducts.isPending}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        products={displayProducts}
      />

      <ArchiveReasonModal
        isOpen={showArchiveModal}
        onClose={() => {
          setShowArchiveModal(false);
          setProductToArchive(null);
        }}
        onConfirm={confirmArchiveProduct}
        product={productToArchive}
        isLoading={archiveProduct.isPending}
      />

      <ArchiveReasonModal
        isOpen={showBulkArchiveModal}
        onClose={() => {
          setShowBulkArchiveModal(false);
        }}
        onConfirm={confirmBulkArchive}
        product={{
          name: `${selectedItems.length} Selected Products`,
          total_stock: selectedItems.length,
          category: "Multiple Categories",
        }}
        isLoading={archiveProduct.isPending}
      />
    </div>
  );
}
