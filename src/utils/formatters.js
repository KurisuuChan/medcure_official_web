import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { CURRENCY, DATE_FORMATS } from "./constants.js";

/**
 * Format currency values consistently throughout the app
 * @param {number} value - Numeric value to format
 * @param {Object} options - Additional formatting options
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, options = {}) {
  if (value === null || value === undefined || isNaN(value)) {
    return `${CURRENCY.SYMBOL}0.00`;
  }

  const numericValue = Number(value);

  try {
    return new Intl.NumberFormat(CURRENCY.LOCALE, {
      ...CURRENCY.OPTIONS,
      ...options,
    }).format(numericValue);
  } catch {
    // Fallback formatting if Intl.NumberFormat fails
    return `${CURRENCY.SYMBOL}${numericValue.toFixed(2)}`;
  }
}

/**
 * Format dates for display
 * @param {string|Date} date - Date to format
 * @param {string} formatType - Type of format to use
 * @returns {string} Formatted date string
 */
export function formatDate(date, formatType = "DISPLAY") {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }

    const formatString = DATE_FORMATS[formatType] || formatType;
    return format(dateObj, formatString);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }

    // Handle special cases
    if (isToday(dateObj)) {
      return `Today at ${format(dateObj, "HH:mm")}`;
    }

    if (isYesterday(dateObj)) {
      return `Yesterday at ${format(dateObj, "HH:mm")}`;
    }

    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return "Invalid Date";
  }
}

/**
 * Format numbers with proper thousand separators
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || isNaN(value)) {
    return "0";
  }

  const numericValue = Number(value);

  try {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numericValue);
  } catch {
    return numericValue.toFixed(decimals);
  }
}

/**
 * Format percentage values
 * @param {number} value - Value to format as percentage (0.15 = 15%)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return "0%";
  }

  const numericValue = Number(value);

  try {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numericValue / 100);
  } catch {
    return `${numericValue.toFixed(decimals)}%`;
  }
}

/**
 * Format file sizes in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Format stock status with color coding
 * @param {number} stock - Current stock level
 * @param {Object} thresholds - Stock threshold configuration
 * @returns {Object} Status object with text and color
 */
export function formatStockStatus(
  stock,
  thresholds = { low: 10, critical: 5 }
) {
  if (stock <= 0) {
    return {
      text: "Out of Stock",
      color: "text-red-600",
      bgColor: "bg-red-50",
      status: "out",
    };
  }

  if (stock <= thresholds.critical) {
    return {
      text: "Critical Stock",
      color: "text-red-600",
      bgColor: "bg-red-50",
      status: "critical",
    };
  }

  if (stock <= thresholds.low) {
    return {
      text: "Low Stock",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      status: "low",
    };
  }

  return {
    text: "In Stock",
    color: "text-green-600",
    bgColor: "bg-green-50",
    status: "good",
  };
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 50) {
  if (!text || typeof text !== "string") return "";

  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Format search term for highlighting
 * @param {string} text - Text to search in
 * @param {string} searchTerm - Term to highlight
 * @returns {string} Text with highlighted search term
 */
export function highlightSearchTerm(text, searchTerm) {
  if (!text || !searchTerm) return text;

  const regex = new RegExp(`(${searchTerm})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

/**
 * Capitalize first letter of each word
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export function capitalizeWords(text) {
  if (!text || typeof text !== "string") return "";

  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Generate initials from a name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export function getInitials(name) {
  if (!name || typeof name !== "string") return "??";

  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}
