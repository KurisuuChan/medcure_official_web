/**
 * Utility functions for product calculations and conversions
 * These functions handle the complex variant calculations for boxes, sheets, and pieces
 */

/**
 * Calculate total pieces from box, sheet, and piece quantities
 * @param {Object} quantities - Quantity breakdown
 * @param {number} quantities.boxes - Number of boxes
 * @param {number} quantities.sheets - Number of sheets
 * @param {number} quantities.pieces - Number of individual pieces
 * @param {Object} product - Product with variant information
 * @param {number} product.pieces_per_sheet - Pieces per sheet
 * @param {number} product.sheets_per_box - Sheets per box
 * @returns {number} Total number of individual pieces
 */
export function calculateTotalPieces(quantities, product) {
  const { boxes = 0, sheets = 0, pieces = 0 } = quantities;
  const { pieces_per_sheet = 1, sheets_per_box = 1 } = product;

  const piecesFromBoxes = boxes * sheets_per_box * pieces_per_sheet;
  const piecesFromSheets = sheets * pieces_per_sheet;

  return piecesFromBoxes + piecesFromSheets + pieces;
}

/**
 * Calculate the total price for a given quantity selection
 * @param {Object} quantities - Quantity breakdown
 * @param {Object} product - Product with pricing information
 * @returns {number} Total price
 */
export function calculateTotalPrice(quantities, product) {
  const totalPieces = calculateTotalPieces(quantities, product);
  return totalPieces * product.price;
}

/**
 * Convert total pieces back to optimal box/sheet/piece breakdown
 * Useful for displaying quantities in a user-friendly format
 * @param {number} totalPieces - Total number of pieces
 * @param {Object} product - Product with variant information
 * @returns {Object} Breakdown of boxes, sheets, and pieces
 */
export function convertPiecesToBreakdown(totalPieces, product) {
  const { pieces_per_sheet = 1, sheets_per_box = 1 } = product;

  let remaining = totalPieces;

  // Calculate boxes
  const piecesPerBox = sheets_per_box * pieces_per_sheet;
  const boxes = Math.floor(remaining / piecesPerBox);
  remaining = remaining % piecesPerBox;

  // Calculate sheets
  const sheets = Math.floor(remaining / pieces_per_sheet);
  remaining = remaining % pieces_per_sheet;

  // Remaining pieces
  const pieces = remaining;

  return { boxes, sheets, pieces };
}

/**
 * Format quantity breakdown for display
 * @param {Object} breakdown - Quantity breakdown
 * @returns {string} Formatted display string
 */
export function formatQuantityDisplay(breakdown) {
  const parts = [];

  if (breakdown.boxes > 0) {
    parts.push(`${breakdown.boxes} box${breakdown.boxes > 1 ? "es" : ""}`);
  }
  if (breakdown.sheets > 0) {
    parts.push(`${breakdown.sheets} sheet${breakdown.sheets > 1 ? "s" : ""}`);
  }
  if (breakdown.pieces > 0) {
    parts.push(`${breakdown.pieces} piece${breakdown.pieces > 1 ? "s" : ""}`);
  }

  return parts.join(", ") || "0 pieces";
}

/**
 * Validate if requested quantity is available in stock
 * @param {Object} quantities - Requested quantity breakdown
 * @param {Object} product - Product with stock information
 * @returns {Object} Validation result with success flag and message
 */
export function validateStockAvailability(quantities, product) {
  const requestedPieces = calculateTotalPieces(quantities, product);

  if (requestedPieces <= 0) {
    return {
      success: false,
      message: "Quantity must be greater than zero",
    };
  }

  if (requestedPieces > product.stock) {
    return {
      success: false,
      message: `Insufficient stock. Available: ${product.stock} pieces`,
    };
  }

  return {
    success: true,
    message: "Stock available",
  };
}

/**
 * Calculate profit margin for a product
 * @param {Object} product - Product with price and cost_price
 * @returns {Object} Profit information
 */
export function calculateProfit(product) {
  if (!product.cost_price || !product.price) {
    return {
      profit: 0,
      margin: 0,
      markup: 0,
    };
  }

  const profit = product.price - product.cost_price;
  const margin = (profit / product.price) * 100;
  const markup = (profit / product.cost_price) * 100;

  return {
    profit: Number(profit.toFixed(2)),
    margin: Number(margin.toFixed(2)),
    markup: Number(markup.toFixed(2)),
  };
}

/**
 * Generate a summary of cart items for checkout
 * @param {Array} cartItems - Array of cart items with quantities and products
 * @returns {Object} Cart summary with totals
 */
export function generateCartSummary(cartItems) {
  let totalItems = 0;
  let totalPieces = 0;
  let subtotal = 0;

  const itemSummaries = cartItems.map((item) => {
    const totalItemPieces = calculateTotalPieces(item.quantities, item.product);
    const itemTotal = totalItemPieces * item.product.price;

    totalItems += 1;
    totalPieces += totalItemPieces;
    subtotal += itemTotal;

    return {
      ...item,
      totalPieces: totalItemPieces,
      itemTotal,
      displayQuantity: formatQuantityDisplay(item.quantities),
    };
  });

  // You can add tax calculation here if needed
  const tax = 0; // For now, no tax
  const total = subtotal + tax;

  return {
    items: itemSummaries,
    summary: {
      totalItems,
      totalPieces,
      subtotal,
      tax,
      total,
    },
  };
}
