import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { usePrestation } from '../contexts/PrestationContext';

import RectificationIntroModal from './RectificationIntroModal';
import RectificationBadge from './RectificationBadge';
import CancelInvoiceModal from './CancelInvoiceModal';
import CreditNoteModal from './CreditNoteModal';
import PDFPreviewModal from './PDFPreviewModal';
import PaymentModal from './PaymentModal';
import CreditNoteBadge from './CreditNoteBadge';

import { INVOICE_STATUS } from '../utils/constants';
import StatusBadge from './common/StatutsBadge';

import {
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  Squares2X2Icon,
  Bars3Icon,
  CheckIcon,
  PencilIcon,
  XCircleIcon,
  DocumentTextIcon,
  ReceiptRefundIcon,
  PaperAirplaneIcon,
  DocumentDuplicateIcon,
  CalendarIcon,
  UserIcon,
  CurrencyEuroIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const FactureList = () => {
  const navigate = useNavigate();
  const { fetchPrestations } = usePrestation();

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

  // Rectification
  const [isRectificationModalOpen, setIsRectificationModalOpen] = useState(false);
  const [selectedFactureForRectification, setSelectedFactureForRectification] = useState(null);

  // Tri
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc',
  });

  // Annulation & Avoir (Credit Note)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
  const [selectedInvoiceForCancel, setSelectedInvoiceForCancel] = useState(null);
  const [selectedInvoiceForCreditNote, setSelectedInvoiceForCreditNote] = useState(null);

  // Détails de l'avoir
  const [isCreditNoteDetailModalOpen, setIsCreditNoteDetailModalOpen] = useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState(null);

  // -----------------------------------------------------------
  // UTILS
  // -----------------------------------------------------------

  // Tronquer un texte long
  const truncateText = (text, maxLength) =>
    text && text.length > maxLength ? text.substring(0, maxLength) + '...' : text || '';

  // Afficher le statut (incluant locked / statut / status)
  const getStatutLabel = (facture) => {
    return (
      <StatusBadge
        status={facture.status}
        isSentToClient={facture.isSentToClient}
        isLocked={facture.locked}
      />
    );
  };


  const handleViewCreditNote = (facture) => {
    if (facture.avoir) {
      setSelectedCreditNote(facture);
      setIsCreditNoteDetailModalOpen(true);
    }
  };

  // -----------------------------------------------------------
  // FETCH
  // -----------------------------------------------------------
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

  // -----------------------------------------------------------
  // SORT
  // -----------------------------------------------------------
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

  // -----------------------------------------------------------
  // PAIEMENT
  // -----------------------------------------------------------
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
      toast.error("Erreur lors de l'enregistrement du paiement");
    }
  };

  // -----------------------------------------------------------
  // MARQUAGE ET DUPLICATION
  // -----------------------------------------------------------
  const handleMarkAsSent = async (factureId) => {
    try {
      const token = localStorage.getItem('token');
      const confirmSend = window.confirm('Êtes-vous sûr de vouloir marquer cette facture comme envoyée au client ? Cette action est irréversible et la facture ne pourra plus être supprimée.');
      if (!confirmSend) return;

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/factures/${factureId}/mark-as-sent`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        await fetchFactures();
        toast.success('Facture marquée comme envoyée au client');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du marquage de la facture');
    }
  };

  const handleDuplicateInvoice = async (factureId) => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/factures/${factureId}/duplicate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        await fetchFactures();
        toast.success('Facture dupliquée avec succès');
      }
    } catch (error) {
      console.error('Erreur duplication:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la duplication de la facture');
    }
  };

  // -----------------------------------------------------------
  // PDF PREVIEW
  // -----------------------------------------------------------
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

  // -----------------------------------------------------------
  // SUPPRESSION
  // -----------------------------------------------------------
  const handleDeleteFacture = async (factureId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Session expirée');
        return;
      }

      // Vérifier d'abord si la facture peut être supprimée
      const factureToDelete = factures.find(f => f._id === factureId);

      if (factureToDelete.isSentToClient) {
        toast.error('Impossible de supprimer une facture déjà envoyée au client. Utilisez plutôt la fonction d\'annulation ou de rectification.');
        return;
      }

      const confirmDelete = window.confirm('Voulez-vous vraiment supprimer cette facture ?');
      if (!confirmDelete) return;

      await axios.delete(`${process.env.REACT_APP_API_URL}/api/factures/${factureId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Facture supprimée');

      // 1) Mise à jour locale de la liste des factures
      setFactures((prev) => prev.filter((f) => f._id !== factureId));
      // 2) Recharger la liste des prestations pour que
      // le “Récap Mensuel” répercute la suppression (invoiceStatus=null)
      await fetchPrestations();

    } catch (error) {
      console.error('Erreur suppression facture :', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // -----------------------------------------------------------
  // RECTIFICATION
  // -----------------------------------------------------------
  const handleRectifyNew = (facture) => {
    setSelectedFactureForRectification(facture);
    setIsRectificationModalOpen(true);
  };

  // -----------------------------------------------------------
  // ANNULATION & AVOIR
  // -----------------------------------------------------------
  const handleCancelInvoice = (facture) => {
    setSelectedInvoiceForCancel(facture);
    setIsCancelModalOpen(true);
  };

  const handleCreditNote = (facture) => {
    setSelectedInvoiceForCreditNote(facture);
    setIsCreditNoteModalOpen(true);
  };

  const handleCancelSubmit = async (cancelData) => {
    try {
      const token = localStorage.getItem('token');
      toast.info('Annulation en cours.', { autoClose: 1500 });

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/factures/${selectedInvoiceForCancel._id}/cancel`,
        cancelData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        await fetchFactures();
        setIsCancelModalOpen(false);
        toast.success('Facture annulée avec succès');
      } else {
        throw new Error(response.data.message || 'Erreur lors de l\'annulation');
      }
    } catch (error) {
      console.error('Erreur annulation:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation de la facture');
    }
  };

  const handleCreditNoteSubmit = async (creditNoteData) => {
    try {
      const token = localStorage.getItem('token');
      toast.info('Création de l\'avoir en cours.', { autoClose: 1500 });

      // Vérifier d'abord si la facture a déjà un avoir valide
      const factureToCheck = factures.find(f => f._id === selectedInvoiceForCreditNote._id);
      const hasValidCreditNote = factureToCheck?.avoir &&
        factureToCheck.avoir.numero &&
        factureToCheck.avoir.montant;

      if (hasValidCreditNote) {
        toast.error(`Cette facture a déjà un avoir (${factureToCheck.avoir.numero})`);
        setIsCreditNoteModalOpen(false);
        return;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/factures/${selectedInvoiceForCreditNote._id}/credit-note`,
        creditNoteData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        await fetchFactures();
        setIsCreditNoteModalOpen(false);
        toast.success(`Avoir ${response.data.avoir.numero} créé avec succès`);

        // Rechargement après un délai pour s'assurer que l'UI est à jour
        setTimeout(async () => {
          await fetchFactures();
        }, 1000);
      } else {
        throw new Error(response.data.message || 'Erreur lors de la création de l\'avoir');
      }
    } catch (error) {
      console.error('Erreur création avoir:', error);

      let errorMsg = 'Erreur lors de la création de l\'avoir';
      if (error.response) {
        console.log('Détails de l\'erreur:', error.response);
        errorMsg = error.response.data?.message || errorMsg;
      }

      toast.error(errorMsg);
    }
  };

  async function handlePreviewCreditNote(factureId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/factures/${factureId}/credit-note/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(blob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Erreur aperçu PDF Avoir :', error);
      toast.error("Impossible d'afficher l'avoir");
    }
  }

  // -----------------------------------------------------------
  // SUB COMPONENTS: TABLES / VIEWS
  // -----------------------------------------------------------
  const ListView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="bg-blue-900/40">
            <th
              className="sticky top-0 px-3 py-2 text-center cursor-pointer border-b border-b-blue-700"
              onClick={() => handleSort('invoiceNumber')}
            >
              N° Facture
            </th>
            <th
              className="sticky top-0 px-3 py-2 text-center cursor-pointer border-b border-b-blue-700"
              onClick={() => handleSort('date')}
            >
              Date
            </th>
            <th className="sticky top-0 px-3 py-2 text-center border-b border-b-blue-700">Client</th>
            <th className="sticky top-0 px-3 py-2 text-center border-b border-b-blue-700">Brut (€)</th>
            <th className="sticky top-0 px-3 py-2 text-center border-b border-b-blue-700">URSSAF (€)</th>
            <th className="sticky top-0 px-3 py-2 text-center border-b border-b-blue-700">Net (€)</th>
            <th className="sticky top-0 px-3 py-2 text-center border-b border-b-blue-700">Statut</th>
            <th className="sticky top-0 px-3 py-2 text-center border-b border-b-blue-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {factures.map((facture, index) => {
            const displayDate = facture.dateEdition
              ? format(new Date(facture.dateEdition), 'dd/MM/yyyy', { locale: fr })
              : format(new Date(facture.createdAt), 'dd/MM/yyyy', { locale: fr });

            // Déterminer si l'icône "créer un avoir" doit être affichée
            const shouldShowCreateCreditNote =
              facture.status === 'paid' &&
              (!facture.avoir || !facture.avoir.numero) &&
              !facture.locked;

            return (
              <tr
                key={facture._id}
                className={`hover:bg-blue-800/20 ${index % 2 === 0 ? 'bg-blue-900/10' : ''}`}
              >
                <td className="px-3 py-2.5 text-center border-b border-b-blue-800/30">
                  <div className="flex items-center justify-center gap-2">
                    {facture.invoiceNumber}
                    {facture.isRectification && (
                      <RectificationBadge type="rectification" />
                    )}
                    {facture.statut === 'RECTIFIEE' && (
                      <RectificationBadge type="rectified" />
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center border-b border-b-blue-800/30">{displayDate}</td>
                <td className="px-3 py-2.5 text-center border-b border-b-blue-800/30" title={facture.client?.name || 'N/A'}>
                  {truncateText(facture.client?.name, 30)}
                </td>
                <td className="px-3 py-2.5 text-center border-b border-b-blue-800/30">
                  {facture.montantHT?.toFixed(2) ?? 'N/A'}
                </td>
                <td className="px-3 py-2.5 text-center border-b border-b-blue-800/30">
                  {facture.taxeURSSAF?.toFixed(2) ?? 'N/A'}
                </td>
                <td className="px-3 py-2.5 text-center border-b border-b-blue-800/30">
                  {facture.montantNet?.toFixed(2) ?? 'N/A'}
                </td>
                <td className="px-3 py-2.5 border-b border-b-blue-800/30">
                  <div className="flex justify-center">
                    {getStatutLabel(facture)}
                  </div>
                </td>
                <td className="px-3 py-2.5 border-b border-b-blue-800/30">
                  <div className="flex justify-center items-center gap-2.5">
                    {/* Actions toujours disponibles */}
                    <button
                      onClick={() => handlePreview(facture)}
                      title="Prévisualiser"
                      className="text-indigo-400 hover:text-indigo-300"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => handleDownload(facture)}
                      title="Télécharger"
                      className="text-green-400 hover:text-green-300"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </button>

                    {/* Actions pour les brouillons */}
                    {facture.status === 'draft' && !facture.isSentToClient && !facture.locked && (
                      <>
                        <button
                          onClick={() => handleMarkAsSent(facture._id)}
                          title="Marquer comme envoyée au client"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <PaperAirplaneIcon className="h-5 w-5" />
                        </button>

                        {!facture.isRectification && (
                          <button
                            onClick={() => handleDeleteFacture(facture._id)}
                            title="Supprimer (uniquement avant envoi)"
                            className="text-red-500 hover:text-red-400"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </>
                    )}

                    {/* Actions pour les factures envoyées mais non payées */}
                    {facture.isSentToClient && facture.status === 'unpaid' && !facture.locked && (
                      <>
                        <button
                          onClick={() => handleMarkAsPaid(facture._id)}
                          title="Marquer payée"
                          className="text-green-400 hover:text-green-300"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => handleRectifyNew(facture)}
                          title="Rectifier"
                          className="text-yellow-400 hover:text-yellow-300"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => handleCancelInvoice(facture)}
                          title="Annuler"
                          className="text-red-400 hover:text-red-300"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}

                    {/* Créer un avoir - pour les factures payées sans avoir existant */}
                    {shouldShowCreateCreditNote && (
                      <button
                        onClick={() => handleCreditNote(facture)}
                        title="Créer un avoir"
                        className="text-pink-400 hover:text-pink-300"
                      >
                        <DocumentTextIcon className="h-5 w-5" />
                      </button>
                    )}

                    {/* Voir l'avoir si existant */}
                    {facture.avoir && facture.avoir.numero && facture.avoir.montant && (
                      <button
                        onClick={() => handlePreviewCreditNote(facture._id)}
                        title="Voir l'avoir (PDF)"
                        className="text-pink-400 hover:text-pink-300"
                      >
                        <ReceiptRefundIcon className="h-5 w-5" />
                      </button>
                    )}


                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // -----------------------------------------------------------
  // MAIN RENDER
  // -----------------------------------------------------------
  return (
    <div className="p-6 text-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Liste des Factures</h2>

      {/* Filtres */}
      <div className="bg-white/10 border border-white/20 rounded-md p-4 mb-4 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Client</label>
          <select
            value={filters.client}
            onChange={(e) => setFilters((prev) => ({ ...prev, client: e.target.value }))}
            className="p-2 text-gray-900 rounded"
          >
            <option value="">Tous</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Mois / Année</label>
          <DatePicker
            selected={filters.selectedMonthYear}
            onChange={(date) => setFilters((prev) => ({ ...prev, selectedMonthYear: date }))}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            className="p-2 text-gray-900 rounded"
            placeholderText="Choisir un mois / année"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Statut</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="p-2 text-gray-900 rounded"
          >
            <option value="">Tous</option>
            <option value="draft">Brouillon</option>
            <option value="unpaid">Non payée</option>
            <option value="paid">Payée</option>
            <option value="overdue">En retard</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>
      </div>

      {/* Choix d'affichage liste ou grille */}
      <div className="mb-4 flex items-center justify-end space-x-2">
        <Bars3Icon
          className={`h-6 w-6 cursor-pointer ${viewMode === 'list' ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
          onClick={() => setViewMode('list')}
        />
        <Squares2X2Icon
          className={`h-6 w-6 cursor-pointer ${viewMode === 'grid' ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
          onClick={() => setViewMode('grid')}
        />
      </div>

      {/* Liste / Grille */}
      {factures.length === 0 ? (
        <div className="text-gray-400">Aucune facture trouvée.</div>
      ) : viewMode === 'list' ? (
        <ListView />
      ) : (
        /* Vue en grille améliorée */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {factures.map((facture) => {
            const displayDate = facture.dateEdition
              ? format(new Date(facture.dateEdition), 'dd/MM/yyyy', { locale: fr })
              : format(new Date(facture.createdAt), 'dd/MM/yyyy', { locale: fr });

            return (
              <div
                key={facture._id}
                className="relative flex flex-col bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden transition-all hover:shadow-xl hover:shadow-blue-900/20 hover:border-blue-400/30"
              >
                {/* Badges en position absolue */}
                <div className="absolute top-0 right-0 flex gap-1 p-1">
                  {facture.isRectification && <RectificationBadge type="rectification" />}
                  {facture.statut === 'RECTIFIEE' && <RectificationBadge type="rectified" />}
                  {facture.avoir && facture.avoir.numero && facture.avoir.montant && (
                    <CreditNoteBadge montant={facture.avoir.montant} onClick={() => handleViewCreditNote(facture)} />
                  )}
                </div>

                {/* En-tête avec n° facture et statut */}
                <div className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 p-4 border-b border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-lg">
                      #{facture.invoiceNumber}
                    </span>
                    <div>{getStatutLabel(facture)}</div>
                  </div>
                </div>

                {/* Contenu principal */}
                <div className="p-4 flex-grow flex flex-col">
                  {/* Infos client & date */}
                  <div className="mb-4">
                    <div className="flex items-start mb-2">
                      <UserIcon className="h-5 w-5 text-blue-300 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="text-base text-blue-100 font-medium" title={facture.client?.name || 'N/A'}>
                        {truncateText(facture.client?.name, 40)}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 text-blue-300 mr-2 flex-shrink-0" />
                      <div className="text-sm text-blue-200">{displayDate}</div>
                    </div>
                  </div>

                  {/* Montants */}
                  <div className="mb-4 grid grid-cols-2 gap-2 p-3 bg-blue-900/30 rounded-md">
                    <div className="col-span-2 flex items-center mb-1">
                      <CurrencyEuroIcon className="h-4 w-4 text-green-300 mr-2" />
                      <span className="text-xs text-blue-300 uppercase font-semibold">Montants</span>
                    </div>
                    <div>
                      <div className="text-xs text-blue-300">Brut:</div>
                      <div className="text-base font-medium">{facture.montantHT?.toFixed(2) ?? 'N/A'} €</div>
                    </div>
                    <div>
                      <div className="text-xs text-blue-300">Net:</div>
                      <div className="text-base font-medium">{facture.montantNet?.toFixed(2) ?? 'N/A'} €</div>
                    </div>
                  </div>
                </div>

                {/* Barre d'actions */}
                <div className="p-3 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-t border-white/10 flex flex-wrap justify-center gap-3">
                  {/* Actions principales toujours visibles */}
                  <EyeIcon
                    className="h-5 w-5 text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    onClick={() => handlePreview(facture)}
                    title="Prévisualiser"
                  />

                  <ArrowDownTrayIcon
                    className="h-5 w-5 text-green-400 hover:text-green-300 cursor-pointer"
                    onClick={() => handleDownload(facture)}
                    title="Télécharger"
                  />

                  {/* Actions pour les brouillons */}
                  {facture.status === INVOICE_STATUS.DRAFT && !facture.isSentToClient && !facture.locked && (
                    <>
                      <PaperAirplaneIcon
                        className="h-5 w-5 text-blue-400 hover:text-blue-300 cursor-pointer"
                        onClick={() => handleMarkAsSent(facture._id)}
                        title="Marquer comme envoyée au client"
                      />

                      <TrashIcon
                        className="h-5 w-5 text-red-500 hover:text-red-400 cursor-pointer"
                        onClick={() => handleDeleteFacture(facture._id)}
                        title="Supprimer (uniquement avant envoi)"
                      />
                    </>
                  )}

                  {/* Actions pour les factures envoyées mais non payées */}
                  {facture.isSentToClient && facture.status === INVOICE_STATUS.UNPAID && !facture.locked && (
                    <>
                      <CheckIcon
                        className="h-5 w-5 text-green-400 hover:text-green-300 cursor-pointer"
                        onClick={() => handleMarkAsPaid(facture._id)}
                        title="Marquer payée"
                      />

                      <PencilIcon
                        className="h-5 w-5 text-yellow-400 hover:text-yellow-300 cursor-pointer"
                        onClick={() => handleRectifyNew(facture)}
                        title="Rectifier"
                      />

                      <XCircleIcon
                        className="h-5 w-5 text-red-400 hover:text-red-300 cursor-pointer"
                        onClick={() => handleCancelInvoice(facture)}
                        title="Annuler"
                      />
                    </>
                  )}

                  {/* Actions pour les factures payées */}
                  {facture.status === INVOICE_STATUS.PAID && !facture.avoir && !facture.locked && (
                    <DocumentTextIcon
                      className="h-5 w-5 text-pink-400 hover:text-pink-300 cursor-pointer"
                      onClick={() => handleCreditNote(facture)}
                      title="Créer un avoir"
                    />
                  )}

                  {/* Voir l'avoir si existant */}
                  {facture.avoir && facture.status === 'paid' && (
                    <ReceiptRefundIcon
                      className="h-5 w-5 text-pink-400 hover:text-pink-300 cursor-pointer"
                      onClick={() => handlePreviewCreditNote(facture._id)}
                      title="Voir l'avoir"
                    />
                  )}


                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <PDFPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        pdfUrl={pdfUrl}
        facture={selectedFacture}
        onDownload={handleDownload}
      />

      <PaymentModal
        isOpen={isPaymentModalOpenPaymentList}
        onClose={() => setIsPaymentModalOpenPaymentList(false)}
        onSubmit={handlePaymentSubmit}
      />

      <RectificationIntroModal
        isOpen={isRectificationModalOpen}
        onClose={() => setIsRectificationModalOpen(false)}
        invoiceNumber={selectedFactureForRectification?.invoiceNumber}
        factureId={selectedFactureForRectification?._id}
      />

      <CancelInvoiceModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onSubmit={handleCancelSubmit}
        facture={selectedInvoiceForCancel}
      />

      <CreditNoteModal
        isOpen={isCreditNoteModalOpen}
        onClose={() => setIsCreditNoteModalOpen(false)}
        onSubmit={handleCreditNoteSubmit}
        facture={selectedInvoiceForCreditNote}
      />

      {/* Détails de l'avoir déjà existant */}
      {isCreditNoteDetailModalOpen && selectedCreditNote && (
        <div className="fixed inset-0 z-[1000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl max-w-md w-full">
            <div className="p-5 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Détails de l'avoir</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-white/70 text-sm">Numéro d'avoir</div>
                <div className="text-white text-lg font-medium">{selectedCreditNote.avoir.numero}</div>
              </div>
              <div>
                <div className="text-white/70 text-sm">Montant</div>
                <div className="text-pink-300 text-lg font-bold">{selectedCreditNote.avoir.montant.toFixed(2)} €</div>
              </div>
              <div>
                <div className="text-white/70 text-sm">Motif</div>
                <div className="text-white">{selectedCreditNote.avoir.motif}</div>
              </div>
              {selectedCreditNote.avoir.remboursement && (
                <>
                  <div>
                    <div className="text-white/70 text-sm">Remboursement</div>
                    <div className="text-white">
                      {selectedCreditNote.avoir.methodePaiement || 'Non spécifié'}
                    </div>
                  </div>
                  {selectedCreditNote.avoir.dateRemboursement && (
                    <div>
                      <div className="text-white/70 text-sm">Date de remboursement</div>
                      <div className="text-white">
                        {format(new Date(selectedCreditNote.avoir.dateRemboursement), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="p-5 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setIsCreditNoteDetailModalOpen(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactureList;