import { useState, useEffect } from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  importProducts,
} from "../services/productService.js";
import { useNotification } from "./useNotification.js";

/**
 * Hook for managing product data and operations
 */
export function useProducts(initialFilters = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const { addNotification } = useNotification();

  // Fetch products
  const fetchProducts = async (filterOverrides = {}) => {
    setLoading(true);
    setError(null);

    try {
      const appliedFilters = { ...filters, ...filterOverrides };
      const { data, error: fetchError } = await getProducts(appliedFilters);

      if (fetchError) {
        throw new Error(fetchError);
      }

      setProducts(data || []);
    } catch (err) {
      setError(err.message);
      addNotification("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  };

  // Add new product
  const addProduct = async (productData) => {
    setLoading(true);

    try {
      const { data, error: createError } = await createProduct(productData);

      if (createError) {
        throw new Error(createError);
      }

      setProducts((prev) => [data, ...prev]);
      addNotification("Product added successfully", "success");
      return { data, error: null };
    } catch (err) {
      const errorMsg = err.message || "Failed to add product";
      setError(errorMsg);
      addNotification(errorMsg, "error");
      return { data: null, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Update product
  const updateProductData = async (id, updates) => {
    setLoading(true);

    try {
      const { data, error: updateError } = await updateProduct(id, updates);

      if (updateError) {
        throw new Error(updateError);
      }

      setProducts((prev) =>
        prev.map((product) => (product.id === id ? data : product))
      );
      addNotification("Product updated successfully", "success");
      return { data, error: null };
    } catch (err) {
      const errorMsg = err.message || "Failed to update product";
      setError(errorMsg);
      addNotification(errorMsg, "error");
      return { data: null, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const removeProduct = async (id) => {
    setLoading(true);

    try {
      const { error: deleteError } = await deleteProduct(id);

      if (deleteError) {
        throw new Error(deleteError);
      }

      setProducts((prev) => prev.filter((product) => product.id !== id));
      addNotification("Product archived successfully", "success");
      return { error: null };
    } catch (err) {
      const errorMsg = err.message || "Failed to archive product";
      setError(errorMsg);
      addNotification(errorMsg, "error");
      return { error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Import products from CSV
  const importProductsFromCSV = async (productsArray) => {
    setLoading(true);

    try {
      const { data, error: importError } = await importProducts(productsArray);

      if (importError) {
        throw new Error(importError);
      }

      const { success, errors, total } = data;

      if (success.length > 0) {
        // Refresh products list
        await fetchProducts();
        addNotification(
          `${success.length} out of ${total} products imported successfully`,
          "success"
        );
      }

      if (errors.length > 0) {
        console.warn("Import errors:", errors);
        addNotification(
          `${errors.length} products failed to import`,
          "warning"
        );
      }

      return { data, error: null };
    } catch (err) {
      const errorMsg = err.message || "Failed to import products";
      setError(errorMsg);
      addNotification(errorMsg, "error");
      return { data: null, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Update filters and refetch
  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Apply filters and refetch
  const applyFilters = (newFilters) => {
    updateFilters(newFilters);
    fetchProducts(newFilters);
  };

  // Clear filters
  const clearFilters = () => {
    const clearedFilters = {};
    setFilters(clearedFilters);
    fetchProducts(clearedFilters);
  };

  // Get product by ID
  const getProductById = (id) => {
    return products.find((product) => product.id === id);
  };

  // Get products by category
  const getProductsByCategory = (category) => {
    if (category === "all") return products;
    return products.filter((product) => product.category === category);
  };

  // Get low stock products
  const getLowStockProducts = () => {
    return products.filter(
      (product) =>
        product.total_stock <= product.critical_level && product.total_stock > 0
    );
  };

  // Get out of stock products
  const getOutOfStockProducts = () => {
    return products.filter((product) => product.total_stock === 0);
  };

  // Calculate inventory stats
  const getInventoryStats = () => {
    const stats = products.reduce(
      (acc, product) => {
        acc.total += 1;
        acc.totalStock += product.total_stock;
        acc.totalValue += product.total_stock * product.cost_price;

        if (product.total_stock === 0) {
          acc.outOfStock += 1;
        } else if (product.total_stock <= product.critical_level) {
          acc.lowStock += 1;
        }

        return acc;
      },
      {
        total: 0,
        totalStock: 0,
        totalValue: 0,
        lowStock: 0,
        outOfStock: 0,
      }
    );

    return stats;
  };

  // Initial load
  useEffect(() => {
    fetchProducts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    products,
    loading,
    error,
    filters,

    // Actions
    fetchProducts,
    addProduct,
    updateProduct: updateProductData,
    removeProduct,
    importProductsFromCSV,

    // Filter actions
    updateFilters,
    applyFilters,
    clearFilters,

    // Utility functions
    getProductById,
    getProductsByCategory,
    getLowStockProducts,
    getOutOfStockProducts,
    getInventoryStats,

    // Refresh
    refresh: fetchProducts,
  };
}
