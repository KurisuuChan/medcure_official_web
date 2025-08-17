import Reac  Clock
} from "lucide-react";
import { useSupplierHistory } from "../../hooks/useContacts";from 'react';
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
  Clock
} from 'lucide-react';
import { useSupplierHistory } from '../hooks/useContacts';

const SupplierHistoryModal = ({ isOpen, onClose, supplierName }) => {
  const { history, loading, error } = useSupplierHistory(supplierName);

  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStockStatus = (currentStock, totalSupplied) => {
    const percentage = (currentStock / totalSupplied) * 100;
    if (percentage <= 20) return { status: 'low', color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle };
    if (percentage <= 50) return { status: 'medium', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Supplier History</h2>
              <p className="text-gray-600">{supplierName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading supplier history...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-600" />
                <span className="text-red-800 font-medium">Error loading history</span>
              </div>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          )}

          {history && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Products</p>
                      <p className="text-2xl font-bold text-blue-800">
                        {history.summary.total_products}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign size={20} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">Total Value</p>
                      <p className="text-2xl font-bold text-green-800">
                        {formatCurrency(history.summary.total_value)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Box size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Current Stock</p>
                      <p className="text-2xl font-bold text-purple-800">
                        {history.summary.total_current_stock.toLocaleString()}
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
                      <p className="text-sm text-orange-600 font-medium">Avg. Value</p>
                      <p className="text-2xl font-bold text-orange-800">
                        {formatCurrency(history.summary.total_value / history.summary.total_products)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Package size={20} />
                    Product Supply History
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Complete list of products supplied by {supplierName}
                  </p>
                </div>

                {history.products.length > 0 ? (
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
                            Total Supplied
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Current Stock
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Supply
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Cost
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Value
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {history.products.map((product) => {
                          const stockStatus = getStockStatus(product.current_stock, product.total_supplied);
                          const StatusIcon = stockStatus.icon;
                          
                          return (
                            <tr key={product.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {product.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {product.id}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {product.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {product.total_supplied.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {product.current_stock.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                                  <StatusIcon size={12} />
                                  {stockStatus.status}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center gap-1">
                                  <Calendar size={14} className="text-gray-400" />
                                  {formatDate(product.last_supply_date)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(product.cost_price)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatCurrency(product.total_value)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package size={48} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      No Products Found
                    </h3>
                    <p className="text-gray-500">
                      This supplier hasn't provided any products yet.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierHistoryModal;
