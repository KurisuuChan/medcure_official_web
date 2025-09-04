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
} from "lucide-react";

// Contact Card Component
const ContactCard = ({ contact }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-blue-500 transition-all duration-300">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-4">
        <img
          src={contact.avatar}
          alt={contact.name}
          className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
        />
        <div>
          <h3 className="font-bold text-lg text-gray-800">{contact.name}</h3>
          <span className="text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
            {contact.role}
          </span>
        </div>
      </div>
      <button className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100">
        <MoreVertical size={20} />
      </button>
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
      {contact.bloodGroup && (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
          <span className="text-gray-600">Blood Group:</span>
          <span className="font-medium text-gray-700">
            {contact.bloodGroup}
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
    </div>

    <div className="mt-6 pt-4 border-t border-gray-100">
      <button className="w-full py-2 px-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium text-sm">
        View Details
      </button>
    </div>
  </div>
);

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
  const [activeTab, setActiveTab] = useState("Suppliers");
  const [searchTerm, setSearchTerm] = useState("");

  const suppliers = [
    {
      avatar: "https://i.pravatar.cc/150?u=pharmaCorp",
      name: "PharmaCorp Inc.",
      role: "Primary Supplier",
      phone: "(555) 123-4567",
      email: "contact@pharmacorp.com",
      company: "PharmaCorp Inc.",
      address: "123 Medical Plaza, Metro Manila",
    },
    {
      avatar: "https://i.pravatar.cc/150?u=mediSupply",
      name: "MediSupply Co.",
      role: "Secondary Supplier",
      phone: "(555) 234-5678",
      email: "orders@medisupply.ph",
      company: "MediSupply Co.",
      address: "456 Healthcare Ave, Quezon City",
    },
    {
      avatar: "https://i.pravatar.cc/150?u=healthMax",
      name: "HealthMax Ltd.",
      role: "Vitamins Supplier",
      phone: "(555) 345-6789",
      email: "sales@healthmax.com",
      company: "HealthMax Ltd.",
      address: "789 Wellness St, Makati City",
    },
    {
      avatar: "https://i.pravatar.cc/150?u=cardioMed",
      name: "CardioMed Supply",
      role: "Specialized Supplier",
      phone: "(555) 456-7890",
      email: "info@cardiomed.ph",
      company: "CardioMed Supply",
      address: "321 Heart Center, BGC",
    },
  ];

  const employees = [
    {
      avatar: "https://i.pravatar.cc/150?u=jane",
      name: "Jane Doe",
      role: "Chief Pharmacist",
      phone: "(555) 555-0121",
      bloodGroup: "B+ (Positive)",
      email: "jane.doe@medcure.ph",
    },
    {
      avatar: "https://i.pravatar.cc/150?u=john",
      name: "John Smith",
      role: "Senior Cashier",
      phone: "(555) 555-0122",
      bloodGroup: "AB+ (Positive)",
      email: "john.smith@medcure.ph",
    },
    {
      avatar: "https://i.pravatar.cc/150?u=maria",
      name: "Maria Garcia",
      role: "Inventory Manager",
      phone: "(555) 555-0123",
      bloodGroup: "O+ (Positive)",
      email: "maria.garcia@medcure.ph",
    },
    {
      avatar: "https://i.pravatar.cc/150?u=robert",
      name: "Robert Johnson",
      role: "Assistant Pharmacist",
      phone: "(555) 555-0124",
      bloodGroup: "A+ (Positive)",
      email: "robert.johnson@medcure.ph",
    },
    {
      avatar: "https://i.pravatar.cc/150?u=lisa",
      name: "Lisa Wang",
      role: "Customer Service",
      phone: "(555) 555-0125",
      bloodGroup: "B- (Negative)",
      email: "lisa.wang@medcure.ph",
    },
    {
      avatar: "https://i.pravatar.cc/150?u=michael",
      name: "Michael Brown",
      role: "Store Manager",
      phone: "(555) 555-0126",
      bloodGroup: "O- (Negative)",
      email: "michael.brown@medcure.ph",
    },
  ];

  const dataToShow = activeTab === "Suppliers" ? suppliers : employees;
  const addButtonText =
    activeTab === "Suppliers" ? "Add New Supplier" : "Add New Employee";

  const filteredData = dataToShow.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <Users size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Contacts Directory
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 leading-relaxed">
                Manage suppliers and employee information
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full">
            <button
              onClick={() => setActiveTab("Suppliers")}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === "Suppliers"
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Building2 size={16} className="inline mr-2" />
              Suppliers
            </button>
            <button
              onClick={() => setActiveTab("Employees")}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === "Employees"
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Users size={16} className="inline mr-2" />
              Employees
            </button>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter size={16} />
              Filters
            </button>
            <button className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow">
              <Plus size={18} />
              {addButtonText}
            </button>
          </div>
        </div>

        {/* Statistics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Total Suppliers</p>
                <p className="text-2xl font-bold text-blue-800">
                  {suppliers.length}
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
                  {employees.length}
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
                  {suppliers.length + employees.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Cards Grid */}
        {filteredData.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {filteredData.map((contact, index) => (
                <ContactCard key={`${activeTab}-${index}`} contact={contact} />
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
              {addButtonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
