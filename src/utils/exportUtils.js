/**
 * Enhanced Export Utilities for MedCure Reports
 * Provides comprehensive PDF and CSV export capabilities
 */

/**
 * Format currency for display
 */
export const formatCurrency = (amount, currency = "₱") => {
  return `${currency}${Number(amount || 0).toFixed(2)}`;
};

/**
 * Format date for display
 */
export const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 2) => {
  return `${Number(value || 0).toFixed(decimals)}%`;
};

/**
 * Generate CSV content from data array
 */
export function generateCSVContent(data, columns = null) {
  if (!Array.isArray(data) || data.length === 0) {
    return "No data available";
  }

  // Auto-detect columns if not provided
  if (!columns) {
    const firstItem = data[0];
    columns = Object.keys(firstItem).map(key => ({
      key,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    }));
  }

  // Create CSV header
  const header = columns.map(col => `"${col.label}"`).join(",");
  
  // Create CSV rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key];
      
      // Handle different data types
      if (value === null || value === undefined) {
        value = "";
      } else if (typeof value === "object") {
        value = JSON.stringify(value);
      } else if (typeof value === "string") {
        // Escape quotes in strings
        value = value.replace(/"/g, '""');
      }
      
      return `"${value}"`;
    }).join(",");
  });

  return [header, ...rows].join("\n");
}

/**
 * Download CSV file
 */
