import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Package,
  FileText,
  Eye,
  Printer,
} from "lucide-react";
import PropTypes from "prop-types";

const TransactionHistoryModal = ({ isOpen, onClose }) => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  // Mock transaction data - replace with actual Supabase query
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockTransactions = [
          {
            id: "TXN-001",
            date: "2025-01-15",
            time: "14:30:00",
            items: [
              { name: "Paracetamol 500mg", quantity: 2, price: 15.0 },
              { name: "Vitamin C 1000mg", quantity: 1, price: 25.0 },
            ],
            total: 55.0,
            paymentMethod: "Cash",
            cashier: "John Doe",
            customer: "Walk-in Customer",
            status: "completed",
          },
          {
            id: "TXN-002",
            date: "2025-01-15",
            time: "15:45:00",
            items: [
              { name: "Aspirin 100mg", quantity: 1, price: 12.0 },
              { name: "Cough Syrup", quantity: 1, price: 35.0 },
            ],
            total: 47.0,
            paymentMethod: "Card",
            cashier: "Jane Smith",
            customer: "Maria Santos",
            status: "completed",
          },
          {
            id: "TXN-003",
            date: "2025-01-14",
            time: "10:15:00",
            items: [{ name: "Ibuprofen 400mg", quantity: 3, price: 18.0 }],
            total: 54.0,
            paymentMethod: "Cash",
            cashier: "John Doe",
            customer: "Walk-in Customer",
            status: "refunded",
          },
        ];
        setTransactions(mockTransactions);
        setFilteredTransactions(mockTransactions);
        setLoading(false);
      }, 1000);
    }
  }, [isOpen]);

  // Filter and search logic
  useEffect(() => {
    let filtered = transactions;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.customer
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.cashier
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.items.some((item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.status === filterStatus
      );
    }

    // Apply date filter
    if (filterDate !== "all") {
      const today = new Date();
      const filterStartDate = new Date();

      switch (filterDate) {
        case "today":
          filterStartDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterStartDate.setDate(today.getDate() - 7);
          break;
        case "month":
          filterStartDate.setMonth(today.getMonth() - 1);
          break;
        default:
          break;
      }

      if (filterDate !== "all") {
        filtered = filtered.filter((transaction) => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= filterStartDate;
        });
      }
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterDate, transactions]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetails(true);
  };

  const handlePrintReceipt = (transaction) => {
    // Implement print receipt functionality
    console.log("Printing receipt for transaction:", transaction.id);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "refunded":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Transaction History</h2>
                <p className="text-blue-100">
                  View and manage all transactions
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by Transaction ID, Customer, or Product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="refunded">Refunded</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {currentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {transaction.id}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {transaction.date} at {transaction.time}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              transaction.status
                            )}`}
                          >
                            {transaction.status.charAt(0).toUpperCase() +
                              transaction.status.slice(1)}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span>{transaction.items.length} item(s)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              ₱{transaction.total.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Customer: </span>
                            <span className="font-medium">
                              {transaction.customer}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Cashier: </span>
                            <span className="font-medium">
                              {transaction.cashier}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(transaction)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handlePrintReceipt(transaction)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Print Receipt"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredTransactions.length)} of{" "}
                    {filteredTransactions.length} transactions
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 bg-blue-600 text-white rounded-lg">
                      {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transaction Details Modal */}
        {showDetails && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-auto m-4">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Transaction Details</h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Transaction ID:</span>
                    <p className="font-medium">{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Date & Time:</span>
                    <p className="font-medium">
                      {selectedTransaction.date} {selectedTransaction.time}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Customer:</span>
                    <p className="font-medium">
                      {selectedTransaction.customer}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Cashier:</span>
                    <p className="font-medium">{selectedTransaction.cashier}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Payment Method:</span>
                    <p className="font-medium">
                      {selectedTransaction.paymentMethod}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        selectedTransaction.status
                      )}`}
                    >
                      {selectedTransaction.status.charAt(0).toUpperCase() +
                        selectedTransaction.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Items Purchased</h4>
                  <div className="space-y-2">
                    {selectedTransaction.items.map((item, index) => (
                      <div
                        key={`${selectedTransaction.id}-item-${index}`}
                        className="flex justify-between items-center py-2 border-b border-gray-100"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">
                          ₱{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 font-bold text-lg">
                    <span>Total</span>
                    <span>₱{selectedTransaction.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

TransactionHistoryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TransactionHistoryModal;
