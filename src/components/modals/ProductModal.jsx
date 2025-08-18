import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { X, Package, DollarSign, Hash, AlertTriangle, Tag } from "lucide-react";

export function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  product = null,
  categories = [],
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: product?.name || "",
    generic_name: product?.generic_name || "",
    brand_name: product?.brand_name || "",
    category: product?.category || "",
    supplier: product?.supplier || "",
    description: product?.description || "",
    cost_price: product?.cost_price || "",
    selling_price: product?.selling_price || "",
    total_stock: product?.total_stock || "",
    critical_level: product?.critical_level || "",
    pieces_per_sheet: product?.pieces_per_sheet || 1,
    sheets_per_box: product?.sheets_per_box || 1,
    expiry_date: product?.expiry_date || "",
    batch_number: product?.batch_number || "",
  });

  const [errors, setErrors] = useState({});

  // Reset form when product changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: product?.name || "",
        generic_name: product?.generic_name || "",
        brand_name: product?.brand_name || "",
        category: product?.category || "",
        supplier: product?.supplier || "",
        description: product?.description || "",
        cost_price: product?.cost_price || "",
        selling_price: product?.selling_price || "",
        total_stock: product?.total_stock || "",
        critical_level: product?.critical_level || "",
        pieces_per_sheet: product?.pieces_per_sheet || 1,
        sheets_per_box: product?.sheets_per_box || 1,
        expiry_date: product?.expiry_date || "",
        batch_number: product?.batch_number || "",
      });
      setErrors({});
    }
  }, [isOpen, product]);

  const handleInputChange = (e) => {
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

  const validateForm = () => {
    const newErrors = {};

    // Required field validations
    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    // Price validations
    const costPrice = parseFloat(formData.cost_price);
    const sellingPrice = parseFloat(formData.selling_price);

    if (!formData.cost_price || isNaN(costPrice) || costPrice < 0) {
      newErrors.cost_price = "Valid cost price is required";
    }

    if (!formData.selling_price || isNaN(sellingPrice) || sellingPrice <= 0) {
      newErrors.selling_price = "Valid selling price is required";
    }

    if (!isNaN(costPrice) && !isNaN(sellingPrice) && sellingPrice < costPrice) {
      newErrors.selling_price =
        "Selling price should be greater than cost price";
    }

    // Stock validation
    const stock = parseInt(formData.total_stock);
    if (isNaN(stock) || stock < 0) {
      newErrors.total_stock = "Valid stock quantity is required";
    }

    const criticalLevel = parseInt(formData.critical_level);
    if (isNaN(criticalLevel) || criticalLevel < 0) {
      newErrors.critical_level = "Valid critical level is required";
    }

    // Packaging validation
    const piecesPerSheet = parseInt(formData.pieces_per_sheet);
    const sheetsPerBox = parseInt(formData.sheets_per_box);

    if (isNaN(piecesPerSheet) || piecesPerSheet < 1) {
      newErrors.pieces_per_sheet = "Pieces per sheet must be at least 1";
    }

    if (isNaN(sheetsPerBox) || sheetsPerBox < 1) {
      newErrors.sheets_per_box = "Sheets per box must be at least 1";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for submission
      // Create submit data matching the actual database schema
      // Based on debug: id, name, category, price, cost_price, stock, pieces_per_sheet, sheets_per_box, description, manufacturer, expiration_date, created_at, updated_at, batch_number, brand_name, critical_level, generic_name, expiry_date, supplier, selling_price, total_stock
      const submitData = {
        name: formData.name?.trim() || null,
        category: formData.category?.trim() || null, // Required
        price: parseFloat(formData.selling_price) || 0, // Database uses 'price' not 'selling_price'
        cost_price: parseFloat(formData.cost_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0, // Keep both for compatibility
        stock: parseInt(formData.total_stock) || 0, // Database uses 'stock' not 'total_stock'
        total_stock: parseInt(formData.total_stock) || 0, // Keep both for compatibility
        generic_name: formData.generic_name?.trim() || null,
        brand_name: formData.brand_name?.trim() || null,
        supplier: formData.supplier?.trim() || null,
        description: formData.description?.trim() || null,
        critical_level: parseInt(formData.critical_level) || 10,
        pieces_per_sheet: parseInt(formData.pieces_per_sheet) || 1,
        sheets_per_box: parseInt(formData.sheets_per_box) || 1,
        batch_number: formData.batch_number?.trim() || null,
        // Add expiry_date if the form has it and the column exists
        expiry_date: formData.expiry_date || null,
      };

      // Validate required fields before submission
      if (!submitData.name) {
        throw new Error("Product name is required");
      }
      if (!submitData.category) {
        throw new Error("Category is required");
      }
      if (!submitData.price || submitData.price <= 0) {
        throw new Error("Valid selling price is required");
      }

      console.log("Submitting product data:", submitData);

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error("Error submitting product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalPiecesPerBox =
    parseInt(formData.pieces_per_sheet || 1) *
    parseInt(formData.sheets_per_box || 1);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {product ? "Edit Product" : "Add New Product"}
              </h2>
              <p className="text-sm text-gray-500">
                {product
                  ? "Update product information"
                  : "Enter product details"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Package size={20} />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., Paracetamol 500mg"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Generic Name
                </label>
                <input
                  type="text"
                  name="generic_name"
                  value={formData.generic_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Paracetamol"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  name="brand_name"
                  value={formData.brand_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Biogesic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.category ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option
                      key={category.name || category}
                      value={category.name || category}
                    >
                      {category.name || category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-xs mt-1">{errors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., PharmaCorp Inc."
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
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Product description..."
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign size={20} />
              Pricing
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Price (₱) *
                </label>
                <input
                  type="number"
                  name="cost_price"
                  value={formData.cost_price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.cost_price ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0.00"
                />
                {errors.cost_price && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.cost_price}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price (₱) *
                </label>
                <input
                  type="number"
                  name="selling_price"
                  value={formData.selling_price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.selling_price ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0.00"
                />
                {errors.selling_price && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.selling_price}
                  </p>
                )}
              </div>
            </div>

            {formData.cost_price && formData.selling_price && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <p>
                    Profit: ₱
                    {(
                      parseFloat(formData.selling_price) -
                      parseFloat(formData.cost_price)
                    ).toFixed(2)}
                  </p>
                  <p>
                    Markup:{" "}
                    {(
                      ((parseFloat(formData.selling_price) -
                        parseFloat(formData.cost_price)) /
                        parseFloat(formData.cost_price)) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stock & Packaging */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Hash size={20} />
              Stock & Packaging
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Stock (pieces) *
                </label>
                <input
                  type="number"
                  name="total_stock"
                  value={formData.total_stock}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.total_stock ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0"
                />
                {errors.total_stock && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.total_stock}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Critical Level *
                </label>
                <input
                  type="number"
                  name="critical_level"
                  value={formData.critical_level}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.critical_level ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="10"
                />
                {errors.critical_level && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.critical_level}
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
                  onChange={handleInputChange}
                  min="1"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.pieces_per_sheet
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="1"
                />
                {errors.pieces_per_sheet && (
                  <p className="text-red-500 text-xs mt-1">
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
                  onChange={handleInputChange}
                  min="1"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.sheets_per_box ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="1"
                />
                {errors.sheets_per_box && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.sheets_per_box}
                  </p>
                )}
              </div>
            </div>

            {/* Packaging Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  📦 Total pieces per box:{" "}
                  <span className="font-semibold">{totalPiecesPerBox}</span>
                </p>
                {formData.total_stock && (
                  <>
                    <p>
                      📊 Total boxes available:{" "}
                      <span className="font-semibold">
                        {Math.floor(
                          parseInt(formData.total_stock) / totalPiecesPerBox
                        )}
                      </span>
                    </p>
                    <p>
                      📋 Total sheets available:{" "}
                      <span className="font-semibold">
                        {Math.floor(
                          parseInt(formData.total_stock) /
                            parseInt(formData.pieces_per_sheet || 1)
                        )}
                      </span>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Tag size={20} />
              Additional Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.expiry_date ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.expiry_date && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.expiry_date}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Number
                </label>
                <input
                  type="text"
                  name="batch_number"
                  value={formData.batch_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., BATCH001"
                />
              </div>
            </div>
          </div>

          {/* Warning for low stock */}
          {formData.total_stock &&
            formData.critical_level &&
            parseInt(formData.total_stock) <=
              parseInt(formData.critical_level) && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3">
                <AlertTriangle
                  size={24}
                  className="text-orange-600 flex-shrink-0"
                />
                <div>
                  <h4 className="font-semibold text-orange-800">Stock Alert</h4>
                  <p className="text-sm text-orange-700">
                    Current stock is at or below the critical level. Consider
                    restocking soon.
                  </p>
                </div>
              </div>
            )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                isSubmitting
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {(() => {
                if (isSubmitting) return "Saving...";
                return product ? "Update Product" : "Add Product";
              })()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

ProductModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  product: PropTypes.object,
  categories: PropTypes.array,
};

export default ProductModal;
