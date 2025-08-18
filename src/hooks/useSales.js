import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSale,
  getSales,
  getSalesSummary,
  getSalesByCategory,
  getSalesByHour,
} from "../services/salesService.js";

/**
 * Hook for creating a new sale (POS transactions)
 */
export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      // Invalidate sales and products data since inventory changed
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      console.error("Failed to create sale:", error);
    },
  });
}

/**
 * Hook for fetching sales with optional filters
 */
export function useSales(filters = {}) {
  return useQuery({
    queryKey: ["sales", filters],
    queryFn: () => getSales(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching sales summary data
 */
export function useSalesSummary(period = "today") {
  return useQuery({
    queryKey: ["sales", "summary", period],
    queryFn: () => getSalesSummary(period),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook for fetching sales by category analytics
 */
export function useSalesByCategory(filters = {}) {
  return useQuery({
    queryKey: ["sales", "by-category", filters],
    queryFn: () => getSalesByCategory(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching hourly sales data
 */
export function useSalesByHour(date) {
  return useQuery({
    queryKey: ["sales", "by-hour", date],
    queryFn: () => getSalesByHour(date),
    enabled: !!date,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
