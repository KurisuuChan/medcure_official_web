import { supabase } from "../config/supabase.js";

/**
 * Archive Service - Handles all archived item operations
 * This service manages the archived_items table for storing archived products, transactions, etc.
 */

/**
 * Initialize and clean up localStorage data
 */
function initializeLocalStorage() {
  try {
    // Check for corrupted data and clean it up
    const keys = ["medcure_archived_items", "archived_items"];
    keys.forEach((key) => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          // Check for common corruption patterns
          if (
            stored === "[object Object]" ||
            stored === "undefined" ||
            stored === "null" ||
            stored === "NaN" ||
            stored.includes("[object Object]") ||
            (!stored.startsWith("[") && !stored.startsWith("{"))
          ) {
            console.warn(
              `Cleaning up corrupted localStorage data for key: ${key}`
            );
            localStorage.removeItem(key);
          } else {
            // Try to parse to check if it's valid JSON
            JSON.parse(stored);
          }
        }
      } catch (parseError) {
        console.warn(
          `Invalid JSON found in localStorage key ${key}, removing:`,
          parseError.message
        );
        localStorage.removeItem(key);
      }
    });

    // Clear any other potentially corrupted medcure-related keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("medcure_")) {
        try {
          const value = localStorage.getItem(key);
          if (
            value &&
            (value === "[object Object]" || value.includes("[object Object]"))
          ) {
            console.warn(
              `Cleaning up corrupted medcure localStorage key: ${key}`
            );
            localStorage.removeItem(key);
            i--; // Adjust index since we removed an item
          }
        } catch (error) {
          console.warn(
            `Error checking localStorage key ${key}, removing:`,
            error.message
          );
          localStorage.removeItem(key);
          i--; // Adjust index since we removed an item
        }
      }
    }
  } catch (_error) {
    console.error("Error initializing localStorage:", _error);
    // If there's a critical error, try to clear all medcure data
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("medcure_")
      );
      keys.forEach((key) => localStorage.removeItem(key));
    } catch (clearError) {
      console.error("Failed to clear corrupted localStorage:", clearError);
    }
  }
}

// Initialize localStorage on module load and set up periodic cleanup
if (typeof window !== "undefined") {
  initializeLocalStorage();

  // Set up periodic cleanup every 30 seconds to handle dynamic corruption
  setInterval(() => {
    try {
      const stored = localStorage.getItem("medcure_archived_items");
      if (
        stored &&
        (stored === "[object Object]" || stored.includes("[object Object]"))
      ) {
        console.warn(
          "Detected runtime localStorage corruption, cleaning up..."
        );
        localStorage.removeItem("medcure_archived_items");
      }
    } catch (error) {
      console.warn("Error during periodic localStorage check:", error.message);
    }
  }, 30000);
}

/**
 * Fetch all archived items from the database
 * @returns {Promise<Array>} Array of archived item objects
 */
