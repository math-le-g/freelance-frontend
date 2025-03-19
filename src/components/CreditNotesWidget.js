// frontend/src/components/CreditNotesWidget.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';

const CreditNotesWidget = () => {
  const [creditNotes, setCreditNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const fetchCreditNotes = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/factures/avoirs`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data && Array.isArray(response.data)) {
          setCreditNotes(response.data);
          
          // Calculer le total des avoirs
          const total = response.data.reduce((sum, item) => sum + (item.avoir?.montant || 0), 0);
          setTotalAmount(total);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des avoirs:', error);
        toast.error('Erreur lors du chargement des avoirs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreditNotes();
  }, []);

  if (isLoading) {
    return <div className="text-center p-4 text-gray-300">Chargement des avoirs...</div>;
  }

  if (creditNotes.length === 0) {
    return (
      <div className="bg-white/10 border border-white/20 rounded-lg p-4">
        <div className="flex items-center text-white mb-3">
          <BanknotesIcon className="h-5 w-5 text-pink-400 mr-2" />
          <h3 className="text-lg font-medium">Avoirs émis</h3>
        </div>
        <div className="text-gray-300 text-center py-10">
          Aucun avoir n'a été émis
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 border border-white/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-white">
          <BanknotesIcon className="h-5 w-5 text-pink-400 mr-2" />
          <h3 className="text-lg font-medium">Avoirs émis</h3>
        </div>
        <div className="text-pink-300 font-bold">
          Total: {totalAmount.toFixed(2)} €
        </div>
      </div>
      
      <div className="overflow-hidden overflow-y-auto max-h-64">
        <table className="min-w-full">
          <thead className="bg-white/10">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Avoir
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Facture
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                Montant
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {creditNotes.map((item) => (
              <tr key={item._id} className="hover:bg-white/5">
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                  {format(new Date(item.avoir.date), 'dd/MM/yyyy', { locale: fr })}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                  {item.avoir.numero}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                  #{item.invoiceNumber}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-medium text-pink-300">
                  {item.avoir.montant.toFixed(2)} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CreditNotesWidget;