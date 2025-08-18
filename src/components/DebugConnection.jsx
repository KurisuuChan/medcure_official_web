import React, { useState, useEffect } from "react";
import { supabase } from "../config/supabase.js";

export default function DebugConnection() {
  const [connectionStatus, setConnectionStatus] = useState("Testing...");
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // Test basic connection
      console.log("Testing Supabase connection...");
      console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
      console.log(
        "Supabase Key length:",
        import.meta.env.VITE_SUPABASE_ANON_KEY?.length
      );

      // Test fetching products
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .limit(5);

      if (error) {
        console.error("Supabase error:", error);
        setError(error.message);
        setConnectionStatus("Failed");
        return;
      }

      console.log("Products fetched:", data);
      setProducts(data || []);
      setConnectionStatus("Connected");
    } catch (err) {
      console.error("Connection error:", err);
      setError(err.message);
      setConnectionStatus("Failed");
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg mb-4">
      <h3 className="font-bold mb-2">Supabase Connection Debug</h3>
      <p>
        Status:{" "}
        <span
          className={
            connectionStatus === "Connected"
              ? "text-green-600"
              : connectionStatus === "Failed"
              ? "text-red-600"
              : "text-yellow-600"
          }
        >
          {connectionStatus}
        </span>
      </p>

      {error && (
        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}

      <div className="mt-2">
        <p>Products found: {products.length}</p>
        {products.length > 0 && (
          <ul className="mt-1">
            {products.map((product, index) => (
              <li key={product.id || index} className="text-sm">
                {product.name} - {product.category} - Stock: {product.stock}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={testConnection}
        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
      >
        Test Again
      </button>
    </div>
  );
}
