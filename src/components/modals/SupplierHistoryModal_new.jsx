import React from "react";
import {
  X,
  Package,
  TrendingUp,
  Calendar,
  DollarSign,
  BarChart3,
  Box,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useSupplierHistory } from "../../hooks/useContacts";

const SupplierHistoryModal = ({ isOpen, onClose, supplierName }) => {
  const { history, loading, error } = useSupplierHistory(supplierName);

  // Calculate summary from history data
  const summary = React.useMemo(() => {
    if (!history || !Array.isArray(history)) {
      return {
        totalProducts: 0,
        totalValue: 0,
        averageMonthlyValue: 0,
        totalDeliveries: 0,
      };
    }

    const totalProducts = history.length;
    const totalValue = history.reduce(
      (sum, item) => sum + (item.totalValue || 0),
      0
    );
    const totalDeliveries = history.reduce(
      (sum, item) => sum + (item.deliveries || 0),
      0
    );
    const averageMonthlyValue =
      totalProducts > 0 ? totalValue / Math.max(1, totalProducts) : 0;

    return {
      totalProducts,
      totalValue,
      averageMonthlyValue,
      totalDeliveries,
    };
  }, [history]);

  if (!isOpen) return null;

  // Show loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading supplier history...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Error Loading Data
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStockStatus = (currentStock, minStock) => {
    const ratio = currentStock / minStock;
    if (ratio <= 0.2)
      return { status: "Critical", color: "text-red-600", bg: "bg-red-100" };
    if (ratio <= 0.5)
      return { status: "Low", color: "text-orange-600", bg: "bg-orange-100" };
    return { status: "Good", color: "text-green-600", bg: "bg-green-100" };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Supply History</h2>
              <p className="text-blue-100">{supplierName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-lg text-gray-600">
                Loading supplier history...
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-lg text-red-600">
                Error loading history: {error}
              </div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">Total Products</p>
                      <p className="text-2xl font-bold text-blue-800">
                        {summary.totalProducts}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp size={20} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600">Total Value</p>
                      <p className="text-2xl font-bold text-green-800">
                        {formatCurrency(summary.totalValue)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-600">Last Supply</p>
                      <p className="text-lg font-bold text-purple-800">
                        {summary.lastSupplyDate
                          ? formatDate(summary.lastSupplyDate)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <BarChart3 size={20} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-orange-600">Avg. Monthly</p>
                      <p className="text-lg font-bold text-orange-800">
                        {formatCurrency(summary.averageMonthlyValue)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Product Supply History
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {history &&
                      Array.isArray(history) &&
                      history.length > 0 ? (
                        history.map((product, index) => {
                          const stockStatus = getStockStatus(
                            product.current_stock,
                            product.min_stock || 10
                          );
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                      <Box size={20} className="text-white" />
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {product.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {product.generic_name || "N/A"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {product.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center">
                                  <span className="font-medium">
                                    {product.current_stock}
                                  </span>
                                  <span className="text-gray-500 ml-1">
                                    units
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(product.price)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Clock size={16} className="mr-1" />
                                  {formatDate(product.updated_at)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}
                                >
                                  {stockStatus.status === "Critical" && (
                                    <AlertTriangle size={12} className="mr-1" />
                                  )}
                                  {stockStatus.status === "Good" && (
                                    <CheckCircle size={12} className="mr-1" />
                                  )}
                                  {stockStatus.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center">
                            <Package
                              size={48}
                              className="mx-auto mb-4 text-gray-400"
                            />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">
                              No products found
                            </h3>
                            <p className="text-gray-500">
                              This supplier has not provided any products yet.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierHistoryModal;
