import { supabase, TABLES } from "../lib/supabase.js";
import {
  mockFetchProducts,
  mockFetchCategories,
  mockFetchProduct,
  mockCreateProduct,
  mockUpdateProduct,
  mockArchiveProduct,
  mockDeleteProduct,
  mockImportProducts,
  mockGetInventorySummary,
  isMockMode,
} from "../utils/mockApi.js";

/**
 * Product Management API Service
 * Handles all product-related database operations
 */

// Get all products with optional filtering
export async function getProducts(filters = {}) {
  // Force mock API for testing - bypass environment check
  console.log("🔧 getProducts called - forcing mock mode");
  return await mockFetchProducts(filters);

  /* Original Supabase code - temporarily disabled
  // Use mock API if enabled
  if (isMockMode()) {
    return await mockFetchProducts(filters);
  }

  try {
    let query = supabase
      .from(TABLES.PRODUCTS)
      .select("*")
      .eq("is_active", true)
      .order("name");

    // Apply filters
    if (filters.category && filters.category !== "all") {
      query = query.eq("category", filters.category);
    }

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%, generic_name.ilike.%${filters.search}%`
      );
    }

    if (filters.lowStock) {
      query = query.lte("total_stock", supabase.raw("critical_level"));
    }

    if (filters.outOfStock) {
      query = query.eq("total_stock", 0);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { data: null, error: error.message };
  }
  */
}

// Get single product by ID
export async function getProduct(id) {
  // Use mock API if enabled
  if (isMockMode()) {
    return await mockFetchProduct(id);
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching product:", error);
    return { data: null, error: error.message };
  }
}

// Create new product
export async function createProduct(productData) {
  // Force mock API for testing - bypass environment check
  console.log("🔧 createProduct called - forcing mock mode");
  return await mockCreateProduct(productData);

  /* Original Supabase code - temporarily disabled
  // Use mock API if enabled
  if (isMockMode()) {
    return await mockCreateProduct(productData);
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .insert([productData])
      .select()
      .single();

    if (error) throw error;

    // Record initial stock movement if stock > 0
    if (productData.total_stock > 0) {
      await createStockMovement({
        product_id: data.id,
        movement_type: "in",
        quantity_change: productData.total_stock,
        remaining_stock: productData.total_stock,
        reference_type: "initial_stock",
        notes: "Initial stock entry",
      });
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error creating product:", error);
    return { data: null, error: error.message };
  }
  */
}

// Update product
export async function updateProduct(id, updates) {
  // Force mock API for testing - bypass environment check
  console.log("🔧 updateProduct called - forcing mock mode");
  return await mockUpdateProduct(id, updates);

  /* Original Supabase code - temporarily disabled
  // Use mock API if enabled
  if (isMockMode()) {
    return await mockUpdateProduct(id, updates);
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error updating product:", error);
    return { data: null, error: error.message };
  }
  */
}

