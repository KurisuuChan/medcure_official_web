import { useState, useCallback } from "react";
import {
  processPOSSale,
  validatePOSCart,
  calculatePOSTotals,
} from "../services/posService.js";
import { useNotification } from "./useNotification.js";

/**
 * Hook for managing POS cart and sales operations
 */
export function usePOS() {
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [isPwdSenior, setIsPwdSenior] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const { addNotification } = useNotification();

  // Add item to cart with packaging breakdown and enhanced validation
  const addToCart = useCallback(
    (product, quantities) => {
      const { boxes = 0, sheets = 0, pieces = 0 } = quantities;

      // Calculate total pieces
      const totalPieces =
        boxes * (product.total_pieces_per_box || 0) +
        sheets * (product.pieces_per_sheet || 0) +
        pieces;

      if (totalPieces <= 0) {
        addNotification("Please specify a valid quantity", "warning");
        return false;
      }

      // Check current cart quantity for this product
      const existingItem = cart.find((item) => item.id === product.id);
      const currentCartQuantity = existingItem ? existingItem.quantity : 0;
      const availableStock = product.total_stock - currentCartQuantity;

      if (totalPieces > availableStock) {
        addNotification(
          `Only ${availableStock} pieces available (${currentCartQuantity} already in cart)`,
          "error"
        );
        return false;
      }

      setCart((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === product.id);

        if (existingIndex >= 0) {
          // Update existing item
          const newCart = [...prev];
          const existingItem = newCart[existingIndex];
          const newQuantity = existingItem.quantity + totalPieces;

          newCart[existingIndex] = {
            ...existingItem,
            quantity: newQuantity,
            packaging: {
              boxes_sold: (existingItem.packaging?.boxes_sold || 0) + boxes,
              sheets_sold: (existingItem.packaging?.sheets_sold || 0) + sheets,
              pieces_sold: (existingItem.packaging?.pieces_sold || 0) + pieces,
            },
          };

          return newCart;
        } else {
          // Add new item
          return [
            ...prev,
            {
              ...product,
              quantity: totalPieces,
              packaging: {
                boxes_sold: boxes,
                sheets_sold: sheets,
                pieces_sold: pieces,
              },
            },
          ];
        }
      });

      addNotification(
        `Added ${totalPieces} ${
          totalPieces === 1 ? "piece" : "pieces"
        } to cart`,
        "success"
      );
      return true;
    },
    [addNotification, cart]
  );

  // Remove item from cart
  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  // Update item quantity
  const updateQuantity = useCallback(
    (productId, newQuantity) => {
      if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
      }

      setCart((prev) =>
        prev.map((item) => {
          if (item.id === productId) {
            const validQuantity = Math.min(newQuantity, item.total_stock);
            return { ...item, quantity: validQuantity };
          }
          return item;
        })
      );
    },
    [removeFromCart]
  );

  // Clear entire cart
  const clearCart = useCallback(() => {
    setCart([]);
    setDiscount(0);
    setIsPwdSenior(false);
    setCustomerInfo({});
  }, []);

  // Calculate totals
  const calculateTotals = useCallback(() => {
    return calculatePOSTotals(cart, discount, isPwdSenior);
  }, [cart, discount, isPwdSenior]);

  // Process sale
  const processSale = useCallback(
    async (paymentInfo = {}) => {
      if (cart.length === 0) {
        addNotification("Cart is empty", "error");
        return { success: false, error: "Cart is empty" };
      }

      // Validate cart
      const validation = validatePOSCart(cart);
      if (!validation.isValid) {
        const errorMsg = validation.errors.join(", ");
        addNotification(errorMsg, "error");
        return { success: false, error: errorMsg };
      }

      const totals = calculateTotals();
      setIsProcessing(true);

      try {
        const saleData = {
          cart: cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.selling_price,
            quantity: item.quantity,
            stock: item.total_stock,
            packaging: item.packaging,
          })),
          discount,
          isPwdSenior,
          customerInfo: {
            ...customerInfo,
            ...paymentInfo,
            amountPaid: paymentInfo.amountPaid || totals.total,
            changeAmount: Math.max(
              0,
              (paymentInfo.amountPaid || totals.total) - totals.total
            ),
          },
        };

        console.log("🛒 Processing POS sale with data:", saleData);

        const result = await processPOSSale(saleData);

        if (!result.success) {
          throw new Error(result.error);
        }

        // Clear cart on successful sale
        clearCart();

        addNotification(
          `Sale completed! Transaction #${result.data.summary.transactionNumber}`,
          "success"
        );

        return {
          success: true,
          data: result.data,
          error: null,
        };
      } catch (err) {
        const errorMsg = err.message || "Failed to process sale";
        addNotification(errorMsg, "error");
        return {
          success: false,
          data: null,
          error: errorMsg,
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [
      cart,
      discount,
      isPwdSenior,
      customerInfo,
      calculateTotals,
      clearCart,
      addNotification,
    ]
  );

  // Get item in cart
  const getCartItem = useCallback(
    (productId) => {
      return cart.find((item) => item.id === productId);
    },
    [cart]
  );

  // Check if product is in cart
  const isInCart = useCallback(
    (productId) => {
      return cart.some((item) => item.id === productId);
    },
    [cart]
  );

  // Get cart warnings for potential issues
  const getCartWarnings = useCallback(() => {
    const warnings = [];

    cart.forEach((item) => {
      const stockPercentage = (item.quantity / item.total_stock) * 100;

      if (stockPercentage > 80) {
        warnings.push({
          type: "high_stock_usage",
          message: `${item.name}: Using ${stockPercentage.toFixed(
            0
          )}% of available stock`,
          severity: stockPercentage > 90 ? "error" : "warning",
        });
      }

      if (item.total_stock - item.quantity < 5) {
        warnings.push({
          type: "low_remaining_stock",
          message: `${item.name}: Only ${
            item.total_stock - item.quantity
          } pieces will remain`,
          severity: "warning",
        });
      }
    });

    return warnings;
  }, [cart]);

  // Get enhanced cart summary with detailed information
  const getCartSummary = useCallback(() => {
    const totals = calculateTotals();
    const warnings = getCartWarnings();

    return {
      ...totals,
      isEmpty: cart.length === 0,
      itemTypes: cart.length,
      totalProducts: cart.length,
      heaviestItem: cart.reduce(
        (max, item) => (item.quantity > max.quantity ? item : max),
        { quantity: 0, name: "None" }
      ),
      packagingBreakdown: cart.reduce(
        (acc, item) => {
          acc.totalBoxes += item.packaging?.boxes_sold || 0;
          acc.totalSheets += item.packaging?.sheets_sold || 0;
          acc.totalIndividualPieces += item.packaging?.pieces_sold || 0;
          return acc;
        },
        { totalBoxes: 0, totalSheets: 0, totalIndividualPieces: 0 }
      ),
      averageItemPrice:
        cart.length > 0 ? totals.subtotal / totals.itemCount : 0,
      warnings,
    };
  }, [cart, calculateTotals, getCartWarnings]);

  // Get available stock for a product considering cart
  const getAvailableStock = useCallback(
    (productId, productStock) => {
      const cartItem = cart.find((item) => item.id === productId);
      return productStock - (cartItem?.quantity || 0);
    },
    [cart]
  );

  // Get cart statistics
  const getCartStatistics = useCallback(() => {
    const totals = calculateTotals();

    return {
      totalValue: totals.subtotal,
      totalItems: totals.itemCount,
      totalProducts: cart.length,
      averageItemValue:
        cart.length > 0 ? totals.subtotal / totals.itemCount : 0,
      largestLineItem: cart.reduce(
        (max, item) => {
          const lineTotal = item.quantity * item.selling_price;
          return lineTotal > max.value
            ? { name: item.name, value: lineTotal }
            : max;
        },
        { name: "None", value: 0 }
      ),
      discountImpact: {
        regularDiscount: totals.regularDiscountAmount,
        pwdSeniorDiscount: totals.pwdSeniorDiscount,
        totalSavings: totals.totalDiscount,
        savingsPercentage:
          totals.subtotal > 0
            ? (totals.totalDiscount / totals.subtotal) * 100
            : 0,
      },
    };
  }, [cart, calculateTotals]);

  // Validate cart before checkout
  const validateCart = useCallback(() => {
    return validatePOSCart(cart);
  }, [cart]);

  return {
    // State
    cart,
    discount,
    isPwdSenior,
    customerInfo,
    isProcessing,

    // Actions
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    processSale,

    // Setters
    setDiscount,
    setIsPwdSenior,
    setCustomerInfo,

    // Utilities
    getCartItem,
    isInCart,
    getCartSummary,
    getCartWarnings,
    getAvailableStock,
    getCartStatistics,
    calculateTotals,
    validateCart,
  };
}
