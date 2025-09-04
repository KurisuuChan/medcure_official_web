import { STOCK_THRESHOLDS, STOCK_STATUS, STOCK_FIELDS } from "../utils/constants.js";

/**
 * Expiry-related constants and functions
 */
export const EXPIRY_THRESHOLDS = {
  EXPIRED: 0, // Already expired
  CRITICAL: 7, // Expires within 7 days
  WARNING: 30, // Expires within 30 days
  SAFE: 90, // Expires within 90 days
};

/**
 * Check if a product is expiring soon
 * @param {Object} product - Product object
 * @param {number} daysThreshold - Days threshold (default: 30)
 * @returns {boolean} True if product is expiring soon
 */
export function isExpiringSoon(product, daysThreshold = EXPIRY_THRESHOLDS.WARNING) {
  if (!product?.expiry_date) return false;
  
  const expiryDate = new Date(product.expiry_date);
  const now = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
  
  return expiryDate > now && expiryDate <= thresholdDate;
}

/**
 * Check if a product is expired
 * @param {Object} product - Product object
 * @returns {boolean} True if product is expired
 */
export function isExpired(product) {
  if (!product?.expiry_date) return false;
  return new Date(product.expiry_date) <= new Date();
}

/**
 * Get expiry status for a product
 * @param {Object} product - Product object
 * @returns {Object} Expiry status with text, color, and days until expiry
 */
export function getExpiryStatus(product) {
  if (!product?.expiry_date) {
    return {
      text: "No Expiry Data",
      color: "text-gray-500",
      bgColor: "bg-gray-50",
      status: "unknown",
      daysUntilExpiry: null,
    };
  }
  
  const expiryDate = new Date(product.expiry_date);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry <= EXPIRY_THRESHOLDS.EXPIRED) {
    return {
      text: "Expired",
      color: "text-red-600",
      bgColor: "bg-red-50",
      status: "expired",
      daysUntilExpiry,
    };
  }
  
  if (daysUntilExpiry <= EXPIRY_THRESHOLDS.CRITICAL) {
    return {
      text: "Expires Soon",
      color: "text-red-600",
      bgColor: "bg-red-50",
      status: "critical",
      daysUntilExpiry,
    };
  }
  
  if (daysUntilExpiry <= EXPIRY_THRESHOLDS.WARNING) {
    return {
      text: "Expiring Soon",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      status: "warning",
      daysUntilExpiry,
    };
  }
  
  return {
    text: "Good",
    color: "text-green-600",
    bgColor: "bg-green-50",
    status: "good",
    daysUntilExpiry,
  };
}

/**
 * Centralized Stock Management Service
 * Handles all stock-related logic and provides consistent data access
 */

/**
 * Get the effective stock value from a product object
 * Uses total_stock as primary, falls back to stock
 * @param {Object} product - Product object
 * @returns {number} Effective stock value
 */
export function getEffectiveStock(product) {
  if (!product) return 0;
  
  // Use total_stock as primary field, fallback to stock
  const primaryStock = product[STOCK_FIELDS.PRIMARY];
  const fallbackStock = product[STOCK_FIELDS.FALLBACK];
  
  return primaryStock !== undefined && primaryStock !== null 
    ? Number(primaryStock) 
    : Number(fallbackStock || 0);
}

/**
 * Determine stock status based on current stock and thresholds
 * @param {Object} product - Product object
 * @param {Object} customThresholds - Custom threshold overrides
 * @returns {Object} Stock status with text, color, and status code
 */
export function getStockStatus(product, customThresholds = {}) {
  const stock = getEffectiveStock(product);
  const thresholds = {
    ...STOCK_THRESHOLDS,
    ...customThresholds,
  };
  
  // Use product-specific reorder level if available
  const lowThreshold = product.reorder_level || thresholds.LOW;
  const criticalThreshold = thresholds.CRITICAL;
  
  if (stock <= thresholds.OUT_OF_STOCK) {
    return {
      text: STOCK_STATUS.OUT_OF_STOCK,
      color: "text-red-600",
      bgColor: "bg-red-50",
      status: "out",
      priority: 4,
    };
  }
  
  if (stock <= criticalThreshold) {
    return {
      text: STOCK_STATUS.CRITICAL,
      color: "text-red-600",
      bgColor: "bg-red-50",
      status: "critical",
      priority: 3,
    };
  }
  
  if (stock <= lowThreshold) {
    return {
      text: STOCK_STATUS.LOW,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      status: "low",
      priority: 2,
    };
  }
  
  return {
    text: STOCK_STATUS.IN_STOCK,
    color: "text-green-600",
    bgColor: "bg-green-50",
    status: "good",
    priority: 1,
  };
}

/**
 * Check if a product is considered low stock
 * @param {Object} product - Product object
 * @param {number} threshold - Custom threshold (optional)
 * @returns {boolean} True if product is low stock
 */
export function isLowStock(product, threshold = null) {
  const stock = getEffectiveStock(product);
  const effectiveThreshold = threshold || product.reorder_level || STOCK_THRESHOLDS.LOW;
  return stock <= effectiveThreshold;
}

/**
 * Check if a product is out of stock
 * @param {Object} product - Product object
 * @returns {boolean} True if product is out of stock
 */
export function isOutOfStock(product) {
  return getEffectiveStock(product) <= STOCK_THRESHOLDS.OUT_OF_STOCK;
}

/**
 * Check if a product is critically low stock
 * @param {Object} product - Product object
 * @returns {boolean} True if product is critically low
 */
