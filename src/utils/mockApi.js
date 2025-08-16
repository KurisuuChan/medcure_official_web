// Mock API layer so we can demonstrate professional structure without backend

let SAMPLE_PRODUCTS = [
  {
    id: 1,
    name: "Paracetamol 500mg",
    generic_name: "Acetaminophen",
    brand_name: "Biogesic",
    category: "Analgesic",
    description:
      "Pain reliever and fever reducer. Used for headaches, muscle aches, and general pain relief.",
    supplier: "PharmaCorp Inc.",
    total_stock: 120,
    critical_level: 20,
    cost_price: 3.5,
    selling_price: 5.25,
    pieces_per_sheet: 10,
    sheets_per_box: 10,
    total_pieces_per_box: 100,
    expiry_date: "2025-12-31",
    batch_number: "PAR001-2024",
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    name: "Amoxicillin 250mg",
    generic_name: "Amoxicillin",
    brand_name: "Amoxil",
    category: "Antibiotic",
    description:
      "Broad-spectrum antibiotic for treating bacterial infections including respiratory and urinary tract infections.",
    supplier: "MediGen Pharmaceuticals",
    total_stock: 85,
    critical_level: 15,
    cost_price: 8.2,
    selling_price: 12.5,
    pieces_per_sheet: 8,
    sheets_per_box: 12,
    total_pieces_per_box: 96,
    expiry_date: "2025-11-30",
    batch_number: "AMX002-2024",
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 3,
    name: "Vitamin C 1000mg",
    generic_name: "Ascorbic Acid",
    brand_name: "C-Lemon",
    category: "Supplement",
    description:
      "High-potency vitamin C supplement for immune system support and antioxidant protection.",
    supplier: "HealthPlus Vitamins",
    total_stock: 6,
    critical_level: 10,
    cost_price: 5.0,
    selling_price: 7.5,
    pieces_per_sheet: 6,
    sheets_per_box: 5,
    total_pieces_per_box: 30,
    expiry_date: "2026-03-15",
    batch_number: "VTC003-2024",
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 4,
    name: "Amoxicillin 500mg",
    generic_name: "Amoxicillin",
    brand_name: "Amoxil Forte",
    category: "Antibiotic",
    description:
      "Higher strength broad-spectrum antibiotic for more severe bacterial infections.",
    supplier: "MediGen Pharmaceuticals",
    total_stock: 50,
    critical_level: 15,
    cost_price: 7.75,
    selling_price: 11.25,
    pieces_per_sheet: 8,
    sheets_per_box: 12,
    total_pieces_per_box: 96,
    expiry_date: "2025-10-31",
    batch_number: "AMX004-2024",
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 5,
    name: "Cetirizine 10mg",
    generic_name: "Cetirizine HCl",
    brand_name: "Zyrtec",
    category: "Antihistamine",
    description:
      "Non-drowsy antihistamine for allergic rhinitis, urticaria, and other allergic conditions.",
    supplier: "AllerCare Pharmaceuticals",
    total_stock: 44,
    critical_level: 25,
    cost_price: 2.1,
    selling_price: 3.15,
    pieces_per_sheet: 10,
    sheets_per_box: 10,
    total_pieces_per_box: 100,
    expiry_date: "2025-09-30",
    batch_number: "CET005-2024",
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 6,
    name: "Hydrogen Peroxide 3%",
    generic_name: "Hydrogen Peroxide Solution",
    brand_name: "H2O2 Clean",
    category: "First Aid",
    description:
      "Antiseptic solution for cleaning wounds and preventing infection. External use only.",
    supplier: "MedClean Solutions",
    total_stock: 9,
    critical_level: 12,
    cost_price: 15.25,
    selling_price: 22.5,
    pieces_per_sheet: 1,
    sheets_per_box: 12,
    total_pieces_per_box: 12,
    expiry_date: "2025-08-31",
    batch_number: "HYD006-2024",
    is_active: true,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 7,
    name: "Ibuprofen 400mg",
    generic_name: "Ibuprofen",
    brand_name: "Advil",
    category: "Analgesic",
    description:
      "Nonsteroidal anti-inflammatory drug (NSAID) for pain, inflammation, and fever reduction.",
    supplier: "PharmaCorp Inc.",
    total_stock: 85,
    critical_level: 30,
    cost_price: 4.2,
    selling_price: 6.3,
    pieces_per_sheet: 10,
    sheets_per_box: 10,
    total_pieces_per_box: 100,
    expiry_date: "2025-07-31",
    batch_number: "IBU007-2024",
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

  // Only show active products by default (for management page)
  if (filters.showArchived !== true) {
    products = products.filter((p) => p.is_active === true);
  }

  // Apply category filter
  if (filters.category && filters.category !== "all") {
    products = products.filter((p) => p.category === filters.category);
  }

  // Apply search filter
  if (filters.search) {
    const search = filters.search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        (p.generic_name && p.generic_name.toLowerCase().includes(search)) ||
        p.category.toLowerCase().includes(search)
    );
  }

  // Apply stock filters
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

// POS-specific functions

// Create a sale transaction (POS backend)
export async function mockCreateSale(saleData) {
  await delay();

  try {
    const { cart, discount, isPwdSenior, customerInfo = {} } = saleData;

    if (!cart || cart.length === 0) {
      throw new Error("Cart is empty");
    }

    console.log("🛒 Processing sale with cart:", cart);

    // Calculate totals using the price from cart items
    const subtotal = cart.reduce((sum, item) => {
      const price = item.price || item.selling_price || 0;
      return sum + price * item.quantity;
    }, 0);

    const discountAmount = (subtotal * (discount || 0)) / 100;
    const pwdSeniorDiscount = isPwdSenior ? subtotal * 0.2 : 0;
    const totalDiscountAmount = discountAmount + pwdSeniorDiscount;
    const totalAmount = Math.max(0, subtotal - totalDiscountAmount);

    // Generate transaction number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const transactionNumber = `TXN${timestamp}${random}`;

    // Create transaction record
    const transaction = {
      id: Date.now(),
      transaction_number: transactionNumber,
      subtotal: Math.round(subtotal * 100) / 100,
      discount_percentage: discount || 0,
      discount_amount: Math.round(discountAmount * 100) / 100,
      pwd_senior_discount: Math.round(pwdSeniorDiscount * 100) / 100,
      total_amount: Math.round(totalAmount * 100) / 100,
      is_pwd_senior: isPwdSenior,
      customer_name: customerInfo.name || null,
      payment_method: customerInfo.paymentMethod || "cash",
      amount_paid: customerInfo.amountPaid || totalAmount,
      change_amount: Math.round((customerInfo.changeAmount || 0) * 100) / 100,
      status: "completed",
      created_at: new Date().toISOString(),
    };

    // Create sales items and update stock
    const saleItems = [];
    const stockUpdates = [];

    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];

      console.log(`📋 Processing item ${i + 1}:`, {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        stock: item.stock || item.total_stock,
        packaging: item.packaging,
      });

      // Check stock availability
      const productIndex = SAMPLE_PRODUCTS.findIndex((p) => p.id === item.id);
      if (productIndex === -1) {
        throw new Error(`Product ${item.name} not found`);
      }

      const currentStock = SAMPLE_PRODUCTS[productIndex].total_stock;
      if (currentStock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${item.quantity}`
        );
      }

      // Create sales item record with proper price handling
      const unitPrice = item.price || item.selling_price || 0;
      const saleItem = {
        id: Date.now() + i,
        transaction_id: transaction.id,
        product_id: item.id,
        name: item.name,
        boxes_sold: item.packaging?.boxes_sold || 0,
        sheets_sold: item.packaging?.sheets_sold || 0,
        pieces_sold: item.packaging?.pieces_sold || 0,
        total_pieces: item.quantity,
        unit_price: unitPrice,
        line_total: Math.round(unitPrice * item.quantity * 100) / 100,
        packaging: item.packaging || {},
        created_at: new Date().toISOString(),
      };

      saleItems.push(saleItem);

      // Update product stock
      const newStock = currentStock - item.quantity;
      SAMPLE_PRODUCTS[productIndex].total_stock = newStock;
      SAMPLE_PRODUCTS[productIndex].updated_at = new Date().toISOString();

      stockUpdates.push({
        productId: item.id,
        productName: item.name,
        previousStock: currentStock,
        newStock: newStock,
        quantitySold: item.quantity,
        packaging: item.packaging || {},
      });

      console.log(
        `📦 Stock updated for ${item.name}: ${currentStock} → ${newStock} (sold ${item.quantity})`
      );
    }

    // Add transaction to sample data for future queries
    SAMPLE_SALES_TRANSACTIONS.unshift({
      ...transaction,
      sales_items: saleItems,
    });

    console.log("✅ Transaction completed:", transactionNumber);

    // Generate receipt
    const receipt = generateReceipt(transaction, saleItems, cart);

    return {
      data: {
        transaction,
        items: saleItems,
        stockUpdates,
        receipt,
        summary: {
          transactionNumber,
          subtotal: transaction.subtotal,
          discountAmount: transaction.discount_amount,
          pwdSeniorDiscount: transaction.pwd_senior_discount,
          totalAmount: transaction.total_amount,
          itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
          itemTypes: cart.length,
        },
      },
      error: null,
    };
  } catch (error) {
    console.error("❌ Error creating sale:", error);
    return { data: null, error: error.message };
  }
}

// Generate receipt for a transaction
function generateReceipt(transaction, items, cart) {
  const receiptItems = cart.map((cartItem) => {
    const unitPrice = cartItem.price || cartItem.selling_price || 0;
    return {
      name: cartItem.name,
      quantity: cartItem.quantity,
      unitPrice: unitPrice,
      lineTotal: unitPrice * cartItem.quantity,
      packaging: cartItem.packaging || {},
    };
  });

  return {
    transaction_number: transaction.transaction_number,
    timestamp: transaction.created_at,
    customer_name: transaction.customer_name,
    items: receiptItems,
    subtotal: transaction.subtotal,
    discount_percentage: transaction.discount_percentage,
    discount_amount: transaction.discount_amount,
    pwd_senior_discount: transaction.pwd_senior_discount,
    total_amount: transaction.total_amount,
    amount_paid: transaction.amount_paid,
    change_amount: transaction.change_amount,
    payment_method: transaction.payment_method,
    cashier: "System User", // Could be dynamic based on user context
  };
}

// Get transaction history for POS
export async function mockGetTransactionHistory(filters = {}) {
  await delay();

  let transactions = [...SAMPLE_SALES_TRANSACTIONS];

  // Apply filters
  if (filters.startDate) {
    transactions = transactions.filter(
      (t) => new Date(t.created_at) >= new Date(filters.startDate)
    );
  }

  if (filters.endDate) {
    transactions = transactions.filter(
      (t) => new Date(t.created_at) <= new Date(filters.endDate)
    );
  }

  if (filters.transactionNumber) {
    transactions = transactions.filter((t) =>
      t.transaction_number
        .toLowerCase()
        .includes(filters.transactionNumber.toLowerCase())
    );
  }

  if (filters.status) {
    transactions = transactions.filter((t) => t.status === filters.status);
  }

  if (filters.limit) {
    transactions = transactions.slice(0, filters.limit);
  }

  return { data: transactions, error: null };
}

// Print receipt (mock implementation)
export async function mockPrintReceipt(transactionId) {
  await delay();

  const transaction = SAMPLE_SALES_TRANSACTIONS.find(
    (t) => t.id === transactionId
  );
  if (!transaction) {
    return { data: null, error: "Transaction not found" };
  }

  // In a real implementation, this would interface with a printer
  console.log(
    "🖨️ Receipt printed for transaction:",
    transaction.transaction_number
  );

  return {
    data: {
      success: true,
      message: "Receipt printed successfully",
      transaction_number: transaction.transaction_number,
    },
    error: null,
  };
}

// Cancel/void a transaction
export async function mockCancelTransaction(transactionId, reason = "") {
  await delay();

  try {
    const transactionIndex = SAMPLE_SALES_TRANSACTIONS.findIndex(
      (t) => t.id === transactionId
    );
    if (transactionIndex === -1) {
      throw new Error("Transaction not found");
    }

    const transaction = SAMPLE_SALES_TRANSACTIONS[transactionIndex];

    if (transaction.status !== "completed") {
      throw new Error("Only completed transactions can be cancelled");
    }

    // Restore stock for each item
    transaction.sales_items.forEach((item) => {
      const productIndex = SAMPLE_PRODUCTS.findIndex(
        (p) => p.id === item.product_id
      );
      if (productIndex !== -1) {
        SAMPLE_PRODUCTS[productIndex].total_stock += item.total_pieces;
        console.log(
          `📦 Stock restored for product ID ${item.product_id}: +${item.total_pieces}`
        );
      }
    });

    // Update transaction status
    SAMPLE_SALES_TRANSACTIONS[transactionIndex] = {
      ...transaction,
      status: "cancelled",
      notes: reason,
      cancelled_at: new Date().toISOString(),
    };

    return {
      data: SAMPLE_SALES_TRANSACTIONS[transactionIndex],
      error: null,
    };
  } catch (error) {
    console.error("Error cancelling transaction:", error);
    return { data: null, error: error.message };
  }
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

// Mock archive product function (soft delete)
export async function mockArchiveProduct(id) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const productIndex = SAMPLE_PRODUCTS.findIndex(
      (p) => p.id === parseInt(id)
    );
    if (productIndex === -1) {
      throw new Error("Product not found");
    }

    // Archive product (mark as inactive)
    SAMPLE_PRODUCTS[productIndex].is_active = false;
    SAMPLE_PRODUCTS[productIndex].updated_at = new Date().toISOString();

    return { data: SAMPLE_PRODUCTS[productIndex], error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

// Mock delete product function (hard delete - only for archived page)
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

    // Only allow deletion if product is already archived
    if (SAMPLE_PRODUCTS[productIndex].is_active) {
      throw new Error("Cannot delete active product. Archive it first.");
    }

    // Remove product completely
    SAMPLE_PRODUCTS.splice(productIndex, 1);

    return { data: { success: true }, error: null };
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
