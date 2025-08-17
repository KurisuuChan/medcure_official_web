import React, { useState } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  Filter,
  History,
  Eye,
  Edit,
  Trash2,
  Package,
} from "lucide-react";
import { useContacts } from "../hooks/useContacts";
import { useNotification } from "../hooks/useNotification";
import SupplierHistoryModal from "../components/modals/SupplierHistoryModal";

// Contact Card Component
const ContactCard = ({ contact, onViewHistory, onViewDetails, onEdit, onDelete }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const isSupplier = contact.type === 'supplier';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-blue-500 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
            {contact.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800">{contact.name}</h3>
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${
              isSupplier 
                ? 'bg-green-100 text-green-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {isSupplier ? contact.company || 'Supplier' : contact.position || 'Employee'}
            </span>
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
          >
            <MoreVertical size={20} />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <div className="py-1">
                <button
                  onClick={() => {
                    onViewDetails(contact);
                    setShowDropdown(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Eye size={16} />
                  View Details
                </button>
                {isSupplier && (
                  <button
                    onClick={() => {
                      onViewHistory(contact.name);
                      setShowDropdown(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <History size={16} />
                    Supply History
                  </button>
                )}
                <button
                  onClick={() => {
                    onEdit(contact);
                    setShowDropdown(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit size={16} />
                  Edit Contact
                </button>
                <button
                  onClick={() => {
                    onDelete(contact);
                    setShowDropdown(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Delete Contact
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <Phone size={16} className="text-gray-400" />
          <span className="text-gray-600">Phone:</span>
          <span className="font-medium text-gray-700">{contact.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-gray-400" />
          <span className="text-gray-600">Email:</span>
          <span className="font-medium text-gray-700">{contact.email}</span>
        </div>
        {contact.blood_group && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
            <span className="text-gray-600">Blood Group:</span>
            <span className="font-medium text-gray-700">
              {contact.blood_group}
            </span>
          </div>
        )}
        {contact.company && (
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-gray-400" />
            <span className="text-gray-600">Company:</span>
            <span className="font-medium text-gray-700">{contact.company}</span>
          </div>
        )}
        {contact.address && (
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-gray-400" />
            <span className="text-gray-600">Address:</span>
            <span className="font-medium text-gray-700">{contact.address}</span>
          </div>
        )}
        {contact.payment_terms && (
          <div className="flex items-center gap-2">
            <Package size={16} className="text-gray-400" />
            <span className="text-gray-600">Payment Terms:</span>
            <span className="font-medium text-gray-700">{contact.payment_terms}</span>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        {isSupplier ? (
          <button 
            onClick={() => onViewHistory(contact.name)}
            className="w-full py-2 px-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium text-sm flex items-center justify-center gap-2"
          >
            <History size={16} />
            View Supply History
          </button>
        ) : (
          <button 
            onClick={() => onViewDetails(contact)}
            className="w-full py-2 px-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium text-sm"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
};

// Pagination Component
const Pagination = () => {
  const pages = [1, 2, 3, 4, 5, "...", 38, 39, 40];
  const currentPage = 1;
  return (
    <nav className="flex items-center justify-center space-x-1">
      <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
        <ChevronLeft size={20} />
      </button>
      {pages.map((page, index) => (
        <button
          key={`page-${page}-${index}`}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            page === currentPage
              ? "bg-blue-600 text-white"
              : "hover:bg-gray-100 text-gray-600"
          } ${page === "..." ? "pointer-events-none" : ""}`}
        >
          {page}
        </button>
      ))}
      <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
        <ChevronRight size={20} />
      </button>
    </nav>
  );
};

// Main Contacts Component
export default function Contacts() {
  const { contacts, loading, error, addContact, updateContact, deleteContact } = useContacts();
  const { showNotification } = useNotification();
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [showSupplierHistory, setShowSupplierHistory] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  
  // Filter contacts based on search term and selected tab
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = selectedTab === 'all' || contact.type === selectedTab;
    
    return matchesSearch && matchesTab;
  });

  // Statistics for tabs
  const stats = {
    all: contacts.length,
    employees: contacts.filter(c => c.type === 'employee').length,
    suppliers: contacts.filter(c => c.type === 'supplier').length,
    customers: contacts.filter(c => c.type === 'customer').length,
  };

  // Handle viewing supplier history
  const handleViewHistory = (supplierName) => {
    setSelectedSupplier(supplierName);
    setShowSupplierHistory(true);
  };

  // Handle contact details
  const handleViewDetails = (contact) => {
    setSelectedContact(contact);
    showNotification('Contact details view coming soon!', 'info');
  };

  // Handle edit contact
  const handleEdit = (contact) => {
    setSelectedContact(contact);
    showNotification('Contact edit modal coming soon!', 'info');
  };

  // Handle delete contact
  const handleDelete = async (contact) => {
    if (window.confirm(`Are you sure you want to delete ${contact.name}?`)) {
      try {
        await deleteContact(contact.id);
        showNotification('Contact deleted successfully', 'success');
      } catch (error) {
        showNotification('Failed to delete contact', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-600">Loading contacts...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-red-600">Error loading contacts: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-100">
            <Users size={32} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Contacts Directory
            </h1>
            <p className="text-gray-500 mt-1">
              Manage suppliers and employee information
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8">
        {/* Tabs */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full">
          <button
            onClick={() => setSelectedTab("all")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              selectedTab === "all"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Users size={16} className="inline mr-2" />
            All ({stats.all})
          </button>
          <button
            onClick={() => setSelectedTab("supplier")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              selectedTab === "supplier"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Building2 size={16} className="inline mr-2" />
            Suppliers ({stats.suppliers})
          </button>
          <button
            onClick={() => setSelectedTab("employee")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              selectedTab === "employee"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Users size={16} className="inline mr-2" />
            Employees ({stats.employees})
          </button>
          <button
            onClick={() => setSelectedTab("customer")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              selectedTab === "customer"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Phone size={16} className="inline mr-2" />
            Customers ({stats.customers})
          </button>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            <Plus size={16} />
            Add Contact
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Total Suppliers</p>
              <p className="text-2xl font-bold text-blue-800">
                {stats.suppliers}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600">Total Employees</p>
              <p className="text-2xl font-bold text-green-800">
                {stats.employees}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Phone size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-purple-600">Active Contacts</p>
              <p className="text-2xl font-bold text-purple-800">
                {stats.all}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Cards Grid */}
      {filteredContacts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {filteredContacts.map((contact) => (
              <ContactCard 
                key={contact.id} 
                contact={contact}
                onViewHistory={handleViewHistory}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex justify-center">
            <Pagination />
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No contacts found
          </h3>
          <p className="text-gray-500 mb-6">
            Try adjusting your search or add a new contact
          </p>
          <button className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus size={16} />
            Add Contact
          </button>
        </div>
      )}

      {/* Supplier History Modal */}
      {showSupplierHistory && (
        <SupplierHistoryModal
          supplierName={selectedSupplier}
          isOpen={showSupplierHistory}
          onClose={() => setShowSupplierHistory(false)}
        />
      )}
    </div>
  );
}
