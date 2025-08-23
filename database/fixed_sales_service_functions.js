// FIXED VERSION OF SALES SERVICE - TIMEZONE-AWARE DATE HANDLING
// Replace the getSalesSummary function in your salesService.js

/**
 * Get sales summary for a specific period with proper timezone handling
 * @param {string} period - The period ('today', 'yesterday', 'week', 'month', 'year', or 'custom')
 * @param {Date} customStartDate - Custom start date for 'custom' period
 * @param {Date} customEndDate - Custom end date for 'custom' period
 * @returns {Promise<Object>} Sales summary with totals and analytics
 */
export async function getSalesSummary(period = 'today', customStartDate = null, customEndDate = null) {
  try {
    console.log(`📊 Getting sales summary for period: ${period}`);
    
    // Get current date/time with proper timezone handling
    const now = new Date();
    let startDate, endDate;

    // Helper function to create proper date boundaries
    const createDateBoundary = (date, isStart = true) => {
      const boundary = new Date(date);
      if (isStart) {
        // Start of day: 00:00:00.000
        boundary.setHours(0, 0, 0, 0);
      } else {
        // End of day: 23:59:59.999
        boundary.setHours(23, 59, 59, 999);
      }
      return boundary;
    };

    switch (period) {
      case 'today':
        // FIXED: Proper today calculation with timezone awareness
        startDate = createDateBoundary(now, true);   // Today at 00:00:00
        endDate = createDateBoundary(now, false);    // Today at 23:59:59
        console.log(`🎯 Today's date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
        break;
        
      case 'yesterday':
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        startDate = createDateBoundary(yesterday, true);
        endDate = createDateBoundary(yesterday, false);
        break;
        
      case 'week':
        // This week (last 7 days including today)
        const weekStart = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        startDate = createDateBoundary(weekStart, true);
        endDate = createDateBoundary(now, false);
        break;
        
      case 'month':
        // This month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = createDateBoundary(startDate, true);
        endDate = createDateBoundary(now, false);
        break;
        
      case 'year':
        // This year
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate = createDateBoundary(startDate, true);
        endDate = createDateBoundary(now, false);
        break;
        
      case 'custom':
        if (!customStartDate || !customEndDate) {
          throw new Error('Custom period requires both start and end dates');
        }
        startDate = createDateBoundary(customStartDate, true);
        endDate = createDateBoundary(customEndDate, false);
        break;
        
      default:
        // Default to today if invalid period
        startDate = createDateBoundary(now, true);
        endDate = createDateBoundary(now, false);
    }

    // Debug logging for date issues
    console.log(`📅 Period: ${period}`);
    console.log(`🕐 Start Date: ${startDate.toISOString()} (Local: ${startDate.toLocaleString()})`);
    console.log(`🕙 End Date: ${endDate.toISOString()} (Local: ${endDate.toLocaleString()})`);
    console.log(`⏰ Current Time: ${now.toISOString()} (Local: ${now.toLocaleString()})`);

    // Get analytics with proper date range
    const analytics = await getSalesAnalytics({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    const result = {
      totalRevenue: analytics.total_revenue || 0,
      totalTransactions: analytics.total_sales || 0,
      averageTransaction: analytics.average_transaction || 0,
      totalItemsSold: analytics.total_items_sold || 0,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        startLocal: startDate.toLocaleString(),
        endLocal: endDate.toLocaleString()
      },
      topCategories: analytics.top_selling_categories || [],
      hourlyDistribution: analytics.hourly_distribution || {},
    };

    console.log(`✅ Sales summary result for ${period}:`, {
      revenue: result.totalRevenue,
      transactions: result.totalTransactions,
      average: result.averageTransaction,
      items: result.totalItemsSold
    });

    return result;
    
  } catch (error) {
    console.error(`❌ Error fetching sales summary for ${period}:`, error);
    
    // Return safe defaults
    return {
      totalRevenue: 0,
      totalTransactions: 0,
      averageTransaction: 0,
      totalItemsSold: 0,
      period,
      dateRange: null,
      topCategories: [],
      hourlyDistribution: {},
      error: error.message
    };
  }
}

// ADDITIONAL HELPER FUNCTION FOR DEBUGGING
export async function debugTodaySales() {
  console.log('🔍 DEBUGGING TODAY\'S SALES...');
  
  const now = new Date();
  console.log('Current time:', now.toString());
  console.log('Current ISO:', now.toISOString());
  console.log('Current date only:', now.toDateString());
  
  // Test different date approaches
  const approaches = [
    {
      name: 'Original (problematic)',
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      endDate: now
    },
    {
      name: 'Fixed with boundaries',
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    },
    {
      name: 'Database-style date comparison',
      startDate: new Date(now.toDateString()), // Start of today
      endDate: new Date(new Date(now.toDateString()).getTime() + 24 * 60 * 60 * 1000 - 1) // End of today
    }
  ];
  
  for (const approach of approaches) {
    console.log(`\n📊 Testing approach: ${approach.name}`);
    console.log(`Start: ${approach.startDate.toISOString()}`);
    console.log(`End: ${approach.endDate.toISOString()}`);
    
    try {
      const sales = await getSales({
        startDate: approach.startDate.toISOString(),
        endDate: approach.endDate.toISOString(),
      });
      
      const total = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      console.log(`Results: ${sales.length} transactions, $${total.toFixed(2)} revenue`);
      
      if (sales.length > 0) {
        console.log('Sample sales:', sales.slice(0, 2).map(s => ({
          id: s.id,
          total: s.total,
          created_at: s.created_at,
          local_time: new Date(s.created_at).toLocaleString()
        })));
      }
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  }
}
