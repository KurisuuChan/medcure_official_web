/**
 * MedCure Archived Items Service
 * Handles all archived content including products, transactions, suppliers, and employees
 */

import { supabase, TABLES } from "../lib/supabase.js";
import {
  mockGetArchivedItems,
  mockRestoreItem,
  mockPermanentDeleteItem,
  mockGetArchivedStats,
  mockArchiveTransaction,
  mockArchiveSupplier,
  mockArchiveEmployee,
  isMockMode,
} from "../utils/mockApi.js";

/**
 * Get all archived items with filtering and pagination
 * @param {Object} filters - Filter options
 * @param {string} filters.type - Item type ('product', 'transaction', 'supplier', 'employee', 'all')
 * @param {string} filters.search - Search term
 * @param {number} filters.page - Page number
 * @param {number} filters.limit - Items per page
 * @param {string} filters.sortBy - Sort field
 * @param {string} filters.sortOrder - Sort order ('asc' or 'desc')
 * @returns {Promise<Object>} Archived items and metadata
 */
export async function getArchivedItems(filters = {}) {
  if (isMockMode()) {
    console.log("🔧 getArchivedItems called - using mock mode");
    return await mockGetArchivedItems(filters);
  }

  try {
    const {
      type = "all",
      search = "",
      page = 1,
      limit = 20,
      sortBy = "updated_at",
      sortOrder = "desc",
    } = filters;

    console.log("🔄 Fetching archived items from Supabase:", {
      type,
      search,
      page,
      limit,
    });

    const offset = (page - 1) * limit;
    let allArchivedItems = [];

    if (type === "all" || type === "product") {
      // Get archived products
      let productQuery = supabase
        .from(TABLES.PRODUCTS)
        .select(
          "id, name, generic_name, brand_name, category, description, total_stock, cost_price, selling_price, expiry_date, updated_at, created_at"
        )
        .eq("is_active", false);

      if (search) {
        productQuery = productQuery.or(
          `name.ilike.%${search}%,generic_name.ilike.%${search}%,category.ilike.%${search}%`
        );
      }

      const { data: products, error: productError } = await productQuery;

      if (productError) {
        console.error("Error fetching archived products:", productError);
      } else {
        const formattedProducts = products.map((product) => ({
          id: `product_${product.id}`,
          name: product.name,
          description:
            product.generic_name ||
            product.description ||
            `${product.category} medication`,
          type: "product",
          category: product.category,
          originalStock: product.total_stock,
          costPrice: product.cost_price,
          sellingPrice: product.selling_price,
          expiryDate: product.expiry_date,
          archivedDate: new Date(product.updated_at).toLocaleDateString(),
          archivedBy: "System Admin",
          reason: "Product archived from inventory",
          rawId: product.id,
          rawData: product,
        }));
        allArchivedItems.push(...formattedProducts);
      }
    }

    if (type === "all" || type === "transaction") {
      // Get archived transactions (cancelled, refunded)
      let transactionQuery = supabase
        .from(TABLES.SALES_TRANSACTIONS)
        .select(
          "id, transaction_number, total_amount, customer_name, payment_method, status, created_at, updated_at"
        )
        .in("status", ["cancelled", "refunded"]);

      if (search) {
        transactionQuery = transactionQuery.or(
          `transaction_number.ilike.%${search}%,customer_name.ilike.%${search}%`
        );
      }

      const { data: transactions, error: transactionError } =
        await transactionQuery;

      if (transactionError) {
        console.error(
          "Error fetching archived transactions:",
          transactionError
        );
      } else {
        const formattedTransactions = transactions.map((transaction) => ({
          id: `transaction_${transaction.id}`,
          name: `Transaction ${transaction.transaction_number}`,
          description: `${transaction.status} transaction for ${
            transaction.customer_name || "Walk-in customer"
          }`,
          type: "transaction",
          amount: `₱${transaction.total_amount}`,
          paymentMethod: transaction.payment_method,
          status: transaction.status,
          archivedDate: new Date(transaction.updated_at).toLocaleDateString(),
          archivedBy: "System Admin",
          reason: `Transaction ${transaction.status}`,
          rawId: transaction.id,
          rawData: transaction,
        }));
        allArchivedItems.push(...formattedTransactions);
      }
    }

    // Sort all items
    allArchivedItems.sort((a, b) => {
      const aValue = a.rawData[sortBy] || a.archivedDate;
      const bValue = b.rawData[sortBy] || b.archivedDate;

      if (sortOrder === "asc") {
        return new Date(aValue) - new Date(bValue);
      }
      return new Date(bValue) - new Date(aValue);
    });

    // Apply pagination
    const paginatedItems = allArchivedItems.slice(offset, offset + limit);
    const totalCount = allArchivedItems.length;

    console.log("✅ Archived items fetched successfully:", {
      total: totalCount,
      page: page,
      items: paginatedItems.length,
    });

    return {
      data: paginatedItems,
      count: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      error: null,
    };
  } catch (error) {
    console.error("❌ Error fetching archived items:", error);
    return {
      data: [],
      count: 0,
      page: 1,
      totalPages: 0,
      error: error.message,
    };
  }
}

