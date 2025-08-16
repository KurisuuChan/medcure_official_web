import React, { useState } from "react";
import { useNotification } from "@/hooks/useNotification";
import { usePOS } from "../hooks/usePOS.js";
import { useProducts } from "../hooks/useProducts.js";
import { QuantitySelectionModal } from "../components/modals/QuantitySelectionModal.jsx";
import { TransactionHistoryModal } from "../components/modals/TransactionHistoryModal.jsx";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  X,
  Receipt,
  Package,
  User,
  Clock,
  CheckCircle,
  Settings,
} from "lucide-react";

export default function POS() {
  const { addNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Use hooks for data management
  const { products } = useProducts();
  const {
    cart,
    discount,
    isPwdSenior,
    addToCart,
    updateQuantity,
    removeFromCart,
    processSale,
    setDiscount,
    setIsPwdSenior,
    calculateTotals,
  } = usePOS();

  // Get unique categories from products
  const categories = ["all", ...new Set(products.map((p) => p.category))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.total_stock > 0;
  });

  const openQuantityModal = (product) => {
    setSelectedProduct(product);
    setShowQuantityModal(true);
  };

  const closeQuantityModal = () => {
    setShowQuantityModal(false);
    setSelectedProduct(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      addNotification("Cart is empty", "warning");
      return;
    }

    try {
      const result = await processSale();
      if (result.success) {
        addNotification("Sale completed successfully!", "success");
        console.log("Sale completed:", result.data);
      } else {
        addNotification(result.error || "Failed to process sale", "error");
      }
    } catch (error) {
      addNotification("Error processing sale: " + error.message, "error");
      console.error("Sale processing error:", error);
    }
  };

  const getStockStatus = (stock, criticalLevel = 10) => {
    if (stock <= 5)
      return { color: "text-red-600", bg: "bg-red-50", text: "Critical" };
    if (stock <= criticalLevel)
      return { color: "text-orange-600", bg: "bg-orange-50", text: "Low" };
    return { color: "text-green-600", bg: "bg-green-50", text: "Good" };
  };

  const totals = calculateTotals();

  const addToCartHandler = (product) => {
    openQuantityModal(product);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-100">
            <ShoppingCart size={32} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Point of Sale</h1>
            <p className="text-gray-500 mt-1">
              Process sales and manage transactions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTransactionHistory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Clock size={16} />
            Transaction History
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Product Search & Listing */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search products by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>
          </div>

          {/* Product Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(
                product.total_stock,
                product.critical_level
              );
              const inCart = cart.find((item) => item.id === product.id);

              return (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package size={24} className="text-gray-400" />
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.bg} ${stockStatus.color}`}
                    >
                      {stockStatus.text}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Stock: {product.total_stock} pieces
                  </p>

                  {/* Packaging Info */}
                  <div className="text-xs text-gray-400 mb-3 space-y-1">
                    <p>📦 {product.total_pieces_per_box} pcs/box</p>
                    <p>📄 {product.pieces_per_sheet} pcs/sheet</p>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-blue-600">
                      ₱{product.selling_price.toFixed(2)}
                    </span>
                    {inCart && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {inCart.quantity} in cart
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => addToCartHandler(product)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                  >
                    <Settings size={16} />
                    Select Quantity
                  </button>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <Package size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No products found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or category filter
              </p>
            </div>
          )}
        </div>

        {/* Cart & Checkout */}
        <div className="space-y-6">
          {/* Cart Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Cart Summary
              </h3>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {totals.itemCount} items
              </span>
            </div>

            {cart.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {item.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        ₱{item.selling_price.toFixed(2)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="p-1 text-gray-400 hover:text-green-600 rounded"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Cart is empty</p>
              </div>
            )}

            {/* Discount and PWD/Senior */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="regular-discount"
                  className="text-sm font-medium text-gray-700"
                >
                  Discount %:
                </label>
                <input
                  id="regular-discount"
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) =>
                    setDiscount(
                      Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                    )
                  }
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <User size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-purple-800">
                      PWD/Senior Citizen
                    </p>
                    <p className="text-sm text-purple-600">
                      20% discount automatically applied
                    </p>
                  </div>
                </div>
                <label
                  htmlFor="pwd-senior-toggle"
                  className="relative inline-flex items-center cursor-pointer"
                  aria-label="Toggle PWD/Senior Citizen discount"
                >
                  <input
                    id="pwd-senior-toggle"
                    type="checkbox"
                    checked={isPwdSenior}
                    onChange={(e) => setIsPwdSenior(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span>₱{totals.subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Regular Discount ({discount}%):
                  </span>
                  <span className="text-red-600">
                    -₱{totals.regularDiscountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              {isPwdSenior && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    PWD/Senior Discount (20%):
                  </span>
                  <span className="text-purple-600">
                    -₱{totals.pwdSeniorDiscount.toFixed(2)}
                  </span>
                </div>
              )}
              {totals.totalDiscount > 0 && (
                <div className="flex justify-between text-sm font-medium border-t border-gray-100 pt-2">
                  <span className="text-gray-700">Total Savings:</span>
                  <span className="text-green-600">
                    -₱{totals.totalDiscount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span>Total:</span>
                <span className="text-blue-600">
                  ₱{totals.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-lg font-semibold text-lg transition-all ${
              cart.length > 0
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <CheckCircle size={20} />
            Complete Sale - ₱{totals.total.toFixed(2)}
          </button>

          {cart.length > 0 && (
            <button className="w-full flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              <Receipt size={18} />
              Print Receipt
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      <QuantitySelectionModal
        isOpen={showQuantityModal}
        onClose={closeQuantityModal}
        product={selectedProduct}
        onAddToCart={addToCart}
      />

      <TransactionHistoryModal
        isOpen={showTransactionHistory}
        onClose={() => setShowTransactionHistory(false)}
      />
    </div>
  );
}
