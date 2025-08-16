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
  Trash2,
  Grid3X3,
  List,
  MoreVertical,
  PackageX,
} from "lucide-react";

export default function Management() {
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  // Mock data - replace with real data from API
  const products = [
    {
      id: 1,
      name: "Amoxicillin 500mg",
      category: "Antibiotics",
      stock: 150,
      cost: 45.5,
      price: 85.0,
      expiry: "2025-08-15",
      status: "Available",
      supplier: "PharmaCorp Inc.",
    },
    {
      id: 2,
      name: "Paracetamol 500mg",
      category: "Pain Relief",
      stock: 8,
      cost: 12.25,
      price: 25.0,
      expiry: "2025-12-01",
      status: "Low Stock",
      supplier: "MediSupply Co.",
    },
    {
      id: 3,
      name: "Vitamin C 1000mg",
      category: "Vitamins",
      stock: 0,
      cost: 28.75,
      price: 55.0,
      expiry: "2026-03-20",
      status: "Out of Stock",
      supplier: "HealthMax Ltd.",
    },
    {
      id: 4,
      name: "Ibuprofen 200mg",
      category: "Pain Relief",
      stock: 75,
      cost: 18.5,
      price: 42.0,
      expiry: "2025-10-10",
      status: "Available",
      supplier: "PharmaCorp Inc.",
    },
    {
      id: 5,
      name: "Aspirin 81mg",
      category: "Cardiovascular",
      stock: 120,
      cost: 8.25,
      price: 18.0,
      expiry: "2025-11-30",
      status: "Available",
      supplier: "CardioMed Supply",
    },
  ];

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status, stock) => {
    if (stock === 0) {
      return (
        <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
          Out of Stock
        </span>
      );
    } else if (stock < 10) {
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
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-semibold hover:bg-orange-200">
            <Archive size={16} /> Archive Selected
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200">
            <Trash2 size={16} /> Delete
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
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
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

          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download size={16} />
            Import
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Upload size={16} />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={16} />
            Add Product
          </button>
        </div>
      </div>

      {/* Content */}
      {filteredProducts.length > 0 ? (
        viewMode === "grid" ? (
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
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Stock</p>
                      <p className="font-semibold">{product.stock} units</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Cost Price</p>
                      <p className="font-semibold">
                        ₱{product.cost.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Selling Price</p>
                      <p className="font-semibold">
                        ₱{product.price.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Expiry</p>
                      <p className="font-semibold">{product.expiry}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {getStatusBadge(product.status, product.stock)}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                      <Eye size={14} />
                      View
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                      <Edit size={14} />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-left">
                    <input
                      type="checkbox"
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
                        className={
                          product.stock === 0
                            ? "text-red-600"
                            : product.stock < 10
                            ? "text-orange-600"
                            : "text-gray-800"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right text-sm font-medium">
                      ₱{product.cost.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right text-sm font-medium">
                      ₱{product.price.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {getStatusBadge(product.status, product.stock)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </div>
  );
}
