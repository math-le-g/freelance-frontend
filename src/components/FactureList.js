// frontend/src/components/FactureList.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import RectificationIntroModal from './RectificationIntroModal';
import RectificationBadge from './RectificationBadge';


// Modal de prévisualisation PDF
import PDFPreviewModal from './PDFPreviewModal';
import PaymentModal from './PaymentModal';

// Icônes Heroicons
import {
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  Squares2X2Icon,
  Bars3Icon,
  CheckIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

const FactureList = () => {
  const navigate = useNavigate();

  // Données
  const [factures, setFactures] = useState([]);
  const [clients, setClients] = useState([]);

  // Filtres
  const [filters, setFilters] = useState({
    client: '',
    selectedMonthYear: null,
    status: '',
    type: '',
  });

  // Vue liste / grille
  const [viewMode, setViewMode] = useState('list');

  // Preview PDF
  const [pdfUrl, setPdfUrl] = useState('');
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Paiement
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [isPaymentModalOpenPaymentList, setIsPaymentModalOpenPaymentList] = useState(false);

  const [isRectificationModalOpen, setIsRectificationModalOpen] = useState(false);
  const [selectedFactureForRectification, setSelectedFactureForRectification] = useState(null);


  // Tri
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc',
  });

  // ---------- UTILS ----------

  // Tronquer un texte long
  const truncateText = (text, maxLength) =>
    text && text.length > maxLength ? text.substring(0, maxLength) + '...' : text || '';

  // Afficher le statut (avec locked)
  const getStatutLabel = (facture) => {
    if (facture.locked) {
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-gray-600 text-white">
          Verrouillée
        </span>
      );
    }
    switch (facture.status) {
      case 'paid':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-green-500 text-white">
            Payée
          </span>
        );
      case 'overdue':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-red-500 text-white">
            En retard
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-orange-500 text-white">
            En attente
          </span>
        );
    }
  };

  // ---------- FETCHS ----------

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
      if (filters.client) params.clientId = filters.client;
      if (filters.status) params.status = filters.status;

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/factures`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setFactures(response.data);
    } catch (error) {
      console.error('Erreur chargement factures :', error);
      toast.error('Erreur lors du chargement des factures');
    }
  }, [filters]);

  const fetchClients = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(resp.data);
    } catch (error) {
      console.error('Erreur chargement clients :', error);
      toast.error('Erreur lors de la récupération des clients');
    }
  }, []);

  useEffect(() => {
    fetchFactures();
    fetchClients();
  }, [fetchFactures, fetchClients]);

  // ---------- SORT ----------

  const handleSort = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });

    const sorted = [...factures].sort((a, b) => {
      if (key === 'date') {
        // On se base sur createdAt ou dateEdition
        const dateA = a.dateEdition ? new Date(a.dateEdition) : new Date(a.createdAt);
        const dateB = b.dateEdition ? new Date(b.dateEdition) : new Date(b.createdAt);
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      if (key === 'invoiceNumber') {
        return direction === 'asc'
          ? a.invoiceNumber - b.invoiceNumber
          : b.invoiceNumber - a.invoiceNumber;
      }
      return 0;
    });

    setFactures(sorted);
  };

  // ---------- PAIEMENT ----------

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
      console.error('Erreur paiement :', error);
      toast.error('Erreur lors de l’enregistrement du paiement');
    }
  };

  // ---------- PDF PREVIEW ----------

  const handlePreview = async (facture) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/factures/${facture._id}/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setSelectedFacture(facture);
      setIsPreviewModalOpen(true);
    } catch (error) {
      console.error('Erreur prévisualisation PDF :', error);
      toast.error('Erreur lors de la prévisualisation');
    }
  };

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
      const fileName = `Facture_${clientName}_${format(
        new Date(facture.dateFacture || facture.createdAt),
        'MMMM_yyyy',
        { locale: fr }
      ).toLowerCase()}.pdf`;

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(pdfUrl);
    } catch (error) {
      toast.error('Erreur lors du téléchargement du PDF');
    }
  };

  // ---------- SUPPRESSION ----------

  const handleDeleteFacture = async (factureId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Session expirée');
        return;
      }
      const confirmDelete = window.confirm('Voulez-vous vraiment supprimer cette facture ?');
      if (!confirmDelete) return;

      await axios.delete(`${process.env.REACT_APP_API_URL}/api/factures/${factureId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Facture supprimée');
      setFactures((prev) => prev.filter((f) => f._id !== factureId));
    } catch (error) {
      console.error('Erreur suppression facture :', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // ---------- RECTIFICATION (Nouvelle logique) ----------
  const handleRectifyNew = (facture) => {
    setSelectedFactureForRectification(facture);
    setIsRectificationModalOpen(true);
  };

  // ---------- RENDUS ----------

  const ListView = () => (
    <table className="min-w-full text-sm">
      <thead className="bg-white/20 text-gray-100">
        <tr>
          <th
            className="px-4 py-2 text-left cursor-pointer"
            onClick={() => handleSort('invoiceNumber')}
          >
            N° Facture
          </th>
          <th
            className="px-4 py-2 text-left cursor-pointer"
            onClick={() => handleSort('date')}
          >
            Date
          </th>
          <th className="px-4 py-2 text-left">Client</th>
          <th className="px-4 py-2 text-left">Brut (€)</th>
          <th className="px-4 py-2 text-left">URSSAF (€)</th>
          <th className="px-4 py-2 text-left">Net (€)</th>
          <th className="px-4 py-2 text-left">Statut</th>
          <th className="px-4 py-2 text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {factures.map((facture) => {
          const displayDate = facture.dateEdition
            ? format(new Date(facture.dateEdition), 'dd/MM/yyyy', { locale: fr })
            : format(new Date(facture.createdAt), 'dd/MM/yyyy', { locale: fr });

          return (
            <tr
              key={facture._id}
              className="border-b border-white/10 hover:bg-white/5"
            >
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  {facture.invoiceNumber}
                  {facture.isRectification && (
                    <RectificationBadge type="rectification" />
                  )}
                  {facture.statut === 'RECTIFIEE' && (
                    <RectificationBadge type="rectified" />
                  )}
                </div>
              </td>
              <td className="px-4 py-2">{displayDate}</td>
              <td className="px-4 py-2 w-64" title={facture.client?.name || 'N/A'}>
                {truncateText(facture.client?.name, 60)}
              </td>
              <td className="px-4 py-2">{facture.montantHT?.toFixed(2) ?? 'N/A'}</td>
              <td className="px-4 py-2">{facture.taxeURSSAF?.toFixed(2) ?? 'N/A'}</td>
              <td className="px-4 py-2">{facture.montantNet?.toFixed(2) ?? 'N/A'}</td>
              <td className="px-4 py-2">{getStatutLabel(facture)}</td>
              <td className="px-4 py-2 text-center">
                <div className="flex justify-center items-center space-x-2">
                  <EyeIcon
                    className="h-5 w-5 text-indigo-400 hover:text-indigo-600 cursor-pointer"
                    onClick={() => handlePreview(facture)}
                  />
                  <ArrowDownTrayIcon
                    className="h-5 w-5 text-green-400 hover:text-green-600 cursor-pointer"
                    onClick={() => handleDownload(facture)}
                  />

                  {facture.status === 'unpaid' && !facture.locked && (
                    <button
                      onClick={() => handleMarkAsPaid(facture._id)}
                      className="text-green-400 hover:text-green-600"
                      title="Marquer payée"
                    >
                      <CheckIcon className="h-5 w-5" />
                    </button>
                  )}

                  {!facture.locked && !facture.isRectification && (
                    <button
                      onClick={() => handleRectifyNew(facture)}
                      className="text-yellow-400 hover:text-yellow-600"
                      title="Rectifier cette facture"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  )}

                  {!facture.locked && facture.status !== 'paid' && (
                    <button
                      onClick={() => handleDeleteFacture(facture._id)}
                      className="text-red-400 hover:text-red-600"
                      title="Supprimer la facture"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
      {factures.map((facture) => {
        const displayDate = facture.dateEdition
          ? format(new Date(facture.dateEdition), 'dd MMM yyyy', { locale: fr })
          : format(new Date(facture.createdAt), 'dd MMM yyyy', { locale: fr });

        return (
          <div
            key={facture._id}
            className="bg-white/10 border border-white/10 p-4 rounded-md shadow-sm hover:bg-white/5"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-col items-start">
                <h3 className="font-bold text-gray-100">
                  Facture N°{facture.invoiceNumber}
                </h3>
                {(facture.isRectification || facture.statut === 'RECTIFIEE') && (
                  <div className="mt-1">
                    {facture.isRectification && (
                      <RectificationBadge type="rectification" />
                    )}
                    {facture.statut === 'RECTIFIEE' && (
                      <RectificationBadge type="rectified" />
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-300">{displayDate}</p>
              </div>
              {getStatutLabel(facture)}
            </div>

            <p className="font-medium text-center text-gray-100 mb-2">
              {facture.client?.name || 'N/A'}
            </p>
            <p className="text-lg font-bold text-center mb-3 text-gray-50">
              {facture.montantTTC ? `${facture.montantTTC.toFixed(2)} €` : 'N/A'}
            </p>

            <div className="flex justify-center space-x-3">
              <EyeIcon
                className="h-5 w-5 text-indigo-400 hover:text-indigo-600 cursor-pointer"
                onClick={() => handlePreview(facture)}
              />
              <ArrowDownTrayIcon
                className="h-5 w-5 text-green-400 hover:text-green-600 cursor-pointer"
                onClick={() => handleDownload(facture)}
              />

              {facture.status === 'unpaid' && !facture.locked && (
                <button
                  onClick={() => handleMarkAsPaid(facture._id)}
                  className="text-green-400 hover:text-green-600"
                  title="Marquer payée"
                >
                  <CheckIcon className="h-5 w-5" />
                </button>
              )}

              {!facture.locked && !facture.isRectification && (
                <button
                  onClick={() => handleRectifyNew(facture)}
                  className="text-yellow-400 hover:text-yellow-600"
                  title="Rectifier cette facture"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
              )}

              {!facture.locked && facture.status !== 'paid' && (
                <button
                  onClick={() => handleDeleteFacture(facture._id)}
                  className="text-red-400 hover:text-red-600"
                  title="Supprimer la facture"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="container mx-auto pt-20 px-6 pb-8 text-gray-100">
      <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-md shadow-sm p-6 space-y-6">
        <h2 className="text-2xl font-semibold">Mes Factures</h2>

        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-4 bg-white/5 border border-white/10 rounded-md p-4">
          {/* Choix du client */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Client
            </label>
            <select
              value={filters.client}
              onChange={(e) => setFilters((prev) => ({ ...prev, client: e.target.value }))}
              className="border rounded p-2 text-gray-900"
            >
              <option value="">Tous</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mois-année */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Mois/Année
            </label>
            <DatePicker
              selected={filters.selectedMonthYear}
              onChange={(date) => setFilters((prev) => ({ ...prev, selectedMonthYear: date }))}
              dateFormat="MMMM yyyy"
              showMonthYearPicker
              locale={fr}
              placeholderText="Sélectionnez le mois/année"
              className="border rounded p-2 text-gray-900"
            />
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Statut
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="border rounded p-2 text-gray-900"
            >
              <option value="">Tous les statuts</option>
              <option value="unpaid">En attente</option>
              <option value="paid">Payées</option>
              <option value="overdue">En retard</option>
            </select>
          </div>

          {/* Type de facture (nouveau filtre) */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Type
            </label>
            <select
              value={filters.type || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
              className="border rounded p-2 text-gray-900"
            >
              <option value="">Tous les types</option>
              <option value="original">Factures originales</option>
              <option value="rectification">Factures rectificatives</option>
            </select>
          </div>

          {/* Bouton switch vue */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className="p-2 border rounded hover:bg-white/10 transition-colors"
            >
              {viewMode === 'list' ? <Squares2X2Icon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Listing */}
        <div className="bg-white/10 border border-white/10 rounded-md overflow-hidden">
          {viewMode === 'list' ? <ListView /> : <GridView />}
        </div>
      </div>

      {/* MODAL : Preview PDF */}
      <PDFPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        pdfUrl={pdfUrl}
        facture={selectedFacture}
        onDownload={handleDownload}
      />

      {/* MODAL : Payment */}
      <PaymentModal
        isOpen={isPaymentModalOpenPaymentList}
        onClose={() => setIsPaymentModalOpenPaymentList(false)}
        onSubmit={handlePaymentSubmit}
      />

      <RectificationIntroModal
        isOpen={isRectificationModalOpen}
        onClose={() => {
          setIsRectificationModalOpen(false);
          setSelectedFactureForRectification(null);
        }}
        invoiceNumber={selectedFactureForRectification?.invoiceNumber}
        factureId={selectedFactureForRectification?._id}
      />
    </div>
  );
};

export default FactureList;






/*
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import PDFPreviewModal from './PDFPreviewModal';
import PaymentModal from './PaymentModal';

// Import Heroicons
import {
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  Squares2X2Icon,
  Bars3Icon,
  CheckIcon,
} from '@heroicons/react/24/outline';

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
  const [isPaymentModalOpenPaymentList, setIsPaymentModalOpenPaymentList] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const truncateText = (text, maxLength) =>
    text && text.length > maxLength ? text.substring(0, maxLength) + '...' : text || '';

  // Fonction pour afficher le statut
  const getStatutLabel = (facture) => {
    switch (facture.status) {
      case 'paid':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-green-500 text-white">
            Payée
          </span>
        );
      case 'overdue':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-red-500 text-white">
            En retard
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-orange-500 text-white">
            En attente
          </span>
        );
    }
  };

  // Fetch Factures
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
      if (filters.client) params.clientId = filters.client;
      if (filters.status) params.status = filters.status;
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

  // Fetch Clients
  const fetchClients = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(resp.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des clients :', error);
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
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
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

  // Marquer comme payée
  const handleMarkAsPaid = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    setIsPaymentModalOpenPaymentList(true);
  };

  // Payment submit
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
      toast.error("Erreur lors de l'enregistrement du paiement");
    }
  };

  // Prévisualiser PDF
  const handlePreview = async (facture) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/factures/${facture._id}/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setSelectedFacture(facture);
      setIsPreviewModalOpen(true);
    } catch (error) {
      console.error('Erreur lors de la prévisualisation :', error);
      toast.error('Erreur lors de la prévisualisation');
    }
  };

  // Télécharger PDF
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
      const fileName = `Facture_${clientName}_${format(
        new Date(facture.dateFacture),
        'MMMM_yyyy',
        { locale: fr }
      ).toLowerCase()}.pdf`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);
    } catch (error) {
      toast.error('Erreur lors du téléchargement du PDF');
    }
  };

  // Supprimer facture
  const handleDeleteFacture = async (factureId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Session expirée');
        return;
      }
      const confirmDelete = window.confirm('Voulez-vous vraiment supprimer cette facture ?');
      if (!confirmDelete) return;
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/factures/${factureId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Facture supprimée');
      setFilteredFactures((prev) =>
        prev.filter((facture) => facture._id !== factureId)
      );
    } catch (error) {
      console.error('Erreur lors de la suppression de la facture :', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // --- ListView ---
  const ListView = () => (
    <table className="min-w-full text-sm">
      <thead className="bg-white/20 text-gray-100">
        <tr>
          <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('invoiceNumber')}>
            N° Facture
          </th>
          <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('date')}>
            Date
          </th>
          <th className="px-4 py-2 text-left">Client</th>
          <th className="px-4 py-2 text-left">Brut (€)</th>
          <th className="px-4 py-2 text-left">URSSAF (€)</th>
          <th className="px-4 py-2 text-left">Net (€)</th>
          <th className="px-4 py-2 text-left">Statut</th>
          <th className="px-4 py-2 text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredFactures.map((facture) => (
          <tr key={facture._id} className="border-b border-white/10 hover:bg-white/5">
            <td className="px-4 py-2">{facture.invoiceNumber}</td>
            <td className="px-4 py-2">
              {facture.dateEdition
                ? format(new Date(facture.dateEdition), 'dd/MM/yyyy', { locale: fr })
                : format(new Date(facture.createdAt), 'dd/MM/yyyy', { locale: fr })}
            </td>
            <td className="px-4 py-2 w-68" title={facture.client?.name || 'N/A'}>
              {truncateText(facture.client?.name, 60)}
            </td>
            <td className="px-4 py-2">{facture.montantHT?.toFixed(2) ?? 'N/A'}</td>
            <td className="px-4 py-2">{facture.taxeURSSAF?.toFixed(2) ?? 'N/A'}</td>
            <td className="px-4 py-2">{facture.montantNet?.toFixed(2) ?? 'N/A'}</td>
            <td className="px-4 py-2">{getStatutLabel(facture)}</td>
            <td className="px-4 py-2 text-center">
              <div className="flex justify-center items-center space-x-2">
                <EyeIcon
                  className="h-5 w-5 text-indigo-400 hover:text-indigo-600 cursor-pointer"
                  onClick={() => handlePreview(facture)}
                />
                <ArrowDownTrayIcon
                  className="h-5 w-5 text-green-400 hover:text-green-600 cursor-pointer"
                  onClick={() => handleDownload(facture)}
                />
                {facture.status === 'unpaid' && (
                  <>
                    <button
                      onClick={() => handleMarkAsPaid(facture._id)}
                      className="text-green-400 hover:text-green-600"
                      title="Marquer payée"
                    >
                      <CheckIcon className="h-5 w-5" />
                    </button>
                    <Link
                      to={`/rectify-facture/${facture._id}`}
                      className="text-yellow-400 hover:text-yellow-600"
                      title="Rectifier"
                    >
                      Rectifier
                    </Link>
                    <button
                      onClick={() => handleDeleteFacture(facture._id)}
                      className="text-red-400 hover:text-red-600"
                      title="Supprimer"
                    >
                      <TrashIcon className="h-5 w-5" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
      {filteredFactures.map((facture) => (
        <div
          key={facture._id}
          className="bg-white/10 border border-white/10 p-4 rounded-md shadow-sm hover:bg-white/5"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-gray-100">
                Facture N°{facture.invoiceNumber}
              </h3>
              <p className="text-xs text-gray-300">
                {facture.dateEdition
                  ? format(new Date(facture.dateEdition), 'dd MMM yyyy', { locale: fr })
                  : format(new Date(facture.createdAt), 'dd MMM yyyy', { locale: fr })}
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs text-white ${
              facture.status === 'paid'
                ? 'bg-green-500'
                : facture.status === 'overdue'
                  ? 'bg-red-500'
                  : 'bg-orange-500'
            }`}>
              {facture.status === 'paid'
                ? 'Payée'
                : facture.status === 'overdue'
                  ? 'En retard'
                  : 'En attente'}
            </span>
          </div>
          <p className="font-medium text-center text-gray-100 mb-2">
            {facture.client?.name || 'N/A'}
          </p>
          <p className="text-lg font-bold text-center mb-3 text-gray-50">
            {facture.montantTTC ? `${facture.montantTTC.toFixed(2)} €` : 'N/A'}
          </p>
          <div className="flex justify-center space-x-3">
            <EyeIcon
              className="h-5 w-5 text-indigo-400 hover:text-indigo-600 cursor-pointer"
              onClick={() => handlePreview(facture)}
            />
            <ArrowDownTrayIcon
              className="h-5 w-5 text-green-400 hover:text-green-600 cursor-pointer"
              onClick={() => handleDownload(facture)}
            />
            {facture.status === 'unpaid' && (
              <>
                <button
                  onClick={() => handleMarkAsPaid(facture._id)}
                  className="text-green-400 hover:text-green-600 text-xs font-semibold"
                  title="Marquer payée"
                >
                  <CheckIcon className="h-5 w-5" />
                </button>
                <Link
                  to={`/rectify-facture/${facture._id}`}
                  className="text-yellow-400 hover:text-yellow-600 text-xs font-semibold"
                  title="Rectifier"
                >
                  Rectifier
                </Link>
                <button
                  onClick={() => handleDeleteFacture(facture._id)}
                  className="text-red-400 hover:text-red-600"
                  title="Supprimer"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto pt-34 px-6 pb-8 text-gray-100">
      <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-md shadow-sm p-6 space-y-6">
        <h2 className="text-2xl font-semibold">Mes Factures</h2>

        
        <div className="bg-white/5 border border-white/10 rounded-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={filters.client}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, client: e.target.value }))
              }
              className="bg-slate-50 border border-gray-300 rounded-md p-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Tous les clients</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name}
                </option>
              ))}
            </select>

            <DatePicker
              selected={filters.selectedMonthYear}
              onChange={(date) =>
                setFilters((prev) => ({ ...prev, selectedMonthYear: date }))
              }
              dateFormat="MMMM yyyy"
              showMonthYearPicker
              locale={fr}
              placeholderText="Sélectionner un mois/année"
              className="bg-slate-50 border border-gray-300 rounded-md p-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
            />

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="bg-slate-50 border border-gray-300 rounded-md p-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Tous les statuts</option>
              <option value="unpaid">En attente</option>
              <option value="paid">Payées</option>
              <option value="overdue">En retard</option>
            </select>

            <div className="flex justify-end md:col-span-2">
              <button
                onClick={() =>
                  setViewMode((prev) => (prev === 'list' ? 'grid' : 'list'))
                }
                className="px-3 py-1 border border-white/20 rounded-md hover:bg-white/10 transition-colors"
              >
                {viewMode === 'list' ? (
                  <Squares2X2Icon className="h-5 w-5" />
                ) : (
                  <Bars3Icon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        
        <div className="bg-white/10 border border-white/10 rounded-md p-4">
          {filteredFactures.length === 0 ? (
            <p className="text-sm text-gray-200">Aucune facture disponible.</p>
          ) : viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <ListView />
            </div>
          ) : (
            <GridView />
          )}
        </div>

        
        <PDFPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          pdfUrl={pdfUrl}
          facture={selectedFacture}
          onDownload={handleDownload}
        />
      </div>
    </div>
  );
};

export default FactureList;
*/