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
      .order("name", { ascending: true });

    if (error) throw error;

    // Add default packaging information for POS system
    const productsWithPackaging = (data || []).map((product) => ({
      ...product,
      // Ensure packaging object exists
      packaging: product.packaging || {
        piecesPerSheet: 10,
        sheetsPerBox: 10,
        totalPieces: 100,
      },
      // Map packaging properties for QuantitySelectionModal compatibility
      pieces_per_sheet: product.packaging?.piecesPerSheet || 10,
      sheets_per_box: product.packaging?.sheetsPerBox || 10,
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
      .order("stock", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    throw new Error("Failed to fetch low stock products");
  }
}

/**
 * Search products by name or category
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of matching products
 */
export async function searchProducts(searchTerm) {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error searching products:", error);
    throw new Error("Failed to search products");
  }
}
