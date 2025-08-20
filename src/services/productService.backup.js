import { supabase } from "../config/supabase.js";

/**
 * Product Service - Handles all product-related database operations
 * This is the only layer that directly communicates with Supabase for products
 */

/**
 * Fetch all products from the database
 * @returns {Promise<Array>} Array of product objects
 */
export async function getProducts() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_archived", false)
      .order("name", { ascending: true });

    if (error) throw error;

    // Add default packaging information for POS system
    const productsWithPackaging = (data || []).map((product) => ({
      ...product,
      // Ensure packaging object exists
      packaging: product.packaging || {
        piecesPerSheet: product.pieces_per_sheet || 10,
        sheetsPerBox: product.sheets_per_box || 10,
        totalPieces:
          (product.pieces_per_sheet || 10) * (product.sheets_per_box || 10),
      },
      // Map packaging properties for QuantitySelectionModal compatibility
      pieces_per_sheet:
        product.pieces_per_sheet || product.packaging?.piecesPerSheet || 10,
      sheets_per_box:
        product.sheets_per_box || product.packaging?.sheetsPerBox || 10,
      total_pieces_per_box:
        (product.pieces_per_sheet || product.packaging?.piecesPerSheet || 10) *
        (product.sheets_per_box || product.packaging?.sheetsPerBox || 10),
      // Map price properties for compatibility
      selling_price: product.selling_price || product.price || 0,
      cost_price: product.cost_price || 0,
      // Map stock properties
      total_stock: product.total_stock || product.stock || 0,
    }));

    return productsWithPackaging;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products");
  }
}

/**
 * Get a single product by ID
 * @param {number} id - Product ID
 * @returns {Promise<Object>} Product object
 */
export async function getProduct(id) {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("is_archived", false)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw new Error("Failed to fetch product");
  }
}

/**
 * Add a new product to the database
 * @param {Object} product - Product object to add
 * @returns {Promise<Object>} Created product object
 */
export async function addProduct(product) {
  try {
    const { data, error } = await supabase
      .from("products")
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding product:", error);
    throw new Error("Failed to add product");
  }
}

/**
 * Update an existing product
 * @param {number} id - Product ID
 * @param {Object} updates - Object containing fields to update
 * @returns {Promise<Object>} Updated product object
 */
export async function updateProduct(id, updates) {
  try {
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating product:", error);
    throw new Error("Failed to update product");
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
 * Bulk add multiple products (for CSV import)
 * @param {Array} products - Array of product objects
 * @returns {Promise<Array>} Array of created product objects
 */
export async function bulkAddProducts(products) {
  try {
    const { data, error } = await supabase
      .from("products")
      .insert(products)
      .select();

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error bulk adding products:", error);
    throw new Error("Failed to bulk add products");
  }
}

/**
 * Get products with low stock (below a certain threshold)
 * @param {number} threshold - Stock threshold (default: 10)
 * @returns {Promise<Array>} Array of low-stock products
 */
export async function getLowStockProducts(threshold = 10) {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .lt("stock", threshold)
      .eq("is_archived", false)
      .order("stock", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    throw new Error("Failed to fetch low stock products");
  }
}

/**
 * Get total count of active products
 * @returns {Promise<number>} Total product count
 */
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
    throw new Error("Failed to fetch product count");
  }
}

/**
 * Get products expiring soon
 * @param {number} days - Number of days ahead to check for expiration
 * @returns {Promise<Array>} Products expiring within the specified days
 */
export async function getExpiringSoonProducts(days = 30) {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .not("expiration_date", "is", null)
      .lte("expiration_date", futureDate.toISOString().split("T")[0])
      .gte("expiration_date", new Date().toISOString().split("T")[0])
      .eq("is_archived", false)
      .order("expiration_date", { ascending: true });

    if (error) throw error;

    // Add days until expiration
    return (data || []).map((product) => ({
      ...product,
      daysUntilExpiration: Math.ceil(
        (new Date(product.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
      ),
    }));
  } catch (error) {
    console.error("Error fetching expiring products:", error);
    throw new Error("Failed to fetch expiring products");
  }
}

/**
 * Search products by name, category, or other criteria
 * @param {string} searchTerm - Search term to filter products
 * @param {Object} filters - Additional filters
 * @param {string} filters.category - Category filter
 * @param {number} filters.minPrice - Minimum price filter
 * @param {number} filters.maxPrice - Maximum price filter
 * @returns {Promise<Array>} Filtered products
 */
export async function searchProducts(searchTerm = "", filters = {}) {
  try {
    let query = supabase.from("products").select("*").eq("is_archived", false);

    // Apply search term (search in name, category, manufacturer)
    if (searchTerm.trim()) {
      query = query.or(
        `name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,manufacturer.ilike.%${searchTerm}%`
      );
    }

    // Apply category filter
    if (filters.category) {
      query = query.eq("category", filters.category);
    }

    // Apply price range filters
    if (filters.minPrice !== undefined) {
      query = query.gte("price", filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte("price", filters.maxPrice);
    }

    // Order by name
    query = query.order("name", { ascending: true });

    const { data, error } = await query;

    if (error) throw error;

    // Add packaging information like in getProducts
    const productsWithPackaging = (data || []).map((product) => ({
      ...product,
      packaging: product.packaging || {
        piecesPerSheet: product.pieces_per_sheet || 10,
        sheetsPerBox: product.sheets_per_box || 10,
        totalPieces:
          (product.pieces_per_sheet || 10) * (product.sheets_per_box || 10),
      },
      pieces_per_sheet:
        product.pieces_per_sheet || product.packaging?.piecesPerSheet || 10,
      sheets_per_box:
        product.sheets_per_box || product.packaging?.sheetsPerBox || 10,
      total_pieces_per_box:
        (product.pieces_per_sheet || product.packaging?.piecesPerSheet || 10) *
        (product.sheets_per_box || product.packaging?.sheetsPerBox || 10),
      selling_price: product.selling_price || product.price || 0,
      cost_price: product.cost_price || 0,
      total_stock: product.total_stock || product.stock || 0,
    }));

    return productsWithPackaging;
  } catch (error) {
    console.error("Error searching products:", error);
    throw new Error("Failed to search products");
  }
}