/**
 * Get archived items statistics
 * @returns {Promise<Object>} Statistics for different archived item types
 */
export async function getArchivedStats() {
  if (isMockMode()) {
    console.log("🔧 getArchivedStats called - using mock mode");
    return await mockGetArchivedStats();
  }

  try {
    console.log("🔄 Fetching archived statistics from Supabase");

    const [productsResult, transactionsResult] = await Promise.all([
      supabase
        .from(TABLES.PRODUCTS)
        .select("id", { count: "exact" })
        .eq("is_active", false),
      supabase
        .from(TABLES.SALES_TRANSACTIONS)
        .select("id", { count: "exact" })
        .in("status", ["cancelled", "refunded"]),
    ]);

    const productsCount = productsResult.count || 0;
    const transactionsCount = transactionsResult.count || 0;

    // For now, suppliers and employees are set to 0 since they're not in the current schema
    const stats = {
      products: productsCount,
      transactions: transactionsCount,
      suppliers: 0, // TODO: Add when suppliers table is available
      employees: 0, // TODO: Add when employees table is available
      total: productsCount + transactionsCount,
    };

    console.log("✅ Archived statistics fetched:", stats);

    return {
      data: stats,
      error: null,
    };
  } catch (error) {
    console.error("❌ Error fetching archived stats:", error);
    return {
      data: {
        products: 0,
        transactions: 0,
        suppliers: 0,
        employees: 0,
        total: 0,
      },
      error: error.message,
    };
  }
}

/**
 * Restore an archived item
 * @param {number} id - Item ID
 * @param {string} type - Item type ('product', 'transaction', 'supplier', 'employee')
 * @returns {Promise<Object>} Restore result
 */
