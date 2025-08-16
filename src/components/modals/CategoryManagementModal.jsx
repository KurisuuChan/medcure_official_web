import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Edit,
  Trash2,
  Tag,
  CheckCircle,
  AlertTriangle,
  Save,
} from "lucide-react";

export function CategoryManagementModal({
  isOpen,
  onClose,
  categories = [],
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) {
  const [localCategories, setLocalCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalCategories(
        categories.map((cat) =>
          typeof cat === "string" ? { name: cat, id: cat } : cat
        )
      );
      setNewCategoryName("");
      setEditingCategory(null);
      setEditingName("");
      setErrors({});
    }
  }, [isOpen, categories]);

  const validateCategoryName = (name, excludeId = null) => {
    if (!name.trim()) {
      return "Category name is required";
    }

    if (name.trim().length < 2) {
      return "Category name must be at least 2 characters";
    }

    if (name.trim().length > 50) {
      return "Category name must be less than 50 characters";
    }

    const exists = localCategories.some(
      (cat) =>
        cat.name.toLowerCase() === name.trim().toLowerCase() &&
        cat.id !== excludeId
    );

    if (exists) {
      return "Category name already exists";
    }

    return null;
  };

  const handleAddCategory = async () => {
    const error = validateCategoryName(newCategoryName);
    if (error) {
      setErrors({ new: error });
      return;
    }

    setIsSubmitting(true);
    try {
      const categoryData = {
        name: newCategoryName.trim(),
        is_active: true,
        created_at: new Date().toISOString(),
      };

      await onAddCategory(categoryData);

      // Update local state
      const newCategory = {
        id: Date.now().toString(),
        ...categoryData,
      };
      setLocalCategories((prev) => [...prev, newCategory]);
      setNewCategoryName("");
      setErrors({});
    } catch (error) {
      setErrors({ new: "Failed to add category" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (category) => {
    setEditingCategory(category.id);
    setEditingName(category.name);
    setErrors({});
  };

  const handleSaveEdit = async (categoryId) => {
    const error = validateCategoryName(editingName, categoryId);
    if (error) {
      setErrors({ [categoryId]: error });
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedData = {
        name: editingName.trim(),
        updated_at: new Date().toISOString(),
      };

      await onUpdateCategory(categoryId, updatedData);

      // Update local state
      setLocalCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId ? { ...cat, ...updatedData } : cat
        )
      );

      setEditingCategory(null);
      setEditingName("");
      setErrors({});
    } catch (error) {
      setErrors({ [categoryId]: "Failed to update category" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditingName("");
    setErrors({});
  };

  const handleDeleteCategory = async (categoryId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this category? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onDeleteCategory(categoryId);

      // Update local state
      setLocalCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
    } catch (error) {
      setErrors({ [categoryId]: "Failed to delete category" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Tag size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Manage Categories
              </h2>
              <p className="text-sm text-gray-500">
                Add, edit, or delete product categories
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Add New Category */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">
              Add New Category
            </h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    if (errors.new) {
                      setErrors((prev) => ({ ...prev, new: "" }));
                    }
                  }}
                  placeholder="Enter category name..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.new ? "border-red-500" : "border-gray-300"
                  }`}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !isSubmitting) {
                      handleAddCategory();
                    }
                  }}
                />
                {errors.new && (
                  <p className="text-red-500 text-xs mt-1">{errors.new}</p>
                )}
              </div>
              <button
                onClick={handleAddCategory}
                disabled={isSubmitting || !newCategoryName.trim()}
                className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
                  isSubmitting || !newCategoryName.trim()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>

          {/* Existing Categories */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">
              Existing Categories ({localCategories.length})
            </h3>

            {localCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Tag size={48} className="mx-auto mb-4 opacity-50" />
                <p>No categories available</p>
                <p className="text-sm">Add your first category above</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {localCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {editingCategory === category.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => {
                            setEditingName(e.target.value);
                            if (errors[category.id]) {
                              setErrors((prev) => ({
                                ...prev,
                                [category.id]: "",
                              }));
                            }
                          }}
                          className={`flex-1 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 ${
                            errors[category.id]
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !isSubmitting) {
                              handleSaveEdit(category.id);
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(category.id)}
                          disabled={isSubmitting}
                          className="p-1 text-green-600 hover:text-green-800 rounded"
                          title="Save"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSubmitting}
                          className="p-1 text-gray-600 hover:text-gray-800 rounded"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Tag size={16} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {category.name}
                            </p>
                            {category.created_at && (
                              <p className="text-xs text-gray-500">
                                Created:{" "}
                                {new Date(
                                  category.created_at
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(category)}
                            disabled={isSubmitting}
                            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Edit Category"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            disabled={isSubmitting}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}

                    {errors[category.id] && (
                      <div className="w-full mt-2">
                        <p className="text-red-500 text-xs">
                          {errors[category.id]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Important Notes:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Category names must be unique</li>
                  <li>• Deleting a category cannot be undone</li>
                  <li>
                    • Products using deleted categories will need reassignment
                  </li>
                  <li>• Use descriptive names for better organization</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <CheckCircle size={16} className="inline mr-1 text-green-600" />
              Changes are saved automatically
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryManagementModal;
