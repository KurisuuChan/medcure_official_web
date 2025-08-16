import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  DollarSign,
  Calculator,
  CheckCircle,
  AlertTriangle,
  User,
  Receipt,
} from "lucide-react";

export function PaymentModal({
  isOpen,
  onClose,
  onProcessPayment,
  totals,
  isProcessing = false,
}) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [errors, setErrors] = useState([]);
  const [isValid, setIsValid] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentMethod("cash");
      setAmountPaid(totals?.total?.toString() || "");
      setCustomerName("");
      setErrors([]);
    }
  }, [isOpen, totals]);

  // Calculate change
  const paidAmount = parseFloat(amountPaid) || 0;
  const changeAmount = Math.max(0, paidAmount - (totals?.total || 0));

  // Validation
  useEffect(() => {
    const newErrors = [];

    if (!amountPaid || paidAmount <= 0) {
      newErrors.push("Please enter a valid payment amount");
    }

    if (paidAmount < (totals?.total || 0)) {
      newErrors.push(
        "Payment amount must be at least ₱" + (totals?.total || 0).toFixed(2)
      );
    }

    if (paymentMethod === "card" && !customerName.trim()) {
      newErrors.push("Customer name is required for card payments");
    }

    setErrors(newErrors);
    setIsValid(newErrors.length === 0);
  }, [amountPaid, paidAmount, totals, paymentMethod, customerName]);

  const handleQuickAmount = (amount) => {
    setAmountPaid(amount.toString());
  };

  const handleProcessPayment = () => {
    if (!isValid || isProcessing) return;

    const paymentData = {
      paymentMethod,
      amountPaid: paidAmount,
      changeAmount,
      name: customerName.trim() || null,
    };

    onProcessPayment(paymentData);
  };

  const quickAmounts = [
    totals?.total || 0,
    Math.ceil((totals?.total || 0) / 100) * 100, // Round up to nearest 100
    Math.ceil((totals?.total || 0) / 500) * 500, // Round up to nearest 500
    Math.ceil((totals?.total || 0) / 1000) * 1000, // Round up to nearest 1000
  ].filter((amount, index, arr) => arr.indexOf(amount) === index && amount > 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Process Payment
              </h3>
              <p className="text-sm text-gray-500">Complete the transaction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Order Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>₱{(totals?.subtotal || 0).toFixed(2)}</span>
              </div>
              {(totals?.regularDiscountAmount || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span className="text-red-600">
                    -₱{(totals?.regularDiscountAmount || 0).toFixed(2)}
                  </span>
                </div>
              )}
              {(totals?.pwdSeniorDiscount || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">PWD/Senior Discount:</span>
                  <span className="text-purple-600">
                    -₱{(totals?.pwdSeniorDiscount || 0).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span>Total:</span>
                <span className="text-green-600">
                  ₱{(totals?.total || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={`p-3 border rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  paymentMethod === "cash"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <DollarSign size={20} />
                <span className="font-medium">Cash</span>
              </button>
              <button
                onClick={() => setPaymentMethod("card")}
                className={`p-3 border rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  paymentMethod === "card"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <CreditCard size={20} />
                <span className="font-medium">Card</span>
              </button>
            </div>
          </div>

          {/* Customer Name (for card payments) */}
          {paymentMethod === "card" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-1" />
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isProcessing}
              />
            </div>
          )}

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calculator size={16} className="inline mr-1" />
              Amount Paid
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="Enter amount paid"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-semibold"
              disabled={isProcessing}
            />

            {/* Quick Amount Buttons */}
            {paymentMethod === "cash" && quickAmounts.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Quick amounts:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickAmounts.slice(0, 4).map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickAmount(amount)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                      disabled={isProcessing}
                    >
                      ₱{amount.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Change Calculation */}
          {paymentMethod === "cash" && paidAmount > 0 && (
            <div
              className={`rounded-lg p-4 ${
                changeAmount >= 0
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Change:</span>
                <span
                  className={`text-xl font-bold ${
                    changeAmount >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ₱{changeAmount.toFixed(2)}
                </span>
              </div>
              {changeAmount < 0 && (
                <p className="text-sm text-red-600 mt-1">
                  Insufficient payment amount
                </p>
              )}
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  Please fix the following issues:
                </span>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="flex items-center gap-1">
                    <span>•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleProcessPayment}
              disabled={!isValid || isProcessing}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                isValid && !isProcessing
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Complete Sale
                </>
              )}
            </button>
          </div>

          {/* Payment Info */}
          <div className="text-xs text-gray-500 text-center border-t border-gray-200 pt-4">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Receipt size={12} />
              <span>Receipt will be generated after payment</span>
            </div>
            <p>Transaction will be saved to history</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