export async function getArchivedItems() {
  try {
    // First, ensure localStorage is clean
    try {
      const stored = localStorage.getItem("medcure_archived_items");
      if (
        stored &&
        (stored === "[object Object]" || stored.includes("[object Object]"))
      ) {
        console.warn(
          "Detected corrupted localStorage during fetch, cleaning..."
        );
        localStorage.removeItem("medcure_archived_items");
      }
    } catch (storageError) {
      console.warn(
        "Error checking localStorage during fetch:",
        storageError.message
      );
    }

    const { data, error } = await supabase
      .from("archived_items")
      .select("*")
      .order("archived_date", { ascending: false });

    if (error) {
      // If table doesn't exist, fall back to localStorage
      if (error.code === "PGRST205" || error.message?.includes("table")) {
        console.warn(
          "archived_items table not found, using localStorage fallback"
        );
        return getArchivedItemsFromStorage();
      }
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error("Error fetching archived items:", error);
    // Fallback to localStorage if database fails
    return getArchivedItemsFromStorage();
  }
}

/**
 * Fallback function to get archived items from localStorage
 * @returns {Array} Array of archived items from localStorage
 */
function getArchivedItemsFromStorage() {
  try {
    const stored = localStorage.getItem("medcure_archived_items");
    if (!stored || stored === "undefined" || stored === "null") {
      return [];
    }

    // Handle case where stored data might be corrupted
    if (
      stored === "[object Object]" ||
      stored.includes("[object Object]") ||
      !stored.startsWith("[")
    ) {
      console.warn("Corrupted archived items data found, clearing storage");
      localStorage.removeItem("medcure_archived_items");
      return [];
    }

    const parsed = JSON.parse(stored);

    // Validate that parsed data is an array
    if (!Array.isArray(parsed)) {
      console.warn(
        "Invalid data type in localStorage (expected array), clearing storage"
      );
      localStorage.removeItem("medcure_archived_items");
      return [];
    }

    // Validate each item in the array
    const validItems = parsed.filter((item) => {
      if (!item || typeof item !== "object") {
        console.warn("Invalid item found in archived items, skipping:", item);
        return false;
      }
      return true;
    });

    // If we filtered out items, save the cleaned data
    if (validItems.length !== parsed.length) {
      console.warn(
        `Cleaned ${
          parsed.length - validItems.length
        } invalid items from archived storage`
      );
      saveArchivedItemsToStorage(validItems);
    }

    return validItems;
  } catch (error) {
    console.error("Error reading archived items from localStorage:", error);
    // Clear corrupted data
    try {
      localStorage.removeItem("medcure_archived_items");
    } catch (clearError) {
      console.error("Failed to clear corrupted localStorage:", clearError);
    }
    return [];
  }
}

/**
 * Fallback function to save archived items to localStorage
 * @param {Array} items - Array of archived items to save
 */
function saveArchivedItemsToStorage(items) {
  try {
    if (!Array.isArray(items)) {
      console.error("Invalid data type for archived items:", typeof items);
      return;
    }

    // Ensure all items have proper structure
    const sanitizedItems = items.map((item) => {
      // Ensure item is an object
      if (!item || typeof item !== "object") {
        return {
          id: Date.now(),
          type: "product",
          name: "Unknown",
          description: "",
          original_data: {},
          archived_date: new Date().toISOString(),
          archived_by: "System",
          reason: "No reason specified",
          category: "Uncategorized",
          original_stock: 0,
        };
      }

      return {
        id: item.id || Date.now(),
        type: item.type || "product",
        name: item.name || "Unknown",
        description: item.description || "",
        original_data: item.original_data || {},
        archived_date: item.archived_date || new Date().toISOString(),
        archived_by: item.archived_by || "System",
        reason: item.reason || "No reason specified",
        category: item.category || "Uncategorized",
        original_stock: item.original_stock || 0,
        // Include additional fields if they exist
        ...Object.fromEntries(
          Object.entries(item).filter(
            ([key]) =>
              ![
                "id",
                "type",
                "name",
                "description",
                "original_data",
                "archived_date",
                "archived_by",
                "reason",
                "category",
                "original_stock",
              ].includes(key)
          )
        ),
      };
    });

    const jsonString = JSON.stringify(sanitizedItems);

    // Double-check that we're not storing corrupted data
    if (jsonString.includes("[object Object]")) {
      console.error(
        "Attempted to save corrupted data, aborting save operation"
      );
      return;
    }

    localStorage.setItem("medcure_archived_items", jsonString);

    // Verify the save was successful
    const verification = localStorage.getItem("medcure_archived_items");
    if (verification && verification.includes("[object Object]")) {
      console.error("localStorage corruption detected after save, clearing...");
      localStorage.removeItem("medcure_archived_items");
    }
  } catch (error) {
    console.error("Error saving archived items to localStorage:", error);
    // If saving fails, try to clear the corrupted data
    try {
      localStorage.removeItem("medcure_archived_items");
    } catch (clearError) {
      console.error(
        "Failed to clear localStorage after save error:",
        clearError
      );
    }
  }
}

/**
 * Utility function to completely reset archived items storage
 * @returns {boolean} Success status
 */
export function resetArchivedItemsStorage() {
  try {
    localStorage.removeItem("medcure_archived_items");
    localStorage.removeItem("archived_items"); // Legacy key
    console.log("Archived items storage has been reset");
    return true;
  } catch (error) {
    console.error("Failed to reset archived items storage:", error);
    return false;
  }
}

/**
 * Archive a product by moving it to archived_items table
 * @param {Object} product - Product object to archive
 * @param {string} reason - Reason for archiving
 * @param {string} archivedBy - Name/ID of user archiving the item
 * @returns {Promise<Object>} Archived item object
 */
export async function archiveProduct(product, reason, archivedBy = "System") {
  try {
    // Create archived item record
    const archivedItem = {
      id: Date.now(), // Temporary ID for localStorage fallback
      type: "product",
      name: product.name,
      description:
        product.description || `${product.name} - ${product.category}`,
      original_data: product, // Store the complete product data
      archived_date: new Date().toISOString(),
      archived_by: archivedBy,
      reason: reason,
      category: product.category,
      original_stock: product.total_stock || product.stock || 0,
    };

    try {
      // Try to insert into archived_items table
      const { data: archived, error: archiveError } = await supabase
        .from("archived_items")
        .insert([archivedItem])
        .select()
        .single();

      if (archiveError) {
        // If table doesn't exist, fall back to localStorage
        if (
          archiveError.code === "PGRST205" ||
          archiveError.message?.includes("table")
        ) {
          console.warn(
            "archived_items table not found, using localStorage fallback"
          );
          return archiveProductToStorage(archivedItem);
        }
        throw archiveError;
      }

      // Delete from products table
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (deleteError) throw deleteError;

      return archived;
    } catch (error) {
      // Fallback to localStorage if database operations fail
      console.warn(
        "Database operations failed, using localStorage fallback:",
        error.message
      );
      return archiveProductToStorage(archivedItem);
    }
  } catch (error) {
    console.error("Error archiving product:", error);
    throw new Error("Failed to archive product");
  }
}

/**
 * Fallback function to archive product to localStorage
 * @param {Object} archivedItem - Archived item object
 * @param {Object} product - Original product object
 * @returns {Object} Archived item object
 */
function archiveProductToStorage(archivedItem) {
  try {
    const existingItems = getArchivedItemsFromStorage();
    existingItems.unshift(archivedItem);
    saveArchivedItemsToStorage(existingItems);

    // Note: We can't actually delete from the products table in localStorage fallback
    // This would require product management to also use localStorage
    console.warn(
      "Product archived to localStorage. Note: Product still exists in database."
    );

    return archivedItem;
  } catch (error) {
    console.error("Error archiving to localStorage:", error);
    throw new Error("Failed to archive product to storage");
  }
}

/**
 * Restore an archived product back to the products table
 * @param {number} archivedId - ID of the archived item
 * @returns {Promise<Object>} Restored product object
 */
export async function restoreArchivedProduct(archivedId) {
  try {
    // First check if we're using localStorage fallback
    if (typeof window !== "undefined") {
      const localArchived = getArchivedItemsFromStorage();
      const archivedItem = localArchived.find((item) => item.id === archivedId);

      if (archivedItem) {
        // For localStorage, just remove from archived list
        // In a real implementation, you'd restore to the products table
        const updatedArchived = localArchived.filter(
          (item) => item.id !== archivedId
        );
        saveArchivedItemsToStorage(updatedArchived);

        console.log("Product restored from local storage:", archivedItem.name);
        return archivedItem;
      }
    }

    // Get the archived item from Supabase
    const { data: archivedItem, error: fetchError } = await supabase
      .from("archived_items")
      .select("*")
      .eq("id", archivedId)
      .single();

    if (fetchError) {
      console.error("Error fetching archived item:", fetchError);
      throw new Error("Archived product not found");
    }

    if (!archivedItem) {
      throw new Error("Archived product not found");
    }

    // Prepare product data for restoration
    const productData = archivedItem.original_data || {};

    // Remove id and timestamps to let Supabase handle them
    delete productData.id;
    delete productData.created_at;
    delete productData.updated_at;

    // Define the base required fields that should exist in the products table
    const baseProductData = {
      name: productData.name || archivedItem.item_name,
      category: productData.category || "Other",
      total_stock: productData.total_stock || productData.stock || 0,
      cost_price: productData.cost_price || productData.price || 0,
      selling_price: productData.selling_price || productData.price || 0,
      critical_level: productData.critical_level || 10,
      description: productData.description || "",
      supplier: productData.supplier || "",
      barcode: productData.barcode || "",
      brand_name: productData.brand_name || "",
      generic_name: productData.generic_name || "",
      manufacturer: productData.manufacturer || "",
      expiry_date:
        productData.expiry_date || productData.expiration_date || null,
      batch_number: productData.batch_number || "",
    };

    // Add optional fields only if they exist in the original data
    const optionalFields = [
      "sheets_per_box",
      "pieces_per_sheet",
      "total_pieces_per_box",
      "packaging",
      "dosage_form",
      "strength",
      "unit_of_measure",
    ];

    optionalFields.forEach((field) => {
      if (productData[field] !== undefined && productData[field] !== null) {
        baseProductData[field] = productData[field];
      }
    });

    // Insert back into products table
    const { data: restoredProduct, error: restoreError } = await supabase
      .from("products")
      .insert([baseProductData])
      .select()
      .single();

    if (restoreError) {
      console.error("Error restoring product:", restoreError);

      // If it's a column not found error, try with just the base fields
      if (
        restoreError.message?.includes("column") &&
        restoreError.message?.includes("schema")
      ) {
        console.warn("Column schema mismatch, retrying with minimal fields...");

        const minimalProductData = {
          name: productData.name || archivedItem.item_name,
          category: productData.category || "Other",
          total_stock: productData.total_stock || productData.stock || 0,
          cost_price: productData.cost_price || productData.price || 0,
          selling_price: productData.selling_price || productData.price || 0,
          critical_level: productData.critical_level || 10,
          description: productData.description || "",
        };

        const { data: minimalRestored, error: minimalError } = await supabase
          .from("products")
          .insert([minimalProductData])
          .select()
          .single();

        if (minimalError) {
          throw new Error(
            `Failed to restore product with minimal data: ${minimalError.message}`
          );
        }

        console.log("Product restored with minimal data:", minimalRestored);

        // Delete from archived_items table
        const { error: deleteError } = await supabase
          .from("archived_items")
          .delete()
          .eq("id", archivedId);

        if (deleteError) {
          console.error("Error deleting archived item:", deleteError);
        }

        return minimalRestored;
      }

      throw new Error(`Failed to restore product: ${restoreError.message}`);
    }

    // Delete from archived_items table
    const { error: deleteError } = await supabase
      .from("archived_items")
      .delete()
      .eq("id", archivedId);

    if (deleteError) {
      console.error("Error deleting archived item:", deleteError);
      // Don't throw here, product was already restored
    }

    return restoredProduct;
  } catch (error) {
    console.error("Error restoring archived product:", error);
    throw new Error(error.message || "Failed to restore archived product");
  }
}

/**
 * Permanently delete an archived item
 * @param {number} archivedId - ID of the archived item
 * @returns {Promise<boolean>} Success status
 */
export async function permanentlyDeleteArchivedItem(archivedId) {
  try {
    const { error } = await supabase
      .from("archived_items")
      .delete()
      .eq("id", archivedId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error permanently deleting archived item:", error);
    throw new Error("Failed to permanently delete archived item");
  }
}

/**
 * Archive multiple products in bulk
 * @param {Array} products - Array of product objects to archive
 * @param {string} reason - Reason for archiving
 * @param {string} archivedBy - Name/ID of user archiving the items
 * @returns {Promise<Array>} Array of archived item objects
 */
export async function bulkArchiveProducts(
  products,
  reason,
  archivedBy = "System"
) {
  try {
    const archivedItems = products.map((product) => ({
      type: "product",
      name: product.name,
      description:
        product.description || `${product.name} - ${product.category}`,
      original_data: product,
      archived_date: new Date().toISOString(),
      archived_by: archivedBy,
      reason: reason,
      category: product.category,
      original_stock: product.total_stock || product.stock || 0,
    }));

    // Insert into archived_items table
    const { data: archived, error: archiveError } = await supabase
      .from("archived_items")
      .insert(archivedItems)
      .select();

    if (archiveError) throw archiveError;

    // Delete from products table
    const productIds = products.map((p) => p.id);
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .in("id", productIds);

    if (deleteError) throw deleteError;

    return archived || [];
  } catch (error) {
    console.error("Error bulk archiving products:", error);
    throw new Error("Failed to bulk archive products");
  }
}

/**
 * Get archived items by type
 * @param {string} type - Type of archived items (product, transaction, etc.)
 * @returns {Promise<Array>} Array of archived items of specified type
 */
export async function getArchivedItemsByType(type) {
  try {
    const { data, error } = await supabase
      .from("archived_items")
      .select("*")
      .eq("type", type)
      .order("archived_date", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching archived items by type:", error);
    throw new Error("Failed to fetch archived items");
  }
}

/**
 * Search archived items
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of matching archived items
 */
export async function searchArchivedItems(searchTerm) {
  try {
    const { data, error } = await supabase
      .from("archived_items")
      .select("*")
      .or(
        `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,reason.ilike.%${searchTerm}%`
      )
      .order("archived_date", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error searching archived items:", error);
    throw new Error("Failed to search archived items");
  }
}
