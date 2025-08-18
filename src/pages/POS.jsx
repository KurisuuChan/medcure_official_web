import React, { useState } from "react";
import { useNotification } from "@/hooks/useNotification";
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
  Box,
  Layers,
  Hash,
  Settings,
} from "lucide-react";

// Import real backend hooks
import { useProducts, useSearchProducts } from "../hooks/useProducts.js";
import { useCreateSale } from "../hooks/useSales.js";
import QuantitySelectionModal from "../components/modals/QuantitySelectionModal.jsx";
import PaymentModal from "../components/modals/PaymentModal.jsx";
import TransactionHistoryModal from "../components/modals/TransactionHistoryModal.jsx";
import { formatCurrency } from "../utils/formatters.js";

export default function POS() {
  const { addNotification } = useNotification();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [discount, setDiscount] = useState(0);
  const [isPwdSenior, setIsPwdSenior] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Real backend hooks
  const {
    data: allProducts = [],
    isLoading: productsLoading,
    error: productsError,
  } = useProducts();
  const { data: searchResults = [] } = useSearchProducts(searchTerm);
  const createSale = useCreateSale();

  // Use search results if searching, otherwise use all products
  const displayProducts = searchTerm.length >= 2 ? searchResults : allProducts;

  // Add missing quantity state for modal
  const [quantityMode, setQuantityMode] = useState({
    boxes: 0,
    sheets: 0,
    pieces: 0,
  });

  // Dynamic categories based on actual products
  const categories = [
    "all",
    ...new Set(allProducts.map((product) => product.category).filter(Boolean)),
  ];

  const filteredProducts = displayProducts.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openQuantityModal = (product) => {
    setSelectedProduct(product);
    setQuantityMode({
      boxes: 0,
      sheets: 0,
      pieces: 0,
    });
    setShowQuantityModal(true);
  };

  const closeQuantityModal = () => {
    setShowQuantityModal(false);
    setSelectedProduct(null);
    setQuantityMode({
      boxes: 0,
      sheets: 0,
      pieces: 0,
    });
  };

  const calculateTotalPieces = (boxes, sheets, pieces, packaging) => {
    // Provide default packaging values if not available
    const defaultPackaging = {
      totalPieces: 1,
      piecesPerSheet: 1,
      ...packaging,
    };

    const piecesFromBoxes = boxes * defaultPackaging.totalPieces;
    const piecesFromSheets = sheets * defaultPackaging.piecesPerSheet;
    return piecesFromBoxes + piecesFromSheets + pieces;
  };

  const addToCartWithQuantity = () => {
    if (!selectedProduct) return;

    const totalPieces = calculateTotalPieces(
      quantityMode.boxes,
      quantityMode.sheets,
      quantityMode.pieces,
      selectedProduct.packaging || { piecesPerSheet: 1, totalPieces: 1 }
    );

    if (totalPieces <= 0) return;

    // Check if product already exists in cart
    const existingItemIndex = cart.findIndex(
      (item) => item.id === selectedProduct.id
    );

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      setCart((prev) =>
        prev.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + totalPieces }
            : item
        )
      );
    } else {
      // Add new item to cart
      const cartItem = {
        id: selectedProduct.id,
        name: selectedProduct.name,
        price: selectedProduct.price || selectedProduct.selling_price || 0,
        quantity: totalPieces,
        stock: selectedProduct.stock || selectedProduct.total_stock || 0,
        variant_info: {
          boxes: quantityMode.boxes,
          sheets: quantityMode.sheets,
          pieces: quantityMode.pieces,
          totalPieces,
        },
      };
      setCart((prev) => [...prev, cartItem]);
    }

    addNotification(`Added ${selectedProduct.name} to cart`, "success");
    closeQuantityModal();
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.min(newQuantity, item.stock) }
          : item
      )
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );
  const pwdSeniorDiscount = isPwdSenior ? subtotal * 0.2 : 0;
  const regularDiscountAmount = (subtotal * discount) / 100;
  const totalDiscount = pwdSeniorDiscount + regularDiscountAmount;
  const total = subtotal - totalDiscount;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      addNotification("Cart is empty", "error");
      return;
    }

    // Open payment modal instead of directly processing sale
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async (paymentData) => {
    try {
      // Prepare sale data for backend
      const saleData = {
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity,
          variant_info: item.variant_info || null, // Include packaging details if available
        })),
        total: total, // Changed from total_amount to total
        payment_method: paymentData.paymentMethod || "cash",
        amount_paid: paymentData.amountPaid || total,
        change_amount: paymentData.changeAmount || 0,
      };

      // Create sale using backend
      const result = await createSale.mutateAsync(saleData);

      addNotification(`Sale completed! Transaction #${result.id}`, "success");

      // Clear cart and reset form
      setCart([]);
      setDiscount(0);
      setIsPwdSenior(false);
      setShowPaymentModal(false);
    } catch (error) {
      console.error("Sale creation failed:", error);
      addNotification("Failed to complete sale. Please try again.", "error");
    }
  };

  const getStockStatus = (stock) => {
    if (stock <= 5)
      return { color: "text-red-600", bg: "bg-red-50", text: "Critical" };
    if (stock <= 20)
      return { color: "text-orange-600", bg: "bg-orange-50", text: "Low" };
    return { color: "text-green-600", bg: "bg-green-50", text: "Good" };
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
            <h1 className="text-3xl font-bold text-gray-800">
              Admin Point of Sale
            </h1>
            <p className="text-gray-500 mt-1">
              Process sales and manage transactions - Admin Interface
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTransactionHistory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

          {/* Loading and Error States */}
          {productsLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading products...</div>
            </div>
          )}

          {productsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              Error loading products: {productsError.message}
            </div>
          )}

          {/* Product Grid */}
          {!productsLoading && !productsError && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => {
                const stockValue = product.stock || product.total_stock || 0;
                const stockStatus = getStockStatus(stockValue);
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
                      Stock: {stockValue} pieces
                    </p>

                    {/* Packaging Info */}
                    {product.packaging && (
                      <div className="text-xs text-gray-400 mb-3 space-y-1">
                        <p>📦 {product.packaging.totalPieces || 1} pcs/box</p>
                        <p>
                          📄 {product.packaging.piecesPerSheet || 1} pcs/sheet
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(
                          product.price || product.selling_price || 0
                        )}
                      </span>
                      {inCart && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {inCart.quantity} in cart
                        </span>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => openQuantityModal(product)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                    >
                      <Settings size={16} />
                      Select Quantity
                    </button>
                  </div>
                );
              })}

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
                {itemCount} items
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
                        ₱{(item.price || 0).toFixed(2)} each
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
                  className="relative inline-flex items-center cursor-pointer"
                  htmlFor="pwd-senior-toggle"
                >
                  <span className="sr-only">PWD/Senior Citizen Discount</span>
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
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Regular Discount ({discount}%):
                  </span>
                  <span className="text-red-600">
                    -₱{regularDiscountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              {isPwdSenior && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    PWD/Senior Discount (20%):
                  </span>
                  <span className="text-purple-600">
                    -₱{pwdSeniorDiscount.toFixed(2)}
                  </span>
                </div>
              )}
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm font-medium border-t border-gray-100 pt-2">
                  <span className="text-gray-700">Total Savings:</span>
                  <span className="text-green-600">
                    -₱{totalDiscount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span>Total:</span>
                <span className="text-blue-600">{formatCurrency(total)}</span>
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
            Complete Sale - {formatCurrency(total)}
          </button>

          {cart.length > 0 && (
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                <Receipt size={18} />
                Print Receipt
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quantity Selection Modal */}
      {showQuantityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Select Quantity
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedProduct?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={closeQuantityModal}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Product Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Available Stock:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {selectedProduct?.stock} pieces
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>
                    • {selectedProduct?.packaging?.piecesPerSheet} pieces per
                    sheet
                  </p>
                  <p>
                    • {selectedProduct?.packaging?.sheetsPerBox} sheets per box
                  </p>
                  <p>
                    • {selectedProduct?.packaging?.totalPieces} pieces per box
                  </p>
                </div>
              </div>

              {/* Quantity Selectors */}
              <div className="space-y-4">
                {/* Boxes */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Box size={20} className="text-blue-600" />
                      <span className="font-semibold text-blue-800">Boxes</span>
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        {selectedProduct?.packaging?.totalPieces} pcs/box
                      </span>
                    </div>
                    <span className="text-sm font-medium text-blue-700">
                      {quantityMode.boxes *
                        (selectedProduct?.packaging?.totalPieces || 0)}{" "}
                      pieces
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setQuantityMode((prev) => ({
                          ...prev,
                          boxes: Math.max(0, prev.boxes - 1),
                        }))
                      }
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={quantityMode.boxes}
                      onChange={(e) =>
                        setQuantityMode((prev) => ({
                          ...prev,
                          boxes: Math.max(0, parseInt(e.target.value) || 0),
                        }))
                      }
                      className="w-20 text-center border border-blue-300 rounded-lg py-2 focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() =>
                        setQuantityMode((prev) => ({
                          ...prev,
                          boxes: prev.boxes + 1,
                        }))
                      }
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Sheets */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Layers size={20} className="text-green-600" />
                      <span className="font-semibold text-green-800">
                        Sheets
                      </span>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        {selectedProduct?.packaging?.piecesPerSheet} pcs/sheet
                      </span>
                    </div>
                    <span className="text-sm font-medium text-green-700">
                      {quantityMode.sheets *
                        (selectedProduct?.packaging?.piecesPerSheet || 0)}{" "}
                      pieces
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setQuantityMode((prev) => ({
                          ...prev,
                          sheets: Math.max(0, prev.sheets - 1),
                        }))
                      }
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={quantityMode.sheets}
                      onChange={(e) =>
                        setQuantityMode((prev) => ({
                          ...prev,
                          sheets: Math.max(0, parseInt(e.target.value) || 0),
                        }))
                      }
                      className="w-20 text-center border border-green-300 rounded-lg py-2 focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={() =>
                        setQuantityMode((prev) => ({
                          ...prev,
                          sheets: prev.sheets + 1,
                        }))
                      }
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Pieces */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Hash size={20} className="text-orange-600" />
                      <span className="font-semibold text-orange-800">
                        Individual Pieces
                      </span>
                    </div>
                    <span className="text-sm font-medium text-orange-700">
                      {quantityMode.pieces} pieces
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setQuantityMode((prev) => ({
                          ...prev,
                          pieces: Math.max(0, prev.pieces - 1),
                        }))
                      }
                      className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={quantityMode.pieces}
                      onChange={(e) =>
                        setQuantityMode((prev) => ({
                          ...prev,
                          pieces: Math.max(0, parseInt(e.target.value) || 0),
                        }))
                      }
                      className="w-20 text-center border border-orange-300 rounded-lg py-2 focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      onClick={() =>
                        setQuantityMode((prev) => ({
                          ...prev,
                          pieces: prev.pieces + 1,
                        }))
                      }
                      className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-700">
                    Total Quantity:
                  </span>
                  <span className="text-xl font-bold text-blue-600">
                    {calculateTotalPieces(
                      quantityMode.boxes,
                      quantityMode.sheets,
                      quantityMode.pieces,
                      selectedProduct?.packaging || {
                        piecesPerSheet: 0,
                        totalPieces: 0,
                      }
                    )}{" "}
                    pieces
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Total Amount:</span>
                  <span className="font-semibold">
                    ₱
                    {(
                      calculateTotalPieces(
                        quantityMode.boxes,
                        quantityMode.sheets,
                        quantityMode.pieces,
                        selectedProduct?.packaging || {
                          piecesPerSheet: 0,
                          totalPieces: 0,
                        }
                      ) * (selectedProduct?.price || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={closeQuantityModal}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addToCartWithQuantity}
                  disabled={
                    calculateTotalPieces(
                      quantityMode.boxes,
                      quantityMode.sheets,
                      quantityMode.pieces,
                      selectedProduct?.packaging || {
                        piecesPerSheet: 0,
                        totalPieces: 0,
                      }
                    ) === 0
                  }
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                    calculateTotalPieces(
                      quantityMode.boxes,
                      quantityMode.sheets,
                      quantityMode.pieces,
                      selectedProduct?.packaging || {
                        piecesPerSheet: 0,
                        totalPieces: 0,
                      }
                    ) > 0
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quantity Selection Modal */}
      {showQuantityModal && selectedProduct && (
        <QuantitySelectionModal
          product={selectedProduct}
          isOpen={showQuantityModal}
          onClose={closeQuantityModal}
          onAddToCart={(product, quantityInfo) => {
            // Add to cart using the calculated total pieces
            if (!product?.id) {
              console.error("Invalid product:", product);
              addNotification("Error adding item to cart", "error");
              return false;
            }

            if (!quantityInfo) {
              console.error("Invalid quantity info:", quantityInfo);
              addNotification("Error: No quantity specified", "error");
              return false;
            }

            // Calculate total pieces from quantity info
            const totalPieces =
              (quantityInfo.boxes || 0) *
                (product.total_pieces_per_box ||
                  product.pieces_per_sheet * product.sheets_per_box ||
                  1) +
              (quantityInfo.sheets || 0) * (product.pieces_per_sheet || 1) +
              (quantityInfo.pieces || 0);

            const variantInfo = {
              boxes: quantityInfo.boxes || 0,
              sheets: quantityInfo.sheets || 0,
              pieces: quantityInfo.pieces || 0,
              totalPieces,
            };

            setCart((prev) => {
              const existing = prev.find((item) => item.id === product.id);
              if (existing) {
                const newQuantity = Math.min(
                  existing.quantity + totalPieces,
                  product.stock || product.total_stock || 0
                );
                return prev.map((item) =>
                  item.id === product.id
                    ? {
                        ...item,
                        quantity: newQuantity,
                        variant_info: variantInfo,
                      }
                    : item
                );
              }
              return [
                ...prev,
                {
                  ...product,
                  quantity: totalPieces,
                  variant_info: variantInfo,
                },
              ];
            });

            // Create display quantity string
            const displayParts = [];
            if (quantityInfo.boxes > 0)
              displayParts.push(
                `${quantityInfo.boxes} box${quantityInfo.boxes > 1 ? "es" : ""}`
              );
            if (quantityInfo.sheets > 0)
              displayParts.push(
                `${quantityInfo.sheets} sheet${
                  quantityInfo.sheets > 1 ? "s" : ""
                }`
              );
            if (quantityInfo.pieces > 0)
              displayParts.push(
                `${quantityInfo.pieces} piece${
                  quantityInfo.pieces > 1 ? "s" : ""
                }`
              );
            const displayQuantity =
              displayParts.join(" + ") || `${totalPieces} pieces`;

            addNotification(`Added ${displayQuantity} to cart`, "success");

            return true; // Return success
          }}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onProcessPayment={handlePaymentConfirm}
          totals={{
            subtotal: subtotal,
            discount: totalDiscount,
            total: total,
          }}
          isProcessing={createSale.isPending}
        />
      )}

      {/* Transaction History Modal */}
      {showTransactionHistory && (
        <TransactionHistoryModal
          isOpen={showTransactionHistory}
          onClose={() => setShowTransactionHistory(false)}
        />
      )}
    </div>
  );
}
