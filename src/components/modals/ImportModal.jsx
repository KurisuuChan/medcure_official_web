import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  parseCSV,
  convertCSVToProducts,
  downloadCSVTemplate,
} from "../../utils/csvUtils.js";

export function ImportModal({ isOpen, onClose, onImport }) {
  const [step, setStep] = useState(1); // 1: Upload, 2: Review, 3: Results
  const [parsedProducts, setParsedProducts] = useState([]);
  const [importResults, setImportResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const resetModal = () => {
    setStep(1);
    setParsedProducts([]);
    setImportResults(null);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setErrors(["Please select a CSV file"]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const { data, error } = parseCSV(text);

      if (error) {
        setErrors([error]);
        return;
      }

      setCsvData(data);

      // Convert to products format
      const { data: products, error: convertError } =
        convertCSVToProducts(data);

      if (convertError) {
        setErrors([convertError]);
        return;
      }

      setParsedProducts(products);
      setErrors([]);
      setStep(2);
    };

    reader.onerror = () => {
      setErrors(["Error reading file"]);
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    setIsProcessing(true);

    try {
      const results = await onImport(parsedProducts);
      setImportResults(results);
      setStep(3);
    } catch (error) {
      setErrors([error.message || "Import failed"]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Upload size={24} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Import Products
              </h2>
              <p className="text-sm text-gray-500">
                Step {step} of 3:{" "}
                {(() => {
                  if (step === 1) return "Upload CSV";
                  if (step === 2) return "Review Data";
                  return "Import Results";
                })()}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">
                  CSV Format Requirements
                </h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>
                    • Required columns: name, category, cost_price,
                    selling_price, total_stock
                  </p>
                  <p>
                    • Optional columns: generic_name, barcode, supplier,
                    critical_level, etc.
                  </p>
                  <p>• Use comma-separated values format</p>
                  <p>• First row should contain column headers</p>
                </div>
              </div>

              {/* Download Template */}
              <div className="text-center">
                <button
                  onClick={downloadCSVTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Download size={16} />
                  Download CSV Template
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Download a template file with the correct format and sample
                  data
                </p>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileText size={32} className="text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Upload CSV File
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Select a CSV file from your computer
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Choose File
                    </button>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={20} className="text-red-600" />
                    <h3 className="font-semibold text-red-800">
                      Upload Errors
                    </h3>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.map((error) => (
                      <li key={error}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Review Products
                  </h3>
                  <p className="text-sm text-gray-500">
                    {parsedProducts.length} products ready to import
                  </p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back to Upload
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Cost Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Selling Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Supplier
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {parsedProducts.slice(0, 10).map((product) => (
                        <tr
                          key={`${product.name}-${
                            product.barcode || Math.random()
                          }`}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {product.category}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            ₱{product.cost_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            ₱{product.selling_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {product.total_stock}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {product.supplier || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedProducts.length > 10 && (
                  <div className="bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    Showing first 10 of {parsedProducts.length} products
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={isProcessing}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                    isProcessing
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {isProcessing
                    ? "Importing..."
                    : `Import ${parsedProducts.length} Products`}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && importResults && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Import Completed
                </h3>
              </div>

              {/* Results Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {importResults.data?.success?.length || 0}
                  </div>
                  <div className="text-sm text-green-700">
                    Successfully Imported
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {importResults.data?.errors?.length || 0}
                  </div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {importResults.data?.total || 0}
                  </div>
                  <div className="text-sm text-blue-700">Total Processed</div>
                </div>
              </div>

              {/* Error Details */}
              {importResults.data?.errors?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={20} className="text-red-600" />
                    <h4 className="font-semibold text-red-800">
                      Import Errors
                    </h4>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {importResults.data.errors
                      .slice(0, 5)
                      .map((error, errorIndex) => {
                        const key =
                          error.product?.barcode ||
                          error.product?.name ||
                          `error-${errorIndex}`;
                        return (
                          <div key={key} className="text-sm text-red-700 mb-2">
                            <p className="font-medium">
                              {error.product?.name || "Unknown Product"}
                            </p>
                            <p>{error.error}</p>
                          </div>
                        );
                      })}
                    {importResults.data.errors.length > 5 && (
                      <p className="text-sm text-red-600">
                        ... and {importResults.data.errors.length - 5} more
                        errors
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Import More
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
