// Updated bulk delete function for archiveService.js
// Replace the existing bulkPermanentlyDeleteProducts function with this safer version

import { supabase } from "../config/supabase.js";

export async function bulkPermanentlyDeleteProducts(
  productIds,
  deletedBy = "System"
) {
  try {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new Error("Product IDs array is required and must not be empty");
    }

    // Use the safe delete function from the database
    const { data: deleteResult, error: deleteError } = await supabase.rpc(
      "safe_delete_archived_products",
      {
        product_ids: productIds,
      }
    );

    if (deleteError) {
      throw new Error(`Safe deletion failed: ${deleteError.message}`);
    }

    // The function now returns a single JSONB object, not an array
    const result = deleteResult;

    // Create logs for the operation
    try {
      await createArchiveLog({
        type: "bulk_product_deletion_attempt",
        reason: "Bulk permanent deletion",
        archived_by: deletedBy,
        metadata: {
          requested_count: productIds.length,
          deleted_count: result.deleted_count,
          skipped_count: result.skipped_count,
          skipped_products: result.skipped_products,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (logError) {
      console.warn("Archive log creation failed:", logError);
    }

    // Return structured result with proper messaging
    const hasSkipped = result.skipped_count > 0;
    const successMessage = hasSkipped
      ? `${result.deleted_count} products deleted successfully. ${result.skipped_count} products were skipped because they have sales history or couldn't be found.`
      : `All ${result.deleted_count} products deleted successfully.`;

    return {
      success: result.success,
      totalRequested: productIds.length,
      totalDeleted: result.deleted_count,
      totalSkipped: result.skipped_count,
      skippedProducts: result.skipped_products || [],
      message: result.message || successMessage,
      hasSkippedItems: hasSkipped,
    };
  } catch (error) {
    console.error("Error in bulk permanent deletion:", error);
    throw new Error(`Bulk deletion failed: ${error.message}`);
  }
}

// Helper function to create archive logs
async function createArchiveLog(logData) {
  try {
    const { error } = await supabase.from("archive_logs").insert([
      {
        ...logData,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.warn("Archive log creation error:", error);
    }
  } catch (error) {
    console.warn("Archive log creation failed:", error);
  }
}