export function isCriticalStock(product) {
  return getEffectiveStock(product) <= STOCK_THRESHOLDS.CRITICAL && getEffectiveStock(product) > STOCK_THRESHOLDS.OUT_OF_STOCK;
}

/**
 * Normalize product data to ensure consistent stock field usage
 * @param {Object} product - Raw product object
 * @returns {Object} Normalized product object
 */
export function normalizeProductData(product) {
  if (!product) return null;
  
  const effectiveStock = getEffectiveStock(product);
  const stockStatus = getStockStatus(product);
  
  return {
    ...product,
    // Ensure both fields are present and consistent
    total_stock: effectiveStock,
    stock: effectiveStock,
    current_stock: effectiveStock,
    // Add calculated status
    stock_status: stockStatus.text,
    stock_status_code: stockStatus.status,
    stock_priority: stockStatus.priority,
    // Ensure selling_price is available
    selling_price: product.selling_price || product.price || 0,
    price: product.price || product.selling_price || 0,
  };
}

/**
 * Filter products by stock status
 * @param {Array} products - Array of products
 * @param {string} statusFilter - Status to filter by ('low', 'critical', 'out', 'good')
 * @param {number} customThreshold - Custom threshold for low stock
 * @returns {Array} Filtered products
 */
export function filterProductsByStockStatus(products, statusFilter, customThreshold = null) {
  if (!Array.isArray(products)) return [];
  
  return products.filter(product => {
    const normalizedProduct = normalizeProductData(product);
    const status = getStockStatus(normalizedProduct, customThreshold ? { LOW: customThreshold } : {});
    
    switch (statusFilter) {
      case 'out':
        return status.status === 'out';
      case 'critical':
        return status.status === 'critical';
      case 'low':
        return status.status === 'low';
      case 'good':
        return status.status === 'good';
      case 'alerts': // All products needing attention
        return ['out', 'critical', 'low'].includes(status.status);
      default:
        return true;
    }
  });
}

/**
 * Calculate reorder recommendations for a product
 * @param {Object} product - Product object
 * @param {Object} salesHistory - Optional sales history data
 * @returns {Object} Reorder recommendation
 */
export function calculateReorderRecommendation(product, salesHistory = null) {
  const currentStock = getEffectiveStock(product);
  const reorderLevel = product.reorder_level || STOCK_THRESHOLDS.REORDER_POINT;
  
  // Basic calculation - can be enhanced with sales history
  const avgMonthlySales = salesHistory?.avgMonthlySales || 30;
  const leadTimeDays = 7;
  const safetyStock = STOCK_THRESHOLDS.LOW;
  
  const reorderPoint = (avgMonthlySales / 30) * leadTimeDays + safetyStock;
  const recommendedOrderQuantity = Math.max(
    reorderPoint - currentStock,
    safetyStock
  );
  
  const urgency = currentStock <= STOCK_THRESHOLDS.OUT_OF_STOCK
    ? "Critical"
    : currentStock <= STOCK_THRESHOLDS.CRITICAL
    ? "High"
    : currentStock <= reorderLevel
    ? "Medium"
    : "Low";
  
  return {
    productId: product.id,
    productName: product.name,
    currentStock,
    reorderPoint,
    recommendedOrderQuantity: Math.ceil(recommendedOrderQuantity),
    urgency,
    estimatedCost: Math.ceil(recommendedOrderQuantity) * (product.cost_price || 0),
    daysUntilStockout: currentStock > 0 ? Math.floor(currentStock / (avgMonthlySales / 30)) : 0,
  };
}

/**
 * Get stock analytics for a set of products
 * @param {Array} products - Array of products
 * @returns {Object} Stock analytics summary
 */
export function getStockAnalytics(products) {
  if (!Array.isArray(products)) return {};
  
  const normalizedProducts = products.map(normalizeProductData);
  
  const analytics = {
    totalProducts: normalizedProducts.length,
    outOfStock: 0,
    criticalStock: 0,
    lowStock: 0,
    inStock: 0,
    totalStockValue: 0,
    totalRetailValue: 0,
    averageStockLevel: 0,
  };
  
  let totalStockUnits = 0;
  
  normalizedProducts.forEach(product => {
    const status = getStockStatus(product);
    const stock = getEffectiveStock(product);
    
    // Count by status
    switch (status.status) {
      case 'out':
        analytics.outOfStock++;
        break;
      case 'critical':
        analytics.criticalStock++;
        break;
      case 'low':
        analytics.lowStock++;
        break;
      default:
        analytics.inStock++;
    }
    
    // Calculate values
    analytics.totalStockValue += stock * (product.cost_price || 0);
    analytics.totalRetailValue += stock * (product.selling_price || product.price || 0);
    totalStockUnits += stock;
  });
  
  analytics.averageStockLevel = analytics.totalProducts > 0 
    ? totalStockUnits / analytics.totalProducts 
    : 0;
  
  analytics.stockHealth = {
    healthy: analytics.inStock,
    needsAttention: analytics.lowStock + analytics.criticalStock + analytics.outOfStock,
    healthPercentage: analytics.totalProducts > 0 
      ? (analytics.inStock / analytics.totalProducts) * 100 
      : 0,
  };
  
  return analytics;
}

export default {
  getEffectiveStock,
  getStockStatus,
  isLowStock,
  isOutOfStock,
  isCriticalStock,
  normalizeProductData,
  filterProductsByStockStatus,
  calculateReorderRecommendation,
  getStockAnalytics,
  isExpiringSoon,
  isExpired,
  getExpiryStatus,
};
