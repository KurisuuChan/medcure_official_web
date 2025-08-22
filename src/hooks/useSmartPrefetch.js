import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Smart Data Prefetching Hook
 * Prefetches data based on user navigation patterns
 */
export function useSmartPrefetch() {
  const queryClient = useQueryClient();
  const location = useLocation();

  // Prefetch data based on current page
  const prefetchStrategy = useCallback(
    async (currentPath) => {
      switch (currentPath) {
        case "/dashboard":
          // Prefetch inventory data when on dashboard
          await queryClient.prefetchQuery({
            queryKey: ["products"],
            staleTime: 5 * 60 * 1000,
          });

          // Prefetch today's sales data
          await queryClient.prefetchQuery({
            queryKey: ["sales", "today"],
            staleTime: 2 * 60 * 1000,
          });
          break;

        case "/management":
          // Prefetch low stock and categories
          await Promise.all([
            queryClient.prefetchQuery({
              queryKey: ["products", "low-stock"],
              staleTime: 5 * 60 * 1000,
            }),
            queryClient.prefetchQuery({
              queryKey: ["product-categories"],
              staleTime: 30 * 60 * 1000,
            }),
          ]);
          break;

        case "/pos":
          // Prefetch popular products and recent sales
          await Promise.all([
            queryClient.prefetchQuery({
              queryKey: ["products", "popular"],
              staleTime: 10 * 60 * 1000,
            }),
            queryClient.prefetchQuery({
              queryKey: ["sales", "recent"],
              staleTime: 1 * 60 * 1000,
            }),
          ]);
          break;

        case "/reports":
          // Prefetch dashboard analytics
          await queryClient.prefetchQuery({
            queryKey: ["reports", "dashboard"],
            staleTime: 5 * 60 * 1000,
          });
          break;
      }
    },
    [queryClient]
  );

  // Execute prefetch strategy on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      prefetchStrategy(location.pathname);
    }, 100); // Small delay to avoid blocking initial render

    return () => clearTimeout(timer);
  }, [location.pathname, prefetchStrategy]);

  // Manual prefetch functions for components
  const prefetchProductDetails = useCallback(
    async (productId) => {
      await queryClient.prefetchQuery({
        queryKey: ["product", productId],
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );

  const prefetchReportData = useCallback(
    async (reportType) => {
      await queryClient.prefetchQuery({
        queryKey: ["reports", reportType],
        staleTime: 10 * 60 * 1000,
      });
    },
    [queryClient]
  );

  return {
    prefetchProductDetails,
    prefetchReportData,
  };
}
