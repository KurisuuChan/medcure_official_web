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

  // CSV template data with proper formatting and examples
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
      "Paracetamol 500mg Tablets",
      "Analgesic",
      "2.50",
      "1.80",
      "150",
      "10",
      "10",
      "Pain reliever and fever reducer tablets",
      "Generic Pharma Ltd",
    ],
    [
      "Amoxicillin 500mg Capsules",
      "Antibiotic",
      "8.75",
      "6.50",
      "80",
      "8",
      "5",
      "Broad-spectrum antibiotic capsules for bacterial infections",
      "MedLab Pharmaceuticals",
    ],
    [
      "Cetirizine 10mg Tablets",
      "Antihistamine",
      "3.25",
      "2.10",
      "120",
      "10",
      "10",
      "Antihistamine for allergic reactions and hay fever",
      "AllerCare Inc",
    ],
    [
      "Ibuprofen 400mg Tablets",
      "Anti-inflammatory",
      "4.50",
      "3.20",
      "90",
      "10",
      "6",
      "Non-steroidal anti-inflammatory drug for pain and inflammation",
      "PainRelief Corp",
    ],
    [
      "Vitamin C 500mg Tablets",
      "Supplement",
      "1.75",
      "1.20",
      "200",
      "10",
      "20",
      "Vitamin C supplement for immune system support",
      "VitaHealth Solutions",
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

    // Reset previous state
    setErrors([]);
    setPreviewData([]);
    setStep(1);

    // Validate file extension
    const fileName = selectedFile.name.toLowerCase();
    const hasValidExtension = FILE_LIMITS.ALLOWED_CSV_EXTENSIONS.some((ext) =>
      fileName.endsWith(ext)
    );

    // Validate file type
    const hasValidType =
      FILE_LIMITS.ALLOWED_CSV_TYPES.includes(selectedFile.type) ||
      selectedFile.type === "" || // Some browsers don't set type for .csv
      hasValidExtension;

    if (!hasValidType && !hasValidExtension) {
      setErrors(["Please select a valid CSV file (.csv)"]);
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

    // Check if file is empty
    if (selectedFile.size === 0) {
      setErrors(["Selected file is empty. Please choose a file with data."]);
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  // Parse CSV file with better error handling
  const parseCSV = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy", // Skip completely empty lines
      trimHeaders: true, // Remove whitespace from headers
      complete: (results) => {
        console.log("CSV parsing results:", results);

        // Check for parsing errors
        if (results.errors.length > 0) {
          const criticalErrors = results.errors.filter(
            (error) => error.type === "Delimiter" || error.type === "Quotes"
          );

          if (criticalErrors.length > 0) {
            setErrors([
              "CSV file format is invalid. Please check:",
              "• Ensure proper comma separation",
              "• Check for unclosed quotes",
              "• Verify file encoding (UTF-8 recommended)",
            ]);
            return;
          }

          // Non-critical errors - show warnings but continue
          const warnings = results.errors.map(
            (error) => `Row ${error.row + 1}: ${error.message}`
          );
          console.warn("CSV parsing warnings:", warnings);
        }

        // Check if file has data
        if (!results.data || results.data.length === 0) {
          setErrors([
            "CSV file appears to be empty or contains no valid data rows.",
          ]);
          return;
        }

        // Filter out completely empty rows
        const validData = results.data.filter((row) => {
          const values = Object.values(row);
          return values.some(
            (value) => value && value.toString().trim() !== ""
          );
        });

        if (validData.length === 0) {
          setErrors(["No valid data rows found in the CSV file."]);
          return;
        }

        setPreviewData(validData);
        setStep(2);
        // Don't validate immediately, let user review first
      },
      error: (error) => {
        setErrors([
          "Failed to read CSV file:",
          error.message,
          "",
          "Please ensure the file is a valid CSV format.",
        ]);
      },
    });
  };

  // Validate CSV data with comprehensive checks
  const validateData = (data) => {
    const validationErrors = [];
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    // Check required columns
    const missingColumns = requiredColumns.filter(
      (col) =>
        !columns.some(
          (column) => column.toLowerCase().trim() === col.toLowerCase()
        )
    );
    if (missingColumns.length > 0) {
      validationErrors.push(
        `Missing required columns: ${missingColumns.join(", ")}`
      );
    }

    // Check for duplicate product names
    const productNames = new Map();

    // Validate each row
    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because index starts at 0 and first row is header

      // Clean and normalize data
      const cleanRow = {};
      Object.keys(row).forEach((key) => {
        cleanRow[key.toLowerCase().trim()] = row[key];
      });

      // Required field validation
      const productName = cleanRow.name?.toString().trim();
      if (!productName) {
        validationErrors.push(`Row ${rowNumber}: Product name is required`);
      } else {
        // Check for duplicate names
        if (productNames.has(productName.toLowerCase())) {
          validationErrors.push(
            `Row ${rowNumber}: Duplicate product name "${productName}" (first seen in row ${productNames.get(
              productName.toLowerCase()
            )})`
          );
        } else {
          productNames.set(productName.toLowerCase(), rowNumber);
        }

        // Check name length
        if (productName.length > 255) {
          validationErrors.push(
            `Row ${rowNumber}: Product name too long (max 255 characters)`
          );
        }
      }

      const category = cleanRow.category?.toString().trim();
      if (!category) {
        validationErrors.push(`Row ${rowNumber}: Category is required`);
      } else if (
        !PRODUCT_CATEGORIES.some(
          (cat) => cat.toLowerCase() === category.toLowerCase()
        )
      ) {
        validationErrors.push(
          `Row ${rowNumber}: Invalid category "${category}". Must be one of: ${PRODUCT_CATEGORIES.join(
            ", "
          )}`
        );
      }

      // Price validation
      const price = cleanRow.price?.toString().trim();
      if (!price) {
        validationErrors.push(`Row ${rowNumber}: Price is required`);
      } else {
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
          validationErrors.push(
            `Row ${rowNumber}: Price must be a positive number`
          );
        } else if (priceNum > 999999.99) {
          validationErrors.push(
            `Row ${rowNumber}: Price too high (max ₱999,999.99)`
          );
        }
      }

      // Stock validation
      const stock = cleanRow.stock?.toString().trim();
      if (!stock) {
        validationErrors.push(`Row ${rowNumber}: Stock quantity is required`);
      } else {
        const stockNum = parseInt(stock);
        if (isNaN(stockNum) || stockNum < 0) {
          validationErrors.push(
            `Row ${rowNumber}: Stock must be a non-negative integer`
          );
        } else if (stockNum > 999999) {
          validationErrors.push(
            `Row ${rowNumber}: Stock quantity too high (max 999,999)`
          );
        }
      }

      // Optional field validation
      const costPrice = cleanRow.cost_price?.toString().trim();
      if (costPrice && costPrice !== "") {
        const costPriceNum = parseFloat(costPrice);
        if (isNaN(costPriceNum) || costPriceNum < 0) {
          validationErrors.push(
            `Row ${rowNumber}: Cost price must be a non-negative number`
          );
        } else if (costPriceNum > 999999.99) {
          validationErrors.push(
            `Row ${rowNumber}: Cost price too high (max ₱999,999.99)`
          );
        }
      }

      const piecesPerSheet = cleanRow.pieces_per_sheet?.toString().trim();
      if (piecesPerSheet && piecesPerSheet !== "") {
        const piecesNum = parseInt(piecesPerSheet);
        if (isNaN(piecesNum) || piecesNum <= 0) {
          validationErrors.push(
            `Row ${rowNumber}: Pieces per sheet must be greater than 0`
          );
        } else if (piecesNum > 9999) {
          validationErrors.push(
            `Row ${rowNumber}: Pieces per sheet too high (max 9,999)`
          );
        }
      }

      const sheetsPerBox = cleanRow.sheets_per_box?.toString().trim();
      if (sheetsPerBox && sheetsPerBox !== "") {
        const sheetsNum = parseInt(sheetsPerBox);
        if (isNaN(sheetsNum) || sheetsNum <= 0) {
          validationErrors.push(
            `Row ${rowNumber}: Sheets per box must be greater than 0`
          );
        } else if (sheetsNum > 9999) {
          validationErrors.push(
            `Row ${rowNumber}: Sheets per box too high (max 9,999)`
          );
        }
      }

      // Description validation
      const description = cleanRow.description?.toString().trim();
      if (description && description.length > 1000) {
        validationErrors.push(
          `Row ${rowNumber}: Description too long (max 1,000 characters)`
        );
      }

      // Manufacturer validation
      const manufacturer = cleanRow.manufacturer?.toString().trim();
      if (manufacturer && manufacturer.length > 255) {
        validationErrors.push(
          `Row ${rowNumber}: Manufacturer name too long (max 255 characters)`
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
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
                  accept=".csv,text/csv,application/vnd.ms-excel,application/csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="space-y-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Select CSV File
                  </button>

                  <p className="text-xs text-gray-500">
                    Supported formats: .csv
                  </p>
                </div>

                {file && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center justify-center">
                      <CheckCircle className="text-green-600 mr-2" size={16} />
                      <p className="text-sm text-green-700 font-medium">
                        {file.name} ({formatFileSize(file.size)})
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Show any file selection errors */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-start">
                    <AlertCircle className="text-red-600 mr-3 mt-1" size={20} />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-900">
                        File Upload Error
                      </h4>
                      <div className="mt-1 text-sm text-red-700">
                        {errors.map((error, index) => (
                          <p key={index}>{error}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

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

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-start">
                  <FileText className="text-blue-600 mr-3 mt-1" size={20} />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900">
                      Review Your Data
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Please review the imported data below. Check that all
                      columns are correctly mapped and the data looks accurate
                      before proceeding to validation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(previewData[0] || {}).map((column) => (
                          <th
                            key={column}
                            className={`px-3 py-2 text-left text-xs font-medium uppercase ${
                              requiredColumns.includes(column)
                                ? "text-red-600 bg-red-50"
                                : "text-gray-500"
                            }`}
                          >
                            {column}
                            {requiredColumns.includes(column) && (
                              <span className="ml-1 text-red-500">*</span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.slice(0, 5).map((row, index) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          {Object.values(row).map((value, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap"
                            >
                              {value || (
                                <span className="text-gray-400 italic">
                                  empty
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewData.length > 5 && (
                  <div className="px-3 py-2 bg-gray-50 text-sm text-gray-600 border-t">
                    ... and {previewData.length - 5} more rows
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="text-red-600">*</span> Required columns
                </div>
                <button
                  onClick={() => validateData(previewData)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Validate Data
                </button>
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

              {/* Validation Summary */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {previewData.length}
                  </div>
                  <div className="text-sm text-blue-700">Total Products</div>
                </div>
                <div
                  className={`border rounded-lg p-4 text-center ${
                    errors.length === 0
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div
                    className={`text-2xl font-bold ${
                      errors.length === 0 ? "text-green-600" : "text-gray-600"
                    }`}
                  >
                    {errors.length === 0 ? previewData.length : 0}
                  </div>
                  <div
                    className={`text-sm ${
                      errors.length === 0 ? "text-green-700" : "text-gray-700"
                    }`}
                  >
                    Valid Products
                  </div>
                </div>
                <div
                  className={`border rounded-lg p-4 text-center ${
                    errors.length > 0
                      ? "bg-red-50 border-red-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div
                    className={`text-2xl font-bold ${
                      errors.length > 0 ? "text-red-600" : "text-gray-600"
                    }`}
                  >
                    {errors.length}
                  </div>
                  <div
                    className={`text-sm ${
                      errors.length > 0 ? "text-red-700" : "text-gray-700"
                    }`}
                  >
                    Errors Found
                  </div>
                </div>
              </div>

              {errors.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center">
                    <CheckCircle className="text-green-600 mr-3" size={20} />
                    <div>
                      <h4 className="font-medium text-green-900">
                        ✨ Validation Successful!
                      </h4>
                      <p className="text-sm text-green-700 mt-1">
                        All {previewData.length} products passed validation and
                        are ready to import. No duplicates or invalid data
                        detected.
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
                        ⚠️ Validation Errors Found
                      </h4>
                      <p className="text-sm text-red-700 mt-1 mb-3">
                        Please fix the following {errors.length} error
                        {errors.length > 1 ? "s" : ""} in your CSV file before
                        importing:
                      </p>
                      <div className="max-h-40 overflow-y-auto bg-white border border-red-200 rounded p-3">
                        <ul className="text-sm text-red-700 space-y-1">
                          {errors.map((error, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-red-500 mr-2 font-bold">
                                •
                              </span>
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                        <p className="text-xs text-red-600">
                          💡 <strong>Tips:</strong> Download the template again
                          for correct format, check for typos in category names,
                          and ensure all required fields are filled.
                        </p>
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
