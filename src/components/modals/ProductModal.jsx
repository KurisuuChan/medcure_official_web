import { useState } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { PRODUCT_CATEGORIES } from "../../utils/constants.js";
import { formatCurrency } from "../../utils/formatters.js";

/**
 * Modal for adding/editing products
 * Used in the Management page for product creation and editing
 */
export default function ProductModal({
  isOpen,
  onClose,
  onSave,
  product = null, // null for new product, object for editing
  isLoading = false,
}) {
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    name: product?.name || "",
    category: product?.category || "",
    price: product?.price || "",
    cost_price: product?.cost_price || "",
    stock: product?.stock || "",
    pieces_per_sheet: product?.pieces_per_sheet || 1,
    sheets_per_box: product?.sheets_per_box || 1,
    barcode: product?.barcode || "",
    description: product?.description || "",
    manufacturer: product?.manufacturer || "",
    expiration_date: product?.expiration_date || "",
  });

  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (
      !formData.price ||
      isNaN(formData.price) ||
      Number(formData.price) <= 0
    ) {
      newErrors.price = "Valid price is required";
    }

    if (
      formData.cost_price &&
      (isNaN(formData.cost_price) || Number(formData.cost_price) < 0)
    ) {
      newErrors.cost_price = "Cost price must be a valid number";
    }

    if (
      !formData.stock ||
      isNaN(formData.stock) ||
      Number(formData.stock) < 0
    ) {
      newErrors.stock = "Valid stock quantity is required";
    }

    if (
      !formData.pieces_per_sheet ||
      isNaN(formData.pieces_per_sheet) ||
      Number(formData.pieces_per_sheet) <= 0
    ) {
      newErrors.pieces_per_sheet = "Pieces per sheet must be greater than 0";
    }

    if (
      !formData.sheets_per_box ||
      isNaN(formData.sheets_per_box) ||
      Number(formData.sheets_per_box) <= 0
    ) {
      newErrors.sheets_per_box = "Sheets per box must be greater than 0";
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Convert string values to numbers where needed
    const productData = {
      ...formData,
      price: Number(formData.price),
      cost_price: formData.cost_price ? Number(formData.cost_price) : null,
      stock: Number(formData.stock),
      pieces_per_sheet: Number(formData.pieces_per_sheet),
      sheets_per_box: Number(formData.sheets_per_box),
    };

    onSave(productData);
  };

  // Handle modal close
  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        name: "",
        category: "",
        price: "",
        cost_price: "",
        stock: "",
        pieces_per_sheet: 1,
        sheets_per_box: 1,
        barcode: "",
        description: "",
        manufacturer: "",
        expiration_date: "",
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? "Edit Product" : "Add New Product"}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter product name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={16} className="mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? "border-red-300" : "border-gray-300"
                }`}
                disabled={isLoading}
              >
                <option value="">Select category</option>
                {PRODUCT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={16} className="mr-1" />
                  {errors.category}
                </p>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selling Price * (₱)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.price ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="0.00"
                disabled={isLoading}
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={16} className="mr-1" />
                  {errors.price}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Price (₱)
              </label>
              <input
                type="number"
                name="cost_price"
                value={formData.cost_price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.cost_price ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="0.00"
                disabled={isLoading}
              />
              {errors.cost_price && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={16} className="mr-1" />
                  {errors.cost_price}
                </p>
              )}
            </div>
          </div>

          {/* Inventory */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.stock ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="0"
                disabled={isLoading}
              />
              {errors.stock && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={16} className="mr-1" />
                  {errors.stock}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pieces per Sheet *
              </label>
              <input
                type="number"
                name="pieces_per_sheet"
                value={formData.pieces_per_sheet}
                onChange={handleChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.pieces_per_sheet ? "border-red-300" : "border-gray-300"
                }`}
                disabled={isLoading}
              />
              {errors.pieces_per_sheet && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={16} className="mr-1" />
                  {errors.pieces_per_sheet}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sheets per Box *
              </label>
              <input
                type="number"
                name="sheets_per_box"
                value={formData.sheets_per_box}
                onChange={handleChange}
                min="1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sheets_per_box ? "border-red-300" : "border-gray-300"
                }`}
                disabled={isLoading}
              />
              {errors.sheets_per_box && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={16} className="mr-1" />
                  {errors.sheets_per_box}
                </p>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Barcode
              </label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter barcode"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter manufacturer"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter product description"
              disabled={isLoading}
            />
          </div>

          {/* Profit Preview */}
          {formData.price && formData.cost_price && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Profit Analysis
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Profit per piece:</span>
                  <p className="font-medium">
                    {formatCurrency(
                      Number(formData.price) - Number(formData.cost_price)
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Margin:</span>
                  <p className="font-medium">
                    {(
                      ((Number(formData.price) - Number(formData.cost_price)) /
                        Number(formData.price)) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Markup:</span>
                  <p className="font-medium">
                    {(
                      ((Number(formData.price) - Number(formData.cost_price)) /
                        Number(formData.cost_price)) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  {isEditing ? "Update Product" : "Add Product"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
