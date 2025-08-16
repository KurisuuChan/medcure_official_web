import React from "react";
import { Archive, MoreVertical } from "lucide-react";
import { useInventoryData } from "@/hooks/useInventoryData";
import { useNotification } from "@/hooks/useNotification";
import { archiveProduct } from "../services/productService";

export default function Inventory() {
  const { addNotification } = useNotification();
  const { loading, error, products, refresh } = useInventoryData();

  const handleArchiveProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to archive "${productName}"?`)) {
      return;
    }

    try {
      const result = await archiveProduct(productId);

      if (result.error) {
        addNotification(`Failed to archive product: ${result.error}`, "error");
      } else {
        addNotification(
          `"${productName}" has been archived successfully`,
          "success"
        );
        refresh(); // Refresh the product list
      }
    } catch (error) {
      addNotification(`Error archiving product: ${error.message}`, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Inventory</h2>
          <p className="text-sm text-gray-600">
            Manage products & stock levels.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="px-3 py-2 text-sm font-medium rounded-lg bg-white border border-gray-300 hover:bg-gray-50"
          >
            Refresh
          </button>
          <button
            onClick={() =>
              addNotification(
                "Create Product modal not implemented yet",
                "info"
              )
            }
            className="px-3 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Add Product
          </button>
        </div>
      </div>
      {loading && (
        <div className="text-sm text-gray-500">Loading products…</div>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Category</th>
                <th className="text-right px-4 py-2">Stock</th>
                <th className="text-right px-4 py-2">Cost</th>
                <th className="text-right px-4 py-2">Value</th>
                <th className="text-center px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const value = (p.quantity * p.cost_price).toFixed(2);
                let low = "";
                if (p.quantity === 0) low = "text-red-600 font-semibold";
                else if (p.quantity < 10) low = "text-amber-600";
                return (
                  <tr
                    key={p.id}
                    className="border-t last:border-b hover:bg-gray-50"
                  >
                    <td className="px-4 py-2 font-medium">{p.name}</td>
                    <td className="px-4 py-2 text-gray-600">
                      {p.category || "–"}
                    </td>
                    <td className={`px-4 py-2 text-right tabular-nums ${low}`}>
                      {p.quantity}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      ₱{p.cost_price.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums font-medium">
                      ₱{value}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleArchiveProduct(p.id, p.name)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                          title="Archive Product"
                        >
                          <Archive size={16} />
                        </button>
                        <button
                          className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-50 transition-colors"
                          title="More Options"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
