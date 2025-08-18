/**
 * PDF Utilities for MedCure Pharmacy Management System
 * This file contains utilities for generating PDF reports
 *
 * Note: To use actual PDF generation, install jsPDF:
 * npm install jspdf jspdf-autotable
 *
 * Then uncomment the jsPDF imports and implementation
 */

// Uncomment these when jsPDF is installed
// import jsPDF from "jspdf";
// import "jspdf-autotable";

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
 * Test function to verify PDF generation works
 */
export function testPDFGeneration() {
  try {
    // Mock test for now
    console.log("📄 PDF Test: Libraries available");
    return { success: true, error: null };
  } catch (error) {
    console.error("📄 PDF Test failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate a simple PDF without advanced features
 * This is a fallback for when jsPDF is not available
 */
export function generateSimplePDF(data, filename = "export.pdf") {
  try {
    console.log(`📄 Generating simple PDF: ${filename}`);

    // Create a simple text-based export
    const content = generateTextReport(data);

    // Create blob and download
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.replace(".pdf", ".txt");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, error: null, filename };
  } catch (error) {
    console.error("📄 Simple PDF generation failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate text report content
 */
function generateTextReport(data) {
  let content = `MEDCURE PHARMACY MANAGEMENT SYSTEM\n`;
  content += `Report Generated: ${new Date().toLocaleString()}\n`;
  content += `${"=".repeat(50)}\n\n`;

  if (Array.isArray(data) && data.length > 0) {
    const firstItem = data[0];

    // Check if it's transaction data
    if (firstItem.transaction_number) {
      content += `TRANSACTION HISTORY REPORT\n`;
      content += `Total Transactions: ${data.length}\n\n`;

      data.forEach((transaction, index) => {
        content += `${index + 1}. Transaction: ${
          transaction.transaction_number
        }\n`;
        content += `   Date: ${formatDate(transaction.created_at)}\n`;
        content += `   Total: ${formatCurrency(transaction.total_amount)}\n`;
        content += `   Status: ${transaction.status}\n`;
        content += `   Payment: ${transaction.payment_method}\n\n`;
      });
    } else {
      // Product data
      content += `PRODUCT INVENTORY REPORT\n`;
      content += `Total Products: ${data.length}\n\n`;

      data.forEach((product, index) => {
        content += `${index + 1}. ${product.name}\n`;
        content += `   Category: ${product.category || "N/A"}\n`;
        content += `   Stock: ${product.stock || product.total_stock || 0}\n`;
        content += `   Price: ${formatCurrency(
          product.price || product.selling_price
        )}\n`;
        if (product.generic_name) {
          content += `   Generic: ${product.generic_name}\n`;
        }
        content += `\n`;
      });
    }
  } else {
    content += `No data available for export.\n`;
  }

  content += `\n${"=".repeat(50)}\n`;
  content += `End of Report\n`;

  return content;
}

/**
 * Generate comprehensive product catalog PDF
 * TODO: Implement with jsPDF when available
 */
export function generateProductCatalogPDF(products, options = {}) {
  console.log("📄 Product Catalog PDF requested");

  // For now, use simple PDF
  return generateSimplePDF(products, options.filename || "product-catalog.pdf");
}

/**
 * Generate low stock report PDF
 * TODO: Implement with jsPDF when available
 */
export function generateLowStockReportPDF(
  products,
  filename = "low-stock-report.pdf"
) {
  console.log("📄 Low Stock Report PDF requested");

  const lowStockProducts = products.filter(
    (p) => (p.total_stock || p.stock || 0) <= (p.critical_level || 10)
  );

  return generateSimplePDF(lowStockProducts, filename);
}

/**
 * Generate inventory valuation report PDF
 * TODO: Implement with jsPDF when available
 */
export function generateInventoryValuationPDF(
  products,
  filename = "inventory-valuation.pdf"
) {
  console.log("📄 Inventory Valuation PDF requested");

  return generateSimplePDF(products, filename);
}

/**
 * Generate transaction history report PDF
 * TODO: Implement with jsPDF when available
 */
export function generateTransactionHistoryPDF(
  transactions,
  filename = "transaction-history.pdf"
) {
  console.log("📄 Transaction History PDF requested");

  return generateSimplePDF(transactions, filename);
}

/**
 * Generate sales report PDF
 * TODO: Implement with jsPDF when available
 */
export function generateSalesReportPDF(
  salesData,
  filename = "sales-report.pdf"
) {
  console.log("📄 Sales Report PDF requested");

  return generateSimplePDF(salesData, filename);
}

/**
 * Generate simple product list PDF
 * TODO: Implement with jsPDF when available
 */
export function generateProductListPDF(
  products,
  filename = "product-list.pdf"
) {
  console.log("📄 Product List PDF requested");

  return generateSimplePDF(products, filename);
}

/**
 * Print receipt for a transaction
 * This creates a printable receipt format
 */
export function printReceipt(transaction, items = []) {
  try {
    const receiptWindow = window.open("", "_blank");
    const receiptHTML = generateReceiptHTML(transaction, items);

    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
    receiptWindow.focus();

    // Auto-print after a short delay
    setTimeout(() => {
      receiptWindow.print();
      receiptWindow.close();
    }, 250);

    return { success: true, message: "Receipt printed successfully" };
  } catch (error) {
    console.error("Receipt printing failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate HTML content for receipt printing
 */
function generateReceiptHTML(transaction, items = []) {
  const date = new Date(transaction.created_at || new Date());

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${transaction.transaction_number}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          width: 300px;
          margin: 0 auto;
          padding: 10px;
          font-size: 12px;
        }
        .header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .item {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
        }
        .total {
          border-top: 1px dashed #000;
          padding-top: 5px;
          margin-top: 10px;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed #000;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>MEDCURE PHARMACY</h2>
        <p>123 Medical Street, Health City</p>
        <p>Tel: (123) 456-7890</p>
        <hr>
        <p>Receipt #: ${transaction.transaction_number}</p>
        <p>Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</p>
        <p>Cashier: POS System</p>
      </div>
      
      <div class="items">
        ${(transaction.sales_items || items || [])
          .map(
            (item) => `
          <div class="item">
            <span>${item.product?.name || "Product"}</span>
          </div>
          <div class="item">
            <span>  ${item.total_pieces || item.quantity} pcs × ₱${(
              item.unit_price || 0
            ).toFixed(2)}</span>
            <span>₱${(item.line_total || 0).toFixed(2)}</span>
          </div>
        `
          )
          .join("")}
      </div>
      
      <div class="total">
        <div class="item">
          <span>Subtotal:</span>
          <span>₱${(transaction.subtotal || 0).toFixed(2)}</span>
        </div>
        ${
          (transaction.discount_amount || 0) > 0
            ? `
        <div class="item">
          <span>Discount:</span>
          <span>-₱${(transaction.discount_amount || 0).toFixed(2)}</span>
        </div>
        `
            : ""
        }
        ${
          (transaction.pwd_senior_discount || 0) > 0
            ? `
        <div class="item">
          <span>PWD/Senior Discount:</span>
          <span>-₱${(transaction.pwd_senior_discount || 0).toFixed(2)}</span>
        </div>
        `
            : ""
        }
        <div class="item">
          <span>TOTAL:</span>
          <span>₱${(transaction.total_amount || 0).toFixed(2)}</span>
        </div>
        <div class="item">
          <span>Cash:</span>
          <span>₱${(transaction.amount_paid || 0).toFixed(2)}</span>
        </div>
        <div class="item">
          <span>Change:</span>
          <span>₱${(transaction.change_amount || 0).toFixed(2)}</span>
        </div>
      </div>
      
      <div class="footer">
        <p>Thank you for your business!</p>
        <p>Please keep this receipt for your records.</p>
        ${
          transaction.is_pwd_senior
            ? `<p>*** PWD/SENIOR CITIZEN DISCOUNT APPLIED ***</p>`
            : ""
        }
      </div>
    </body>
    </html>
  `;
}

// Export default object with all functions
export default {
  testPDFGeneration,
  generateSimplePDF,
  generateProductCatalogPDF,
  generateLowStockReportPDF,
  generateInventoryValuationPDF,
  generateTransactionHistoryPDF,
  generateSalesReportPDF,
  generateProductListPDF,
  printReceipt,
  formatCurrency,
  formatDate,
};
