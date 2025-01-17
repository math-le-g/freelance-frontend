
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import PaymentModal from '../components/PaymentModal';
import { toast } from 'react-toastify';

const SuiviPaiements = () => {
  const [factures, setFactures] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` }
      };

      const [facturesRes, statsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/api/factures`, config),
        axios.get(`${process.env.REACT_APP_API_URL}/api/factures/statistiques`, config)
      ]);

      setFactures(facturesRes.data);
      setStats(statsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données.');
      setLoading(false);
    }
  };


  const handlePaiement = (factureId, method) => {
    setSelectedInvoiceId(factureId);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (paymentData) => {
    try {
      const token = localStorage.getItem('token');
      toast.info('Enregistrement du paiement...', { autoClose: 1500 });

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/factures/${selectedInvoiceId}/paiement`,
        paymentData,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      await fetchData();
      setIsPaymentModalOpen(false);
      toast.success('Paiement enregistré avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement du paiement');
      console.error('Erreur lors de l\'enregistrement du paiement:', error);
    }
  };

  const getStatutLabel = (facture) => {
    switch (facture.status) {
      case 'paid':
        return <span className="text-green-600">Payée</span>;
      case 'overdue':
        return <span className="text-red-600">En retard</span>;
      default:
        return <span className="text-yellow-600">En attente</span>;
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="container mx-auto p-4">
      {/* Statistiques globales */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Factures en attente</h3>
          <p className="text-2xl">{stats.unpaid?.count || 0}</p>
          <p className="text-gray-600">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.unpaid?.total || 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Factures en retard</h3>
          <p className="text-2xl text-red-600">{stats.overdue?.count || 0}</p>
          <p className="text-gray-600">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.overdue?.total || 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Factures payées</h3>
          <p className="text-2xl text-green-600">{stats.paid?.count || 0}</p>
          <p className="text-gray-600">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.paid?.total || 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Général</h3>
          <p className="text-2xl">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(stats.total || 0)}</p>
        </div>
      </div>

      {/* Liste des factures */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                N° Facture
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date d'édition
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brut (€)
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                URSSAF (€)
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net (€)
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {factures.map(facture => (
              <tr key={facture._id} className="hover:bg-gray-100">
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {facture.invoiceNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {facture.dateEdition ? format(new Date(facture.dateEdition), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {facture.client?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(facture.brut || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(facture.urssaf || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(facture.net || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {getStatutLabel(facture)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {facture.status !== 'paid' && (
                    <div className="flex justify-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`payment-${facture._id}`}
                          value="virement"
                          onChange={() => handlePaiement(facture._id, 'virement')}
                          className="mr-2"
                        />
                        Virement
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`payment-${facture._id}`}
                          value="cheque"
                          onChange={() => handlePaiement(facture._id, 'cheque')}
                          className="mr-2"
                        />
                        Chèque
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`payment-${facture._id}`}
                          value="especes"
                          onChange={() => handlePaiement(facture._id, 'especes')}
                          className="mr-2"
                        />
                        Espèces
                      </label>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  );
};

export default SuiviPaiements;

