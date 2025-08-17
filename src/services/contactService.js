import { supabase, TABLES } from "../lib/supabase.js";
import { isMockMode } from "../utils/mockApi.js";

/**
 * Contacts Management API Service
 * Handles suppliers, employees, and their relationships with products
 */

// Mock data for suppliers
const mockSuppliers = [
  {
    id: 1,
    name: "PharmaCorp Inc.",
    type: "supplier",
    email: "contact@pharmacorp.com",
    phone: "(555) 123-4567",
    address: "123 Medical Plaza, Metro Manila",
    company: "PharmaCorp Inc.",
    contact_person: "Maria Santos",
    payment_terms: "Net 30",
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: 2,
    name: "MediSupply Co.",
    type: "supplier",
    email: "orders@medisupply.ph",
    phone: "(555) 234-5678",
    address: "456 Healthcare Ave, Quezon City",
    company: "MediSupply Co.",
    contact_person: "John Cruz",
    payment_terms: "Net 15",
    is_active: true,
    created_at: "2024-01-20T14:30:00Z",
    updated_at: "2024-01-20T14:30:00Z",
  },
  {
    id: 3,
    name: "HealthMax Ltd.",
    type: "supplier",
    email: "sales@healthmax.com",
    phone: "(555) 345-6789",
    address: "789 Wellness St, Makati City",
    company: "HealthMax Ltd.",
    contact_person: "Ana Reyes",
    payment_terms: "Net 30",
    is_active: true,
    created_at: "2024-02-01T09:15:00Z",
    updated_at: "2024-02-01T09:15:00Z",
  },
  {
    id: 4,
    name: "CardioMed Supply",
    type: "supplier",
    email: "info@cardiomed.ph",
    phone: "(555) 456-7890",
    address: "321 Heart Center, BGC",
    company: "CardioMed Supply",
    contact_person: "Dr. Roberto Silva",
    payment_terms: "Net 45",
    is_active: true,
    created_at: "2024-02-10T16:45:00Z",
    updated_at: "2024-02-10T16:45:00Z",
  },
];

// Mock data for employees
const mockEmployees = [
  {
    id: 5,
    name: "Jane Doe",
    type: "employee",
    email: "jane.doe@medcure.ph",
    phone: "(555) 555-0121",
    position: "Chief Pharmacist",
    blood_group: "B+",
    employee_id: "EMP001",
    hire_date: "2023-01-15",
    is_active: true,
    created_at: "2023-01-15T08:00:00Z",
    updated_at: "2023-01-15T08:00:00Z",
  },
  {
    id: 6,
    name: "John Smith",
    type: "employee",
    email: "john.smith@medcure.ph",
    phone: "(555) 555-0122",
    position: "Senior Cashier",
    blood_group: "AB+",
    employee_id: "EMP002",
    hire_date: "2023-03-20",
    is_active: true,
    created_at: "2023-03-20T08:00:00Z",
    updated_at: "2023-03-20T08:00:00Z",
  },
  {
    id: 7,
    name: "Maria Garcia",
    type: "employee",
    email: "maria.garcia@medcure.ph",
    phone: "(555) 555-0123",
    position: "Inventory Manager",
    blood_group: "O+",
    employee_id: "EMP003",
    hire_date: "2023-02-10",
    is_active: true,
    created_at: "2023-02-10T08:00:00Z",
    updated_at: "2023-02-10T08:00:00Z",
  },
];

