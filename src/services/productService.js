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
  if (isMockMode()) {
    console.log("🔧 getProducts called - using mock mode");
    return await mockFetchProducts(filters);
  }

  console.log("🔄 getProducts called - using backend mode");

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

    if (error) {
      console.error("❌ Error fetching products:", error);
      throw error;
    }

    console.log("✅ Products fetched from backend:", data?.length || 0);

    return {
      data: data || [],
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("❌ Error in getProducts:", error);
    return {
      data: [],
      error: error.message,
      success: false,
    };
  }
}

// Get single product by ID
export async function getProduct(id) {
  if (isMockMode()) {
    console.log("🔧 getProduct called - using mock mode");
    return await mockFetchProduct(id);
  }

  console.log("🔄 getProduct called - using backend mode");

  try {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("❌ Error fetching product:", error);
      throw error;
    }

    console.log("✅ Product fetched from backend:", data);

    return { data, error: null, success: true };
  } catch (error) {
    console.error("❌ Error in getProduct:", error);
    return { data: null, error: error.message, success: false };
  }
}

// Get categories
export async function getCategories() {
  if (isMockMode()) {
    console.log("🔧 getCategories called - using mock mode");
    return await mockFetchCategories();
  }

  console.log("🔄 getCategories called - using backend mode");

  try {
    const { data, error } = await supabase
      .from(TABLES.CATEGORIES)
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("❌ Error fetching categories:", error);
      throw error;
    }

    console.log("✅ Categories fetched from backend:", data?.length || 0);

    return { data: data || [], error: null, success: true };
  } catch (error) {
    console.error("❌ Error in getCategories:", error);
    return { data: [], error: error.message, success: false };
  }
}

// Create new product
export async function createProduct(productData) {
  if (isMockMode()) {
    console.log("🔧 createProduct called - using mock mode");
    return await mockCreateProduct(productData);
  }

  console.log("🔄 createProduct called - using backend mode");

  try {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .insert([productData])
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating product:", error);
      throw error;
    }

    // Record initial stock movement if stock > 0
    if (productData.total_stock > 0) {
      await supabase.from(TABLES.STOCK_MOVEMENTS).insert({
        product_id: data.id,
        movement_type: "in",
        quantity_change: productData.total_stock,
        remaining_stock: productData.total_stock,
        reference_type: "initial_stock",
        notes: "Initial stock entry",
      });
    }

    console.log("✅ Product created in backend:", data);

    return { data, error: null, success: true };
  } catch (error) {
    console.error("❌ Error in createProduct:", error);
    return { data: null, error: error.message, success: false };
  }
}

// Update existing product
export async function updateProduct(id, productData) {
  if (isMockMode()) {
    console.log("🔧 updateProduct called - using mock mode");
    return await mockUpdateProduct(id, productData);
  }

  console.log("🔄 updateProduct called - using backend mode");

  try {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .update(productData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Error updating product:", error);
      throw error;
    }

    console.log("✅ Product updated in backend:", data);

    return { data, error: null, success: true };
  } catch (error) {
    console.error("❌ Error in updateProduct:", error);
    return { data: null, error: error.message, success: false };
  }
}

// Archive product (soft delete)
export async function archiveProduct(id, reason = "Product archived") {
  if (isMockMode()) {
    console.log("🔧 archiveProduct called - using mock mode");
    return await mockArchiveProduct(id, reason);
  }

  console.log("🔄 archiveProduct called - using backend mode");

  try {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Error archiving product:", error);
      throw error;
    }

    // Record stock movement for archiving
    await supabase.from(TABLES.STOCK_MOVEMENTS).insert({
      product_id: id,
      movement_type: "archived",
      quantity_change: 0,
      remaining_stock: data.total_stock,
      reference_type: "archive",
      notes: reason,
    });

    console.log("✅ Product archived in backend:", data);

    return { data, error: null, success: true };
  } catch (error) {
    console.error("❌ Error in archiveProduct:", error);
    return { data: null, error: error.message, success: false };
  }
}

// Delete product permanently
export async function deleteProduct(id) {
  if (isMockMode()) {
    console.log("🔧 deleteProduct called - using mock mode");
    return await mockDeleteProduct(id);
  }

  console.log("🔄 deleteProduct called - using backend mode");

  try {
    const { error } = await supabase
      .from(TABLES.PRODUCTS)
      .delete()
      .eq("id", id)
      .eq("is_active", false); // Only delete archived products

    if (error) {
      console.error("❌ Error deleting product:", error);
      throw error;
    }

    console.log("✅ Product deleted from backend");

    return { data: { success: true }, error: null, success: true };
  } catch (error) {
    console.error("❌ Error in deleteProduct:", error);
    return { data: null, error: error.message, success: false };
  }
}

