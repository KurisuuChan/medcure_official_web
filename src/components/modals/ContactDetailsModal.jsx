import React from "react";
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  CreditCard,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
} from "lucide-react";

const ContactDetailsModal = ({ isOpen, onClose, contact, onEdit }) => {
  if (!isOpen || !contact) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getContactTypeColor = (type) => {
    switch (type) {
      case "supplier":
        return "bg-blue-100 text-blue-800";
      case "employee":
        return "bg-green-100 text-green-800";
      case "customer":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getContactTypeIcon = (type) => {
    switch (type) {
      case "supplier":
        return <Building2 size={16} />;
      case "employee":
        return <Users size={16} />;
      case "customer":
        return <User size={16} />;
      default:
        return <User size={16} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-700">
                {contact.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {contact.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getContactTypeColor(
                    contact.type
                  )}`}
                >
                  {getContactTypeIcon(contact.type)}
                  {contact.type?.charAt(0).toUpperCase() +
                    contact.type?.slice(1)}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    contact.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {contact.is_active ? (
                    <CheckCircle size={12} />
                  ) : (
                    <XCircle size={12} />
                  )}
                  {contact.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(contact)}
              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
              title="Edit Contact"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone size={20} className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-800">
                    {contact.phone || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail size={20} className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-800">
                    {contact.email || "N/A"}
                  </p>
                </div>
              </div>
              {contact.address && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                  <MapPin size={20} className="text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium text-gray-800">
                      {contact.address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Type-specific Information */}
          {contact.type === "supplier" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Supplier Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contact.company && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Building2 size={20} className="text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600">Company</p>
                      <p className="font-medium text-blue-800">
                        {contact.company}
                      </p>
                    </div>
                  </div>
                )}
                {contact.contact_person && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <User size={20} className="text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600">Contact Person</p>
                      <p className="font-medium text-blue-800">
                        {contact.contact_person}
                      </p>
                    </div>
                  </div>
                )}
                {contact.payment_terms && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg md:col-span-2">
                    <CreditCard size={20} className="text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600">Payment Terms</p>
                      <p className="font-medium text-blue-800">
                        {contact.payment_terms}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {contact.type === "employee" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Employee Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contact.position && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Users size={20} className="text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">Position</p>
                      <p className="font-medium text-green-800">
                        {contact.position}
                      </p>
                    </div>
                  </div>
                )}
                {contact.blood_group && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm text-green-600">Blood Group</p>
                      <p className="font-medium text-green-800">
                        {contact.blood_group}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Record Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar size={20} className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium text-gray-800">
                    {formatDate(contact.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar size={20} className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="font-medium text-gray-800">
                    {formatDate(contact.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ID for debugging */}
          {contact.id && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">Contact ID: {contact.id}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onEdit(contact)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit size={16} />
            Edit Contact
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactDetailsModal;
