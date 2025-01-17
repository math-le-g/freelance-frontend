// frontend/src/components/FactureList.js

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Eye,
  Download,
  Grid as GridIcon,
  List as ListIcon,
  Trash2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import Modal from './Modal';
import HistoriqueFacture from './HistoriqueFacture';
import PaymentModal from './PaymentModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const FactureList = () => {
  const [filteredFactures, setFilteredFactures] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [filters, setFilters] = useState({
    client: '',
    selectedMonthYear: null,
    status: '',
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc',
  });

  // Payment States
  const [isPaymentModalOpenPaymentList, setIsPaymentModalOpenPaymentList] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  // --- Récupération des factures ---
  const fetchFactures = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {};

      if (filters.selectedMonthYear) {
        const year = filters.selectedMonthYear.getFullYear();
        const month = filters.selectedMonthYear.getMonth() + 1;
        params.year = year;
        params.month = month;
      }
      if (filters.client) {
        params.clientId = filters.client;
      }
      if (filters.status) {
        params.status = filters.status;
      }

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/factures`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setFilteredFactures(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des factures :', error);
      toast.error('Erreur lors du chargement des factures');
    }
  }, [filters]);

  // Récupération des clients pour le filtre
  const fetchClients = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(resp.data);
    } catch (error) {
      console.error('Erreur fetch clients:', error);
      toast.error('Erreur lors de la récupération des clients');
    }
  }, []);

  useEffect(() => {
    fetchFactures();
    fetchClients();
  }, [fetchFactures, fetchClients]);

  // Tri
  const handleSort = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });

    const sorted = [...filteredFactures].sort((a, b) => {
      if (key === 'date') {
        return direction === 'asc'
          ? new Date(b.createdAt) - new Date(a.createdAt)
          : new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (key === 'invoiceNumber') {
        return direction === 'asc'
          ? a.invoiceNumber.localeCompare(b.invoiceNumber)
          : b.invoiceNumber.localeCompare(a.invoiceNumber);
      }
      return 0;
    });

    setFilteredFactures(sorted);
  };

  const handleMarkAsPaid = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    setIsPaymentModalOpenPaymentList(true);
  };

  const handlePaymentSubmit = async (paymentData) => {
    try {
      const token = localStorage.getItem('token');
      toast.info('Enregistrement du paiement...', { autoClose: 1500 });

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/factures/${selectedInvoiceId}/paiement`,
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      await fetchFactures();
      setIsPaymentModalOpenPaymentList(false);
      toast.success('Paiement enregistré avec succès');
    } catch (error) {
      console.error('Erreur paiement:', error);
      toast.error('Erreur lors de l\'enregistrement du paiement');
    }
  };

  // Preview PDF
  const handlePreview = async (facture) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/factures/${facture._id}/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Erreur lors de la récupération du PDF');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setSelectedFacture(facture);
      setIsPreviewModalOpen(true);
    } catch (error) {
      toast.error('Erreur lors de la prévisualisation');
    }
  };

  // Download PDF
  const handleDownload = async (facture) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/factures/${facture._id}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Erreur PDF');
      const pdfBlob = await response.blob();

      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      const clientName = (facture.client && facture.client.name) || facture.client;
      const fileName = `Facture_${clientName}_${format(new Date(facture.dateFacture), 'MMMM_yyyy', { locale: fr }).toLowerCase()}.pdf`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);
    } catch (error) {
      toast.error('Erreur lors du téléchargement du PDF');
    }
  };

  // Supprimer
  const handleDeleteFacture = async (factureId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Session expirée');
        return;
      }
      const confirmDelete = window.confirm(
        'Voulez-vous vraiment supprimer cette facture ?'
      );
      if (!confirmDelete) return;

      await axios.delete(`${process.env.REACT_APP_API_URL}/api/factures/${factureId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Facture supprimée');
      setFilteredFactures((prevFactures) =>
        prevFactures.filter((facture) => facture._id !== factureId)
      );
    } catch (error) {
      console.error('Erreur suppression facture:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Fonction utilitaire pour tronquer le texte
const truncateText = (text, maxLength) =>
  text && text.length > maxLength ? text.substring(0, maxLength) + '...' : text || '';

/* --- ListView --- */
const ListView = () => (
  <table className="min-w-full bg-white">
    <thead className="bg-gray-50">
      <tr>
        <th
          className="px-4 py-2 text-center cursor-pointer"
          onClick={() => handleSort('invoiceNumber')}
        >
          N° Facture
        </th>
        <th
          className="px-4 py-2 text-center cursor-pointer"
          onClick={() => handleSort('date')}
        >
          Date d'édition
        </th>
        <th className="px-4 py-2 text-center">Client</th>
        <th className="px-4 py-2 text-center">Brut (€)</th>
        <th className="px-4 py-2 text-center">URSSAF (€)</th>
        <th className="px-4 py-2 text-center">Net (€)</th>
        <th className="px-4 py-2 text-center whitespace-nowrap">Statut</th>
        <th className="px-4 py-2 text-center">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {filteredFactures.map((facture) => (
        <tr key={facture._id} className="hover:bg-gray-50">
          <td className="px-4 py-2 text-center">{facture.invoiceNumber}</td>
          <td className="px-4 py-2 text-center">
            {facture.dateEdition
              ? format(new Date(facture.dateEdition), 'dd/MM/yyyy', { locale: fr })
              : format(new Date(facture.createdAt), 'dd/MM/yyyy', { locale: fr })}
          </td>
          <td
            className="px-4 py-2 text-center w-68"
            // On utilise 'truncateText' pour afficher une version abrégée,
            // et l'attribut title pour afficher le nom complet au survol.
            title={facture.client?.name || 'N/A'}
          >
            {truncateText(facture.client?.name, 80)}
          </td>
          <td className="px-4 py-2 text-center">
            {facture.montantHT
              ? new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(facture.montantHT)
              : 'N/A'}
          </td>
          <td className="px-4 py-2 text-center">
            {facture.taxeURSSAF
              ? new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(facture.taxeURSSAF)
              : 'N/A'}
          </td>
          <td className="px-4 py-2 text-center">
            {facture.montantNet
              ? new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(facture.montantNet)
              : 'N/A'}
          </td>
          <td className="px-4 py-2 text-center whitespace-nowrap">
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                facture.status === 'paid'
                  ? 'bg-green-500'
                  : facture.status === 'overdue'
                  ? 'bg-red-500'
                  : 'bg-orange-500'
              } text-white truncate`}
            >
              {facture.status === 'paid'
                ? 'Payée'
                : facture.status === 'overdue'
                ? 'En retard'
                : 'En attente'}
            </span>
          </td>
          <td className="px-4 py-2 text-center">
            <div className="flex justify-center items-center space-x-2">
              {/* Icône Aperçu PDF */}
              <Eye
                className="h-5 w-5 text-blue-600 hover:text-blue-900 cursor-pointer flex-shrink-0"
                onClick={() => handlePreview(facture)}
              />
              {/* Icône Télécharger PDF */}
              <Download
                className="h-5 w-5 text-green-600 hover:text-green-900 cursor-pointer flex-shrink-0"
                onClick={() => handleDownload(facture)}
              />
              {facture.status === 'unpaid' && (
                <>
                  {/* Marquer payée */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 hover:text-green-700 cursor-pointer flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    onClick={() => handleMarkAsPaid(facture._id)}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {/* Lien Rectifier */}
                  <Link
                    to={`/rectify-facture/${facture._id}`}
                    className="text-yellow-600 hover:text-yellow-800 flex-shrink-0"
                  >
                    Rectifier
                  </Link>
                  {/* Bouton Supprimer */}
                  <button
                    onClick={() => handleDeleteFacture(facture._id)}
                    className="text-red-600 hover:text-red-800 cursor-pointer flex-shrink-0"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);



  // --- GridView ---
  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredFactures.map((facture) => (
        <div
          key={facture._id}
          className="bg-white p-4 rounded-lg shadow hover:shadow-md"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold">Facture N°{facture.invoiceNumber}</h3>
              <p className="text-sm text-gray-600">
                {facture.dateEdition
                  ? format(new Date(facture.dateEdition), 'dd MMM yyyy', {
                    locale: fr,
                  })
                  : format(new Date(facture.createdAt), 'dd MMM yyyy', {
                    locale: fr,
                  })}
              </p>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs ${facture.status === 'paid'
                ? 'bg-green-500'
                : facture.status === 'overdue'
                  ? 'bg-red-500'
                  : 'bg-orange-500'
                } text-white`}
            >
              {facture.status === 'paid'
                ? 'Payée'
                : facture.status === 'overdue'
                  ? 'En retard'
                  : 'En attente'}
            </span>
          </div>
          <p className="font-medium text-center">{facture.client?.name || 'N/A'}</p>
          <p className="text-lg font-bold mt-2 text-center">
            {facture.montantTTC
              ? new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              }).format(facture.montantTTC)
              : 'N/A'}
          </p>

          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={() => handlePreview(facture)}
              className="text-blue-600 hover:text-blue-900"
            >
              <Eye className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleDownload(facture)}
              className="text-green-600 hover:text-green-900"
            >
              <Download className="h-5 w-5" />
            </button>
            {facture.status === 'unpaid' && (
              <>
                <button
                  onClick={() => handleMarkAsPaid(facture._id)}
                  className="text-green-600 hover:text-green-800"
                >
                  Payée
                </button>
                <Link
                  to={`/rectify-facture/${facture._id}`}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  Rectifier
                </Link>
                <button
                  onClick={() => handleDeleteFacture(facture._id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Filtre client */}
          <select
            value={filters.client}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, client: e.target.value }))
            }
            className="border rounded p-2"
          >
            <option value="">Tous les clients</option>
            {clients.map((client) => (
              <option key={client._id} value={client._id}>
                {client.name}
              </option>
            ))}
          </select>
          {/* Mois-année */}
          <DatePicker
            selected={filters.selectedMonthYear}
            onChange={(date) =>
              setFilters((prev) => ({ ...prev, selectedMonthYear: date }))
            }
            dateFormat="MMMM yyyy"
            showMonthYearPicker
            locale={fr}
            placeholderText="Sélectionner un mois/année"
            className="border rounded p-2 w-full"
          />
          {/* Filtre statut */}
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
            className="border rounded p-2"
          >
            <option value="">Tous les statuts</option>
            <option value="unpaid">En attente</option>
            <option value="paid">Payées</option>
            <option value="overdue">En retard</option>
          </select>
          <div className="flex justify-end">
            <button
              onClick={() =>
                setViewMode((prev) => (prev === 'list' ? 'grid' : 'list'))
              }
              className="p-2 border rounded hover:bg-gray-100"
            >
              {viewMode === 'list' ? <GridIcon /> : <ListIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* Affichage */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {viewMode === 'list' ? <ListView /> : <GridView />}
      </div>

      {/* Modal Preview PDF */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        className="max-w-7xl w-11/12"
      >
        {selectedFacture && (
          <div className="flex flex-col h-[85vh]">
            {/* En-tête du Modal */}
            <div className="pb-4 mb-4 border-b flex items-center">
              <h2 className="text-2xl font-semibold text-gray-800 flex-1">
                Facture N°{selectedFacture.invoiceNumber}
              </h2>
              <button
                onClick={() => handleDownload(selectedFacture)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors mr-8"
              >
                <Download className="h-5 w-5" />
                <span>Télécharger</span>
              </button>
            </div>

            {/* Contenu du Modal */}
            <div className="flex flex-1 gap-6 min-h-0">
              {/* Prévisualisation PDF - prend 60% de l'espace */}
              <div className="w-3/5 bg-gray-50 rounded-lg overflow-hidden">
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  className="pdf-viewer"
                  type="application/pdf"
                  title={`Facture ${selectedFacture.invoiceNumber}`}
                />
              </div>

              {/* Historique de la Facture - prend 40% de l'espace */}
              <div className="w-2/5 overflow-y-auto">
                <HistoriqueFacture facture={selectedFacture} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* PaymentModal */}
      <PaymentModal
        isOpen={isPaymentModalOpenPaymentList}
        onClose={() => setIsPaymentModalOpenPaymentList(false)}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  );
};

export default FactureList;

