/**
 * Utility functions for CSV import and data processing
 */

// Parse CSV text to array of objects
export function parseCSV(csvText) {
  try {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV must have at least a header row and one data row");
    }

    const headers = lines[0]
      .split(",")
      .map((header) => header.trim().replace(/"/g, ""));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i]
        .split(",")
        .map((cell) => cell.trim().replace(/"/g, ""));
      const obj = {};

      headers.forEach((header, index) => {
        obj[header] = row[index] || "";
      });

      data.push(obj);
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

// Convert parsed CSV data to product format
export function convertCSVToProducts(csvData) {
  try {
    const products = csvData.map((row, index) => {
      // Map CSV columns to product fields
      const product = {
        name:
          row.name || row.product_name || row.Name || row["Product Name"] || "",
        generic_name: row.generic_name || row.generic || row.Generic || "",
        brand_name: row.brand_name || row.brand || row.Brand || "",
        category: row.category || row.Category || "General",
        description: row.description || row.Description || "",
        barcode: row.barcode || row.Barcode || row.sku || row.SKU || "",
        supplier: row.supplier || row.Supplier || "",
        cost_price: parseFloat(
          row.cost_price || row.cost || row.Cost || row["Cost Price"] || 0
        ),
        selling_price: parseFloat(
          row.selling_price ||
            row.price ||
            row.Price ||
            row["Selling Price"] ||
            0
        ),
        total_stock: parseInt(
          row.total_stock ||
            row.stock ||
            row.Stock ||
            row.quantity ||
            row.Quantity ||
            0
        ),
        critical_level: parseInt(
          row.critical_level || row.min_stock || row["Min Stock"] || 10
        ),
        pieces_per_sheet: parseInt(
          row.pieces_per_sheet ||
            row.pcs_per_sheet ||
            row["Pieces per Sheet"] ||
            1
        ),
        sheets_per_box: parseInt(
          row.sheets_per_box || row.sheets_per_box || row["Sheets per Box"] || 1
        ),
        expiry_date: parseDate(
          row.expiry_date || row.expiry || row.Expiry || row["Expiry Date"]
        ),
        batch_number: row.batch_number || row.batch || row.Batch || "",
      };

      // Validation
      if (!product.name) {
        throw new Error(`Row ${index + 2}: Product name is required`);
      }

      if (product.cost_price < 0 || product.selling_price < 0) {
        throw new Error(`Row ${index + 2}: Prices cannot be negative`);
      }

      if (product.total_stock < 0) {
        throw new Error(`Row ${index + 2}: Stock cannot be negative`);
      }

      if (product.selling_price < product.cost_price) {
        console.warn(
          `Row ${index + 2}: Selling price is less than cost price for ${
            product.name
          }`
        );
      }

      return product;
    });

    return { data: products, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

// Parse date string to valid date format
function parseDate(dateString) {
  if (!dateString) return null;

  // Try different date formats
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
  ];

  let parsedDate = null;

  // Try parsing with different formats
  if (formats[0].test(dateString)) {
    parsedDate = new Date(dateString);
  } else if (formats[1].test(dateString)) {
    const [month, day, year] = dateString.split("/");
    parsedDate = new Date(
      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    );
  } else if (formats[2].test(dateString)) {
    const [month, day, year] = dateString.split("-");
    parsedDate = new Date(
      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
    );
  } else if (formats[3].test(dateString)) {
    parsedDate = new Date(dateString.replace(/\//g, "-"));
  } else {
    // Try JavaScript's built-in date parsing
    parsedDate = new Date(dateString);
  }

  // Validate the parsed date
  if (isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString().split("T")[0]; // Return YYYY-MM-DD format
}

// Generate sample CSV template
export function generateCSVTemplate() {
  const headers = [
    "name",
    "generic_name",
    "category",
    "barcode",
    "supplier",
    "cost_price",
    "selling_price",
    "total_stock",
    "critical_level",
    "pieces_per_sheet",
    "sheets_per_box",
    "expiry_date",
    "batch_number",
    "description",
  ];

  const sampleData = [
    {
      name: "Paracetamol 500mg",
      generic_name: "Paracetamol",
      category: "Pain Relief",
      barcode: "1234567890123",
      supplier: "PharmaCorp Inc.",
      cost_price: "12.50",
      selling_price: "15.50",
      total_stock: "100",
      critical_level: "10",
      pieces_per_sheet: "10",
      sheets_per_box: "10",
      expiry_date: "2025-12-31",
      batch_number: "BATCH001",
      description: "Pain reliever and fever reducer",
    },
  ];

  // Create CSV string
  const csvContent = [
    headers.join(","),
    ...sampleData.map((row) =>
      headers.map((header) => `"${row[header] || ""}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
}

// Download CSV template
export function downloadCSVTemplate() {
  const csvContent = generateCSVTemplate();
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "product_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Export products to CSV
export function exportProductsToCSV(
  products,
  filename = "products_export.csv"
) {
  try {
    const headers = [
      "id",
      "name",
      "generic_name",
      "category",
      "barcode",
      "supplier",
      "cost_price",
      "selling_price",
      "total_stock",
      "critical_level",
      "pieces_per_sheet",
      "sheets_per_box",
      "expiry_date",
      "batch_number",
      "description",
      "created_at",
    ];

    const csvContent = [
      headers.join(","),
      ...products.map((product) =>
        headers
          .map((header) => {
            let value = product[header] || "";
            // Escape quotes and wrap in quotes if contains comma
            if (
              typeof value === "string" &&
              (value.includes(",") || value.includes('"'))
            ) {
              value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Format currency
export function formatCurrency(amount, currency = "₱") {
  return `${currency}${parseFloat(amount || 0).toFixed(2)}`;
}

// Format date
export function formatDate(dateString, locale = "en-US") {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  } else {
    return formatDate(dateString);
  }
}

// Calculate packaging breakdown
export function calculatePackagingBreakdown(
  totalPieces,
  piecesPerSheet,
  sheetsPerBox
) {
  const totalPiecesPerBox = piecesPerSheet * sheetsPerBox;

  const boxes = Math.floor(totalPieces / totalPiecesPerBox);
  const remainingAfterBoxes = totalPieces % totalPiecesPerBox;

  const sheets = Math.floor(remainingAfterBoxes / piecesPerSheet);
  const pieces = remainingAfterBoxes % piecesPerSheet;

  return { boxes, sheets, pieces };
}

// Validate barcode format (basic validation)
export function validateBarcode(barcode) {
  if (!barcode) return { valid: true, error: null };

  // Remove any spaces or dashes
  const cleanBarcode = barcode.replace(/[\s-]/g, "");

  // Check common barcode formats
  const formats = [
    { name: "UPC-A", pattern: /^\d{12}$/ },
    { name: "EAN-13", pattern: /^\d{13}$/ },
    { name: "EAN-8", pattern: /^\d{8}$/ },
    { name: "Alphanumeric", pattern: /^[A-Za-z0-9]{1,48}$/ },
  ];

  for (const format of formats) {
    if (format.pattern.test(cleanBarcode)) {
      return { valid: true, error: null, format: format.name };
    }
  }

  return {
    valid: false,
    error:
      "Invalid barcode format. Please use UPC-A (12 digits), EAN-13 (13 digits), or EAN-8 (8 digits).",
  };
}
