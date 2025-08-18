import { useState, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Papa from "papaparse";
import { PRODUCT_CATEGORIES, FILE_LIMITS } from "../../utils/constants.js";
import { formatFileSize } from "../../utils/formatters.js";

/**
 * Modal for importing products from CSV files
 * Used in Management page for bulk product import
 */
export default function ImportModal({
  isOpen,
  onClose,
  onImport,
  isLoading = false,
}) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [step, setStep] = useState(1); // 1: upload, 2: preview, 3: validation
  const fileInputRef = useRef(null);

  // CSV template data
  const csvTemplate = [
    [
      "name",
      "category",
      "price",
      "cost_price",
      "stock",
      "pieces_per_sheet",
      "sheets_per_box",
      "description",
      "manufacturer",
    ],
    [
      "Paracetamol 500mg",
      "Analgesic",
      "2.50",
      "1.50",
      "120",
      "10",
      "10",
      "Pain reliever",
      "Generic Pharma",
    ],
    [
      "Amoxicillin 500mg",
      "Antibiotic",
      "8.75",
      "6.00",
      "80",
      "8",
      "5",
      "1234567891",
      "Antibiotic capsule",
      "MedLab Inc",
    ],
  ];

  // Required CSV columns
  const requiredColumns = ["name", "category", "price", "stock"];
  const optionalColumns = [
    "cost_price",
    "pieces_per_sheet",
    "sheets_per_box",
    "description",
    "manufacturer",
  ];

  // Handle file selection
  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    if (
      !FILE_LIMITS.ALLOWED_CSV_TYPES.some(
        (type) =>
          selectedFile.type === type ||
          selectedFile.name.toLowerCase().endsWith(".csv")
      )
    ) {
      setErrors(["Please select a valid CSV file"]);
      return;
    }

    // Validate file size
    if (selectedFile.size > FILE_LIMITS.CSV_MAX_SIZE) {
      setErrors([
        `File size must be less than ${formatFileSize(
          FILE_LIMITS.CSV_MAX_SIZE
        )}`,
      ]);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    parseCSV(selectedFile);
  };

  // Parse CSV file
  const parseCSV = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log("CSV parsing results:", results);

        if (results.errors.length > 0) {
          setErrors(
            results.errors.map((error) => `Row ${error.row}: ${error.message}`)
          );
          return;
        }

        setPreviewData(results.data);
        setStep(2);
        validateData(results.data);
      },
      error: (error) => {
        setErrors([`Failed to parse CSV: ${error.message}`]);
      },
    });
  };

  // Validate CSV data
  const validateData = (data) => {
    const validationErrors = [];
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    // Check required columns
    const missingColumns = requiredColumns.filter(
      (col) => !columns.includes(col)
    );
    if (missingColumns.length > 0) {
      validationErrors.push(
        `Missing required columns: ${missingColumns.join(", ")}`
      );
    }

    // Validate each row
    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because index starts at 0 and first row is header

      // Required field validation
      if (!row.name?.trim()) {
        validationErrors.push(`Row ${rowNumber}: Product name is required`);
      }

      if (!row.category?.trim()) {
        validationErrors.push(`Row ${rowNumber}: Category is required`);
      } else if (!PRODUCT_CATEGORIES.includes(row.category)) {
        validationErrors.push(
          `Row ${rowNumber}: Invalid category "${
            row.category
          }". Must be one of: ${PRODUCT_CATEGORIES.join(", ")}`
        );
      }

      if (
        !row.price ||
        isNaN(parseFloat(row.price)) ||
        parseFloat(row.price) <= 0
      ) {
        validationErrors.push(`Row ${rowNumber}: Valid price is required`);
      }

      if (!row.stock || isNaN(parseInt(row.stock)) || parseInt(row.stock) < 0) {
        validationErrors.push(
          `Row ${rowNumber}: Valid stock quantity is required`
        );
      }

      // Optional field validation
      if (
        row.cost_price &&
        (isNaN(parseFloat(row.cost_price)) || parseFloat(row.cost_price) < 0)
      ) {
        validationErrors.push(
          `Row ${rowNumber}: Cost price must be a valid number`
        );
      }

      if (
        row.pieces_per_sheet &&
        (isNaN(parseInt(row.pieces_per_sheet)) ||
          parseInt(row.pieces_per_sheet) <= 0)
      ) {
        validationErrors.push(
          `Row ${rowNumber}: Pieces per sheet must be greater than 0`
        );
      }

      if (
        row.sheets_per_box &&
        (isNaN(parseInt(row.sheets_per_box)) ||
          parseInt(row.sheets_per_box) <= 0)
      ) {
        validationErrors.push(
          `Row ${rowNumber}: Sheets per box must be greater than 0`
        );
      }
    });

    setErrors(validationErrors);
    setStep(3);
  };

  // Process data for import
  const processDataForImport = (data) => {
    return data.map((row) => ({
      name: row.name?.trim(),
      category: row.category?.trim(),
      price: parseFloat(row.price),
      cost_price: row.cost_price ? parseFloat(row.cost_price) : null,
      stock: parseInt(row.stock),
      pieces_per_sheet: row.pieces_per_sheet
        ? parseInt(row.pieces_per_sheet)
        : 1,
      sheets_per_box: row.sheets_per_box ? parseInt(row.sheets_per_box) : 1,
      description: row.description?.trim() || null,
      manufacturer: row.manufacturer?.trim() || null,
    }));
  };

  // Handle import
  const handleImport = () => {
    if (errors.length > 0) return;

    const processedData = processDataForImport(previewData);
    onImport(processedData);
  };

  // Download template
  const downloadTemplate = () => {
    const csvContent = Papa.unparse(csvTemplate);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "medcure_product_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset modal
  const handleClose = () => {
    if (!isLoading) {
      setFile(null);
      setPreviewData([]);
      setErrors([]);
      setStep(1);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onClose();
    }
  };

  // Go back to previous step
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      if (step === 2) {
        setPreviewData([]);
        setErrors([]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Import Products
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Step {step} of 3:{" "}
              {step === 1
                ? "Upload CSV File"
                : step === 2
                ? "Preview Data"
                : "Validation Results"}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: File Upload */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Template Download */}
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="flex items-start">
                  <FileText className="text-blue-600 mr-3 mt-1" size={20} />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900">
                      Need a template?
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Download our CSV template with sample data and required
                      column headers.
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Download size={16} className="mr-1" />
                      Download Template
                    </button>
                  </div>
                </div>
              </div>

              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Choose CSV file to upload
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  File must be in CSV format and less than{" "}
                  {formatFileSize(FILE_LIMITS.CSV_MAX_SIZE)}
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Select File
                </button>

                {file && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700">
                      Selected: {file.name} ({formatFileSize(file.size)})
                    </p>
                  </div>
                )}
              </div>

              {/* Required Columns Info */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">
                  Required Columns
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Required:</p>
                    <ul className="text-gray-600 mt-1 space-y-1">
                      {requiredColumns.map((col) => (
                        <li key={col}>• {col}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Optional:</p>
                    <ul className="text-gray-600 mt-1 space-y-1">
                      {optionalColumns.map((col) => (
                        <li key={col}>• {col}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Data Preview */}
          {step === 2 && previewData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                  Data Preview ({previewData.length} products)
                </h3>
                <button
                  onClick={handleBack}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  ← Back to Upload
                </button>
              </div>

              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(previewData[0] || {}).map((column) => (
                          <th
                            key={column}
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.slice(0, 5).map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap"
                            >
                              {value || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewData.length > 5 && (
                  <div className="px-3 py-2 bg-gray-50 text-sm text-gray-600">
                    ... and {previewData.length - 5} more rows
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Validation Results */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                  Validation Results
                </h3>
                <button
                  onClick={handleBack}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  ← Back to Preview
                </button>
              </div>

              {errors.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center">
                    <CheckCircle className="text-green-600 mr-3" size={20} />
                    <div>
                      <h4 className="font-medium text-green-900">
                        Validation Successful!
                      </h4>
                      <p className="text-sm text-green-700 mt-1">
                        All {previewData.length} products are ready to import.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-start">
                    <AlertCircle className="text-red-600 mr-3 mt-1" size={20} />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-900">
                        Validation Errors Found
                      </h4>
                      <p className="text-sm text-red-700 mt-1 mb-3">
                        Please fix the following errors before importing:
                      </p>
                      <div className="max-h-40 overflow-y-auto">
                        <ul className="text-sm text-red-700 space-y-1">
                          {errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          {step === 3 && errors.length === 0 && (
            <button
              onClick={handleImport}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload size={16} className="mr-2" />
                  Import {previewData.length} Products
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
