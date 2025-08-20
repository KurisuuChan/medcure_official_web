// =====================================================
// Stock Validation Utility Service
// MedCure Pharmacy Management System
// =====================================================

import { supabase } from "../config/supabase.js";

/**
 * Validates stock availability for a single product
 * @param {number} productId - Product ID
 * @param {number} requestedQuantity - Quantity requested
 * @returns {Promise<Object>} Validation result
 */
export async function validateProductStock(productId, requestedQuantity) {
  try {
    const { data: product, error } = await supabase
      .from("products")
      .select("id, name, total_stock, critical_level")
      .eq("id", productId)
      .single();

    if (error) throw error;
    if (!product) throw new Error("Product not found");

    const result = {
      isValid: true,
      message: "",
      availableStock: product.total_stock,
      requestedQuantity,
      productName: product.name,
    };

    // Check for negative stock
    if (product.total_stock < 0) {
      result.isValid = false;
      result.message = `${product.name} is out of stock (negative inventory)`;
      return result;
    }

    // Check if requested quantity exceeds available stock
    if (requestedQuantity > product.total_stock) {
      result.isValid = false;
      result.message = `Insufficient stock for ${product.name}. Requested: ${requestedQuantity}, Available: ${product.total_stock}`;
      return result;
    }

    // Warning for low stock
    if (
      product.total_stock - requestedQuantity <=
      (product.critical_level || 0)
    ) {
      result.warning = `Low stock warning: ${product.name} will have ${
        product.total_stock - requestedQuantity
      } pieces remaining`;
    }

    return result;
  } catch (error) {
    console.error("Error validating product stock:", error);
    return {
      isValid: false,
      message: `Stock validation failed: ${error.message}`,
      availableStock: 0,
      requestedQuantity,
    };
  }
}

/**
 * Validates stock for multiple products (cart validation)
 * @param {Array} cartItems - Array of {productId, quantity} objects
 * @returns {Promise<Object>} Batch validation result
 */
export async function validateCartStock(cartItems) {
  try {
    const productIds = cartItems.map((item) => item.productId || item.id);

    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, total_stock, critical_level")
      .in("id", productIds);

    if (error) throw error;

    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      validItems: [],
      invalidItems: [],
    };

    for (const cartItem of cartItems) {
      const productId = cartItem.productId || cartItem.id;
      const quantity = cartItem.quantity;
      const product = products.find((p) => p.id === productId);

      if (!product) {
        results.errors.push(`Product ID ${productId} not found`);
        results.invalidItems.push(cartItem);
        continue;
      }

      // Check for negative stock
      if (product.total_stock < 0) {
        results.errors.push(
          `${product.name} is out of stock (negative inventory)`
        );
        results.invalidItems.push({ ...cartItem, productName: product.name });
        continue;
      }

      // Check if requested quantity exceeds available stock
      if (quantity > product.total_stock) {
        results.errors.push(
          `${product.name}: Requested ${quantity}, Available ${product.total_stock}`
        );
        results.invalidItems.push({ ...cartItem, productName: product.name });
        continue;
      }

      // Check for low stock warning
      const remainingStock = product.total_stock - quantity;
      if (remainingStock <= (product.critical_level || 0)) {
        results.warnings.push(
          `Low stock: ${product.name} will have ${remainingStock} pieces remaining`
        );
      }

      results.validItems.push({
        ...cartItem,
        productName: product.name,
        availableStock: product.total_stock,
        remainingStock,
      });
    }

    results.isValid = results.errors.length === 0;
    return results;
  } catch (error) {
    console.error("Error validating cart stock:", error);
    return {
      isValid: false,
      errors: [`Cart validation failed: ${error.message}`],
      warnings: [],
      validItems: [],
      invalidItems: cartItems,
    };
  }
}

/**
 * Get real-time stock status for a product
 * @param {number} productId - Product ID
 * @returns {Promise<Object>} Stock status
 */
export async function getStockStatus(productId) {
  try {
    const { data: product, error } = await supabase
      .from("products")
      .select("id, name, total_stock, critical_level")
      .eq("id", productId)
      .single();

    if (error) throw error;
    if (!product) throw new Error("Product not found");

    let status = "HEALTHY";
    let color = "green";

    if (product.total_stock <= 0) {
      status = "OUT_OF_STOCK";
      color = "red";
    } else if (product.total_stock <= product.critical_level * 0.5) {
      status = "CRITICAL";
      color = "red";
    } else if (product.total_stock <= product.critical_level) {
      status = "LOW";
      color = "orange";
    }

    return {
      productId: product.id,
      productName: product.name,
      currentStock: product.total_stock,
      criticalLevel: product.critical_level,
      status,
      color,
      isAvailable: product.total_stock > 0,
    };
  } catch (error) {
    console.error("Error getting stock status:", error);
    return {
      productId,
      status: "ERROR",
      color: "red",
      isAvailable: false,
      error: error.message,
    };
  }
}

/**
 * Prevent negative stock by safely updating quantities
 * @param {number} productId - Product ID
 * @param {number} quantityToDeduct - Quantity to deduct
 * @returns {Promise<Object>} Update result
 */
export async function safeStockDeduction(productId, quantityToDeduct) {
  try {
    // Use database function for atomic stock update
    const { data, error } = await supabase.rpc("safe_stock_deduction", {
      product_id: productId,
      quantity_to_deduct: quantityToDeduct,
    });

    if (error) throw error;

    return {
      success: data[0]?.success || false,
      message: data[0]?.message || "Stock update completed",
      oldStock: data[0]?.old_stock,
      newStock: data[0]?.new_stock,
      deducted: data[0]?.deducted,
    };
  } catch (error) {
    console.error("Error in safe stock deduction:", error);
    return {
      success: false,
      message: `Stock deduction failed: ${error.message}`,
      oldStock: null,
      newStock: null,
      deducted: 0,
    };
  }
}

/**
 * Get products with negative stock
 * @returns {Promise<Array>} Products with negative stock
 */
export async function getNegativeStockProducts() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, total_stock, selling_price, updated_at")
      .lt("total_stock", 0)
      .order("total_stock", { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error getting negative stock products:", error);
    return [];
  }
}

/**
 * Fix negative stock for a specific product
 * @param {number} productId - Product ID
 * @param {number} newStock - New stock level
 * @param {string} reason - Reason for the fix
 * @returns {Promise<Object>} Fix result
 */
export async function fixNegativeStock(
  productId,
  newStock,
  reason = "Stock correction"
) {
  try {
    const { data, error } = await supabase
      .from("products")
      .update({
        total_stock: Math.max(0, newStock),
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .select()
      .single();

    if (error) throw error;

    // Log the correction
    await supabase.from("stock_audit_log").insert({
      product_id: productId,
      old_stock: data.total_stock < newStock ? data.total_stock : null,
      new_stock: newStock,
      change_reason: reason,
      user_id: "system",
    });

    return {
      success: true,
      message: `Stock corrected for ${data.name}`,
      product: data,
    };
  } catch (error) {
    console.error("Error fixing negative stock:", error);
    return {
      success: false,
      message: `Failed to fix stock: ${error.message}`,
    };
  }
}

export default {
  validateProductStock,
  validateCartStock,
  getStockStatus,
  safeStockDeduction,
  getNegativeStockProducts,
  fixNegativeStock,
};