export async function restoreItem(id, type) {
  if (isMockMode()) {
    console.log("🔧 restoreItem called - using mock mode");
    return await mockRestoreItem(id, type);
  }

  try {
    console.log("🔄 Restoring item from Supabase:", { id, type });

    // Extract real ID from formatted ID (e.g., "product_123" -> 123)
    const realId = id.toString().includes("_") ? id.split("_")[1] : id;

    let query;
    const updateData = {
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    switch (type) {
      case "product":
        query = supabase
          .from(TABLES.PRODUCTS)
          .update(updateData)
          .eq("id", realId)
          .select()
          .single();
        break;
      case "transaction":
        query = supabase
          .from(TABLES.SALES_TRANSACTIONS)
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", realId)
          .select()
          .single();
        break;
      case "supplier":
        // TODO: Implement when suppliers table is available
        throw new Error("Supplier restoration not yet implemented");
      case "employee":
        // TODO: Implement when employees table is available
        throw new Error("Employee restoration not yet implemented");
      default:
        throw new Error("Invalid item type");
    }

    const { data, error } = await query;

    if (error) throw error;

    console.log("✅ Item restored successfully:", data);

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error restoring item:", error);
    return { data: null, error: error.message };
  }
}

/**
 * Permanently delete an archived item
 * @param {number} id - Item ID
 * @param {string} type - Item type ('product', 'transaction', 'supplier', 'employee')
 * @returns {Promise<Object>} Delete result
 */
export async function permanentDeleteItem(id, type) {
  if (isMockMode()) {
    console.log("🔧 permanentDeleteItem called - using mock mode");
    return await mockPermanentDeleteItem(id, type);
  }

  try {
    console.log("🔄 Permanently deleting item from Supabase:", { id, type });

    // Extract real ID from formatted ID (e.g., "product_123" -> 123)
    const realId = id.toString().includes("_") ? id.split("_")[1] : id;

    let query;

    switch (type) {
      case "product":
        // Only delete if already archived (is_active = false)
        query = supabase
          .from(TABLES.PRODUCTS)
          .delete()
          .eq("id", realId)
          .eq("is_active", false);
        break;
      case "transaction":
        // Only delete if already archived (status in cancelled/refunded)
        query = supabase
          .from(TABLES.SALES_TRANSACTIONS)
          .delete()
          .eq("id", realId)
          .in("status", ["cancelled", "refunded"]);
        break;
      case "supplier":
        // TODO: Implement when suppliers table is available
        throw new Error("Supplier deletion not yet implemented");
      case "employee":
        // TODO: Implement when employees table is available
        throw new Error("Employee deletion not yet implemented");
      default:
        throw new Error("Invalid item type");
    }

    const { error } = await query;

    if (error) throw error;

    console.log("✅ Item permanently deleted successfully");

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error("❌ Error permanently deleting item:", error);
    return { data: null, error: error.message };
  }
}

/**
 * Archive a transaction
 * @param {number} transactionId - Transaction ID
 * @param {string} reason - Reason for archiving
 * @returns {Promise<Object>} Archive result
 */
export async function archiveTransaction(transactionId, reason) {
  if (isMockMode()) {
    console.log("🔧 archiveTransaction called - using mock mode");
    return await mockArchiveTransaction(transactionId, reason);
  }

  try {
    console.log("🔄 Archiving transaction in Supabase:", {
      transactionId,
      reason,
    });

    const { data, error } = await supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId)
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Transaction archived successfully:", data);

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error archiving transaction:", error);
    return { data: null, error: error.message };
  }
}

/**
 * Archive a supplier
 * @param {number} supplierId - Supplier ID
 * @param {string} reason - Reason for archiving
 * @returns {Promise<Object>} Archive result
 */
export async function archiveSupplier(supplierId, reason) {
  if (isMockMode()) {
    console.log("🔧 archiveSupplier called - using mock mode");
    return await mockArchiveSupplier(supplierId, reason);
  }

  try {
    console.log("🔄 Archiving supplier in Supabase:", { supplierId, reason });

    // TODO: Implement when suppliers table is available in schema
    throw new Error(
      "Supplier archiving not yet implemented - table not available"
    );

    /* Future implementation when suppliers table exists:
    const { data, error } = await supabase
      .from("suppliers")
      .update({
        is_active: false,
        archive_reason: reason,
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", supplierId)
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Supplier archived successfully:", data);
    return { data, error: null };
    */
  } catch (error) {
    console.error("❌ Error archiving supplier:", error);
    return { data: null, error: error.message };
  }
}

/**
 * Archive an employee
 * @param {number} employeeId - Employee ID
 * @param {string} reason - Reason for archiving
 * @returns {Promise<Object>} Archive result
 */
export async function archiveEmployee(employeeId, reason) {
  if (isMockMode()) {
    console.log("🔧 archiveEmployee called - using mock mode");
    return await mockArchiveEmployee(employeeId, reason);
  }

  try {
    console.log("🔄 Archiving employee in Supabase:", { employeeId, reason });

    // TODO: Implement when employees table is available in schema
    throw new Error(
      "Employee archiving not yet implemented - table not available"
    );

    /* Future implementation when employees table exists:
    const { data, error } = await supabase
      .from("employees")
      .update({
        is_active: false,
        archive_reason: reason,
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", employeeId)
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Employee archived successfully:", data);
    return { data, error: null };
    */
  } catch (error) {
    console.error("❌ Error archiving employee:", error);
    return { data: null, error: error.message };
  }
}

