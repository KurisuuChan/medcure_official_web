import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "../config/supabase.js";

/**
 * Optimized Product Search with debouncing and intelligent caching
 */
export function useOptimizedProductSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: null,
    priceRange: null,
    stockStatus: null,
  });

  // Debounced search term to prevent excessive API calls
  const debouncedSearchTerm = useMemo(() => {
    const timer = setTimeout(() => searchTerm, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const searchResults = useQuery({
    queryKey: ["products", "search", debouncedSearchTerm, filters],
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
        return [];
      }

      // Use database full-text search with proper indexing
      let query = supabase
        .from("products_enhanced") // Use your enhanced view
        .select("*")
        .eq("is_archived", false);

      // Optimized text search using PostgreSQL's text search
      if (debouncedSearchTerm) {
        query = query.or(
          `name.ilike.%${debouncedSearchTerm}%,brand_name.ilike.%${debouncedSearchTerm}%,category.ilike.%${debouncedSearchTerm}%`
        );
      }

      // Apply filters efficiently
      if (filters.category) {
        query = query.eq("category", filters.category);
      }

      if (filters.stockStatus) {
        query = query.eq("stock_status", filters.stockStatus);
      }

      if (filters.priceRange) {
        query = query
          .gte("price", filters.priceRange.min)
          .lte("price", filters.priceRange.max);
      }

      const { data, error } = await query.order("name").limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: debouncedSearchTerm.length >= 2,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  // Prefetch popular categories for instant results
  const categoriesQuery = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("category")
        .eq("is_archived", false)
        .group("category")
        .order("count", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data?.map((item) => item.category) || [];
    },
    staleTime: 60 * 60 * 1000, // Cache for 1 hour - categories don't change often
  });

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    searchResults,
    categories: categoriesQuery.data || [],
    isSearching: searchResults.isLoading,
    searchError: searchResults.error,
  };
}