// Get all contacts (suppliers and employees)
export async function getContacts(filters = {}) {
  if (await isMockMode()) {
    console.log("🔧 getContacts called - using mock mode");

    let contacts = [];

    if (!filters.type || filters.type === "supplier") {
      contacts = [...contacts, ...mockSuppliers];
    }

    if (!filters.type || filters.type === "employee") {
      contacts = [...contacts, ...mockEmployees];
    }

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      contacts = contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchTerm) ||
          contact.email.toLowerCase().includes(searchTerm) ||
          (contact.position &&
            contact.position.toLowerCase().includes(searchTerm)) ||
          (contact.company &&
            contact.company.toLowerCase().includes(searchTerm))
      );
    }

    return {
      success: true,
      data: contacts,
      total: contacts.length,
    };
  }

  console.log("🔄 getContacts called - using backend mode");

  try {
    // For now, we'll create a virtual contacts table by querying unique suppliers from products
    // In a real implementation, you would have a dedicated contacts table

    let contacts = [];

    if (!filters.type || filters.type === "supplier") {
      // Get unique suppliers from products table
      const { data: suppliers, error: suppliersError } = await supabase
        .from(TABLES.PRODUCTS)
        .select("supplier")
        .not("supplier", "is", null)
        .not("supplier", "eq", "");

      if (suppliersError) throw suppliersError;

      // Create unique supplier list
      const uniqueSuppliers = [...new Set(suppliers.map((p) => p.supplier))];

      for (const supplierName of uniqueSuppliers) {
        // Find a mock supplier with matching name or create a basic one
        const mockSupplier = mockSuppliers.find((s) => s.name === supplierName);

        contacts.push({
          id: `supplier_${supplierName.replace(/\s+/g, "_")}`,
          name: supplierName,
          type: "supplier",
          email:
            mockSupplier?.email ||
            `contact@${supplierName.toLowerCase().replace(/\s+/g, "")}.com`,
          phone: mockSupplier?.phone || "(555) 000-0000",
          address: mockSupplier?.address || "Address not available",
          company: supplierName,
          contact_person: mockSupplier?.contact_person || "N/A",
          payment_terms: mockSupplier?.payment_terms || "Net 30",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (!filters.type || filters.type === "employee") {
      // For employees, use mock data for now
      contacts = [...contacts, ...mockEmployees];
    }

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      contacts = contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchTerm) ||
          contact.email.toLowerCase().includes(searchTerm) ||
          (contact.position &&
            contact.position.toLowerCase().includes(searchTerm)) ||
          (contact.company &&
            contact.company.toLowerCase().includes(searchTerm))
      );
    }

    return {
      success: true,
      data: contacts,
      total: contacts.length,
    };
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
}

// Get supplier history - products they have supplied
export async function getSupplierHistory(supplierName) {
  if (await isMockMode()) {
    console.log("🔧 getSupplierHistory called - using mock mode");

    // Mock supplier history data
    const mockHistory = {
      "PharmaCorp Inc.": [
        {
          id: 1,
          name: "Paracetamol 500mg",
          category: "Pain Relief",
          total_supplied: 2000,
          current_stock: 1500,
          last_supply_date: "2024-08-10",
          cost_price: 12.5,
          selling_price: 15.5,
          total_value: 25000.0,
        },
      ],
      "MediSupply Co.": [
        {
          id: 2,
          name: "Amoxicillin 500mg",
          category: "Antibiotics",
          total_supplied: 1000,
          current_stock: 800,
          last_supply_date: "2024-08-05",
          cost_price: 18.75,
          selling_price: 25.0,
          total_value: 18750.0,
        },
      ],
      "HealthMax Ltd.": [
        {
          id: 3,
          name: "Vitamin C 1000mg",
          category: "Vitamins",
          total_supplied: 500,
          current_stock: 432,
          last_supply_date: "2024-07-20",
          cost_price: 120.0,
          selling_price: 180.0,
          total_value: 60000.0,
        },
        {
          id: 6,
          name: "Multivitamins",
          category: "Supplements",
          total_supplied: 300,
          current_stock: 240,
          last_supply_date: "2024-07-25",
          cost_price: 250.0,
          selling_price: 350.0,
          total_value: 75000.0,
        },
      ],
      "CardioMed Supply": [
        {
          id: 5,
          name: "Aspirin 81mg",
          category: "Cardiovascular",
          total_supplied: 2500,
          current_stock: 2000,
          last_supply_date: "2024-08-01",
          cost_price: 6.25,
          selling_price: 8.75,
          total_value: 15625.0,
        },
      ],
    };

    const history = mockHistory[supplierName] || [];

    return {
      success: true,
      data: {
        supplier: supplierName,
        products: history,
        summary: {
          total_products: history.length,
          total_value: history.reduce(
            (sum, product) => sum + product.total_value,
            0
          ),
          total_current_stock: history.reduce(
            (sum, product) => sum + product.current_stock,
            0
          ),
        },
      },
    };
  }

  console.log("🔄 getSupplierHistory called - using backend mode");

  try {
    // Get all products from this supplier
    const { data: products, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select(
        `
        id,
        name,
        category,
        total_stock,
        cost_price,
        selling_price,
        created_at,
        updated_at
      `
      )
      .eq("supplier", supplierName)
      .eq("is_active", true)
      .order("name");

    if (error) throw error;

    // Calculate summary statistics
    const summary = {
      total_products: products.length,
      total_value: products.reduce(
        (sum, product) => sum + product.cost_price * product.total_stock,
        0
      ),
      total_current_stock: products.reduce(
        (sum, product) => sum + product.total_stock,
        0
      ),
    };

    // Transform data for frontend
    const transformedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      total_supplied: product.total_stock, // In real scenario, this would come from stock movements
      current_stock: product.total_stock,
      last_supply_date: product.updated_at.split("T")[0],
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      total_value: product.cost_price * product.total_stock,
    }));

    return {
      success: true,
      data: {
        supplier: supplierName,
        products: transformedProducts,
        summary,
      },
    };
  } catch (error) {
    console.error("Error fetching supplier history:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}

// Get contact by ID
export async function getContact(contactId) {
  if (await isMockMode()) {
    console.log("🔧 getContact called - using mock mode");

    const allContacts = [...mockSuppliers, ...mockEmployees];
    const contact = allContacts.find(
      (c) => c.id === parseInt(contactId) || c.id === contactId
    );

    if (!contact) {
      return {
        success: false,
        error: "Contact not found",
        data: null,
      };
    }

    return {
      success: true,
      data: contact,
    };
  }

  console.log("🔄 getContact called - using backend mode");

  try {
    // In a real implementation, you would query a contacts table
    // For now, we'll simulate by checking if it's a supplier or employee

    if (contactId.toString().startsWith("supplier_")) {
      const supplierName = contactId
        .replace("supplier_", "")
        .replace(/_/g, " ");
      const mockSupplier = mockSuppliers.find((s) => s.name === supplierName);

      if (mockSupplier) {
        return {
          success: true,
          data: {
            ...mockSupplier,
            id: contactId,
            name: supplierName,
          },
        };
      }
    } else {
      // Check employees
      const employee = mockEmployees.find((e) => e.id === parseInt(contactId));
      if (employee) {
        return {
          success: true,
          data: employee,
        };
      }
    }

    return {
      success: false,
      error: "Contact not found",
      data: null,
    };
  } catch (error) {
    console.error("Error fetching contact:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}

// Create new contact
export async function createContact(contactData) {
  if (await isMockMode()) {
    console.log("🔧 createContact called - using mock mode");

    const newContact = {
      id: Date.now(),
      ...contactData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return {
      success: true,
      data: newContact,
      message: "Contact created successfully",
    };
  }

  console.log("🔄 createContact called - using backend mode");

  try {
    // In a real implementation, you would insert into a contacts table
    // For now, we'll simulate success

    const newContact = {
      id: `${contactData.type}_${Date.now()}`,
      ...contactData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return {
      success: true,
      data: newContact,
      message: "Contact created successfully",
    };
  } catch (error) {
    console.error("Error creating contact:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}

// Update existing contact
export async function updateContact(contactId, contactData) {
  if (await isMockMode()) {
    console.log("🔧 updateContact called - using mock mode");

    const updatedContact = {
      id: contactId,
      ...contactData,
      updated_at: new Date().toISOString(),
    };

    return {
      success: true,
      data: updatedContact,
      message: "Contact updated successfully",
    };
  }

  console.log("🔄 updateContact called - using backend mode");

  try {
    // In a real implementation, you would update the contacts table
    // For now, we'll simulate success

    const updatedContact = {
      id: contactId,
      ...contactData,
      updated_at: new Date().toISOString(),
    };

    return {
      success: true,
      data: updatedContact,
      message: "Contact updated successfully",
    };
  } catch (error) {
    console.error("Error updating contact:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
}

// Delete contact
export async function deleteContact(contactId) {
  if (await isMockMode()) {
    console.log(
      "🔧 deleteContact called - using mock mode, contactId:",
      contactId
    );

    return {
      success: true,
      message: "Contact deleted successfully",
    };
  }

  console.log(
    "🔄 deleteContact called - using backend mode, contactId:",
    contactId
  );

  try {
    // In a real implementation, you would delete from contacts table
    // For now, we'll simulate success

    return {
      success: true,
      message: "Contact deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting contact:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Get contact statistics
export async function getContactStatistics() {
  if (await isMockMode()) {
    console.log("🔧 getContactStatistics called - using mock mode");

    return {
      success: true,
      data: {
        total_suppliers: mockSuppliers.length,
        total_employees: mockEmployees.length,
        active_suppliers: mockSuppliers.filter((s) => s.is_active).length,
        active_employees: mockEmployees.filter((e) => e.is_active).length,
        total_contacts: mockSuppliers.length + mockEmployees.length,
      },
    };
  }

  console.log("🔄 getContactStatistics called - using backend mode");

  try {
    // Get unique suppliers count
    const { data: suppliers, error: suppliersError } = await supabase
      .from(TABLES.PRODUCTS)
      .select("supplier")
      .not("supplier", "is", null)
      .not("supplier", "eq", "");

    if (suppliersError) throw suppliersError;

    const uniqueSuppliers = new Set(suppliers.map((p) => p.supplier));

    return {
      success: true,
      data: {
        total_suppliers: uniqueSuppliers.size,
        total_employees: mockEmployees.length, // Using mock data for employees
        active_suppliers: uniqueSuppliers.size,
        active_employees: mockEmployees.filter((e) => e.is_active).length,
        total_contacts: uniqueSuppliers.size + mockEmployees.length,
      },
    };
  } catch (error) {
    console.error("Error fetching contact statistics:", error);
    return {
      success: false,
      error: error.message,
      data: {
        total_suppliers: 0,
        total_employees: 0,
        active_suppliers: 0,
        active_employees: 0,
        total_contacts: 0,
      },
    };
  }
}