// Update product stock
export async function updateProductStock(
  productId,
  newStock,
  movementType = "adjustment",
  reference = {}
) {
  try {
    // Get current product
    const { data: product, error: productError } = await getProduct(productId);
    if (productError) throw new Error(productError);

    const oldStock = product.total_stock;
    const quantityChange = newStock - oldStock;

    // Update product stock
    const { data: updatedProduct, error: updateError } = await supabase
      .from(TABLES.PRODUCTS)
      .update({ total_stock: newStock })
      .eq("id", productId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Record stock movement
    if (quantityChange !== 0) {
      await createStockMovement({
        product_id: productId,
        movement_type: quantityChange > 0 ? "in" : "out",
        quantity_change: quantityChange,
        remaining_stock: newStock,
        reference_type: reference.type || movementType,
        reference_id: reference.id || null,
        notes: reference.notes || `Stock ${movementType}`,
      });
    }

    return { data: updatedProduct, error: null };
  } catch (error) {
    console.error("Error updating product stock:", error);
    return { data: null, error: error.message };
  }
}

// Archive product (soft delete)
export async function archiveProduct(id) {
  // Force mock API for testing - bypass environment check
  console.log("🔧 archiveProduct called - forcing mock mode");
  return await mockArchiveProduct(id);

  /* Original Supabase code - temporarily disabled
  // Use mock API if enabled
  if (isMockMode()) {
    return await mockArchiveProduct(id);
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .update({ is_active: false })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error archiving product:", error);
    return { data: null, error: error.message };
  }
  */
}

// Hard delete product (only for archived products)
export async function deleteProduct(id) {
  // Force mock API for testing - bypass environment check
  console.log("🔧 deleteProduct called - forcing mock mode");
  return await mockDeleteProduct(id);

  /* Original Supabase code - temporarily disabled
  // Use mock API if enabled
  if (isMockMode()) {
    return await mockDeleteProduct(id);
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .delete()
      .eq("id", id)
      .eq("is_active", false); // Only delete already archived products

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { data: null, error: error.message };
  }
  */
}

// Import products from CSV data
export async function importProducts(productsArray) {
  // Force mock API for testing - bypass environment check
  console.log("🔧 importProducts called - forcing mock mode");
  return await mockImportProducts(productsArray);

  /* Original Supabase code - temporarily disabled
  // Use mock API if enabled
  if (isMockMode()) {
    return await mockImportProducts(productsArray);
  }

  try {
    const results = {
      success: [],
      errors: [],
      total: productsArray.length,
    };

    for (const productData of productsArray) {
      try {
        const { data, error } = await createProduct(productData);

        if (error) {
          results.errors.push({
            product: productData,
            error: error,
          });
        } else {
          results.success.push(data);
        }
      } catch (error) {
        results.errors.push({
          product: productData,
          error: error.message,
        });
      }
    }

    return { data: results, error: null };
  } catch (error) {
    console.error("Error importing products:", error);
    return { data: null, error: error.message };
  }
  */
}

// Get product categories
export async function getCategories() {
  // Force mock API for testing
  console.log("🔧 getCategories called - forcing mock mode");
  return await mockFetchCategories();

  /* Original Supabase code - temporarily disabled
  // Use mock API if enabled
  if (isMockMode()) {
    return await mockFetchCategories();
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { data: null, error: error.message };
  }
  */
}

// Create stock movement record
export async function createStockMovement(movementData) {
  try {
    const { data, error } = await supabase
      .from(TABLES.STOCK_MOVEMENTS)
      .insert([movementData])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error creating stock movement:", error);
    return { data: null, error: error.message };
  }
}

// Get stock movements for a product
export async function getStockMovements(productId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from(TABLES.STOCK_MOVEMENTS)
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return { data: null, error: error.message };
  }
}

// Get inventory summary
export async function getInventorySummary() {
  // Force mock API for testing
  console.log("🔧 getInventorySummary called - forcing mock mode");
  return await mockGetInventorySummary();

  /* Original Supabase code - temporarily disabled
  // Use mock API if enabled
  if (isMockMode()) {
    return await mockGetInventorySummary();
  }

  try {
    const { data: products, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select("total_stock, critical_level, cost_price, selling_price")
      .eq("is_active", true);

    if (error) throw error;

    const summary = products.reduce(
      (acc, product) => {
        acc.totalProducts += 1;
        acc.totalStock += product.total_stock;
        acc.totalValue += product.total_stock * product.cost_price;

        if (product.total_stock === 0) {
          acc.outOfStock += 1;
        } else if (product.total_stock <= product.critical_level) {
          acc.lowStock += 1;
        }

        return acc;
      },
      {
        totalProducts: 0,
        totalStock: 0,
        totalValue: 0,
        lowStock: 0,
        outOfStock: 0,
      }
    );

    return { data: summary, error: null };
  } catch (error) {
    console.error("Error getting inventory summary:", error);
    return { data: null, error: error.message };
  }
  */
}
