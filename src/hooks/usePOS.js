import { useState, useCallback } from "react";
import { createSale } from "../services/salesService.js";
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

  // Add item to cart with packaging breakdown
  const addToCart = useCallback(
    (product, quantities) => {
      const { boxes = 0, sheets = 0, pieces = 0 } = quantities;

      // Calculate total pieces
      const totalPieces =
        boxes * product.total_pieces_per_box +
        sheets * product.pieces_per_sheet +
        pieces;

      if (totalPieces <= 0) {
        addNotification("Please specify a valid quantity", "warning");
        return false;
      }

      if (totalPieces > product.total_stock) {
        addNotification(
          `Only ${product.total_stock} pieces available`,
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
          const newQuantity = Math.min(
            existingItem.quantity + totalPieces,
            product.total_stock
          );

          newCart[existingIndex] = {
            ...existingItem,
            quantity: newQuantity,
            packaging: {
              boxes_sold: boxes,
              sheets_sold: sheets,
              pieces_sold: pieces,
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

      addNotification(`Added ${totalPieces} pieces to cart`, "success");
      return true;
    },
    [addNotification]
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
    const subtotal = cart.reduce(
      (sum, item) => sum + item.selling_price * item.quantity,
      0
    );
    const regularDiscountAmount = (subtotal * discount) / 100;
    const pwdSeniorDiscount = isPwdSenior ? subtotal * 0.2 : 0;
    const totalDiscount = regularDiscountAmount + pwdSeniorDiscount;
    const total = subtotal - totalDiscount;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return {
      subtotal,
      regularDiscountAmount,
      pwdSeniorDiscount,
      totalDiscount,
      total,
      itemCount,
    };
  }, [cart, discount, isPwdSenior]);

  // Process sale
  const processSale = useCallback(
    async (paymentInfo = {}) => {
      if (cart.length === 0) {
        addNotification("Cart is empty", "error");
        return { success: false, error: "Cart is empty" };
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

        const { data, error } = await createSale(saleData);

        if (error) {
          throw new Error(error);
        }

        // Clear cart on successful sale
        clearCart();

        addNotification(
          `Sale completed! Transaction #${data.summary.transactionNumber}`,
          "success"
        );

        return {
          success: true,
          data: data,
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

  // Get cart summary
  const getCartSummary = useCallback(() => {
    const totals = calculateTotals();
    return {
      ...totals,
      isEmpty: cart.length === 0,
      itemTypes: cart.length,
    };
  }, [cart, calculateTotals]);

  // Validate cart before checkout
  const validateCart = useCallback(() => {
    const errors = [];

    if (cart.length === 0) {
      errors.push("Cart is empty");
    }

    cart.forEach((item) => {
      if (item.quantity > item.total_stock) {
        errors.push(`Insufficient stock for ${item.name}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
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
    calculateTotals,
    validateCart,
  };
}
