/**
 * useArchived Hook
 * Custom hook for managing archived items functionality
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getArchivedItems,
  getArchivedStats,
  restoreItem,
  permanentDeleteItem,
  bulkRestoreItems,
  bulkDeleteItems,
} from "../services/archivedService.js";

export default function useArchived() {
  const [archivedItems, setArchivedItems] = useState([]);
  const [stats, setStats] = useState({
    products: 0,
    transactions: 0,
    suppliers: 0,
    employees: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: "all",
    search: "",
    page: 1,
    limit: 20,
    sortBy: "archived_at",
    sortOrder: "desc",
  });

  // Use ref to store current filters to avoid dependency issues
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // Fetch archived items
  const fetchArchivedItems = useCallback(async (customFilters = null) => {
    try {
      setLoading(true);
      setError(null);

      const currentFilters = customFilters || filtersRef.current;
      const response = await getArchivedItems(currentFilters);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setArchivedItems(response.data || []);
      return response;
    } catch (err) {
      console.error("Error fetching archived items:", err);
      setError(err.message);
      setArchivedItems([]);
      return { data: [], error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch archived statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await getArchivedStats();
      
      if (response.error) {
        throw new Error(response.error);
      }

      setStats(response.data || {
        products: 0,
        transactions: 0,
        suppliers: 0,
        employees: 0,
        total: 0,
      });

      return response;
    } catch (err) {
      console.error("Error fetching archived stats:", err);
      setError(err.message);
      return { data: null, error: err.message };
    }
  }, []);

  // Update filters and fetch new data
  const updateFilters = useCallback(async (newFilters) => {
    const updatedFilters = { ...filtersRef.current, ...newFilters };
    setFilters(updatedFilters);
    return await fetchArchivedItems(updatedFilters);
  }, [fetchArchivedItems]);

  // Restore single item
  const handleRestoreItem = useCallback(async (id, type) => {
    try {
      setError(null);
      const response = await restoreItem(id, type);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh data after successful restore
      await Promise.all([
        fetchArchivedItems(),
        fetchStats(),
      ]);

      return { success: true, data: response.data };
    } catch (err) {
      console.error("Error restoring item:", err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [fetchArchivedItems, fetchStats]);

  // Permanently delete single item
  const handleDeleteItem = useCallback(async (id, type) => {
    try {
      setError(null);
      const response = await permanentDeleteItem(id, type);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh data after successful deletion
      await Promise.all([
        fetchArchivedItems(),
        fetchStats(),
      ]);

      return { success: true, data: response.data };
    } catch (err) {
      console.error("Error deleting item:", err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [fetchArchivedItems, fetchStats]);

  // Bulk restore items
  const handleBulkRestore = useCallback(async (items) => {
    try {
      setError(null);
      const response = await bulkRestoreItems(items);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh data after bulk operation
      await Promise.all([
        fetchArchivedItems(),
        fetchStats(),
      ]);

      return { success: true, data: response.data };
    } catch (err) {
      console.error("Error in bulk restore:", err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [fetchArchivedItems, fetchStats]);

  // Bulk delete items
  const handleBulkDelete = useCallback(async (items) => {
    try {
      setError(null);
      const response = await bulkDeleteItems(items);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Refresh data after bulk operation
      await Promise.all([
        fetchArchivedItems(),
        fetchStats(),
      ]);

      return { success: true, data: response.data };
    } catch (err) {
      console.error("Error in bulk delete:", err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [fetchArchivedItems, fetchStats]);

  // Search functionality
  const handleSearch = useCallback(async (searchTerm) => {
    return await updateFilters({ search: searchTerm, page: 1 });
  }, [updateFilters]);

  // Filter by type
  const handleFilterByType = useCallback(async (type) => {
    return await updateFilters({ type, page: 1 });
  }, [updateFilters]);

  // Pagination
  const handlePageChange = useCallback(async (page) => {
    return await updateFilters({ page });
  }, [updateFilters]);

  // Sorting
  const handleSort = useCallback(async (sortBy, sortOrder = "desc") => {
    return await updateFilters({ sortBy, sortOrder, page: 1 });
  }, [updateFilters]);

  // Initial data fetch - only runs once
  useEffect(() => {
    let mounted = true;
    
    const initializeData = async () => {
      if (!mounted) return;
      
      try {
        setLoading(true);
        const [itemsResponse, statsResponse] = await Promise.all([
          getArchivedItems(filtersRef.current),
          getArchivedStats(),
        ]);

        if (mounted) {
          if (itemsResponse.data) {
            setArchivedItems(itemsResponse.data);
          }
          if (statsResponse.data) {
            setStats(statsResponse.data);
          }
        }
      } catch (err) {
        if (mounted) {
          console.error("Error initializing archived data:", err);
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeData();

    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - only run once

  return {
    // Data
    archivedItems,
    stats,
    filters,
    loading,
    error,

    // Actions
    fetchArchivedItems,
    fetchStats,
    updateFilters,
    handleRestoreItem,
    handleDeleteItem,
    handleBulkRestore,
    handleBulkDelete,
    handleSearch,
    handleFilterByType,
    handlePageChange,
    handleSort,

    // Utilities
    refreshData: useCallback(() => Promise.all([fetchArchivedItems(), fetchStats()]), [fetchArchivedItems, fetchStats]),
    clearError: useCallback(() => setError(null), []),
  };
}
