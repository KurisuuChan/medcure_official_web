/**
 * MedCure Global Search Service
 * Handles comprehensive search functionality across products, patients, transactions, etc. with full backend integration
 */

import { supabase, TABLES } from "../lib/supabase.js";
import { shouldUseMockAPI } from "./backendService.js";

// Mock search data for fallback
const mockSearchData = {
  products: [
    {
      id: 1,
      name: "Paracetamol 500mg",
      genericName: "Paracetamol",
      category: "Pain Relief",
      barcode: "8901030825556",
      type: "product",
      description: "Pain relief medication",
      manufacturer: "Generic Pharma",
      price: 15.50
    },
    {
      id: 2,
      name: "Amoxicillin 250mg",
      genericName: "Amoxicillin",
      category: "Antibiotics",
      barcode: "8901030825557",
      type: "product",
      description: "Antibiotic medication",
      manufacturer: "MedCorp",
      price: 45.75
    },
    {
      id: 3,
      name: "Vitamin C 1000mg",
      genericName: "Ascorbic Acid",
      category: "Vitamins",
      barcode: "8901030825558",
      type: "product",
      description: "Vitamin C supplement",
      manufacturer: "HealthPlus",
      price: 25.00
    }
  ],
  transactions: [
    {
      id: 1,
      transactionNumber: "TXN-001",
      totalAmount: 125.50,
      customerName: "Juan Dela Cruz",
      createdAt: "2024-08-16T10:30:00Z",
      type: "transaction",
      status: "completed"
    },
    {
      id: 2,
      transactionNumber: "TXN-002", 
      totalAmount: 89.25,
      customerName: "Maria Santos",
      createdAt: "2024-08-16T11:15:00Z",
      type: "transaction",
      status: "completed"
    }
  ],
  customers: [
    {
      id: 1,
      name: "Juan Dela Cruz",
      email: "juan@email.com",
      phone: "+63 912 345 6789",
      type: "customer",
      totalPurchases: 1250.00,
      lastPurchase: "2024-08-16T10:30:00Z"
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria@email.com", 
      phone: "+63 912 345 6788",
      type: "customer",
      totalPurchases: 890.50,
      lastPurchase: "2024-08-16T11:15:00Z"
    }
  ]
};

/**
 * Perform global search across all entities
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {Array} options.types - Entity types to search (products, transactions, customers)
 * @param {number} options.limit - Maximum results per type
 * @param {boolean} options.fuzzy - Enable fuzzy search
 * @returns {Promise<Object>} Search results
 */
