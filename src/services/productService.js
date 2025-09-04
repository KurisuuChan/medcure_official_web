import { supabase } from "../config/supabase.js";
import { normalizeProductData, getStockStatus, isLowStock, getEffectiveStock, isExpiringSoon, getExpiryStatus } from "./stockService.js";
import { STOCK_THRESHOLDS } from "../utils/constants.js";

/**
 * Enhanced Product Service - Implements improved backend architecture
 * Leverages database views, functions, and constraints for better data integrity
 */

/**
 * Fetch all products with consistent data normalization
 * @returns {Promise<Array>} Array of normalized product objects
 */
export async function getProducts() {
  try {
    console.log("🔍 Fetching all products...");
    
    // Use products table directly for consistency
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_archived", false)
      .order("name", { ascending: true });

    if (error) throw error;

    // Use centralized stock service for consistent data normalization
    const normalizedProducts = (data || []).map(product => {
      const normalized = normalizeProductData(product);
      
      // Add expiry status calculation
      normalized.expiry_status = !product.expiry_date
        ? "No Expiry Data"
        : new Date(product.expiry_date) <= new Date()
        ? "Expired"
        : new Date(product.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ? "Expiring Soon"
        : "Good";
      
      return normalized;
    });

    console.log(`✅ Fetched ${normalizedProducts.length} products`);
    return normalizedProducts;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products");
  }
}

/**
 * Get comprehensive inventory analytics
 * @returns {Promise<Object>} Analytics object with inventory statistics
 */
export async function getInventoryAnalytics() {
  try {
    const { data, error } = await supabase.rpc("get_inventory_analytics");

    if (error) throw error;
    return data?.[0] || {};
  } catch (error) {
    console.error("Error fetching inventory analytics:", error);
    throw new Error("Failed to fetch inventory analytics");
  }
}

/**
 * Advanced product search with full-text search capabilities
 * @param {Object} searchParams - Search parameters
 * @param {string} searchParams.searchTerm - Search term
 * @param {string} searchParams.category - Category filter
 * @param {string} searchParams.stockStatus - Stock status filter
 * @param {number} searchParams.minPrice - Minimum price filter
 * @param {number} searchParams.maxPrice - Maximum price filter
 * @param {string} searchParams.sortBy - Sort criteria
 * @param {number} searchParams.limit - Result limit
 * @returns {Promise<Array>} Array of matching products with relevance scores
 */
export async function searchProductsAdvanced({
  searchTerm = "",
  category = null,
  stockStatus = null,
  minPrice = null,
  maxPrice = null,
  sortBy = "relevance",
  limit = 50,
} = {}) {
  try {
    // Try the advanced database function first
    const { data, error } = await supabase.rpc("search_products_optimized", {
      search_query: searchTerm || null,
      category_filter: category,
      stock_status_filter: stockStatus,
      price_min: minPrice,
      price_max: maxPrice,
      limit_count: limit,
    });

    if (error && !error.message?.includes("does not exist")) {
      throw error;
    }

    // If function exists and works, return the data
    if (!error && data) {
      return data;
    }

    // Fallback to direct query if function doesn't exist
    console.warn(
      "Advanced search function not available, using fallback query"
    );

    let query = supabase
      .from("products_enhanced")
      .select("*")
      .eq("is_archived", false);

    // If products_enhanced doesn't exist, try products table
    if (!query) {
      query = supabase.from("products").select("*").eq("is_archived", false);
    }

    // Apply search term filter
    if (searchTerm && searchTerm.trim()) {
      query = query.or(
        `name.ilike.%${searchTerm}%,brand_name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,manufacturer.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%`
      );
    }

    // Apply category filter
    if (category) {
      query = query.eq("category", category);
    }

    // Apply stock status filter
    if (stockStatus) {
      switch (stockStatus.toLowerCase()) {
        case "out of stock":
          query = query.lte("stock", 0);
          break;
        case "low stock":
          query = query.gt("stock", 0).lte("stock", 10);
          break;
        case "in stock":
          query = query.gt("stock", 10);
          break;
      }
    }

    // Apply price filters
    if (minPrice !== null) {
      query = query.gte("selling_price", minPrice);
    }
    if (maxPrice !== null) {
      query = query.lte("selling_price", maxPrice);
    }

    // Apply sorting
    switch (sortBy) {
      case "name":
        query = query.order("name", { ascending: true });
        break;
      case "price_low":
        query = query.order("selling_price", { ascending: true });
        break;
      case "price_high":
        query = query.order("selling_price", { ascending: false });
        break;
      case "stock":
        query = query.order("stock", { ascending: false });
        break;
      default:
        query = query.order("name", { ascending: true });
    }

    // Apply limit
    query = query.limit(limit);

    const { data: fallbackData, error: fallbackError } = await query;

    if (fallbackError) {
      throw fallbackError;
    }

    return fallbackData || [];
  } catch (error) {
    console.error("Error in advanced search:", error);

    // Final fallback - simple query
    try {
      const { data: simpleData, error: simpleError } = await supabase
        .from("products")
        .select("*")
        .eq("is_archived", false)
        .ilike("name", `%${searchTerm}%`)
        .limit(limit);

      if (simpleError) throw simpleError;
      return simpleData || [];
    } catch (simpleSearchError) {
      console.error("Fallback search also failed:", simpleSearchError);
      return [];
    }
  }
}

/**
 * Simple search function for backward compatibility
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of matching products
 */
export async function searchProducts(searchTerm) {
  return searchProductsAdvanced({ searchTerm });
}

/**
 * Get a single product by ID from enhanced view
 * @param {number} id - Product ID
 * @returns {Promise<Object>} Enhanced product object
 */
export async function getProduct(id) {
  try {
    const { data, error } = await supabase
      .from("products_enhanced")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw new Error("Failed to fetch product");
  }
}

/**
 * Add a new product with data validation
 * @param {Object} product - Product object to add
 * @returns {Promise<Object>} Created product object
 */
export async function addProduct(product) {
  try {
    // Ensure required fields have defaults
    const productData = {
      ...product,
      cost_price: product.cost_price || 0,
      pieces_per_sheet: product.pieces_per_sheet || 1,
      sheets_per_box: product.sheets_per_box || 1,
      selling_price: product.selling_price || product.price || 0,
      total_stock: product.total_stock || product.stock || 0,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Validate required fields
    if (!productData.name?.trim()) {
      throw new Error("Product name is required");
    }
    if (!productData.category?.trim()) {
      throw new Error("Product category is required");
    }
    if (!productData.price || productData.price < 0) {
      throw new Error("Valid price is required");
    }

    const { data, error } = await supabase
      .from("products")
      .insert([productData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding product:", error);
    if (error.message.includes("violates check constraint")) {
      throw new Error(
        "Product data validation failed. Check all required fields."
      );
    }
    throw new Error(error.message || "Failed to add product");
  }
}

/**
 * Update an existing product with validation
 * @param {number} id - Product ID
 * @param {Object} updates - Object containing fields to update
 * @returns {Promise<Object>} Updated product object
 */
export async function updateProduct(id, updates) {
  try {
    // Add timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating product:", error);
    if (error.message.includes("violates check constraint")) {
      throw new Error("Update validation failed. Check field values.");
    }
    throw new Error(error.message || "Failed to update product");
  }
}

/**
 * Safely update product stock using database function
 * @param {number} productId - Product ID
 * @param {number} quantityChange - Quantity to change
 * @param {string} operation - Operation type: 'add', 'subtract', 'set'
 * @returns {Promise<Object>} Updated product object
 */
export async function updateProductStock(
  productId,
  quantityChange,
  operation = "subtract"
) {
  try {
    const { data, error } = await supabase.rpc("update_product_stock", {
      product_id: productId,
      quantity_change: quantityChange,
      operation_type: operation,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating product stock:", error);
    throw new Error(error.message || "Failed to update product stock");
  }
}

/**
 * Delete a product from the database
 * @param {number} id - Product ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteProduct(id) {
  try {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw new Error("Failed to delete product");
  }
}

/**
 * Bulk add multiple products with validation
 * @param {Array} products - Array of product objects
 * @returns {Promise<Array>} Array of created product objects
 */
export async function bulkAddProducts(products) {
  try {
    // Validate and prepare all products
    const validatedProducts = products.map((product, index) => {
      if (!product.name?.trim()) {
        throw new Error(`Product at position ${index + 1}: Name is required`);
      }
      if (!product.category?.trim()) {
        throw new Error(
          `Product at position ${index + 1}: Category is required`
        );
      }
      if (!product.price || product.price < 0) {
        throw new Error(
          `Product at position ${index + 1}: Valid price is required`
        );
      }

      return {
        ...product,
        cost_price: product.cost_price || 0,
        pieces_per_sheet: product.pieces_per_sheet || 1,
        sheets_per_box: product.sheets_per_box || 1,
        selling_price: product.selling_price || product.price || 0,
        total_stock: product.total_stock || product.stock || 0,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    const { data, error } = await supabase
      .from("products")
      .insert(validatedProducts)
      .select();

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error bulk adding products:", error);
    throw new Error(error.message || "Failed to bulk add products");
  }
}

/**
 * Get products with low stock using centralized stock logic
 * @param {number} threshold - Stock threshold (default: 10)
 * @returns {Promise<Array>} Array of low-stock products
 */
export async function getLowStockProducts(threshold = STOCK_THRESHOLDS.DEFAULT_THRESHOLD) {
  try {
    console.log(`🔍 Fetching low stock products with threshold: ${threshold}`);
    
    // Get all non-archived products
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_archived", false)
      .order("total_stock", { ascending: true });

    if (error) throw error;

    // Use centralized stock service to filter and normalize
    const normalizedProducts = (products || []).map(normalizeProductData);
    const lowStockProducts = normalizedProducts.filter(product => 
      isLowStock(product, threshold)
    );

    console.log(`✅ Found ${lowStockProducts.length} low stock products`);
    return lowStockProducts;
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    throw new Error("Failed to fetch low stock products");
  }
}

/**
 * Get products by category with analytics
 * @param {string} category - Category name
 * @returns {Promise<Object>} Category products with statistics
 */
export async function getProductsByCategory(category) {
  try {
    const { data: products, error: productsError } = await supabase
      .from("products_enhanced")
      .select("*")
      .ilike("category", `%${category}%`)
      .order("name", { ascending: true });

    if (productsError) throw productsError;

    // Get category analytics
    const totalValue = products.reduce(
      (sum, product) => sum + product.selling_price * product.total_stock,
      0
    );
    const lowStockCount = products.filter(
      (product) => product.stock_status === "Low Stock"
    ).length;
    const outOfStockCount = products.filter(
      (product) => product.stock_status === "Out of Stock"
    ).length;

    return {
      products,
      analytics: {
        totalProducts: products.length,
        totalValue: Math.round(totalValue * 100) / 100,
        lowStockCount,
        outOfStockCount,
        averagePrice:
          products.length > 0
            ? Math.round(
                (products.reduce((sum, p) => sum + p.selling_price, 0) /
                  products.length) *
                  100
              ) / 100
            : 0,
      },
    };
  } catch (error) {
    console.error("Error fetching products by category:", error);
    throw new Error("Failed to fetch products by category");
  }
}

/**
 * Get product audit history
 * @param {number} productId - Product ID
 * @returns {Promise<Array>} Array of audit log entries
 */
export async function getProductAuditHistory(productId) {
  try {
    const { data, error } = await supabase
      .from("product_audit_log")
      .select("*")
      .eq("product_id", productId)
      .order("changed_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching product audit history:", error);
    throw new Error("Failed to fetch product audit history");
  }
}

/**
 * Validate product data before operations
 * @param {Object} product - Product object to validate
 * @returns {Object} Validation result with errors array
 */
export function validateProductData(product) {
  const errors = [];

  if (!product.name?.trim()) {
    errors.push("Product name is required");
  }
  if (!product.category?.trim()) {
    errors.push("Category is required");
  }
  if (!product.price || product.price < 0) {
    errors.push("Valid price is required");
  }
  if (product.cost_price < 0) {
    errors.push("Cost price cannot be negative");
  }
  if (product.stock < 0) {
    errors.push("Stock cannot be negative");
  }
  if (product.pieces_per_sheet <= 0) {
    errors.push("Pieces per sheet must be greater than 0");
  }
  if (product.sheets_per_box <= 0) {
    errors.push("Sheets per box must be greater than 0");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Export constants for use in components
export const STOCK_STATUS = {
  OUT_OF_STOCK: "Out of Stock",
  LOW_STOCK: "Low Stock",
  MEDIUM_STOCK: "Medium Stock",
  IN_STOCK: "In Stock",
};

export const EXPIRY_STATUS = {
  EXPIRED: "Expired",
  EXPIRING_SOON: "Expiring Soon",
  EXPIRING_IN_3_MONTHS: "Expiring in 3 Months",
  GOOD: "Good",
  NO_EXPIRY_DATA: "No Expiry Data",
};

export const SORT_OPTIONS = {
  RELEVANCE: "relevance",
  NAME: "name",
  PRICE_ASC: "price_asc",
  PRICE_DESC: "price_desc",
  STOCK: "stock",
};

// Get total product count
export async function getProductCount() {
  try {
    const { count, error } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_archived", false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error fetching product count:", error);
    throw error;
  }
}

// Get products expiring soon using centralized expiry logic
export async function getExpiringSoonProducts(days = 30) {
  try {
    console.log(`🔍 Fetching products expiring within ${days} days...`);
    
    // Get all non-archived products
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_archived", false);

    if (error) throw error;

    // Use centralized stock and expiry services
    const normalizedProducts = (products || []).map(normalizeProductData);
    const expiringProducts = normalizedProducts
      .filter(product => isExpiringSoon(product, days))
      .map(product => ({
        ...product,
        expiryStatus: getExpiryStatus(product),
        daysUntilExpiry: Math.ceil((new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
      }))
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    console.log(`✅ Found ${expiringProducts.length} products expiring within ${days} days`);
    return expiringProducts;
  } catch (error) {
    console.error("Error fetching expiring products:", error);
    throw error;
  }
}
