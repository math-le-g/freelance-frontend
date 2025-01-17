// frontend/src/contexts/InvoiceContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axios-config';

const InvoiceContext = createContext();

export const InvoiceProvider = ({ children }) => {
  const [selectedInvoiceClient, setSelectedInvoiceClient] = useState(null);
  const [selectedInvoiceMonth, setSelectedInvoiceMonth] = useState('');
  const [filteredPrestations, setFilteredPrestations] = useState([]);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(null);
  const [billingSettings, setBillingSettings] = useState({
    invoiceTitle: '',
    businessName: '',
    businessAddress: '',
    businessPostalCode: '',
    businessCity: '',
    businessPhone: '',
    businessEmail: '',
    businessSIRET: '',
    businessType: '',
    currentInvoiceNumber: 0,
  });

  const fetchNextInvoiceNumber = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const [businessInfoResponse, lastNumberResponse] = await Promise.all([
        axios.get('/business-info/'),
        axios.get('/factures/last-number'),
      ]);
      const startNumber = businessInfoResponse.data.invoiceNumberStart || 1;
      const lastNumber = lastNumberResponse.data.lastInvoiceNumber || 0;
      setNextInvoiceNumber(Math.max(startNumber, lastNumber + 1));
    } catch (error) {
      console.error('Erreur lors de la récupération du numéro de facture', error);
    }
  };

  useEffect(() => {
    fetchNextInvoiceNumber();
  }, [selectedInvoiceClient]);

  const value = {
    selectedInvoiceClient,
    setSelectedInvoiceClient,
    selectedInvoiceMonth,
    setSelectedInvoiceMonth,
    filteredPrestations,
    setFilteredPrestations,
    nextInvoiceNumber,
    setNextInvoiceNumber,
    billingSettings,
    setBillingSettings,
    fetchNextInvoiceNumber,
  };

  return <InvoiceContext.Provider value={value}>{children}</InvoiceContext.Provider>;
};

export const useInvoice = () => {
  const context = useContext(InvoiceContext);
  if (!context) throw new Error('useInvoice must be used within an InvoiceProvider');
  return context;
};



