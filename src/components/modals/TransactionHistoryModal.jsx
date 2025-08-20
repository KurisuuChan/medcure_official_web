import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  X,
  Clock,
  Search,
  Filter,
  Receipt,
  RefreshCw,
  Calendar,
  CreditCard,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Printer,
  Download,
} from "lucide-react";
import { useNotification } from "../../hooks/useNotification.js";
import { 
  getTransactionHistory, 
  printReceipt, 
  exportTransactionsToCSV 
} from "../../services/transactionService.js";

export function TransactionHistoryModal({ isOpen, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);

  const { addNotification } = useNotification();

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        status: statusFilter === "all" ? undefined : statusFilter,
        searchTerm: searchTerm.trim() || undefined,
        limit: 50,
      };

      // Add date filters
      if (dateFilter === "today") {
        const today = new Date();
        filters.startDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        ).toISOString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filters.startDate = weekAgo.toISOString();
      } else if (dateFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filters.startDate = monthAgo.toISOString();
      }

      const result = await getTransactionHistory(filters);
      if (result.success) {
        setTransactions(result.data || []);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      addNotification("Failed to load transactions", "error");
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter, searchTerm, addNotification]);

  // Load transactions when modal opens or filters change
  useEffect(() => {
    if (isOpen) {
      loadTransactions();
    }
  }, [isOpen, dateFilter, statusFilter, searchTerm, loadTransactions]);

  const handlePrintReceipt = async (transactionId) => {
    try {
      const result = await printReceipt(transactionId);
      if (result.success) {
        addNotification("Receipt printed successfully", "success");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      addNotification("Failed to print receipt", "error");
      console.error("Error printing receipt:", error);
    }
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  const handleExportTransactions = async () => {
    try {
      if (transactions.length === 0) {
        addNotification("No transactions to export", "warning");
        return;
      }

      const result = await exportTransactionsToCSV(transactions, 'transaction_history');
      if (result.success) {
        addNotification("Transactions exported successfully", "success");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      addNotification("Failed to export transactions", "error");
      console.error("Error exporting transactions:", error);
    }
  };

  // Since filtering is now done in the service, we just display the transactions
  const filteredTransactions = transactions;

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={16} className="text-green-600" />;
      case "cancelled":
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <AlertTriangle size={16} className="text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Transaction History
              </h3>
              <p className="text-sm text-gray-500">
                View and manage past transactions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportTransactions}
              className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
              title="Export Transactions"
            >
              <Download size={20} />
            </button>
            <button
              onClick={loadTransactions}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by transaction number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2 text-gray-500">
                <RefreshCw size={20} className="animate-spin" />
                <span>Loading transactions...</span>
              </div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <Clock size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  No transactions found
                </h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => {
                const dateTime = formatDate(transaction.created_at);
                return (
                  <div
                    key={transaction.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-gray-900">
                            {transaction.transaction_number}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              transaction.status
                            )}`}
                          >
                            {getStatusIcon(transaction.status)}
                            <span className="ml-1">{transaction.status}</span>
                          </span>
                          {transaction.is_pwd_senior && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              PWD/Senior
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>
                              {dateTime.date} at {dateTime.time}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard size={14} />
                            <span>
                              ₱{(transaction.total_amount || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package size={14} />
                            <span>
                              {transaction.sales_items?.reduce(
                                (sum, item) => sum + (item.total_pieces || 0),
                                0
                              ) || 0}{" "}
                              items
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(transaction)}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handlePrintReceipt(transaction.id)}
                          className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                          title="Print Receipt"
                        >
                          <Printer size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredTransactions.length} of {transactions.length}{" "}
              transactions
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={14} />
                <span>
                  Filter: {dateFilter === "all" ? "All time" : dateFilter}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Receipt size={14} />
                <span>
                  Status: {statusFilter === "all" ? "All" : statusFilter}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {showTransactionDetails && selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={() => {
            setShowTransactionDetails(false);
            setSelectedTransaction(null);
          }}
          onPrintReceipt={handlePrintReceipt}
        />
      )}
    </div>
  );
}

// Transaction Details Modal Component
function TransactionDetailsModal({ transaction, onClose, onPrintReceipt }) {
  const dateTime = new Date(transaction.created_at);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Receipt size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Transaction Details
              </h3>
              <p className="text-sm text-gray-500">
                {transaction.transaction_number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Transaction Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">
              Transaction Information
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Date & Time:</span>
                <span>{dateTime.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    transaction.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {transaction.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="capitalize">{transaction.payment_method}</span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">
              Items Purchased
            </h4>
            <div className="space-y-2">
              {transaction.sales_items?.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {item.product?.name || `Product ID: ${item.product_id}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.total_pieces} pieces × ₱
                      {(item.unit_price || 0).toFixed(2)}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-900">
                    ₱{(item.line_total || 0).toFixed(2)}
                  </span>
                </div>
              )) || []}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">
              Payment Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>₱{(transaction.subtotal || 0).toFixed(2)}</span>
              </div>
              {(transaction.discount_amount || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span className="text-red-600">
                    -₱{(transaction.discount_amount || 0).toFixed(2)}
                  </span>
                </div>
              )}
              {(transaction.pwd_senior_discount || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">PWD/Senior Discount:</span>
                  <span className="text-purple-600">
                    -₱{(transaction.pwd_senior_discount || 0).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span>Total:</span>
                <span className="text-green-600">
                  ₱{(transaction.total_amount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span>₱{(transaction.amount_paid || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Change:</span>
                <span>₱{(transaction.change_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onPrintReceipt(transaction.id)}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Printer size={16} />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

// PropTypes validation
TransactionHistoryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

TransactionDetailsModal.propTypes = {
  transaction: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    transaction_number: PropTypes.string,
    created_at: PropTypes.string,
    status: PropTypes.string,
    payment_method: PropTypes.string,
    sales_items: PropTypes.arrayOf(PropTypes.object),
    subtotal: PropTypes.number,
    discount_amount: PropTypes.number,
    pwd_senior_discount: PropTypes.number,
    total_amount: PropTypes.number,
    amount_paid: PropTypes.number,
    change_amount: PropTypes.number,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onPrintReceipt: PropTypes.func.isRequired,
};

export default TransactionHistoryModal;
