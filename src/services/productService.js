import { supabase } from "../config/supabase.js";

/**
 * Enhanced Product Service - Implements improved backend architecture
 * Leverages database views, functions, and constraints for better data integrity
 */

/**
 * Fetch all products using enhanced database view with fallback
 * @returns {Promise<Array>} Array of enhanced product objects
 */
export async function getProducts() {
  try {
    // Try to use products_enhanced view first (should already filter non-archived)
    let { data, error } = await supabase
      .from("products_enhanced")
      .select("*")
      .eq("is_archived", false)
      .order("name", { ascending: true });

    // If products_enhanced doesn't exist, fallback to products table
    if (error && error.message?.includes("products_enhanced")) {
      console.warn(
        "products_enhanced view not found, falling back to products table"
      );

      const fallbackResult = await supabase
        .from("products")
        .select("*")
        .eq("is_archived", false)
        .order("name", { ascending: true });

      if (fallbackResult.error) throw fallbackResult.error;

      // Add calculated fields that would normally come from products_enhanced view
      data = (fallbackResult.data || []).map((product) => ({
        ...product,
        stock_status:
          product.stock <= 0
            ? "Out of Stock"
            : product.stock <= (product.reorder_level || 10)
            ? "Low Stock"
            : "In Stock",
        current_stock: product.stock || product.total_stock || 0,
        total_stock: product.total_stock || product.stock || 0,
        expiry_status: !product.expiry_date
          ? "No Expiry Data"
          : new Date(product.expiry_date) <= new Date()
          ? "Expired"
          : new Date(product.expiry_date) <=
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          ? "Expiring Soon"
          : "Good",
      }));
    } else if (error) {
      throw error;
    }

    // Products now come with calculated fields from the database view
    // No need for frontend manipulation - data integrity handled by DB
    return data || [];
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
    const { data, error } = await supabase.rpc("search_products_advanced", {
      search_term: searchTerm || null,
      category_filter: category,
      stock_status_filter: stockStatus,
      price_range_min: minPrice,
      price_range_max: maxPrice,
      sort_by: sortBy,
      limit_count: limit,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error in advanced search:", error);
    throw new Error("Failed to perform advanced search");
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
 * Get products with low stock using enhanced view
 * @returns {Promise<Array>} Array of low-stock products
 */
export async function getLowStockProducts() {
  try {
    const { data, error } = await supabase
      .from("products_enhanced")
      .select("*")
      .or(`stock_status.eq.Low Stock,stock_status.eq.Out of Stock`)
      .order("total_stock", { ascending: true });

    if (error) throw error;
    return data || [];
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

// Get products expiring soon (within 30 days)
export async function getExpiringSoonProducts(days = 30) {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabase
      .from("products")
      .select("id, name, expiry_date, stock, total_stock, reorder_level")
      .eq("is_archived", false)
      .not("expiry_date", "is", null)
      .lte("expiry_date", futureDate.toISOString())
      .order("expiry_date", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching expiring products:", error);
    throw error;
  }
}
