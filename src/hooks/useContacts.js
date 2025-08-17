import { useState, useEffect, useCallback } from 'react';
import { 
  getContacts, 
  getSupplierHistory, 
  getContact, 
  getContactStatistics 
} from '../services/contactService';
import { useNotification } from './useNotification';

export const useContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [statistics, setStatistics] = useState({
    total_suppliers: 0,
    total_employees: 0,
    active_suppliers: 0,
    active_employees: 0,
    total_contacts: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();

  // Fetch contacts with filters
  const fetchContacts = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getContacts(filters);
      
      if (result.success) {
        setContacts(result.data);
      } else {
        setError(result.error);
        showNotification(`Failed to load contacts: ${result.error}`, 'error');
      }
    } catch (err) {
      setError(err.message);
      showNotification('Error loading contacts', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Fetch contact statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const result = await getContactStatistics();
      
      if (result.success) {
        setStatistics(result.data);
      }
    } catch (err) {
      console.error('Error fetching contact statistics:', err);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    fetchContacts();
    fetchStatistics();
  }, [fetchContacts, fetchStatistics]);

  return {
    contacts,
    statistics,
    loading,
    error,
    fetchContacts,
    fetchStatistics,
    refetch: () => {
      fetchContacts();
      fetchStatistics();
    }
  };
};

export const useSupplierHistory = (supplierName) => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();

  const fetchHistory = useCallback(async () => {
    if (!supplierName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getSupplierHistory(supplierName);
      
      if (result.success) {
        setHistory(result.data);
      } else {
        setError(result.error);
        showNotification(`Failed to load supplier history: ${result.error}`, 'error');
      }
    } catch (err) {
      setError(err.message);
      showNotification('Error loading supplier history', 'error');
    } finally {
      setLoading(false);
    }
  }, [supplierName, showNotification]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    refetch: fetchHistory
  };
};

export const useContact = (contactId) => {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showNotification } = useNotification();

  const fetchContact = useCallback(async () => {
    if (!contactId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getContact(contactId);
      
      if (result.success) {
        setContact(result.data);
      } else {
        setError(result.error);
        showNotification(`Failed to load contact: ${result.error}`, 'error');
      }
    } catch (err) {
      setError(err.message);
      showNotification('Error loading contact', 'error');
    } finally {
      setLoading(false);
    }
  }, [contactId, showNotification]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  return {
    contact,
    loading,
    error,
    refetch: fetchContact
  };
};
