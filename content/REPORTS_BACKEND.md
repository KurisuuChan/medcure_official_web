# MedCure Reports Backend System

A comprehensive reporting and analytics backend for the MedCure Pharmacy Management System.

## 📊 Overview

The Reports Backend provides robust data analysis and export capabilities for:
- **Inventory Management**: Stock levels, valuations, and category analysis
- **Sales Analytics**: Revenue tracking, trends, and performance metrics  
- **Financial Reporting**: Profitability analysis and cash flow insights
- **Low Stock Alerts**: Automated inventory warnings and reorder recommendations
- **Product Performance**: Sales analysis and turnover rate calculations

## 🏗️ Architecture

### Core Components

#### 1. Report Service (`src/services/reportService.js`)
Central service handling all report generation logic:
- `generateInventoryReport()` - Complete inventory analysis
- `generateSalesReport()` - Sales and revenue analytics
- `generateFinancialReport()` - Financial summaries and metrics
- `generateLowStockReport()` - Inventory alerts and recommendations
- `generateProductPerformanceReport()` - Product analytics
- `generateDashboardReport()` - Comprehensive overview data

#### 2. Reports Hook (`src/hooks/useReports.js`)
React hook providing:
- State management for all report types
- Loading and error states
- Centralized report operations
- Auto-refresh capabilities

#### 3. Export Utilities (`src/utils/exportUtils.js`)
Export functionality for:
- CSV generation and download
- Text-based PDF reports (when jsPDF unavailable)
- Data formatting and currency display
- Multi-format report exports

#### 4. Report Viewer (`src/components/ReportViewer.jsx`)
Interactive UI component for:
- Formatted report display
- Modal-based viewing
- Category breakdowns
- Visual data presentation

#### 5. Reports Page (`src/pages/Reports.jsx`)
Main interface providing:
- Report generation controls
- Export options (CSV, TXT)
- Date range filtering
- Real-time status updates

## 🚀 Features

### Inventory Reports
- **Stock Analysis**: Current levels, valuations, category breakdowns
- **Low Stock Detection**: Automated alerts below configurable thresholds
- **Valuation Metrics**: Cost vs retail value, profit potential calculations
- **Category Performance**: Product distribution and value by category

### Sales Reports
- **Revenue Analytics**: Total sales, average transaction values
- **Time-based Analysis**: Daily, weekly, monthly breakdowns
- **Product Performance**: Top-selling items, quantity analysis
- **Category Sales**: Revenue distribution by product category
- **Hourly Trends**: Peak sales time identification

### Financial Reports
- **Profitability Analysis**: Gross profit, margin calculations
- **Cash Flow Tracking**: Revenue inflow, inventory investment
- **ROI Metrics**: Turnover rates, inventory efficiency
- **Business Overview**: Comprehensive financial health summary

### Low Stock Alerts
- **Urgency Classification**: Critical, High, Medium priority levels
- **Reorder Recommendations**: Quantity suggestions, cost estimates
- **Lead Time Analysis**: Restocking timeline calculations
- **Supplier Integration**: Purchase order preparation support

### Product Performance
- **Sales Velocity**: Units sold, revenue generated
- **Profitability**: Margin analysis, profit contribution
- **Turnover Rates**: Inventory movement efficiency
- **Comparative Analysis**: Top vs underperforming products

## 📋 Usage

### Basic Report Generation

```javascript
import { useReports } from '../hooks/useReports.js';

function MyComponent() {
  const { generateInventory, reports, loading, errors } = useReports();
  
  const handleGenerateReport = async () => {
    try {
      const report = await generateInventory({
        includeLowStock: true,
        includeValuation: true,
        lowStockThreshold: 10
      });
      console.log('Report generated:', report);
    } catch (error) {
      console.error('Report failed:', error);
    }
  };
  
  return (
    <button 
      onClick={handleGenerateReport}
      disabled={loading.inventory}
    >
      {loading.inventory ? 'Generating...' : 'Generate Report'}
    </button>
  );
}
```

### Export Functionality

```javascript
import { exportInventoryCSV, exportReportPDF } from '../utils/exportUtils.js';

// Export as CSV
const handleCSVExport = () => {
  if (reports.inventory) {
    exportInventoryCSV(reports.inventory, 'my-inventory-report.csv');
  }
};

// Export as text-based PDF
const handlePDFExport = () => {
  if (reports.inventory) {
    exportReportPDF(reports.inventory, 'inventory', 'inventory-report.txt');
  }
};
```

