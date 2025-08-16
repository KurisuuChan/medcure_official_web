// Mock API layer so we can demonstrate professional structure without backend

let SAMPLE_PRODUCTS = [
  {
    id: 1,
    name: "Paracetamol 500mg",
    generic_name: "Acetaminophen",
    category: "Analgesic",
    total_stock: 120,
    critical_level: 20,
    cost_price: 3.5,
    selling_price: 5.25,
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    name: "Amoxicillin 250mg",
    generic_name: "Amoxicillin",
    category: "Antibiotic",
    total_stock: 85,
    critical_level: 15,
    cost_price: 8.2,
    selling_price: 12.5,
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 3,
    name: "Vitamin C 1000mg",
    generic_name: "Ascorbic Acid",
    category: "Supplement",
    total_stock: 6,
    critical_level: 10,
    cost_price: 5.0,
    selling_price: 7.5,
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 3,
    name: "Amoxicillin 500mg",
    generic_name: "Amoxicillin",
    category: "Antibiotic",
    total_stock: 0,
    critical_level: 15,
    cost_price: 7.75,
    selling_price: 11.25,
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 4,
    name: "Cetirizine 10mg",
    generic_name: "Cetirizine HCl",
    category: "Antihistamine",
    total_stock: 44,
    critical_level: 25,
    cost_price: 2.1,
    selling_price: 3.15,
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 5,
    name: "Hydrogen Peroxide",
    generic_name: "Hydrogen Peroxide 3%",
    category: "First Aid",
    total_stock: 9,
    critical_level: 12,
    cost_price: 15.25,
    selling_price: 22.5,
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 6,
    name: "Ibuprofen 400mg",
    generic_name: "Ibuprofen",
    category: "Analgesic",
    total_stock: 85,
    critical_level: 30,
    cost_price: 4.2,
    selling_price: 6.3,
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
];

const SAMPLE_CATEGORIES = [
  { id: 1, name: "Analgesic", is_active: true },
  { id: 2, name: "Supplement", is_active: true },
  { id: 3, name: "Antibiotic", is_active: true },
  { id: 4, name: "Antihistamine", is_active: true },
  { id: 5, name: "First Aid", is_active: true },
];

const SAMPLE_SALES_TRANSACTIONS = [
  {
    id: 1,
    transaction_number: "TXN1708156200001",
    total_amount: 25.5,
    created_at: "2024-08-16T09:15:00Z",
    payment_method: "cash",
    status: "completed",
    sales_items: [
      {
        id: 1,
        product_id: 1,
        total_pieces: 2,
        unit_price: 5.25,
        line_total: 10.5,
        products: { name: "Paracetamol 500mg", category: "Analgesic" },
      },
      {
        id: 2,
        product_id: 2,
        total_pieces: 2,
        unit_price: 7.5,
        line_total: 15.0,
        products: { name: "Vitamin C 1000mg", category: "Supplement" },
      },
    ],
  },
  {
    id: 2,
    transaction_number: "TXN1708156900002",
    total_amount: 15.75,
    created_at: "2024-08-16T10:30:00Z",
    payment_method: "card",
    status: "completed",
    sales_items: [
      {
        id: 3,
        product_id: 4,
        total_pieces: 5,
        unit_price: 3.15,
        line_total: 15.75,
        products: { name: "Cetirizine 10mg", category: "Antihistamine" },
      },
    ],
  },
  {
    id: 3,
    transaction_number: "TXN1708157700003",
    total_amount: 42.25,
    created_at: "2024-08-16T11:45:00Z",
    payment_method: "cash",
    status: "completed",
    sales_items: [
      {
        id: 4,
        product_id: 6,
        total_pieces: 3,
        unit_price: 6.3,
        line_total: 18.9,
        products: { name: "Ibuprofen 400mg", category: "Analgesic" },
      },
      {
        id: 5,
        product_id: 5,
        total_pieces: 1,
        unit_price: 22.5,
        line_total: 22.5,
        products: { name: "Hydrogen Peroxide", category: "First Aid" },
      },
    ],
  },
];

// Utility function to simulate API delay
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockFetchProducts(filters = {}) {
  await delay();
  let products = [...SAMPLE_PRODUCTS];

  // Apply filters
  if (filters.category && filters.category !== "all") {
    products = products.filter((p) => p.category === filters.category);
  }

  if (filters.search) {
    const search = filters.search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.generic_name.toLowerCase().includes(search)
    );
  }

  if (filters.lowStock) {
    products = products.filter(
      (p) => p.total_stock <= p.critical_level && p.total_stock > 0
    );
  }

  if (filters.outOfStock) {
    products = products.filter((p) => p.total_stock === 0);
  }

  return { data: products, error: null };
}

export async function mockFetchCategories() {
  await delay();
  return { data: SAMPLE_CATEGORIES, error: null };
}

export async function mockFetchProduct(id) {
  await delay();
  const product = SAMPLE_PRODUCTS.find((p) => p.id === parseInt(id));
  return { data: product || null, error: product ? null : "Product not found" };
}

