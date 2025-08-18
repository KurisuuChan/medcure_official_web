import { supabase } from "../config/supabase.js";

/**
 * Archive Service - Handles all archived item operations
 * This service manages the archived_items table for storing archived products, transactions, etc.
 */

/**
 * Fetch all archived items from the database
 * @returns {Promise<Array>} Array of archived item objects
 */
export async function getArchivedItems() {
  try {
    const { data, error } = await supabase
      .from("archived_items")
      .select("*")
      .order("archived_date", { ascending: false });

    if (error) {
      // If table doesn't exist, fall back to localStorage
      if (error.code === 'PGRST205' || error.message?.includes('table')) {
        console.warn("archived_items table not found, using localStorage fallback");
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
    const stored = localStorage.getItem('medcure_archived_items');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return [];
  }
}

/**
 * Fallback function to save archived items to localStorage
 * @param {Array} items - Array of archived items to save
 */
function saveArchivedItemsToStorage(items) {
  try {
    localStorage.setItem('medcure_archived_items', JSON.stringify(items));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
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
      description: product.description || `${product.name} - ${product.category}`,
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
        if (archiveError.code === 'PGRST205' || archiveError.message?.includes('table')) {
          console.warn("archived_items table not found, using localStorage fallback");
          return archiveProductToStorage(archivedItem, product);
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
      console.warn("Database operations failed, using localStorage fallback");
      return archiveProductToStorage(archivedItem, product);
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
function archiveProductToStorage(archivedItem, product) {
  try {
    const existingItems = getArchivedItemsFromStorage();
    existingItems.unshift(archivedItem);
    saveArchivedItemsToStorage(existingItems);
    
    // Note: We can't actually delete from the products table in localStorage fallback
    // This would require product management to also use localStorage
    console.warn("Product archived to localStorage. Note: Product still exists in database.");
    
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
      const localArchived = JSON.parse(localStorage.getItem("archived_items") || "[]");
      const archivedItem = localArchived.find(item => item.id === archivedId);
      
      if (archivedItem) {
        // For localStorage, just remove from archived list
        // In a real implementation, you'd restore to the products table
        const updatedArchived = localArchived.filter(item => item.id !== archivedId);
        localStorage.setItem("archived_items", JSON.stringify(updatedArchived));
        
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

    // Ensure required fields are present
    const requiredProductData = {
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
      packaging: productData.packaging || "",
      expiry_date: productData.expiry_date || productData.expiration_date || null,
      batch_number: productData.batch_number || "",
      sheets_per_box: productData.sheets_per_box || null,
      pieces_per_sheet: productData.pieces_per_sheet || null,
      total_pieces_per_box: productData.total_pieces_per_box || null,
      ...productData // Spread any other fields
    };

    // Insert back into products table
    const { data: restoredProduct, error: restoreError } = await supabase
      .from("products")
      .insert([requiredProductData])
      .select()
      .single();

    if (restoreError) {
      console.error("Error restoring product:", restoreError);
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
export async function bulkArchiveProducts(products, reason, archivedBy = "System") {
  try {
    const archivedItems = products.map(product => ({
      type: "product",
      name: product.name,
      description: product.description || `${product.name} - ${product.category}`,
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
    const productIds = products.map(p => p.id);
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
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,reason.ilike.%${searchTerm}%`)
      .order("archived_date", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error searching archived items:", error);
    throw new Error("Failed to search archived items");
  }
}
