import React, { useEffect, useCallback, forwardRef } from 'react';
import { useInvoice } from '../contexts/InvoiceContext';
import { usePrestation } from '../contexts/PrestationContext';
import axios from '../utils/axios-config';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarIcon } from '@heroicons/react/24/solid';

registerLocale('fr', fr);

// Composant d'entrée personnalisé avec icône
const CustomInput = forwardRef(({ value, onClick }, ref) => (
  <div className="relative">
    <input
      ref={ref}
      value={value}
      onClick={onClick}
      readOnly
      placeholder="Sélectionner un mois/année"
      className="
        mt-1 w-full p-2 pr-10
        border border-gray-300
        rounded-md
        text-gray-900
        focus:outline-none focus:ring-2 focus:ring-blue-500
        cursor-pointer
      "
    />
    <CalendarIcon
      onClick={onClick}
      className="
        absolute right-3 top-1/2 -translate-y-1/2
        h-5 w-5 text-gray-400
        cursor-pointer
        hover:text-gray-600
        transition-colors duration-200
      "
    />
  </div>
));
CustomInput.displayName = 'CustomInput'; // pour éviter un warning de forwardRef

const InvoiceCreator = ({ clients, businessInfo }) => {
  const {
    selectedInvoiceClient,
    setSelectedInvoiceClient,
    selectedInvoiceMonth,
    setSelectedInvoiceMonth,
    filteredPrestations,
    setFilteredPrestations,
    nextInvoiceNumber,
    fetchNextInvoiceNumber,
  } = useInvoice();

  const { prestations, fetchPrestations } = usePrestation();

  const parseMonthStringToDate = (monthStr) => {
    if (!monthStr) return null;
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month - 1, 1);
  };

  const formatDateToMonthString = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // Filtrer les prestations pour le client + mois choisis
  const updateFilteredPrestations = useCallback(
    (clientId, monthStr) => {
      if (!clientId || !monthStr) {
        setFilteredPrestations([]);
        return;
      }
      const [year, monthNum] = monthStr.split('-').map(Number);
      const filtered = prestations.filter((p) => {
        const d = new Date(p.date);
        return (
          d.getFullYear() === year &&
          d.getMonth() === monthNum - 1 &&
          p.client._id === clientId
        );
      });
      setFilteredPrestations(filtered);
    },
    [prestations, setFilteredPrestations]
  );

  // Sur changement du client / mois => filtrer
  useEffect(() => {
    if (selectedInvoiceClient && selectedInvoiceMonth) {
      updateFilteredPrestations(selectedInvoiceClient._id, selectedInvoiceMonth);
    }
  }, [selectedInvoiceClient, selectedInvoiceMonth, updateFilteredPrestations]);

  const handleMonthChange = (date) => {
    const monthStr = formatDateToMonthString(date);
    setSelectedInvoiceMonth(monthStr);
    if (selectedInvoiceClient) {
      updateFilteredPrestations(selectedInvoiceClient._id, monthStr);
    }
  };

  const handleClientSelect = (clientId) => {
    const client = clients.find((c) => c._id === clientId);
    setSelectedInvoiceClient(client);
    if (selectedInvoiceMonth) {
      updateFilteredPrestations(clientId, selectedInvoiceMonth);
    }
  };

  const handleSaveInvoice = async () => {
    if (!selectedInvoiceClient || !selectedInvoiceMonth) {
      toast.error('Veuillez sélectionner un client et un mois');
      return;
    }
    if (filteredPrestations.length === 0) {
      toast.error('Aucune prestation trouvée pour cette période');
      return;
    }

    const [year, month] = selectedInvoiceMonth.split('-').map(Number);
    try {
      await axios.post(
        '/factures/',
        {
          clientId: selectedInvoiceClient._id,
          year: year,
          month: month,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      // Rafraîchir les prestations
      await fetchPrestations();

      toast.success('Facture générée avec succès');
      // Reset
      setSelectedInvoiceClient(null);
      setSelectedInvoiceMonth('');
      setFilteredPrestations([]);
      fetchNextInvoiceNumber();
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message?.includes('existe déjà')) {
        toast.warn('Une facture existe déjà pour ce client ce mois-ci', { autoClose: 3000 });
      } else if (error.response?.status === 404) {
        toast.warn('Aucune prestation trouvée pour cette période', { autoClose: 2000 });
      } else {
        toast.error('Erreur lors de la création de la facture', { autoClose: 2000 });
      }
    }
  };

  const selectedDate = parseMonthStringToDate(selectedInvoiceMonth);

  // Calcul du total
  const total = filteredPrestations.reduce((sum, p) => sum + p.total, 0).toFixed(2);

  const isDisabled =
    !selectedInvoiceClient || !selectedInvoiceMonth || filteredPrestations.length === 0;

  return (
    <div
      className="
        bg-white/10
        border border-white/20
        backdrop-blur-sm
        text-gray-100
        p-6
        rounded-md
        shadow-sm
        space-y-4
      "
    >
      <h2 className="text-xl font-semibold">Créer une Facture</h2>
      <p className="text-sm text-gray-200 mb-4">
        Sélectionnez un client et un mois, puis générez la facture correspondante.
      </p>

      {/* Sélection du client */}
      <div>
        <label className="block text-sm font-medium text-gray-200">Client :</label>
        <select
          value={selectedInvoiceClient?._id || ''}
          onChange={(e) => handleClientSelect(e.target.value)}
          className="
            mt-1 w-full p-2 border border-gray-300 rounded-md
            text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        >
          <option value="">-- Sélectionner un client --</option>
          {clients.map((client) => (
            <option key={client._id} value={client._id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sélection du mois */}
      <div>
        <label className="block text-sm font-medium text-gray-200">Mois :</label>
        <DatePicker
          selected={selectedDate}
          onChange={handleMonthChange}
          dateFormat="MMMM yyyy"
          showMonthYearPicker
          locale="fr"
          placeholderText="Sélectionner un mois/année"
          customInput={<CustomInput />}
        />
      </div>

      {/* Récap prestations */}
      {filteredPrestations.length > 0 && (
        <div className="p-3 rounded-md border border-blue-300 bg-blue-50 text-blue-900 space-y-1">
          <p className="text-sm">
            {filteredPrestations.length} prestation(s) trouvée(s) pour cette période
          </p>
          <p className="text-sm font-semibold">Total : {total} €</p>
        </div>
      )}

      {/* Bouton Générer */}
      <button
        onClick={handleSaveInvoice}
        disabled={isDisabled}
        className={`
          w-full py-2 px-4 rounded-md font-semibold transition-colors
          ${
            isDisabled
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }
        `}
      >
        {nextInvoiceNumber
          ? `Générer la facture N°${nextInvoiceNumber}`
          : 'Générer la facture'}
      </button>
    </div>
  );
};

export default InvoiceCreator;



/*
import React, { useEffect, useCallback, forwardRef } from 'react';
import { useInvoice } from '../contexts/InvoiceContext';
import { usePrestation } from '../contexts/PrestationContext';
import axios from '../utils/axios-config';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarIcon } from '@heroicons/react/24/solid';

registerLocale('fr', fr);

// Composant d'entrée personnalisé avec icône
const CustomInput = forwardRef(({ value, onClick }, ref) => (
  <div className="relative">
    <input
      ref={ref}
      value={value}
      onClick={onClick}
      readOnly
      placeholder="Sélectionner un mois/année"
      className="mt-1 w-full p-2 pr-10 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
    />
    <CalendarIcon
      onClick={onClick}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors duration-200"
    />
  </div>
));

const InvoiceCreator = ({ clients, businessInfo }) => {
  const {
    selectedInvoiceClient,
    setSelectedInvoiceClient,
    selectedInvoiceMonth,
    setSelectedInvoiceMonth,
    filteredPrestations,
    setFilteredPrestations,
    nextInvoiceNumber,
    fetchNextInvoiceNumber,
  } = useInvoice();

  const { prestations, fetchPrestations } = usePrestation();

  const parseMonthStringToDate = (monthStr) => {
    if (!monthStr) return null;
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month - 1, 1);
  };

  const formatDateToMonthString = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const updateFilteredPrestations = useCallback(
    (clientId, monthStr) => {
      if (!clientId || !monthStr) {
        setFilteredPrestations([]);
        return;
      }
      const [year, monthNum] = monthStr.split('-').map(Number);
      const filtered = prestations.filter((prestation) => {
        const prestationDate = new Date(prestation.date);
        return (
          prestationDate.getFullYear() === year &&
          prestationDate.getMonth() === monthNum - 1 &&
          prestation.client._id === clientId
        );
      });
      console.log('Prestations filtrées:', filtered);
      setFilteredPrestations(filtered);
    },
    [prestations, setFilteredPrestations]
  );

  useEffect(() => {
    console.log('selectedInvoiceClient:', selectedInvoiceClient);
    console.log('selectedInvoiceMonth:', selectedInvoiceMonth);
    if (selectedInvoiceClient && selectedInvoiceMonth) {
      updateFilteredPrestations(selectedInvoiceClient._id, selectedInvoiceMonth);
    }
  }, [selectedInvoiceClient, selectedInvoiceMonth, updateFilteredPrestations]);

  const handleMonthChange = (date) => {
    const monthStr = formatDateToMonthString(date);
    console.log('handleMonthChange:', monthStr);
    setSelectedInvoiceMonth(monthStr);
    if (selectedInvoiceClient) {
      updateFilteredPrestations(selectedInvoiceClient._id, monthStr);
    }
  };

  const handleClientSelect = (clientId) => {
    const client = clients.find((c) => c._id === clientId);
    setSelectedInvoiceClient(client);
    if (selectedInvoiceMonth) {
      updateFilteredPrestations(clientId, selectedInvoiceMonth);
    }
  };

  // Mise à jour de handleSaveInvoice : on ne déclenche plus de téléchargement automatique
  const handleSaveInvoice = async () => {
    if (!selectedInvoiceClient || !selectedInvoiceMonth) {
      toast.error('Veuillez sélectionner un client et un mois');
      return;
    }
    if (filteredPrestations.length === 0) {
      toast.error('Aucune prestation trouvée pour cette période');
      return;
    }
    const [year, month] = selectedInvoiceMonth.split('-').map(Number);
    try {
      await axios.post(
        '/factures/',
        {
          clientId: selectedInvoiceClient._id,
          year: year,
          month: month,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      // Rafraîchir les prestations
      await fetchPrestations();


      toast.success('Facture générée avec succès');
      // Réinitialisation des sélections
      setSelectedInvoiceClient(null);
      setSelectedInvoiceMonth('');
      setFilteredPrestations([]);
      fetchNextInvoiceNumber();
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('existe déjà')) {
        toast.warn(
          `Une facture existe déjà pour ${selectedInvoiceClient.name} pour le mois de ${format(
            new Date(year, month - 1),
            'MMMM yyyy',
            { locale: fr }
          ).toLowerCase()}`,
          { autoClose: 3000 }
        );
      } else if (error.response?.status === 404) {
        toast.warn('Aucune prestation trouvée pour cette période', { autoClose: 2000 });
      } else {
        toast.error('Une erreur est survenue lors de la création de la facture', { autoClose: 2000 });
      }
    }
  };

  const selectedDate = parseMonthStringToDate(selectedInvoiceMonth);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Créer une facture</h2>
      <div>
        <label className="block text-gray-700">Sélectionner un client :</label>
        <select
          value={selectedInvoiceClient?._id || ''}
          onChange={(e) => handleClientSelect(e.target.value)}
          className="mt-1 w-full p-2 border border-gray-300 rounded"
        >
          <option value="">-- Sélectionner un client --</option>
          {clients.map((client) => (
            <option key={client._id} value={client._id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-gray-700">Sélectionner une date :</label>
        <DatePicker
          selected={selectedDate}
          onChange={handleMonthChange}
          dateFormat="MMMM yyyy"
          showMonthYearPicker
          locale="fr"
          placeholderText="Sélectionner un mois/année"
          customInput={<CustomInput />}
        />
      </div>
      {filteredPrestations.length > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-blue-600">{filteredPrestations.length} prestation(s) pour ce mois</p>
          <p className="text-blue-800 font-semibold">
            Total : {filteredPrestations.reduce((sum, p) => sum + p.total, 0).toFixed(2)} €
          </p>
        </div>
      )}
      <button
        onClick={handleSaveInvoice}
        disabled={!selectedInvoiceClient || !selectedInvoiceMonth || filteredPrestations.length === 0}
        className={`w-full py-2 px-4 rounded transition-colors ${
          !selectedInvoiceClient || !selectedInvoiceMonth || filteredPrestations.length === 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        {nextInvoiceNumber
          ? `Générer la facture N°${nextInvoiceNumber}`
          : 'Générer la facture'}
      </button>
    </div>
  );
};

export default InvoiceCreator;
*/