export async function mockGetInventorySummary() {
  await delay();

  const summary = SAMPLE_PRODUCTS.reduce(
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
}

export async function mockGetSalesTransactions(filters = {}) {
  await delay();
  let transactions = [...SAMPLE_SALES_TRANSACTIONS];

  if (filters.limit) {
    transactions = transactions.slice(0, filters.limit);
  }

  return { data: transactions, error: null };
}

export async function mockGetSalesSummary(period = "today") {
  await delay();

  // Mock sales summary based on sample data
  const summary = {
    totalSales: SAMPLE_SALES_TRANSACTIONS.reduce(
      (sum, t) => sum + t.total_amount,
      0
    ),
    totalTransactions: SAMPLE_SALES_TRANSACTIONS.length,
    totalDiscounts: 0,
    averageSale: 0,
  };

  summary.averageSale = summary.totalSales / summary.totalTransactions;

  return { data: summary, error: null };
}

export async function mockGetHourlySales(date) {
  await delay();

  // Generate mock hourly data
  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour.toString().padStart(2, "0")}:00`,
    sales:
      hour >= 8 && hour <= 20
        ? Math.floor(Math.random() * 100) + 20
        : Math.floor(Math.random() * 20),
    transactions:
      hour >= 8 && hour <= 20
        ? Math.floor(Math.random() * 5) + 1
        : Math.floor(Math.random() * 2),
  }));

  return { data: hourlyData, error: null };
}

export async function mockGetTopSellingProducts(limit = 5) {
  await delay();

  const topProducts = [
    {
      product: SAMPLE_PRODUCTS[0],
      totalQuantity: 45,
      totalRevenue: 236.25,
    },
    {
      product: SAMPLE_PRODUCTS[3],
      totalQuantity: 38,
      totalRevenue: 119.7,
    },
    {
      product: SAMPLE_PRODUCTS[5],
      totalQuantity: 22,
      totalRevenue: 138.6,
    },
    {
      product: SAMPLE_PRODUCTS[1],
      totalQuantity: 15,
      totalRevenue: 112.5,
    },
    {
      product: SAMPLE_PRODUCTS[4],
      totalQuantity: 8,
      totalRevenue: 180.0,
    },
  ].slice(0, limit);

  return { data: topProducts, error: null };
}

export async function mockGetDashboardData() {
  await delay();

  // Generate some sample sales data for the dashboard
  const today = new Date();
  const salesData = [];

  // Generate sales for the last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    salesData.push({
      date: date.toISOString().split("T")[0],
      sales: Math.floor(Math.random() * 500) + 100,
      transactions: Math.floor(Math.random() * 20) + 5,
    });
  }

  const dashboardData = {
    todaySales: salesData[6].sales,
    totalTransactions: salesData.reduce(
      (sum, day) => sum + day.transactions,
      0
    ),
    averageOrderValue:
      salesData.reduce((sum, day) => sum + day.sales, 0) /
      salesData.reduce((sum, day) => sum + day.transactions, 0),
    salesTrend: salesData,
    topProducts: SAMPLE_PRODUCTS.slice(0, 5),
    lowStockAlerts: SAMPLE_PRODUCTS.filter(
      (p) => p.total_stock <= p.critical_level
    ),
  };

  return { data: dashboardData, error: null };
}

// Mock create product function
export async function mockCreateProduct(productData) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Generate new ID
    const newId = Math.max(...SAMPLE_PRODUCTS.map((p) => p.id)) + 1;

    // Create new product with timestamp
    const newProduct = {
      ...productData,
      id: newId,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add to sample products (in memory only)
    SAMPLE_PRODUCTS.push(newProduct);

    return { data: newProduct, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

// Mock update product function
export async function mockUpdateProduct(id, updates) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const productIndex = SAMPLE_PRODUCTS.findIndex(
      (p) => p.id === parseInt(id)
    );
    if (productIndex === -1) {
      throw new Error("Product not found");
    }

    // Update product
    SAMPLE_PRODUCTS[productIndex] = {
      ...SAMPLE_PRODUCTS[productIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    return { data: SAMPLE_PRODUCTS[productIndex], error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

// Mock delete product function
export async function mockDeleteProduct(id) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const productIndex = SAMPLE_PRODUCTS.findIndex(
      (p) => p.id === parseInt(id)
    );
    if (productIndex === -1) {
      throw new Error("Product not found");
    }

    // Soft delete (mark as inactive)
    SAMPLE_PRODUCTS[productIndex].is_active = false;
    SAMPLE_PRODUCTS[productIndex].updated_at = new Date().toISOString();

    return { data: SAMPLE_PRODUCTS[productIndex], error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

// Mock import products function
export async function mockImportProducts(productsArray) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const results = {
      success: [],
      errors: [],
      total: productsArray.length,
    };

    for (const productData of productsArray) {
      try {
        // Validate required fields
        if (!productData.name) {
          throw new Error("Product name is required");
        }

        if (productData.cost_price < 0 || productData.selling_price < 0) {
          throw new Error("Prices cannot be negative");
        }

        if (productData.total_stock < 0) {
          throw new Error("Stock cannot be negative");
        }

        // Create product using mock function
        const { data, error } = await mockCreateProduct(productData);

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

// Check if mock mode is enabled
export function isMockMode() {
  console.log(
    "🔧 Environment check - VITE_USE_MOCK_API:",
    import.meta.env.VITE_USE_MOCK_API
  );
  console.log(
    "🔧 Environment check - String comparison:",
    import.meta.env.VITE_USE_MOCK_API === "true"
  );

  // Temporarily force mock mode to true for testing
  return true; // Force mock mode for now
  // return import.meta.env.VITE_USE_MOCK_API === 'true';
}

console.log("🔧 Mock API mode:", isMockMode() ? "ENABLED" : "DISABLED");
