/**
 * Application constants and configuration
 */

// Product categories
export const PRODUCT_CATEGORIES = [
  "Analgesic",
  "Antibiotic",
  "Antihistamine",
  "Anti-inflammatory",
  "Supplement",
  "First Aid",
  "Cardiovascular",
  "Respiratory",
  "Digestive",
  "Dermatological",
  "Ophthalmic",
  "Otic",
  "Other",
];

// Payment methods
export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Credit/Debit Card" },
  { value: "digital", label: "Digital Payment" },
  { value: "check", label: "Check" },
];

// Stock thresholds
export const STOCK_THRESHOLDS = {
  LOW_STOCK: 10,
  CRITICAL_STOCK: 5,
  OUT_OF_STOCK: 0,
};

// Dashboard refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  DASHBOARD: 5 * 60 * 1000, // 5 minutes
  PRODUCTS: 2 * 60 * 1000, // 2 minutes
  SALES: 1 * 60 * 1000, // 1 minute
  REAL_TIME: 30 * 1000, // 30 seconds
};

// Query stale times (in milliseconds)
export const STALE_TIMES = {
  PRODUCTS: 5 * 60 * 1000, // 5 minutes
  SALES: 2 * 60 * 1000, // 2 minutes
  DASHBOARD: 2 * 60 * 1000, // 2 minutes
  SEARCH: 1 * 60 * 1000, // 1 minute
};

// Currency formatting
export const CURRENCY = {
  SYMBOL: "₱",
  LOCALE: "en-PH",
  OPTIONS: {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  INPUT: "yyyy-MM-dd",
  DATETIME: "MMM dd, yyyy HH:mm",
  TIME: "HH:mm",
  FULL: "EEEE, MMMM dd, yyyy",
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// File upload limits
export const FILE_LIMITS = {
  CSV_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_CSV_TYPES: [
    "text/csv",
    "application/vnd.ms-excel",
    "application/csv",
  ],
  ALLOWED_CSV_EXTENSIONS: [".csv"],
};

// Notification durations (in milliseconds)
export const NOTIFICATION_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  WARNING: 4000,
  INFO: 3000,
};

// API endpoints (if using external APIs)
export const API_ENDPOINTS = {
  CURRENCY_RATES: "https://api.exchangerate-api.com/v4/latest/PHP",
};

// Export default configuration
export const APP_CONFIG = {
  name: "MedCure",
  version: "1.0.0",
  author: "Your Name",
  description: "Professional Pharmacy Management System",
  features: {
    multiVariant: true,
    realTimeUpdates: false, // Enable when implemented
    reporting: true,
    csvImport: true,
    backup: false, // Enable when implemented
  },
};
