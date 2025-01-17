
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';

const MesFactures = () => {
  const [factures, setFactures] = useState([]);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState('');
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // États pour les filtres
  const [clientFilter, setClientFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Préparer les paramètres de filtre
        const params = {};
        if (clientFilter) params.clientId = clientFilter;
        if (monthFilter) {
          const [year, month] = monthFilter.split('-');
          params.year = year;
          params.month = month;
        }
        if (statusFilter) params.status = statusFilter;

        // Récupérer les factures avec les filtres
        const responseFactures = await axios.get('http://localhost:5000/api/factures', { params });
        console.log('Factures récupérées:', responseFactures.data);
        setFactures(responseFactures.data);

        // Récupérer les clients pour le filtre
        const responseClients = await axios.get('http://localhost:5000/api/clients', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setClients(responseClients.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des données', error);
        toast.error('Erreur lors de la récupération des données.');
      }
    };

    fetchData();
  }, [clientFilter, monthFilter, statusFilter]);

  const handleViewPdf = async (facture) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/factures/${facture._id}/pdf`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const pdfUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setSelectedPdfUrl(pdfUrl);
      setSelectedFacture(facture);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Erreur lors de la récupération du PDF:', error);
      toast.error('Erreur lors de la récupération du PDF.');
    }
  };

  const handleDownloadPdf = async (facture) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/factures/${facture._id}/pdf`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      // Construire le nom de fichier souhaité avec le nom du client et le mois en minuscules
      const fileName = `Facture_${facture.client.name}_${format(new Date(facture.dateFacture), 'MMMM_yyyy', { locale: fr }).toLowerCase()}.pdf`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement du PDF:', error);
      toast.error('Erreur lors du téléchargement du PDF.');
    }
  };
  

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-semibold mb-4">Mes Factures</h2>

      {/* Filtres */}
      <div className="flex flex-wrap space-x-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Client</label>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md"
          >
            <option value="">Tous les clients</option>
            {clients.map((client) => (
              <option key={client._id} value={client._id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mois</label>
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Statut</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md"
          >
            <option value="">Tous les statuts</option>
            <option value="unpaid">Non payée</option>
            <option value="paid">Payée</option>
            <option value="overdue">En retard</option>
          </select>
        </div>
      </div>

      {factures.length === 0 ? (
        <p>Aucune facture disponible.</p>
      ) : (
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-1">Numéro</th>
              <th className="py-1">Client</th>
              <th className="py-1">Date</th>
              <th className="py-1">Montants (€)</th>
              <th className="py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {factures.map((facture) => (
              <tr key={facture._id} className="border-t">
                <td className="py-1 text-center">{facture.invoiceNumber}</td>
                <td className="py-1 text-center">{facture.client.name}</td>
                <td className="py-1 text-center">
                  {format(new Date(facture.createdAt), 'dd MMM yyyy', { locale: fr })}
                </td>
                <td className="py-1 text-center text-sm">
                  <span title="Montant Brut">{facture.montantHT.toFixed(2)} €</span> |{' '}
                  <span title="Taxe URSSAF">{facture.taxeURSSAF.toFixed(2)} €</span> |{' '}
                  <span title="Montant Net">{facture.montantNet.toFixed(2)} €</span>
                </td>
                <td className="py-1 text-center">
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => handleViewPdf(facture)}
                      title="Visualiser"
                      className="inline-flex items-center mx-1"
                    >
                      <EyeIcon className="h-5 w-5 text-blue-500 hover:text-blue-700" />
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(facture)}
                      title="Télécharger"
                      className="inline-flex items-center mx-1"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5 text-green-500 hover:text-green-700" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal de prévisualisation du PDF */}
      <PDFPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        pdfUrl={selectedPdfUrl}
        facture={selectedFacture}
      />
    </div>
  );
};

export default MesFactures;
