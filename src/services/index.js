/**
 * MedCure Backend API Index
 * Central export point for all backend services
 */

// Core Services
export * from "./productService.js";
export * from "./salesService.js";
export * from "./reportService.js";

// Database Configuration
export { supabase, TABLES } from "../lib/supabase.js";

// Utility Functions
export * from "../utils/csvUtils.js";

// Service Collections for organized imports
export { default as ProductService } from "./productService.js";
export { default as SalesService } from "./salesService.js";
export { default as ReportService } from "./reportService.js";

/**
 * Quick API Reference:
 *
 * Product Management:
 * - getProducts(filters)
 * - getProduct(id)
 * - createProduct(productData)
 * - updateProduct(id, updates)
 * - updateProductStock(productId, newStock, movementType, reference)
 * - deleteProduct(id)
 * - importProducts(productsArray)
 * - getCategories()
 * - getInventorySummary()
 *
 * Sales Management:
 * - createSale(saleData)
 * - getSalesTransactions(filters)
 * - getSaleTransaction(id)
 * - getSalesSummary(period)
 * - cancelTransaction(transactionId, reason)
 * - getTopSellingProducts(limit, period)
 * - getHourlySales(date)
 *
 * Reporting:
 * - getSalesReport(startDate, endDate, groupBy)
 * - getInventoryReport()
 * - getLowStockReport()
 * - getExpiringProductsReport(daysAhead)
 * - getProductPerformanceReport(period)
 * - getCustomerSalesReport(startDate, endDate)
 * - getStockMovementReport(productId, startDate, endDate)
 *
 * Stock Management:
 * - createStockMovement(movementData)
 * - getStockMovements(productId, limit)
 *
 * CSV Utilities:
 * - parseCSV(csvText)
 * - convertCSVToProducts(csvData)
 * - generateCSVTemplate()
 * - downloadCSVTemplate()
 * - exportProductsToCSV(products, filename)
 * - validateBarcode(barcode)
 * - formatCurrency(amount, currency)
 * - calculatePackagingBreakdown(totalPieces, piecesPerSheet, sheetsPerBox)
 */
