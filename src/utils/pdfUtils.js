import jsPDF from "jspdf";
import "jspdf-autotable";

/**
 * Utility functions for PDF generation and export
 */

// Format currency for display
export const formatCurrency = (amount, currency = "₱") => {
  return `${currency}${Number(amount).toFixed(2)}`;
};

// Format date for display
export const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Generate comprehensive product catalog PDF
export function generateProductCatalogPDF(products, options = {}) {
  try {
    const {
      title = "Product Catalog",
      includeImages = false,
      includeFinancials = true,
      groupByCategory = true,
      filename = "product-catalog.pdf",
    } = options;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Set up the document
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Header
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(title, pageWidth / 2, 25, { align: "center" });

    // Subtitle with date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on ${formatDate(new Date())}`, pageWidth / 2, 32, {
      align: "center",
    });

    // Summary statistics
    const totalProducts = products.length;
    const totalStock = products.reduce(
      (sum, p) => sum + (p.total_stock || 0),
      0
    );
    const totalValue = products.reduce(
      (sum, p) => sum + (p.total_stock || 0) * (p.cost_price || 0),
      0
    );
    const lowStockCount = products.filter(
      (p) => (p.total_stock || 0) <= (p.critical_level || 10)
    ).length;
    const outOfStockCount = products.filter(
      (p) => (p.total_stock || 0) === 0
    ).length;

    // Summary box
    doc.setFillColor(240, 248, 255);
    doc.rect(margin, 40, pageWidth - 2 * margin, 25, "F");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Inventory Summary", margin + 5, 48);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Products: ${totalProducts}`, margin + 5, 55);
    doc.text(
      `Total Stock: ${totalStock.toLocaleString()} units`,
      margin + 5,
      60
    );
    doc.text(
      `Inventory Value: ${formatCurrency(totalValue)}`,
      pageWidth / 2 + 10,
      55
    );
    doc.text(`Low Stock Items: ${lowStockCount}`, pageWidth / 2 + 10, 60);

    let yPosition = 75;

    if (groupByCategory) {
      // Group products by category
      const categorizedProducts = products.reduce((acc, product) => {
        const category = product.category || "Uncategorized";
        if (!acc[category]) acc[category] = [];
        acc[category].push(product);
        return acc;
      }, {});

      // Generate table for each category
      Object.entries(categorizedProducts).forEach(
        ([category, categoryProducts]) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 60) {
            doc.addPage();
            yPosition = 20;
          }

          // Category header
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setFillColor(59, 130, 246);
          doc.setTextColor(255, 255, 255);
          doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");
          doc.text(
            `${category} (${categoryProducts.length} products)`,
            margin + 3,
            yPosition + 5.5
          );

          yPosition += 12;

          // Create table data
          const tableData = categoryProducts.map((product) => {
            const row = [
              product.name || "N/A",
              product.generic_name || "-",
              `${product.total_stock || 0}`,
              formatCurrency(product.cost_price || 0),
              formatCurrency(product.selling_price || 0),
            ];

            if (includeFinancials) {
              const profit =
                (product.selling_price || 0) - (product.cost_price || 0);
              const inventoryValue =
                (product.total_stock || 0) * (product.cost_price || 0);
              row.push(formatCurrency(profit));
              row.push(formatCurrency(inventoryValue));
            }

            return row;
          });

          // Table headers
          const headers = [
            "Product Name",
            "Generic Name",
            "Stock",
            "Cost Price",
            "Selling Price",
          ];
          if (includeFinancials) {
            headers.push("Profit/Unit", "Inventory Value");
          }

          // Generate table
          doc.autoTable({
            startY: yPosition,
            head: [headers],
            body: tableData,
            theme: "grid",
            styles: {
              fontSize: 8,
              cellPadding: 2,
            },
            headStyles: {
              fillColor: [99, 102, 241],
              textColor: 255,
              fontStyle: "bold",
            },
            columnStyles: {
              0: { cellWidth: 40 }, // Product Name
              1: { cellWidth: 30 }, // Generic Name
              2: { cellWidth: 15, halign: "center" }, // Stock
              3: { cellWidth: 20, halign: "right" }, // Cost Price
              4: { cellWidth: 20, halign: "right" }, // Selling Price
              ...(includeFinancials && {
                5: { cellWidth: 20, halign: "right" }, // Profit
                6: { cellWidth: 25, halign: "right" }, // Inventory Value
              }),
            },
            didParseCell: function (data) {
              // Color code stock levels
              if (data.column.index === 2 && data.section === "body") {
                const product = categoryProducts[data.row.index];
                const stock = product.total_stock || 0;
                const critical = product.critical_level || 10;

                if (stock === 0) {
                  data.cell.styles.textColor = [220, 38, 38]; // Red
                  data.cell.styles.fontStyle = "bold";
                } else if (stock <= critical) {
                  data.cell.styles.textColor = [245, 158, 11]; // Orange
                  data.cell.styles.fontStyle = "bold";
                } else {
                  data.cell.styles.textColor = [34, 197, 94]; // Green
                }
              }
            },
            margin: { left: margin, right: margin },
          });

          yPosition = doc.lastAutoTable.finalY + 10;
        }
      );
    } else {
      // Single table with all products
      const tableData = products.map((product) => {
        const row = [
          product.name || "N/A",
          product.category || "N/A",
          product.generic_name || "-",
          `${product.total_stock || 0}`,
          formatCurrency(product.cost_price || 0),
          formatCurrency(product.selling_price || 0),
        ];

        if (includeFinancials) {
          const profit =
            (product.selling_price || 0) - (product.cost_price || 0);
          const inventoryValue =
            (product.total_stock || 0) * (product.cost_price || 0);
          row.push(formatCurrency(profit));
          row.push(formatCurrency(inventoryValue));
        }

        return row;
      });

      const headers = [
        "Product Name",
        "Category",
        "Generic Name",
        "Stock",
        "Cost Price",
        "Selling Price",
      ];
      if (includeFinancials) {
        headers.push("Profit/Unit", "Inventory Value");
      }

      doc.autoTable({
        startY: yPosition,
        head: [headers],
        body: tableData,
        theme: "grid",
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
        },
        headStyles: {
          fillColor: [99, 102, 241],
          textColor: 255,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 35 }, // Product Name
          1: { cellWidth: 20 }, // Category
          2: { cellWidth: 25 }, // Generic Name
          3: { cellWidth: 15, halign: "center" }, // Stock
          4: { cellWidth: 18, halign: "right" }, // Cost Price
          5: { cellWidth: 18, halign: "right" }, // Selling Price
          ...(includeFinancials && {
            6: { cellWidth: 18, halign: "right" }, // Profit
            7: { cellWidth: 22, halign: "right" }, // Inventory Value
          }),
        },
        didParseCell: function (data) {
          // Color code stock levels
          if (data.column.index === 3 && data.section === "body") {
            const product = products[data.row.index];
            const stock = product.total_stock || 0;
            const critical = product.critical_level || 10;

            if (stock === 0) {
              data.cell.styles.textColor = [220, 38, 38]; // Red
              data.cell.styles.fontStyle = "bold";
            } else if (stock <= critical) {
              data.cell.styles.textColor = [245, 158, 11]; // Orange
              data.cell.styles.fontStyle = "bold";
            } else {
              data.cell.styles.textColor = [34, 197, 94]; // Green
            }
          }
        },
        margin: { left: margin, right: margin },
      });
    }

    // Footer with page numbers
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, {
        align: "center",
      });
      doc.text(
        `Generated by MedCure Pharmacy Management System`,
        pageWidth - margin,
        pageHeight - 10,
        { align: "right" }
      );
    }

    // Save the PDF
    doc.save(filename);

    return { success: true, error: null };
  } catch (error) {
    console.error("PDF generation error:", error);
    return { success: false, error: error.message };
  }
}

// Generate low stock report PDF
export function generateLowStockReportPDF(
  products,
  filename = "low-stock-report.pdf"
) {
  const lowStockProducts = products.filter(
    (p) => (p.total_stock || 0) <= (p.critical_level || 10)
  );

  return generateProductCatalogPDF(lowStockProducts, {
    title: "Low Stock Report",
    filename,
    groupByCategory: true,
    includeFinancials: true,
  });
}

// Generate inventory valuation report PDF
export function generateInventoryValuationPDF(
  products,
  filename = "inventory-valuation.pdf"
) {
  return generateProductCatalogPDF(products, {
    title: "Inventory Valuation Report",
    filename,
    groupByCategory: true,
    includeFinancials: true,
  });
}

// Generate simple product list PDF
export function generateProductListPDF(
  products,
  filename = "product-list.pdf"
) {
  return generateProductCatalogPDF(products, {
    title: "Product List",
    filename,
    groupByCategory: false,
    includeFinancials: false,
  });
}
