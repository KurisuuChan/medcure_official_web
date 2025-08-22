import { QueryClient } from "@tanstack/react-query";

/**
 * Advanced QueryClient configuration for optimal caching
 */
export const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Global defaults optimized for pharmacy management
        staleTime: 2 * 60 * 1000, // 2 minutes default
        cacheTime: 10 * 60 * 1000, // 10 minutes cache retention
        refetchOnWindowFocus: false, // Prevent unnecessary refetches
        refetchOnReconnect: "always", // Always refetch when reconnecting
        retry: (failureCount, error) => {
          // Custom retry logic based on error type
          if (error?.status === 404) return false; // Don't retry 404s
          if (error?.status >= 500) return failureCount < 3; // Retry server errors
          return failureCount < 1; // Limited retries for other errors
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        // Mutation defaults for better UX
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
};

/**
 * Smart cache invalidation strategies
 */
export const cacheInvalidationStrategies = {
  // When a product is updated
  onProductUpdate: (queryClient, productId) => {
    // Invalidate specific product
    queryClient.invalidateQueries({ queryKey: ["product", productId] });

    // Invalidate product lists
    queryClient.invalidateQueries({ queryKey: ["products"] });

    // Invalidate dashboard if stock changed
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });

    // Invalidate search results
    queryClient.invalidateQueries({ queryKey: ["products", "search"] });

    // Invalidate inventory summary
    queryClient.invalidateQueries({ queryKey: ["inventory-summary"] });
  },

  // When a sale is created
  onSaleCreate: (queryClient, saleData) => {
    // Invalidate sales data
    queryClient.invalidateQueries({ queryKey: ["sales"] });

    // Update products affected by the sale
    saleData.items?.forEach((item) => {
      queryClient.invalidateQueries({ queryKey: ["product", item.product_id] });
    });

    // Invalidate dashboard and reports
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["reports"] });

    // Update product lists
    queryClient.invalidateQueries({ queryKey: ["products"] });
  },

  // When reports are generated
  onReportGenerate: (queryClient, reportType) => {
    // Only invalidate related reports
    queryClient.invalidateQueries({ queryKey: ["reports", reportType] });

    // If dashboard report, also invalidate dashboard cache
    if (reportType === "dashboard") {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  },

  // Bulk operations
  onBulkOperation: (queryClient, operationType, affectedIds) => {
    // Invalidate all related caches for bulk operations
    switch (operationType) {
      case "archive":
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["archived-items"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        break;

      case "restore":
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["archived-items"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        break;

      case "delete":
        queryClient.invalidateQueries({ queryKey: ["archived-items"] });
        break;
    }
  },
};

/**
 * Cache warming strategies for better performance
 */
export const cacheWarmingStrategies = {
  // Warm critical data on app load
  warmOnAppLoad: async (queryClient) => {
    const warmingQueries = [
      // Essential dashboard data
      {
        queryKey: ["dashboard"],
        priority: "high",
        staleTime: 3 * 60 * 1000,
      },

      // Product categories (rarely change)
      {
        queryKey: ["product-categories"],
        priority: "medium",
        staleTime: 60 * 60 * 1000,
      },

      // Recent activity
      {
        queryKey: ["activity", "recent"],
        priority: "low",
        staleTime: 5 * 60 * 1000,
      },
    ];

    // Execute high priority queries first
    const highPriority = warmingQueries.filter((q) => q.priority === "high");
    const mediumPriority = warmingQueries.filter(
      (q) => q.priority === "medium"
    );
    const lowPriority = warmingQueries.filter((q) => q.priority === "low");

    // Sequential execution for high priority
    for (const query of highPriority) {
      try {
        await queryClient.prefetchQuery({
          queryKey: query.queryKey,
          staleTime: query.staleTime,
        });
      } catch (error) {
        console.warn(`Failed to warm cache for ${query.queryKey}:`, error);
      }
    }

    // Parallel execution for medium and low priority
    await Promise.allSettled([
      ...mediumPriority.map((query) =>
        queryClient.prefetchQuery({
          queryKey: query.queryKey,
          staleTime: query.staleTime,
        })
      ),
      ...lowPriority.map((query) =>
        queryClient.prefetchQuery({
          queryKey: query.queryKey,
          staleTime: query.staleTime,
        })
      ),
    ]);
  },

  // Warm data based on user behavior
  warmOnUserAction: async (queryClient, action, context) => {
    switch (action) {
      case "view-product":
        // Prefetch related products
        await queryClient.prefetchQuery({
          queryKey: ["products", "category", context.category],
          staleTime: 5 * 60 * 1000,
        });
        break;

      case "navigate-to-reports":
        // Prefetch report data
        await queryClient.prefetchQuery({
          queryKey: ["reports", "dashboard"],
          staleTime: 5 * 60 * 1000,
        });
        break;

      case "open-pos":
        // Prefetch popular products and payment methods
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: ["products", "popular"],
            staleTime: 10 * 60 * 1000,
          }),
          queryClient.prefetchQuery({
            queryKey: ["sales", "recent"],
            staleTime: 2 * 60 * 1000,
          }),
        ]);
        break;
    }
  },
};
