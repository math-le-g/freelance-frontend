import React, { useEffect, useState, useRef } from 'react'; // Ajout de useRef
import { useInvoice } from '../contexts/InvoiceContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const InvoicePreview = () => {
  const {
    selectedInvoiceClient,
    selectedInvoiceMonth,
    filteredPrestations,
  } = useInvoice();
  const [pdfUrl, setPdfUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const previousPdfUrlRef = useRef(''); // Utilisation de useRef

  useEffect(() => {
    let isMounted = true;

    const fetchPreview = async () => {
      if (!selectedInvoiceClient || !selectedInvoiceMonth || !filteredPrestations.length) {
        setPdfUrl('');
        return;
      }

      setIsLoading(true);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Session expirée. Veuillez vous reconnecter.');
          return;
        }

        const [year, month] = selectedInvoiceMonth.split('-');

        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/factures/preview`,
          {
            clientId: selectedInvoiceClient._id,
            year: parseInt(year),
            month: parseInt(month)
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            responseType: 'blob'
          }
        );

        if (isMounted) {
          // Nettoyer l'ancien URL
          if (previousPdfUrlRef.current) {
            URL.revokeObjectURL(previousPdfUrlRef.current);
          }

          const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
          const newPdfUrl = URL.createObjectURL(pdfBlob);
          setPdfUrl(newPdfUrl);
          previousPdfUrlRef.current = newPdfUrl; // Mettre à jour le ref
        }
      } catch (error) {
        console.error('Erreur aperçu:', error);
        if (isMounted) {
          toast.error('Erreur lors de la génération de l\'aperçu');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
      if (previousPdfUrlRef.current) {
        URL.revokeObjectURL(previousPdfUrlRef.current);
      }
    };
  }, [selectedInvoiceClient, selectedInvoiceMonth, filteredPrestations]);

  if (!selectedInvoiceClient || !selectedInvoiceMonth) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Sélectionnez un client et un mois pour voir l'aperçu</p>
      </div>
    );
  }

  if (filteredPrestations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Aucune prestation pour cette période</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <p>Chargement de l'aperçu...</p>
        </div>
      ) : pdfUrl ? (
        <iframe
          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
          className="pdf-viewer"
          type="application/pdf"
          title="Aperçu de la facture"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p>Erreur de chargement</p>
        </div>
      )}
    </div>
  );
};

export default InvoicePreview;
