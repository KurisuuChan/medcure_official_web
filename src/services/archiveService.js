import { supabase } from "../config/supabase.js";

/**
 * Enhanced Archive Service - Database-Only Approach with Soft Deletes
 * This service uses soft deletes for better data consistency and eliminates localStorage dependency
 */

/**
 * Archive a product using soft delete approach
 * @param {Object} product - Product object to archive
 * @param {string} reason - Reason for archiving
 * @param {string} archivedBy - Name/ID of user archiving the item
 * @returns {Promise<Object>} Result of archive operation
 */
export async function archiveProduct(product, reason, archivedBy = "System") {
  try {
    // First, check if product is already archived
    const { data: existingProduct, error: checkError } = await supabase
      .from("products")
      .select("is_archived")
      .eq("id", product.id)
      .single();

    if (checkError) {
      throw new Error(`Failed to check product status: ${checkError.message}`);
    }

    if (existingProduct?.is_archived) {
      console.log(`Product ${product.name} is already archived.`);
      return { success: true, message: "Product already archived" };
    }

    // Update product with soft delete flag and archive metadata
    const { data: archivedProduct, error: archiveError } = await supabase
      .from("products")
      .update({
        is_archived: true,
        archived_date: new Date().toISOString(),
        archived_by: archivedBy,
        archive_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id)
      .select()
      .single();

    if (archiveError) {
      throw new Error(`Failed to archive product: ${archiveError.message}`);
    }

    // Optional: Create archive log entry for audit trail
    await createArchiveLog({
      type: "product_archived",
      item_id: product.id,
      item_name: product.name,
      reason: reason,
      archived_by: archivedBy,
      original_data: product,
    });

    return {
      success: true,
      archived: archivedProduct,
      message: `Product "${product.name}" archived successfully`,
    };
  } catch (error) {
    console.error("Error archiving product:", error);
    throw new Error(`Failed to archive product: ${error.message}`);
  }
}

/**
 * Restore an archived product
 * @param {number} productId - ID of the product to restore
 * @param {string} restoredBy - Name/ID of user restoring the item
 * @returns {Promise<Object>} Result of restore operation
 */
export async function restoreArchivedProduct(productId, restoredBy = "System") {
  try {
    // Check if product exists and is archived
    const { data: existingProduct, error: checkError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (checkError) {
      throw new Error(`Failed to find product: ${checkError.message}`);
    }

    if (!existingProduct.is_archived) {
      return { success: true, message: "Product is not archived" };
    }

    // Restore product by removing archive flags
    const { data: restoredProduct, error: restoreError } = await supabase
      .from("products")
      .update({
        is_archived: false,
        archived_date: null,
        archived_by: null,
        archive_reason: null,
        restored_date: new Date().toISOString(),
        restored_by: restoredBy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .select()
      .single();

    if (restoreError) {
      throw new Error(`Failed to restore product: ${restoreError.message}`);
    }

    // Create restore log entry
    await createArchiveLog({
      type: "product_restored",
      item_id: productId,
      item_name: existingProduct.name,
      reason: "Product restored from archive",
      archived_by: restoredBy,
      original_data: existingProduct,
    });

    return {
      success: true,
      restored: restoredProduct,
      message: `Product "${existingProduct.name}" restored successfully`,
    };
  } catch (error) {
    console.error("Error restoring product:", error);
    throw new Error(`Failed to restore product: ${error.message}`);
  }
}

/**
 * Get all archived products
 * @returns {Promise<Array>} Array of archived products
 */
export async function getArchivedProducts() {
  try {
    const { data: archivedProducts, error } = await supabase
      .from("products")
      .select("*")
      .or("is_archived.eq.true,archived_at.not.is.null")
      .order("archived_date", { ascending: false, nullsLast: true });

    if (error) {
      throw new Error(`Failed to fetch archived products: ${error.message}`);
    }

    // Filter and ensure we only return actually archived products
    const validArchivedProducts = (archivedProducts || []).filter(
      (product) => product.is_archived === true || product.archived_at !== null
    );

    // Map archive_reason to reason for compatibility with frontend
    const mappedProducts = validArchivedProducts.map((product) => ({
      ...product,
      reason: product.archive_reason || product.reason, // Map archive_reason to reason
      archivedBy: product.archived_by, // Also map archived_by for consistency
      archivedDate: product.archived_date, // Map archived_date for consistency
    }));

    return mappedProducts;
  } catch (error) {
    console.error("Error fetching archived products:", error);
    throw new Error(`Failed to fetch archived products: ${error.message}`);
  }
}

/**
 * Permanently delete an archived product
 * @param {number} productId - ID of the product to permanently delete
 * @param {string} deletedBy - Name/ID of user deleting the item
 * @returns {Promise<Object>} Result of delete operation
 */
export async function permanentlyDeleteProduct(
  productId,
  deletedBy = "System"
) {
  try {
    // Check if product exists and is archived (using both conditions for compatibility)
    const { data: existingProduct, error: checkError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .or("is_archived.eq.true,archived_at.not.is.null")
      .single();

    if (checkError) {
      if (checkError.code === "PGRST116") {
        throw new Error(`Product not found or not archived`);
      }
      throw new Error(`Failed to find archived product: ${checkError.message}`);
    }

    if (!existingProduct) {
      throw new Error("Product not found or not archived");
    }

    // Create deletion log before deleting
    try {
      await createArchiveLog({
        type: "product_permanently_deleted",
        item_id: productId,
        item_name: existingProduct.name,
        reason: "Product permanently deleted",
        archived_by: deletedBy,
        original_data: existingProduct,
      });
    } catch (logError) {
      console.warn("Failed to create archive log:", logError);
      // Continue with deletion even if logging fails
    }

    // Permanently delete the product
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (deleteError) {
      throw new Error(
        `Failed to permanently delete product: ${deleteError.message}`
      );
    }

    return {
      success: true,
      message: `Product "${existingProduct.name}" permanently deleted`,
      deletedProduct: existingProduct,
    };
  } catch (error) {
    console.error("Error permanently deleting product:", error);
    throw new Error(`Failed to permanently delete product: ${error.message}`);
  }
}

/**
 * Permanently delete multiple archived products in bulk
 * @param {Array<number>} productIds - Array of product IDs to delete
 * @param {string} deletedBy - Who initiated the deletion
 * @returns {Promise<Object>} Bulk deletion result
 */
export async function bulkPermanentlyDeleteProducts(
  productIds,
  deletedBy = "System"
) {
  try {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new Error("Product IDs array is required and must not be empty");
    }

    // First, fetch all products to be deleted for validation and logging
    const { data: productsToDelete, error: fetchError } = await supabase
      .from("products")
      .select("id, name, category, archived_date, is_archived, archived_at")
      .in("id", productIds)
      .or("is_archived.eq.true,archived_at.not.is.null");

    if (fetchError) {
      throw new Error(
        `Failed to fetch products for deletion: ${fetchError.message}`
      );
    }

    if (!productsToDelete || productsToDelete.length === 0) {
      throw new Error("No archived products found with the provided IDs");
    }

    // Validate that all products are archived
    const validProductIds = productsToDelete.map((p) => p.id);
    const invalidIds = productIds.filter((id) => !validProductIds.includes(id));

    if (invalidIds.length > 0) {
      console.warn(`Skipping non-archived products: ${invalidIds.join(", ")}`);
    }

    const results = {
      success: true,
      totalRequested: productIds.length,
      totalDeleted: 0,
      skipped: invalidIds.length,
      deletedProducts: [],
      errors: [],
    };

    // Create deletion logs for all products (batch operation)
    try {
      const logEntries = productsToDelete.map((product) => ({
        type: "product_permanently_deleted",
        item_id: product.id,
        item_name: product.name,
        reason: "Bulk permanent deletion",
        archived_by: deletedBy,
        original_data: product,
      }));

      // Insert all logs at once if createArchiveLog supports batch
      await Promise.allSettled(
        logEntries.map((logEntry) => createArchiveLog(logEntry))
      );
    } catch (logError) {
      console.warn("Some archive logs failed to create:", logError);
      // Continue with deletion even if some logs fail
    }

    // Perform bulk deletion using Supabase's bulk delete
    const { error: bulkDeleteError } = await supabase
      .from("products")
      .delete()
      .in("id", validProductIds);

    if (bulkDeleteError) {
      throw new Error(`Bulk deletion failed: ${bulkDeleteError.message}`);
    }

    results.totalDeleted = validProductIds.length;
    results.deletedProducts = productsToDelete;

    return results;
  } catch (error) {
    console.error("Error in bulk permanent deletion:", error);
    throw new Error(`Bulk deletion failed: ${error.message}`);
  }
}

/**
 * Create an archive log entry for audit trail
 * @param {Object} logData - Log entry data
 * @returns {Promise<void>}
 */
async function createArchiveLog(logData) {
  try {
    const { error } = await supabase.from("archive_logs").insert([
      {
        ...logData,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error && error.code !== "42P01") {
      // Ignore table doesn't exist error
      console.warn("Failed to create archive log:", error.message);
    }
  } catch (error) {
    console.warn("Archive log creation failed:", error.message);
  }
}

/**
 * Search archived products
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of matching archived products
 */
export async function searchArchivedProducts(searchTerm) {
  try {
    if (!searchTerm || searchTerm.length < 2) {
      return getArchivedProducts();
    }

    const { data: results, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_archived", true)
      .or(
        `name.ilike.%${searchTerm}%, category.ilike.%${searchTerm}%, manufacturer.ilike.%${searchTerm}%`
      )
      .order("archived_date", { ascending: false });

    if (error) {
      throw new Error(`Failed to search archived products: ${error.message}`);
    }

    // Map archive_reason to reason for consistency with frontend
    const mappedResults = (results || []).map((product) => ({
      ...product,
      reason: product.archive_reason || product.reason, // Map archive_reason to reason
      archivedBy: product.archived_by, // Also map archived_by for consistency
      archivedDate: product.archived_date, // Map archived_date for consistency
    }));

    return mappedResults;
  } catch (error) {
    console.error("Error searching archived products:", error);
    throw new Error(`Failed to search archived products: ${error.message}`);
  }
}

/**
 * Get archive statistics
 * @returns {Promise<Object>} Archive statistics
 */
export async function getArchiveStats() {
  try {
    const { data: stats, error } = await supabase
      .from("products")
      .select("is_archived, category")
      .eq("is_archived", true);

    if (error) {
      throw new Error(`Failed to get archive stats: ${error.message}`);
    }

    const totalArchived = stats.length;
    const categoryCounts = stats.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {});

    return {
      totalArchived,
      categoryCounts,
      categories: Object.keys(categoryCounts),
    };
  } catch (error) {
    console.error("Error getting archive stats:", error);
    return {
      totalArchived: 0,
      categoryCounts: {},
      categories: [],
    };
  }
}

/**
 * Bulk archive multiple products
 * @param {Array} productIds - Array of product IDs to archive
 * @param {string} reason - Reason for bulk archiving
 * @param {string} archivedBy - Name/ID of user archiving items
 * @returns {Promise<Object>} Result of bulk archive operation
 */
export async function bulkArchiveProducts(
  productIds,
  reason,
  archivedBy = "System"
) {
  try {
    if (!productIds || productIds.length === 0) {
      throw new Error("No products selected for archiving");
    }

    // Update all products in one operation
    const { data: archivedProducts, error: archiveError } = await supabase
      .from("products")
      .update({
        is_archived: true,
        archived_date: new Date().toISOString(),
        archived_by: archivedBy,
        archive_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .in("id", productIds)
      .eq("is_archived", false) // Only archive non-archived products
      .select();

    if (archiveError) {
      throw new Error(
        `Failed to bulk archive products: ${archiveError.message}`
      );
    }

    // Create log entries for all archived products
    const logEntries = (archivedProducts || []).map((product) => ({
      type: "product_archived",
      item_id: product.id,
      item_name: product.name,
      reason: `Bulk: ${reason}`,
      archived_by: archivedBy,
      original_data: product,
      created_at: new Date().toISOString(),
    }));

    if (logEntries.length > 0) {
      await supabase.from("archive_logs").insert(logEntries);
    }

    return {
      success: true,
      archivedCount: archivedProducts?.length || 0,
      message: `${
        archivedProducts?.length || 0
      } products archived successfully`,
    };
  } catch (error) {
    console.error("Error bulk archiving products:", error);
    throw new Error(`Failed to bulk archive products: ${error.message}`);
  }
}

// Export the main functions for use in hooks
export default archiveProduct;