// Import products from CSV
export async function importProducts(products) {
  if (isMockMode()) {
    console.log("🔧 importProducts called - using mock mode");
    return await mockImportProducts(products);
  }

  console.log("🔄 importProducts called - using backend mode");

  try {
    const results = {
      success: [],
      errors: [],
      total: products.length,
    };

    for (const product of products) {
      try {
        const { data, error } = await supabase
          .from(TABLES.PRODUCTS)
          .insert([product])
          .select()
          .single();

        if (error) {
          results.errors.push({ product, error: error.message });
        } else {
          results.success.push(data);

          // Record initial stock movement if stock > 0
          if (product.total_stock > 0) {
            await supabase.from(TABLES.STOCK_MOVEMENTS).insert({
              product_id: data.id,
              movement_type: "in",
              quantity_change: product.total_stock,
              remaining_stock: product.total_stock,
              reference_type: "import",
              notes: "CSV import",
            });
          }
        }
      } catch (error) {
        results.errors.push({ product, error: error.message });
      }
    }

    console.log("✅ Products imported to backend:", results);

    return { data: results, error: null, success: true };
  } catch (error) {
    console.error("❌ Error in importProducts:", error);
    return { data: null, error: error.message, success: false };
  }
}

// Get inventory summary
export async function getInventorySummary() {
  if (isMockMode()) {
    console.log("🔧 getInventorySummary called - using mock mode");
    return await mockGetInventorySummary();
  }

  console.log("🔄 getInventorySummary called - using backend mode");

  try {
    const { data: products, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select(
        "total_stock, cost_price, selling_price, critical_level, is_active"
      )
      .eq("is_active", true);

    if (error) {
      console.error("❌ Error fetching inventory summary:", error);
      throw error;
    }

    const summary = products.reduce(
      (acc, product) => {
        acc.totalProducts += 1;
        acc.totalValue += product.total_stock * product.cost_price;
        acc.totalRetailValue += product.total_stock * product.selling_price;

        if (product.total_stock <= product.critical_level) {
          acc.lowStockCount += 1;
        }

        if (product.total_stock === 0) {
          acc.outOfStockCount += 1;
        }

        return acc;
      },
      {
        totalProducts: 0,
        totalValue: 0,
        totalRetailValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
      }
    );

    console.log("✅ Inventory summary fetched from backend:", summary);

    return { data: summary, error: null, success: true };
  } catch (error) {
    console.error("❌ Error in getInventorySummary:", error);
    return { data: null, error: error.message, success: false };
  }
}

// Update product stock
export async function updateProductStock(
  productId,
  newStock,
  movementType = "adjustment",
  options = {}
) {
  if (isMockMode()) {
    console.log("🔧 updateProductStock called - using mock mode");
    // Mock doesn't have this function, return success
    return { data: { success: true }, error: null, success: true };
  }

  console.log("🔄 updateProductStock called - using backend mode");

  try {
    // Get current product data
    const { data: currentProduct, error: fetchError } = await supabase
      .from(TABLES.PRODUCTS)
      .select("total_stock")
      .eq("id", productId)
      .single();

    if (fetchError) {
      console.error("❌ Error fetching current product:", fetchError);
      throw fetchError;
    }

    const quantityChange = newStock - currentProduct.total_stock;

    // Update product stock
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .update({
        total_stock: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .select()
      .single();

    if (error) {
      console.error("❌ Error updating product stock:", error);
      throw error;
    }

    // Record stock movement
    await supabase.from(TABLES.STOCK_MOVEMENTS).insert({
      product_id: productId,
      movement_type: movementType,
      quantity_change: quantityChange,
      remaining_stock: newStock,
      reference_type: options.reference_type || "manual_adjustment",
      reference_id: options.reference_id || null,
      notes: options.notes || "Stock adjustment",
    });

    console.log("✅ Product stock updated in backend:", data);

    return { data, error: null, success: true };
  } catch (error) {
    console.error("❌ Error in updateProductStock:", error);
    return { data: null, error: error.message, success: false };
  }
}

export default {
  getProducts,
  getProduct,
  getCategories,
  createProduct,
  updateProduct,
  archiveProduct,
  deleteProduct,
  importProducts,
  getInventorySummary,
  updateProductStock,
};
