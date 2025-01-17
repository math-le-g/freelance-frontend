// frontend/src/components/AddPrestation.js
import React, { useState, useEffect } from 'react';
import DescriptionSelect from './DescriptionSelect';
import axios from '../utils/axios-config'; // Utilise l'instance Axios configurée
import { toast } from 'react-toastify';
import { usePrestation } from '../contexts/PrestationContext';
import { useInvoice } from '../contexts/InvoiceContext';

const AddPrestation = ({
  addPrestation,
  updatePrestation,
  initialData,
  selectedClient,
  setCurrentPrestation,
}) => {
  // Pour rafraîchir les données via les hooks des contextes
  const { fetchPrestations } = usePrestation();
  const { fetchNextInvoiceNumber } = useInvoice();

  const [selectedDescription, setSelectedDescription] = useState(null);
  const [hours, setHours] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [date, setDate] = useState('');

  // Initialisation des champs en cas de modification (initialData)
  useEffect(() => {
    if (initialData) {
      if (initialData.description) {
        setSelectedDescription({
          value: initialData.description,
          label: initialData.description.charAt(0).toUpperCase() + initialData.description.slice(1),
        });
      }
      setHours(initialData.hours?.toString() || '');
      setHourlyRate(initialData.hourlyRate?.toString() || '');
      // On suppose que date est au format ISO et on en extrait la partie "YYYY-MM-DD"
      setDate(initialData.date ? initialData.date.slice(0, 10) : '');
    } else {
      // Réinitialisation si aucune donnée initiale
      setSelectedDescription(null);
      setHours('');
      setHourlyRate('');
      setDate('');
    }
  }, [initialData]);

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClient || !selectedClient._id) {
      toast.error('Veuillez sélectionner un client valide.');
      return;
    }

    if (!selectedDescription) {
      toast.error('Veuillez sélectionner ou saisir une description.');
      return;
    }

    if (!hours || !hourlyRate || isNaN(hours) || isNaN(hourlyRate)) {
      toast.error('Veuillez entrer des valeurs numériques valides pour les heures et le taux horaire.');
      return;
    }

    const prestationData = {
      description: selectedDescription.value,
      hours: parseFloat(hours),
      hourlyRate: parseFloat(hourlyRate),
      clientId: selectedClient._id,
      date: date || new Date().toISOString(), // Si aucune date, on prend la date actuelle
    };
console.log('Données envoyées :', prestationData);

    try {
      let response;
      if (initialData && initialData._id) {
        // Modification d'une prestation existante
        response = await updatePrestation({ _id: initialData._id, ...prestationData });
        
      } else {
        // Ajout d'une nouvelle prestation
        response = await addPrestation(prestationData);
      }

      // Rafraîchir les données après ajout/mise à jour
      fetchPrestations();
      fetchNextInvoiceNumber();

      // Réinitialiser le formulaire
      setSelectedDescription(null);
      setHours('');
      setHourlyRate('');
      setDate('');
      setCurrentPrestation(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la prestation:', error);
      toast.error("❌ Erreur lors de la sauvegarde de la prestation.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-4 ${
        initialData
          ? 'bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-lg shadow-lg'
          : 'bg-white rounded-lg p-4 shadow'
      }`}
    >
      {initialData && (
        <div className="text-yellow-700 mb-4">
          Vous modifiez une prestation existante.
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:space-x-4 lg:space-y-2">
        <div className="flex-1">
          <label className="block text-gray-700">Date :</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="mt-1 w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="flex-1">
          <label className="block text-gray-700">Description :</label>
          <DescriptionSelect
            value={selectedDescription}
            onChange={setSelectedDescription}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:space-x-4">
        <div className="flex-1">
          <label className="block text-gray-700">Nombre d'heures :</label>
          <input
            type="number"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            required
            className="mt-1 w-full p-2 border border-gray-300 rounded"
            min="0"
            step="0.1"
          />
        </div>
        <div className="flex-1">
          <label className="block text-gray-700">Taux horaire (€) :</label>
          <input
            type="number"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            required
            className="mt-1 w-full p-2 border border-gray-300 rounded"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
        >
          {initialData ? 'Modifier la prestation' : 'Ajouter une prestation'}
        </button>

        {initialData && (
          <button
            type="button"
            onClick={() => {
              setCurrentPrestation(null);
              setSelectedDescription(null);
              setHours('');
              setHourlyRate('');
              setDate('');
            }}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
};

export default AddPrestation;




