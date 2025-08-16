import { supabase, TABLES } from "../lib/supabase.js";

/**
 * Product Management API Service
 * Handles all product-related database operations
 */

// Get all products with optional filtering
export async function getProducts(filters = {}) {
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
        `name.ilike.%${filters.search}%, generic_name.ilike.%${filters.search}%, barcode.ilike.%${filters.search}%`
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
}

// Get single product by ID
export async function getProduct(id) {
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
}

// Update product
export async function updateProduct(id, updates) {
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

// Soft delete product
export async function deleteProduct(id) {
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
    console.error("Error deleting product:", error);
    return { data: null, error: error.message };
  }
}

// Import products from CSV data
export async function importProducts(productsArray) {
  try {
    const results = {
      success: [],
      errors: [],
      total: productsArray.length,
    };

    for (const productData of productsArray) {
      try {
        // Check if product with barcode already exists
        if (productData.barcode) {
          const { data: existing } = await supabase
            .from(TABLES.PRODUCTS)
            .select("id")
            .eq("barcode", productData.barcode)
            .single();

          if (existing) {
            results.errors.push({
              product: productData,
              error: "Product with this barcode already exists",
            });
            continue;
          }
        }

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
}

// Get product categories
export async function getCategories() {
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
}