/**
 * Bulk operations for archived items
 */

/**
 * Archive a product (move to archived state)
 * @param {number} productId - Product ID
 * @param {string} reason - Reason for archiving
 * @returns {Promise<Object>} Archive result
 */
export async function archiveProduct(productId, reason = "Product archived") {
  if (isMockMode()) {
    console.log("🔧 archiveProduct called - using mock mode");
    // Mock implementation - this should use mockApi
    return { data: { success: true }, error: null };
  }

  try {
    console.log("🔄 Archiving product in Supabase:", { productId, reason });

    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .select()
      .single();

    if (error) throw error;

    // Create a stock movement record for archiving
    await supabase.from(TABLES.STOCK_MOVEMENTS).insert({
      product_id: productId,
      movement_type: "archived",
      quantity_change: 0,
      remaining_stock: data.total_stock,
      reference_type: "archive",
      reference_id: null,
      notes: reason,
      created_at: new Date().toISOString(),
    });

    console.log("✅ Product archived successfully:", data);

    return { data, error: null };
  } catch (error) {
    console.error("❌ Error archiving product:", error);
    return { data: null, error: error.message };
  }
}

/**
 * Get archived products only
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Archived products
 */
export async function getArchivedProducts(filters = {}) {
  if (isMockMode()) {
    // Use existing mock function but filter for products only
    const result = await mockGetArchivedItems({ ...filters, type: "product" });
    return result;
  }

  try {
    const {
      search = "",
      page = 1,
      limit = 20,
      sortBy = "updated_at",
      sortOrder = "desc",
    } = filters;

    console.log("🔄 Fetching archived products from Supabase:", filters);

    const offset = (page - 1) * limit;

    let query = supabase
      .from(TABLES.PRODUCTS)
      .select("*")
      .eq("is_active", false);

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,generic_name.ilike.%${search}%,category.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    console.log("✅ Archived products fetched successfully:", {
      count: data?.length || 0,
      total: count,
    });

    return {
      data: data || [],
      count,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      error: null,
    };
  } catch (error) {
    console.error("❌ Error fetching archived products:", error);
    return {
      data: [],
      count: 0,
      page: 1,
      totalPages: 0,
      error: error.message,
    };
  }
}

/**
 * Bulk operations for archived items
 */

/**
 * Restore multiple items
 * @param {Array} items - Array of {id, type} objects
 * @returns {Promise<Object>} Bulk restore result
 */
export async function bulkRestoreItems(items) {
  try {
    const results = {
      success: [],
      errors: [],
      total: items.length,
    };

    for (const item of items) {
      try {
        const result = await restoreItem(item.id, item.type);
        if (result.error) {
          results.errors.push({ item, error: result.error });
        } else {
          results.success.push(result.data);
        }
      } catch (error) {
        results.errors.push({ item, error: error.message });
      }
    }

    return { data: results, error: null };
  } catch (error) {
    console.error("Error in bulk restore:", error);
    return { data: null, error: error.message };
  }
}

/**
 * Permanently delete multiple items
 * @param {Array} items - Array of {id, type} objects
 * @returns {Promise<Object>} Bulk delete result
 */
export async function bulkDeleteItems(items) {
  try {
    const results = {
      success: [],
      errors: [],
      total: items.length,
    };

    for (const item of items) {
      try {
        const result = await permanentDeleteItem(item.id, item.type);
        if (result.error) {
          results.errors.push({ item, error: result.error });
        } else {
          results.success.push({ id: item.id, type: item.type });
        }
      } catch (error) {
        results.errors.push({ item, error: error.message });
      }
    }

    return { data: results, error: null };
  } catch (error) {
    console.error("Error in bulk delete:", error);
    return { data: null, error: error.message };
  }
}

// Export default service object for organized imports
export default {
  getArchivedItems,
  getArchivedStats,
  getArchivedProducts,
  restoreItem,
  permanentDeleteItem,
  archiveProduct,
  archiveTransaction,
  archiveSupplier,
  archiveEmployee,
  bulkRestoreItems,
  bulkDeleteItems,
};