export async function globalSearch(query, options = {}) {
  const {
    types = ['products', 'transactions', 'customers'],
    limit = 10,
    fuzzy = true
  } = options;

  if (!query || query.trim().length < 2) {
    return {
      data: {
        products: [],
        transactions: [],
        customers: [],
        total: 0
      },
      error: null
    };
  }

  if (await shouldUseMockAPI()) {
    console.log('🔍 Using mock global search');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const searchTerm = query.toLowerCase().trim();
    const results = {
      products: [],
      transactions: [],
      customers: [],
      total: 0
    };

    // Search products
    if (types.includes('products')) {
      results.products = mockSearchData.products.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.genericName.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm) ||
        item.barcode.includes(searchTerm) ||
        item.manufacturer.toLowerCase().includes(searchTerm)
      ).slice(0, limit);
    }

    // Search transactions
    if (types.includes('transactions')) {
      results.transactions = mockSearchData.transactions.filter(item =>
        item.transactionNumber.toLowerCase().includes(searchTerm) ||
        item.customerName.toLowerCase().includes(searchTerm)
      ).slice(0, limit);
    }

    // Search customers
    if (types.includes('customers')) {
      results.customers = mockSearchData.customers.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.email.toLowerCase().includes(searchTerm) ||
        item.phone.includes(searchTerm)
      ).slice(0, limit);
    }

    results.total = results.products.length + results.transactions.length + results.customers.length;

    return {
      data: results,
      error: null
    };
  }

  try {
    console.log('🔍 Performing backend global search for:', query);
    
    const searchTerm = `%${query.toLowerCase()}%`;
    const results = {
      products: [],
      transactions: [],
      customers: [],
      total: 0
    };

    // Search products
    if (types.includes('products')) {
      const { data: products, error: productsError } = await supabase
        .from(TABLES.PRODUCTS)
        .select(`
          id,
          name,
          generic_name,
          category,
          barcode,
          description,
          manufacturer,
          selling_price,
          total_stock,
          is_active
        `)
        .or(`name.ilike.${searchTerm},generic_name.ilike.${searchTerm},category.ilike.${searchTerm},barcode.ilike.${searchTerm},manufacturer.ilike.${searchTerm}`)
        .eq('is_active', true)
        .limit(limit);

      if (productsError) {
        console.error('Products search error:', productsError);
      } else {
        results.products = products.map(product => ({
          ...product,
          type: 'product',
          price: product.selling_price
        }));
      }
    }

    // Search transactions
    if (types.includes('transactions')) {
      const { data: transactions, error: transactionsError } = await supabase
        .from(TABLES.SALES_TRANSACTIONS)
        .select(`
          id,
          transaction_number,
          total_amount,
          customer_name,
          created_at,
          status
        `)
        .or(`transaction_number.ilike.${searchTerm},customer_name.ilike.${searchTerm}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (transactionsError) {
        console.error('Transactions search error:', transactionsError);
      } else {
        results.transactions = transactions.map(transaction => ({
          ...transaction,
          type: 'transaction',
          transactionNumber: transaction.transaction_number,
          totalAmount: transaction.total_amount,
          customerName: transaction.customer_name,
          createdAt: transaction.created_at
        }));
      }
    }

    // Search customers (from transactions)
    if (types.includes('customers')) {
      const { data: customerTransactions, error: customersError } = await supabase
        .from(TABLES.SALES_TRANSACTIONS)
        .select(`
          customer_name,
          customer_email,
          customer_phone,
          total_amount,
          created_at
        `)
        .not('customer_name', 'is', null)
        .ilike('customer_name', searchTerm)
        .order('created_at', { ascending: false })
        .limit(limit * 2); // Get more to group by customer

      if (customersError) {
        console.error('Customers search error:', customersError);
      } else {
        // Group by customer and calculate totals
        const customerMap = new Map();
        
        customerTransactions.forEach(transaction => {
          const name = transaction.customer_name;
          if (customerMap.has(name)) {
            const existing = customerMap.get(name);
            existing.totalPurchases += transaction.total_amount;
            if (new Date(transaction.created_at) > new Date(existing.lastPurchase)) {
              existing.lastPurchase = transaction.created_at;
              existing.email = transaction.customer_email || existing.email;
              existing.phone = transaction.customer_phone || existing.phone;
            }
          } else {
            customerMap.set(name, {
              id: `customer_${name.replace(/\s+/g, '_')}`,
              name,
              email: transaction.customer_email,
              phone: transaction.customer_phone,
              type: 'customer',
              totalPurchases: transaction.total_amount,
              lastPurchase: transaction.created_at
            });
          }
        });

        results.customers = Array.from(customerMap.values()).slice(0, limit);
      }
    }

    results.total = results.products.length + results.transactions.length + results.customers.length;

    return {
      data: results,
      error: null
    };

  } catch (error) {
    console.error('❌ Global search error:', error);
    return {
      data: {
        products: [],
        transactions: [],
        customers: [],
        total: 0
      },
      error: error.message
    };
  }
}

/**
 * Search products specifically
 * @param {string} query - Search query
 * @param {Object} filters - Additional filters
 * @returns {Promise<Object>} Product search results
 */
export async function searchProducts(query, filters = {}) {
  const {
    category,
    inStock = true,
    limit = 20
  } = filters;

  if (await shouldUseMockAPI()) {
    console.log('🔍 Mock product search');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let results = mockSearchData.products;
    
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.genericName.toLowerCase().includes(searchTerm) ||
        product.barcode.includes(searchTerm)
      );
    }
    
    if (category) {
      results = results.filter(product => product.category === category);
    }
    
    return {
      data: results.slice(0, limit),
      error: null
    };
  }

  try {
    let query_builder = supabase
      .from(TABLES.PRODUCTS)
      .select(`
        id,
        name,
        generic_name,
        category,
        barcode,
        description,
        manufacturer,
        selling_price,
        cost_price,
        total_stock,
        critical_level,
        is_active
      `)
      .eq('is_active', true);

    if (query) {
      const searchTerm = `%${query.toLowerCase()}%`;
      query_builder = query_builder.or(`name.ilike.${searchTerm},generic_name.ilike.${searchTerm},barcode.ilike.${searchTerm}`);
    }

    if (category) {
      query_builder = query_builder.eq('category', category);
    }

    if (inStock) {
      query_builder = query_builder.gt('total_stock', 0);
    }

    const { data, error } = await query_builder
      .order('name')
      .limit(limit);

    if (error) {
      return {
        data: [],
        error: error.message
      };
    }

    return {
      data: data.map(product => ({
        ...product,
        type: 'product',
        price: product.selling_price
      })),
      error: null
    };

  } catch (error) {
    console.error('❌ Product search error:', error);
    return {
      data: [],
      error: error.message
    };
  }
}

/**
 * Search transactions
 * @param {string} query - Search query
 * @param {Object} filters - Additional filters
 * @returns {Promise<Object>} Transaction search results
 */
export async function searchTransactions(query, filters = {}) {
  const {
    status,
    dateFrom,
    dateTo,
    limit = 20
  } = filters;

  if (await shouldUseMockAPI()) {
    console.log('🔍 Mock transaction search');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let results = mockSearchData.transactions;
    
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(transaction =>
        transaction.transactionNumber.toLowerCase().includes(searchTerm) ||
        transaction.customerName.toLowerCase().includes(searchTerm)
      );
    }
    
    if (status) {
      results = results.filter(transaction => transaction.status === status);
    }
    
    return {
      data: results.slice(0, limit),
      error: null
    };
  }

  try {
    let query_builder = supabase
      .from(TABLES.SALES_TRANSACTIONS)
      .select(`
        id,
        transaction_number,
        total_amount,
        customer_name,
        customer_email,
        customer_phone,
        payment_method,
        status,
        created_at
      `);

    if (query) {
      const searchTerm = `%${query.toLowerCase()}%`;
      query_builder = query_builder.or(`transaction_number.ilike.${searchTerm},customer_name.ilike.${searchTerm}`);
    }

    if (status) {
      query_builder = query_builder.eq('status', status);
    }

    if (dateFrom) {
      query_builder = query_builder.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query_builder = query_builder.lte('created_at', dateTo);
    }

    const { data, error } = await query_builder
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return {
        data: [],
        error: error.message
      };
    }

    return {
      data: data.map(transaction => ({
        ...transaction,
        type: 'transaction',
        transactionNumber: transaction.transaction_number,
        totalAmount: transaction.total_amount,
        customerName: transaction.customer_name,
        createdAt: transaction.created_at
      })),
      error: null
    };

  } catch (error) {
    console.error('❌ Transaction search error:', error);
    return {
      data: [],
      error: error.message
    };
  }
}

/**
 * Get search suggestions based on query
 * @param {string} query - Search query
 * @param {string} type - Suggestion type (products, customers, etc.)
 * @returns {Promise<Object>} Search suggestions
 */
export async function getSearchSuggestions(query, type = 'all') {
  if (!query || query.length < 2) {
    return {
      data: [],
      error: null
    };
  }

  if (await shouldUseMockAPI()) {
    console.log('🔍 Mock search suggestions');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const suggestions = [];
    const searchTerm = query.toLowerCase();
    
    if (type === 'all' || type === 'products') {
      mockSearchData.products.forEach(product => {
        if (product.name.toLowerCase().includes(searchTerm)) {
          suggestions.push({
            text: product.name,
            type: 'product',
            id: product.id
          });
        }
      });
    }
    
    return {
      data: suggestions.slice(0, 8),
      error: null
    };
  }

  try {
    const suggestions = [];
    const searchTerm = `%${query.toLowerCase()}%`;

    if (type === 'all' || type === 'products') {
      const { data: products } = await supabase
        .from(TABLES.PRODUCTS)
        .select('id, name, generic_name')
        .or(`name.ilike.${searchTerm},generic_name.ilike.${searchTerm}`)
        .eq('is_active', true)
        .limit(5);

      if (products) {
        products.forEach(product => {
          suggestions.push({
            text: product.name,
            type: 'product',
            id: product.id,
            subtitle: product.generic_name
          });
        });
      }
    }

    return {
      data: suggestions,
      error: null
    };

  } catch (error) {
    console.error('❌ Search suggestions error:', error);
    return {
      data: [],
      error: error.message
    };
  }
}

/**
 * Search by barcode
 * @param {string} barcode - Product barcode
 * @returns {Promise<Object>} Barcode search result
 */
export async function searchByBarcode(barcode) {
  if (!barcode) {
    return {
      data: null,
      error: "Barcode is required"
    };
  }

  if (await shouldUseMockAPI()) {
    console.log('🔍 Mock barcode search');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const product = mockSearchData.products.find(p => p.barcode === barcode);
    
    return {
      data: product || null,
      error: product ? null : "Product not found"
    };
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select(`
        id,
        name,
        generic_name,
        category,
        barcode,
        description,
        manufacturer,
        selling_price,
        cost_price,
        total_stock,
        critical_level,
        is_active
      `)
      .eq('barcode', barcode)
      .eq('is_active', true)
      .single();

    if (error) {
      return {
        data: null,
        error: error.message
      };
    }

    return {
      data: {
        ...data,
        type: 'product',
        price: data.selling_price
      },
      error: null
    };

  } catch (error) {
    console.error('❌ Barcode search error:', error);
    return {
      data: null,
      error: error.message
    };
  }
}

// Export all functions
export default {
  globalSearch,
  searchProducts,
  searchTransactions,
  getSearchSuggestions,
  searchByBarcode
};
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