export function downloadCSV(content, filename = "export.csv") {
  try {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.href = url;
    link.download = filename;
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    return { success: true, filename };
  } catch (error) {
    console.error("CSV download failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate inventory report CSV
 */
export function exportInventoryCSV(reportData, filename = "inventory-report.csv") {
  const columns = [
    { key: "name", label: "Product Name" },
    { key: "category", label: "Category" },
    { key: "total_stock", label: "Current Stock" },
    { key: "selling_price", label: "Selling Price" },
    { key: "cost_price", label: "Cost Price" },
    { key: "stockValue", label: "Stock Value" },
    { key: "retailValue", label: "Retail Value" },
  ];

  // Prepare data with calculated values
  const csvData = reportData.products.map(product => ({
    ...product,
    stockValue: formatCurrency((product.total_stock || 0) * (product.cost_price || 0)),
    retailValue: formatCurrency((product.total_stock || 0) * (product.selling_price || 0)),
    selling_price: formatCurrency(product.selling_price || 0),
    cost_price: formatCurrency(product.cost_price || 0),
  }));

  const csvContent = generateCSVContent(csvData, columns);
  return downloadCSV(csvContent, filename);
}

/**
 * Generate sales report CSV
 */
export function exportSalesCSV(reportData, filename = "sales-report.csv") {
  const columns = [
    { key: "id", label: "Sale ID" },
    { key: "created_at", label: "Date" },
    { key: "total", label: "Total Amount" },
    { key: "payment_method", label: "Payment Method" },
    { key: "items_count", label: "Items Count" },
  ];

  // Prepare data
  const csvData = reportData.sales.map(sale => ({
    ...sale,
    created_at: formatDate(sale.created_at),
    total: formatCurrency(sale.total || 0),
    items_count: sale.sale_items?.length || 0,
  }));

  const csvContent = generateCSVContent(csvData, columns);
  return downloadCSV(csvContent, filename);
}

/**
 * Generate low stock report CSV
 */
export function exportLowStockCSV(reportData, filename = "low-stock-report.csv") {
  const columns = [
    { key: "name", label: "Product Name" },
    { key: "category", label: "Category" },
    { key: "total_stock", label: "Current Stock" },
    { key: "critical_level", label: "Critical Level" },
    { key: "urgency", label: "Urgency" },
    { key: "selling_price", label: "Selling Price" },
  ];

  // Prepare data with urgency calculation
  const csvData = reportData.products.all.map(product => ({
    ...product,
    urgency: (product.total_stock || 0) === 0 ? "Critical" : 
             (product.total_stock || 0) <= 3 ? "High" : "Medium",
    selling_price: formatCurrency(product.selling_price || 0),
  }));

  const csvContent = generateCSVContent(csvData, columns);
  return downloadCSV(csvContent, filename);
}

/**
 * Generate product performance CSV
 */
export function exportProductPerformanceCSV(reportData, filename = "product-performance.csv") {
  const columns = [
    { key: "name", label: "Product Name" },
    { key: "category", label: "Category" },
    { key: "quantitySold", label: "Quantity Sold" },
    { key: "revenue", label: "Revenue" },
    { key: "profit", label: "Profit" },
    { key: "profitMargin", label: "Profit Margin %" },
    { key: "turnoverRate", label: "Turnover Rate" },
  ];

  // Use top performers by revenue for the CSV
  const csvData = reportData.topPerformers.byRevenue.map(product => ({
    ...product,
    revenue: formatCurrency(product.revenue),
    profit: formatCurrency(product.profit),
    profitMargin: formatPercentage(product.profitMargin),
    turnoverRate: Number(product.turnoverRate || 0).toFixed(2),
  }));

  const csvContent = generateCSVContent(csvData, columns);
  return downloadCSV(csvContent, filename);
}

/**
 * Generate simple text-based PDF content
 * This is a fallback for when jsPDF is not available
 */
export function generateTextReport(reportData, reportType = "general") {
  let content = `MEDCURE PHARMACY MANAGEMENT SYSTEM\n`;
  content += `${reportType.toUpperCase()} REPORT\n`;
  content += `Generated: ${new Date().toLocaleString()}\n`;
  content += `${"=".repeat(60)}\n\n`;

  switch (reportType) {
    case "inventory":
      content += generateInventoryTextReport(reportData);
      break;
    case "sales":
      content += generateSalesTextReport(reportData);
      break;
    case "financial":
      content += generateFinancialTextReport(reportData);
      break;
    case "lowstock":
      content += generateLowStockTextReport(reportData);
      break;
    case "performance":
      content += generatePerformanceTextReport(reportData);
      break;
    default:
      content += "Report data:\n";
      content += JSON.stringify(reportData, null, 2);
  }

  content += `\n${"=".repeat(60)}\n`;
  content += `End of Report\n`;
  content += `Generated by MedCure Pharmacy Management System\n`;

  return content;
}

/**
 * Generate inventory text report
 */
function generateInventoryTextReport(reportData) {
  let content = `INVENTORY SUMMARY\n`;
  content += `-`.repeat(30) + `\n`;
  content += `Total Products: ${reportData.summary.totalProducts}\n`;
  content += `Total Stock Value: ${formatCurrency(reportData.summary.totalStockValue)}\n`;
  content += `Total Retail Value: ${formatCurrency(reportData.summary.totalRetailValue)}\n`;
  content += `Potential Profit: ${formatCurrency(reportData.summary.potentialProfit)}\n`;
  content += `Profit Margin: ${formatPercentage(reportData.summary.profitMargin)}\n\n`;

  content += `CATEGORY BREAKDOWN\n`;
  content += `-`.repeat(30) + `\n`;
  reportData.categoryBreakdown.forEach(category => {
    content += `${category.category}:\n`;
    content += `  Products: ${category.count}\n`;
    content += `  Total Stock: ${category.totalStock}\n`;
    content += `  Total Value: ${formatCurrency(category.totalValue)}\n\n`;
  });

  if (reportData.lowStock) {
    content += `LOW STOCK ALERTS\n`;
    content += `-`.repeat(30) + `\n`;
    content += `Low Stock Products: ${reportData.lowStock.count}\n`;
    content += `Out of Stock: ${reportData.lowStock.criticalProducts.length}\n\n`;
    
    if (reportData.lowStock.products.length > 0) {
      content += `Low Stock Products:\n`;
      reportData.lowStock.products.slice(0, 10).forEach((product, index) => {
        content += `${index + 1}. ${product.name} - Stock: ${product.total_stock || 0}\n`;
      });
    }
  }

  return content;
}

/**
 * Generate sales text report
 */
function generateSalesTextReport(reportData) {
  let content = `SALES SUMMARY\n`;
  content += `-`.repeat(30) + `\n`;
  content += `Total Sales: ${reportData.summary.totalSales}\n`;
  content += `Total Revenue: ${formatCurrency(reportData.summary.totalRevenue)}\n`;
  content += `Average Transaction: ${formatCurrency(reportData.summary.averageTransaction)}\n`;
  content += `Daily Average: ${formatCurrency(reportData.summary.dailyAverage)}\n\n`;

  content += `PERIOD: ${formatDate(reportData.summary.period.startDate)} to ${formatDate(reportData.summary.period.endDate)}\n\n`;

  if (reportData.topProducts) {
    content += `TOP PRODUCTS\n`;
    content += `-`.repeat(30) + `\n`;
    reportData.topProducts.slice(0, 10).forEach((product, index) => {
      content += `${index + 1}. ${product.name}\n`;
      content += `   Quantity Sold: ${product.quantitySold}\n`;
      content += `   Revenue: ${formatCurrency(product.revenue)}\n\n`;
    });
  }

  if (reportData.categoryBreakdown) {
    content += `SALES BY CATEGORY\n`;
    content += `-`.repeat(30) + `\n`;
    reportData.categoryBreakdown.forEach(category => {
      content += `${category.category}: ${formatCurrency(category.revenue)}\n`;
    });
  }

  return content;
}

/**
 * Generate financial text report
 */
function generateFinancialTextReport(reportData) {
  let content = `FINANCIAL SUMMARY (${reportData.period.type.toUpperCase()})\n`;
  content += `-`.repeat(30) + `\n`;
  content += `Revenue: ${formatCurrency(reportData.sales.revenue)}\n`;
  content += `Transactions: ${reportData.sales.transactions}\n`;
  content += `Average Transaction: ${formatCurrency(reportData.sales.averageTransaction)}\n\n`;

  content += `INVENTORY\n`;
  content += `-`.repeat(30) + `\n`;
  content += `Stock Value: ${formatCurrency(reportData.inventory.stockValue)}\n`;
  content += `Retail Value: ${formatCurrency(reportData.inventory.retailValue)}\n`;
  content += `Total Products: ${reportData.inventory.totalProducts}\n\n`;

  content += `PROFITABILITY\n`;
  content += `-`.repeat(30) + `\n`;
  content += `Gross Profit: ${formatCurrency(reportData.profitability.grossProfit)}\n`;
  content += `Margin: ${formatPercentage(reportData.profitability.marginPercentage)}\n`;
  content += `Turnover Rate: ${Number(reportData.profitability.turnoverRate).toFixed(2)}\n\n`;

  return content;
}

/**
 * Generate low stock text report
 */
function generateLowStockTextReport(reportData) {
  let content = `LOW STOCK ALERT SUMMARY\n`;
  content += `-`.repeat(30) + `\n`;
  content += `Total Low Stock: ${reportData.summary.totalLowStock}\n`;
  content += `Out of Stock: ${reportData.summary.outOfStock}\n`;
  content += `Critically Low: ${reportData.summary.criticallyLow}\n`;
  content += `Low: ${reportData.summary.low}\n`;
  content += `Threshold: ${reportData.summary.threshold}\n\n`;

  content += `OUT OF STOCK PRODUCTS\n`;
  content += `-`.repeat(30) + `\n`;
  reportData.products.outOfStock.forEach((product, index) => {
    content += `${index + 1}. ${product.name} (${product.category || 'N/A'})\n`;
  });

  content += `\nCRITICALLY LOW STOCK\n`;
  content += `-`.repeat(30) + `\n`;
  reportData.products.criticallyLow.forEach((product, index) => {
    content += `${index + 1}. ${product.name} - Stock: ${product.total_stock || 0}\n`;
  });

  if (reportData.recommendations) {
    content += `\nREORDER RECOMMENDATIONS\n`;
    content += `-`.repeat(30) + `\n`;
    reportData.recommendations.slice(0, 10).forEach((rec, index) => {
      content += `${index + 1}. ${rec.productName}\n`;
      content += `   Current: ${rec.currentStock}\n`;
      content += `   Recommended Order: ${rec.recommendedOrderQuantity}\n`;
      content += `   Urgency: ${rec.urgency}\n`;
      content += `   Est. Cost: ${formatCurrency(rec.estimatedCost)}\n\n`;
    });
  }

  return content;
}

/**
 * Generate performance text report
 */
function generatePerformanceTextReport(reportData) {
  let content = `PRODUCT PERFORMANCE SUMMARY\n`;
  content += `-`.repeat(30) + `\n`;
  content += `Total Products: ${reportData.summary.totalProducts}\n`;
  content += `Products with Sales: ${reportData.summary.productsWithSales}\n`;
  content += `Total Revenue: ${formatCurrency(reportData.summary.totalRevenue)}\n`;
  content += `Total Profit: ${formatCurrency(reportData.summary.totalProfit)}\n\n`;

  content += `TOP PERFORMERS BY REVENUE\n`;
  content += `-`.repeat(30) + `\n`;
  reportData.topPerformers.byRevenue.slice(0, 10).forEach((product, index) => {
    content += `${index + 1}. ${product.name}\n`;
    content += `   Revenue: ${formatCurrency(product.revenue)}\n`;
    content += `   Quantity Sold: ${product.quantitySold}\n`;
    content += `   Profit: ${formatCurrency(product.profit)}\n\n`;
  });

  content += `CATEGORY PERFORMANCE\n`;
  content += `-`.repeat(30) + `\n`;
  reportData.categoryPerformance.forEach(category => {
    content += `${category.category}:\n`;
    content += `  Products: ${category.totalProducts}\n`;
    content += `  Revenue: ${formatCurrency(category.totalRevenue)}\n`;
    content += `  Profit: ${formatCurrency(category.totalProfit)}\n`;
    content += `  Avg Turnover: ${Number(category.averageTurnover).toFixed(2)}\n\n`;
  });

  return content;
}

/**
 * Download text-based PDF (as TXT file)
 */
export function downloadTextPDF(content, filename = "report.txt") {
  try {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.href = url;
    link.download = filename;
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    return { success: true, filename };
  } catch (error) {
    console.error("Text PDF download failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Export report as text-based PDF
 */
export function exportReportPDF(reportData, reportType, filename) {
  const content = generateTextReport(reportData, reportType);
  const txtFilename = filename.replace('.pdf', '.txt');
  return downloadTextPDF(content, txtFilename);
}

// Export all functions
export default {
  formatCurrency,
  formatDate,
  formatPercentage,
  generateCSVContent,
  downloadCSV,
  exportInventoryCSV,
  exportSalesCSV,
  exportLowStockCSV,
  exportProductPerformanceCSV,
  generateTextReport,
  downloadTextPDF,
  exportReportPDF,
};