### Custom Date Ranges

```javascript
const handleSalesReport = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const report = await generateSales({
    startDate: thirtyDaysAgo.toISOString(),
    endDate: new Date().toISOString(),
    includeHourlyData: true,
    includeCategoryData: true
  });
};
```

## 🔧 Configuration

### Report Options

Each report type supports various configuration options:

#### Inventory Report Options
```javascript
{
  includeLowStock: boolean,      // Include low stock analysis
  includeValuation: boolean,     // Include inventory valuation
  lowStockThreshold: number      // Threshold for low stock detection
}
```

#### Sales Report Options
```javascript
{
  startDate: string,             // ISO date string
  endDate: string,               // ISO date string
  includeHourlyData: boolean,    // Include hourly breakdown
  includeCategoryData: boolean,  // Include category analysis
  includeTopProducts: boolean    // Include top product list
}
```

#### Performance Report Options
```javascript
{
  startDate: string,             // Analysis period start
  endDate: string,               // Analysis period end
  topCount: number               // Number of top performers to include
}
```

### Export Configuration

```javascript
// CSV Export with custom columns
const customColumns = [
  { key: 'name', label: 'Product Name' },
  { key: 'stock', label: 'Current Stock' },
  { key: 'value', label: 'Total Value' }
];

// Text report with custom formatting
const textReport = generateTextReport(reportData, 'inventory');
```

## 🧪 Testing

The system includes comprehensive testing utilities:

```javascript
import { runAllReportTests, smokeTest } from '../utils/reportTests.js';

// Quick functionality check
await smokeTest();

// Complete test suite
await runAllReportTests();
```

### Test Coverage
- ✅ All report generation functions
- ✅ CSV export functionality
- ✅ Text report generation
- ✅ Error handling and validation
- ✅ Data integrity checks

## 📊 Data Sources

Reports integrate with existing MedCure services:
- **Product Service**: Inventory data, stock levels, pricing
- **Sales Service**: Transaction history, revenue data
- **Database**: Direct Supabase integration for complex queries

## 🔐 Security & Performance

### Data Security
- ✅ No sensitive data exposure in exports
- ✅ User permission validation
- ✅ Secure database connections

### Performance Optimization
- ✅ Efficient database queries
- ✅ Data caching for frequently accessed reports
- ✅ Lazy loading for large datasets
- ✅ Background processing for complex reports

## 🔄 Real-time Updates

Reports automatically refresh when:
- Inventory levels change
- New sales are recorded
- Product data is updated
- Settings are modified

## 📱 Mobile Compatibility

All reports are fully responsive and work on:
- ✅ Desktop browsers
- ✅ Tablet devices
- ✅ Mobile phones
- ✅ Touch interfaces

## 🔮 Future Enhancements

### Planned Features
- 📊 Advanced charting and visualizations
- 📧 Automated email reports
- 🔔 Slack/Teams integration
- 📅 Scheduled report generation
- 🤖 AI-powered insights and predictions
- 📈 Trend analysis and forecasting

### Integration Roadmap
- **Business Intelligence Tools**: Power BI, Tableau connections
- **Accounting Software**: QuickBooks, Sage integration
- **E-commerce Platforms**: Shopify, WooCommerce sync
- **Supply Chain**: Supplier API integrations

## 🛠️ Development

### Adding New Reports

1. **Create Report Function** in `reportService.js`:
```javascript
export async function generateCustomReport(options = {}) {
  // Implementation
}
```

2. **Add to Hook** in `useReports.js`:
```javascript
const generateCustom = useCallback(async (options = {}) => {
  // Hook implementation
}, []);
```

3. **Create Export Function** in `exportUtils.js`:
```javascript
export function exportCustomCSV(reportData, filename) {
  // Export implementation
}
```

4. **Update UI** in `Reports.jsx`:
```javascript
const handleCustomReport = async () => {
  // UI handler
};
```

### Code Standards
- ✅ ESLint compliance
- ✅ Comprehensive error handling
- ✅ TypeScript-ready (JSDoc annotations)
- ✅ Consistent naming conventions
- ✅ Performance optimizations

## 📞 Support

For issues or questions:
1. Check the console for detailed error messages
2. Run the smoke test to verify system functionality
3. Review the comprehensive test suite results
4. Refer to the MedCure main documentation

---

*MedCure Reports Backend - Built for comprehensive pharmacy analytics and business intelligence.*
