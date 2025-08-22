import React, { useState } from "react";
import { useSearchProducts, useProducts } from "../hooks/useProducts";

export default function SearchTest() {
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: allProducts = [],
    isLoading: productsLoading,
    error: productsError,
  } = useProducts();
  const {
    data: searchResults = [],
    isLoading: searchLoading,
    error: searchError,
  } = useSearchProducts(searchTerm);

  return (
    <div className="p-4 bg-gray-100 rounded-lg mb-4">
      <h3 className="font-bold mb-2">Search Debug Panel</h3>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Type to search..."
        className="border p-2 rounded w-full mb-2"
      />

      <div className="text-sm space-y-1">
        <p>
          <strong>Search Term:</strong> "{searchTerm}" (Length:{" "}
          {searchTerm.length})
        </p>
        <p>
          <strong>All Products Count:</strong> {allProducts.length}
        </p>
        <p>
          <strong>Search Results Count:</strong> {searchResults.length}
        </p>
        <p>
          <strong>Products Loading:</strong> {productsLoading ? "Yes" : "No"}
        </p>
        <p>
          <strong>Search Loading:</strong> {searchLoading ? "Yes" : "No"}
        </p>
        <p>
          <strong>Products Error:</strong>{" "}
          {productsError ? productsError.message : "None"}
        </p>
        <p>
          <strong>Search Error:</strong>{" "}
          {searchError ? searchError.message : "None"}
        </p>
        <p>
          <strong>Search Enabled:</strong>{" "}
          {searchTerm.length >= 2 ? "Yes" : "No"}
        </p>
      </div>

      {searchTerm.length >= 2 && (
        <div className="mt-2">
          <p className="font-semibold">Search Results:</p>
          <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(searchResults.slice(0, 3), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
