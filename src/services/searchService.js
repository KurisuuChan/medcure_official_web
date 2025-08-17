/**
 * MedCure Search Service
 * Handles global search functionality across products, patients, transactions, etc.
 */

import { supabase } from "../lib/supabase";
import { shouldUseMockAPI } from "../utils/backendStatus";

// Mock search data
const mockSearchData = {
  products: [
    {
      id: 1,
      name: "Paracetamol 500mg",
      genericName: "Paracetamol",
      category: "Pain Relief",
      barcode: "8901030825556",
      type: "product",
    },
    {
      id: 2,
      name: "Amoxicillin 250mg",
      genericName: "Amoxicillin",
      category: "Antibiotics",
      barcode: "8901030825557",
      type: "product",
    },
    {
      id: 3,
      name: "Vitamin C 1000mg",
      genericName: "Ascorbic Acid",
      category: "Vitamins",
      barcode: "8901030825558",
      type: "product",
    },
    {
      id: 4,
      name: "Aspirin 81mg",
      genericName: "Acetylsalicylic Acid",
      category: "Cardiovascular",
      barcode: "8901030825560",
      type: "product",
    },
  ],
  patients: [
    {
      id: 1,
      name: "Juan Dela Cruz",
      email: "juan@email.com",
      phone: "+63 912 345 6789",
      type: "patient",
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria@email.com",
      phone: "+63 912 345 6788",
      type: "patient",
    },
  ],
  transactions: [
    {
      id: 1,
      transactionNumber: "TXN-2024-001",
      customerName: "Juan Dela Cruz",
      totalAmount: 1250.0,
      date: "2024-08-16",
      type: "transaction",
    },
    {
      id: 2,
      transactionNumber: "TXN-2024-002",
      customerName: "Maria Santos",
      totalAmount: 850.0,
      date: "2024-08-16",
      type: "transaction",
    },
  ],
};

/**
 * Perform global search across all entities
 */
