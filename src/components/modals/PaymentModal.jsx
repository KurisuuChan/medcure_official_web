import { useState } from "react";
import {
  X,
  CreditCard,
  DollarSign,
  Smartphone,
  FileText,
  CheckCircle,
} from "lucide-react";
import { PAYMENT_METHODS } from "../../utils/constants.js";
import { formatCurrency } from "../../utils/formatters.js";

/**
 * Modal for processing payments in POS system
 * Handles payment method selection and transaction completion
 */
export default function PaymentModal({
  isOpen,
  onClose,
  onConfirmPayment,
  cartSummary,
  isProcessing = false,
}) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [error, setError] = useState("");

  const total = cartSummary?.summary?.total || 0;
  const receivedAmount = parseFloat(amountReceived) || 0;
  const change = receivedAmount - total;

  // Quick amount buttons for cash payments
  const quickAmounts = [
    Math.ceil(total / 100) * 100, // Round up to nearest 100
    Math.ceil(total / 500) * 500, // Round up to nearest 500
    Math.ceil(total / 1000) * 1000, // Round up to nearest 1000
  ].filter(
    (amount, index, arr) => arr.indexOf(amount) === index && amount > total
  );

  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setError("");

    // For non-cash payments, set received amount to exact total
    if (method !== "cash") {
      setAmountReceived(total.toString());
    }
  };

  // Handle amount received change
  const handleAmountReceivedChange = (value) => {
    setAmountReceived(value);
    setError("");
  };

  // Handle quick amount selection
  const handleQuickAmount = (amount) => {
    setAmountReceived(amount.toString());
    setError("");
  };

  // Validate payment
  const validatePayment = () => {
    if (!paymentMethod) {
      return "Please select a payment method";
    }

    if (paymentMethod === "cash") {
      if (!amountReceived || receivedAmount <= 0) {
        return "Please enter the amount received";
      }

      if (receivedAmount < total) {
        return "Amount received is less than the total";
      }
    }

    return null;
  };

  // Handle payment confirmation
  const handleConfirmPayment = () => {
    const validationError = validatePayment();
    if (validationError) {
      setError(validationError);
      return;
    }

    const paymentData = {
      method: paymentMethod,
      amountReceived: paymentMethod === "cash" ? receivedAmount : total,
      change: paymentMethod === "cash" ? change : 0,
      total,
    };

    onConfirmPayment(paymentData);
  };

  // Reset modal state when closed
  const handleClose = () => {
    if (!isProcessing) {
      setPaymentMethod("cash");
      setAmountReceived("");
      setError("");
      onClose();
    }
  };

  if (!isOpen) return null;

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case "cash":
        return <DollarSign size={20} />;
      case "card":
        return <CreditCard size={20} />;
      case "digital":
        return <Smartphone size={20} />;
      case "check":
        return <FileText size={20} />;
      default:
        return <DollarSign size={20} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Complete Payment
          </h2>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Order Summary */}
        <div className="p-6 border-b bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Items ({cartSummary?.summary?.totalItems || 0}):</span>
              <span>{formatCurrency(cartSummary?.summary?.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax:</span>
              <span>{formatCurrency(cartSummary?.summary?.tax || 0)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Total:</span>
              <span className="text-blue-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="p-6">
          <h3 className="font-medium text-gray-900 mb-4">Payment Method</h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.value}
                onClick={() => handlePaymentMethodChange(method.value)}
                disabled={isProcessing}
                className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                  paymentMethod === method.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                } disabled:opacity-50`}
              >
                {getPaymentMethodIcon(method.value)}
                <span className="font-medium">{method.label}</span>
              </button>
            ))}
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === "cash" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Received (₱)
                </label>
                <input
                  type="number"
                  value={amountReceived}
                  onChange={(e) => handleAmountReceivedChange(e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  disabled={isProcessing}
                />
              </div>

              {/* Quick Amount Buttons */}
              {quickAmounts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Select
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {quickAmounts.slice(0, 4).map((amount) => (
                      <button
                        key={amount}
                        onClick={() => handleQuickAmount(amount)}
                        disabled={isProcessing}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        {formatCurrency(amount)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Change Calculation */}
              {receivedAmount > 0 && (
                <div className="bg-green-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Change:</span>
                    <span
                      className={`font-bold text-lg ${
                        change >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(Math.max(0, change))}
                    </span>
                  </div>
                  {change < 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      Insufficient amount: {formatCurrency(Math.abs(change))}{" "}
                      short
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Non-cash Payment Info */}
          {paymentMethod !== "cash" && (
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex items-center">
                <CheckCircle size={16} className="text-blue-600 mr-2" />
                <span className="text-sm text-blue-700">
                  Payment amount: {formatCurrency(total)}
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmPayment}
            disabled={isProcessing || !!validatePayment()}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle size={16} className="mr-2" />
                Complete Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