export async function globalSearch(query, options = {}) {
  if (!query || query.trim().length < 2) {
    return {
      success: true,
      data: {
        products: [],
        patients: [],
        transactions: [],
        total: 0,
      },
    };
  }

  const searchTerm = query.trim().toLowerCase();
  const {
    categories = ["products", "patients", "transactions"],
    limit = 10,
    includeInactive = false,
  } = options;

  if (shouldUseMockAPI()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const results = {
          products: [],
          patients: [],
          transactions: [],
          total: 0,
        };

        // Search products
        if (categories.includes("products")) {
          results.products = mockSearchData.products
            .filter(
              (product) =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.genericName.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm) ||
                product.barcode.includes(searchTerm)
            )
            .slice(0, limit);
        }

        // Search patients
        if (categories.includes("patients")) {
          results.patients = mockSearchData.patients
            .filter(
              (patient) =>
                patient.name.toLowerCase().includes(searchTerm) ||
                patient.email.toLowerCase().includes(searchTerm) ||
                patient.phone.includes(searchTerm)
            )
            .slice(0, limit);
        }

        // Search transactions
        if (categories.includes("transactions")) {
          results.transactions = mockSearchData.transactions
            .filter(
              (transaction) =>
                transaction.transactionNumber
                  .toLowerCase()
                  .includes(searchTerm) ||
                transaction.customerName.toLowerCase().includes(searchTerm)
            )
            .slice(0, limit);
        }

        results.total =
          results.products.length +
          results.patients.length +
          results.transactions.length;

        resolve({
          success: true,
          data: results,
        });
      }, 300);
    });
  }

  try {
    const results = {
      products: [],
      patients: [],
      transactions: [],
      total: 0,
    };

    // Search products
    if (categories.includes("products")) {
      let productQuery = supabase
        .from("products")
        .select(
          "id, name, generic_name, category, barcode, selling_price, total_stock"
        )
        .or(
          `name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`
        )
        .limit(limit);

      if (!includeInactive) {
        productQuery = productQuery.eq("is_active", true);
      }

      const { data: products, error: productsError } = await productQuery;

      if (!productsError && products) {
        results.products = products.map((product) => ({
          ...product,
          type: "product",
        }));
      }
    }

    // Search patients/contacts
    if (categories.includes("patients")) {
      const { data: patients, error: patientsError } = await supabase
        .from("contacts")
        .select("id, name, email, phone, type")
        .or(
          `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
        )
        .eq("type", "patient")
        .limit(limit);

      if (!patientsError && patients) {
        results.patients = patients.map((patient) => ({
          ...patient,
          type: "patient",
        }));
      }
    }

    // Search transactions
    if (categories.includes("transactions")) {
      const { data: transactions, error: transactionsError } = await supabase
        .from("sales_transactions")
        .select(
          "id, transaction_number, customer_name, total_amount, created_at"
        )
        .or(
          `transaction_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%`
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!transactionsError && transactions) {
        results.transactions = transactions.map((transaction) => ({
          ...transaction,
          type: "transaction",
        }));
      }
    }

    results.total =
      results.products.length +
      results.patients.length +
      results.transactions.length;

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Search failed",
    };
  }
}

/**
 * Search products specifically
 */
export async function searchProducts(query, options = {}) {
  if (!query || query.trim().length < 2) {
    return {
      success: true,
      data: [],
    };
  }

  const searchTerm = query.trim().toLowerCase();
  const {
    category = null,
    limit = 20,
    includeInactive = false,
    sortBy = "name",
    sortOrder = "asc",
  } = options;

  if (shouldUseMockAPI()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let results = mockSearchData.products.filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.genericName.toLowerCase().includes(searchTerm) ||
            product.barcode.includes(searchTerm)
        );

        if (category) {
          results = results.filter(
            (product) =>
              product.category.toLowerCase() === category.toLowerCase()
          );
        }

        // Sort results
        results.sort((a, b) => {
          if (sortOrder === "asc") {
            return a[sortBy] > b[sortBy] ? 1 : -1;
          } else {
            return a[sortBy] < b[sortBy] ? 1 : -1;
          }
        });

        resolve({
          success: true,
          data: results.slice(0, limit),
        });
      }, 200);
    });
  }

  try {
    let query_builder = supabase
      .from("products")
      .select("*")
      .or(
        `name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`
      );

    if (category) {
      query_builder = query_builder.eq("category", category);
    }

    if (!includeInactive) {
      query_builder = query_builder.eq("is_active", true);
    }

    query_builder = query_builder
      .order(sortBy, { ascending: sortOrder === "asc" })
      .limit(limit);

    const { data, error } = await query_builder;

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Product search failed",
    };
  }
}

/**
 * Get search suggestions (autocomplete)
 */
export async function getSearchSuggestions(query, type = "all") {
  if (!query || query.trim().length < 1) {
    return {
      success: true,
      data: [],
    };
  }

  const searchTerm = query.trim().toLowerCase();

  if (shouldUseMockAPI()) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const suggestions = [];

        if (type === "all" || type === "products") {
          mockSearchData.products.forEach((product) => {
            if (product.name.toLowerCase().includes(searchTerm)) {
              suggestions.push({
                text: product.name,
                type: "product",
                id: product.id,
                category: product.category,
              });
            }
            if (
              product.genericName.toLowerCase().includes(searchTerm) &&
              product.genericName.toLowerCase() !== product.name.toLowerCase()
            ) {
              suggestions.push({
                text: product.genericName,
                type: "product",
                id: product.id,
                category: product.category,
              });
            }
          });
        }

        if (type === "all" || type === "patients") {
          mockSearchData.patients.forEach((patient) => {
            if (patient.name.toLowerCase().includes(searchTerm)) {
              suggestions.push({
                text: patient.name,
                type: "patient",
                id: patient.id,
                email: patient.email,
              });
            }
          });
        }

        // Remove duplicates and limit results
        const uniqueSuggestions = suggestions
          .filter(
            (suggestion, index, self) =>
              index ===
              self.findIndex(
                (s) => s.text === suggestion.text && s.type === suggestion.type
              )
          )
          .slice(0, 8);

        resolve({
          success: true,
          data: uniqueSuggestions,
        });
      }, 150);
    });
  }

  try {
    const suggestions = [];

    if (type === "all" || type === "products") {
      const { data: products } = await supabase
        .from("products")
        .select("id, name, generic_name, category")
        .or(`name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%`)
        .eq("is_active", true)
        .limit(5);

      if (products) {
        products.forEach((product) => {
          suggestions.push({
            text: product.name,
            type: "product",
            id: product.id,
            category: product.category,
          });

          if (
            product.generic_name &&
            product.generic_name.toLowerCase() !== product.name.toLowerCase() &&
            product.generic_name.toLowerCase().includes(searchTerm)
          ) {
            suggestions.push({
              text: product.generic_name,
              type: "product",
              id: product.id,
              category: product.category,
            });
          }
        });
      }
    }

    if (type === "all" || type === "patients") {
      const { data: patients } = await supabase
        .from("contacts")
        .select("id, name, email")
        .ilike("name", `%${searchTerm}%`)
        .eq("type", "patient")
        .limit(5);

      if (patients) {
        patients.forEach((patient) => {
          suggestions.push({
            text: patient.name,
            type: "patient",
            id: patient.id,
            email: patient.email,
          });
        });
      }
    }

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter(
        (suggestion, index, self) =>
          index ===
          self.findIndex(
            (s) => s.text === suggestion.text && s.type === suggestion.type
          )
      )
      .slice(0, 8);

    return {
      success: true,
      data: uniqueSuggestions,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Failed to get suggestions",
    };
  }
}

/**
 * Get recent searches
 */
export async function getRecentSearches() {
  const recentSearches = JSON.parse(
    localStorage.getItem("medcure_recent_searches") || "[]"
  );

  return {
    success: true,
    data: recentSearches.slice(0, 5),
  };
}

/**
 * Save search term to recent searches
 */
export async function saveRecentSearch(searchTerm) {
  if (!searchTerm || searchTerm.trim().length < 2) {
    return { success: false, error: "Invalid search term" };
  }

  try {
    const recentSearches = JSON.parse(
      localStorage.getItem("medcure_recent_searches") || "[]"
    );

    // Remove if already exists
    const filtered = recentSearches.filter(
      (term) => term.toLowerCase() !== searchTerm.toLowerCase()
    );

    // Add to beginning
    filtered.unshift(searchTerm.trim());

    // Keep only last 10 searches
    const limited = filtered.slice(0, 10);

    localStorage.setItem("medcure_recent_searches", JSON.stringify(limited));

    return {
      success: true,
      data: limited,
    };
  } catch (err) {
    console.error("Failed to save search:", err);
    return {
      success: false,
      error: "Failed to save search",
    };
  }
}

/**
 * Clear recent searches
 */
export async function clearRecentSearches() {
  try {
    localStorage.removeItem("medcure_recent_searches");
    return {
      success: true,
      message: "Recent searches cleared",
    };
  } catch (err) {
    console.error("Failed to clear searches:", err);
    return {
      success: false,
      error: "Failed to clear searches",
    };
  }
}

export default {
  globalSearch,
  searchProducts,
  getSearchSuggestions,
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
};
