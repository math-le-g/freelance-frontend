import React, { useState, useEffect } from 'react';
import DescriptionSelect from './DescriptionSelect';
import { toast } from 'react-toastify';
import { usePrestation } from '../contexts/PrestationContext';
import { useInvoice } from '../contexts/InvoiceContext';

// convertit (heures,minutes) => total minutes
function hmToMinutes(h, m) {
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
}

// convertit la durée selon l'unité
function convertDurationToMinutes(unit, input1, input2) {
  switch (unit) {
    case 'minutes':
      return parseInt(input1, 10) || 0;
    case 'hours':
      return hmToMinutes(input1, input2);
    case 'days':
      return Math.round((parseFloat(input1) || 0) * 24 * 60);
    default:
      return 0;
  }
}

const AddPrestation = ({
  addPrestation,
  updatePrestation,
  initialData,
  selectedClient,
  setCurrentPrestation,
}) => {
  const { fetchPrestations } = usePrestation();
  const { fetchNextInvoiceNumber } = useInvoice();

  // État local
  const [date, setDate] = useState('');
  const [selectedDescription, setSelectedDescription] = useState(null);
  const [billingType, setBillingType] = useState('hourly');

  // "hourly"
  const [hours, setHours] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');

  // "fixed" & "daily"
  const [fixedPrice, setFixedPrice] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Durée (pour "fixed", potentiellement)
  const [durationUnit, setDurationUnit] = useState('minutes');
  const [durationInput1, setDurationInput1] = useState('');
  const [durationInput2, setDurationInput2] = useState('');

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date ? initialData.date.slice(0, 10) : '');
      setSelectedDescription(
        initialData.description
          ? {
              value: initialData.description,
              label:
                initialData.description.charAt(0).toUpperCase() +
                initialData.description.slice(1),
            }
          : null
      );
      setBillingType(initialData.billingType || 'hourly');

      setHours(initialData.hours?.toString() || '');
      setHourlyRate(initialData.hourlyRate?.toString() || '');
      setFixedPrice(initialData.fixedPrice?.toString() || '');
      setQuantity(initialData.quantity || 1);

      setDurationUnit(initialData.durationUnit || 'minutes');
      const totalMin = initialData.duration || 0;
      if (initialData.durationUnit === 'minutes') {
        setDurationInput1(String(totalMin));
        setDurationInput2('');
      } else if (initialData.durationUnit === 'hours') {
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        setDurationInput1(String(h));
        setDurationInput2(String(m));
      } else if (initialData.durationUnit === 'days') {
        const nbDays = totalMin / (24 * 60);
        setDurationInput1(String(nbDays));
        setDurationInput2('');
      }
    } else {
      // Reset
      setDate('');
      setSelectedDescription(null);
      setBillingType('hourly');
      setHours('');
      setHourlyRate('');
      setFixedPrice('');
      setQuantity(1);
      setDurationUnit('minutes');
      setDurationInput1('');
      setDurationInput2('');
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClient || !selectedClient._id) {
      toast.error('Veuillez sélectionner un client valide.');
      return;
    }
    if (!selectedDescription) {
      toast.error('Veuillez saisir une description.');
      return;
    }

    // Construction
    const prestationData = {
      description: selectedDescription.value,
      clientId: selectedClient._id,
      date: date || new Date().toISOString(),
    };

    if (billingType === 'hourly') {
      // Taux horaire
      prestationData.billingType = 'hourly';
      if (!hours || !hourlyRate || isNaN(hours) || isNaN(hourlyRate)) {
        toast.error('Valeurs invalides pour heures / taux horaire.');
        return;
      }
      prestationData.hours = parseFloat(hours);
      prestationData.hourlyRate = parseFloat(hourlyRate);
    } else if (billingType === 'fixed') {
      // Forfait
      prestationData.billingType = 'fixed';
      if (!fixedPrice || isNaN(fixedPrice)) {
        toast.error('Valeur invalide pour le prix forfaitaire.');
        return;
      }
      prestationData.fixedPrice = parseFloat(fixedPrice);
      if (durationUnit !== 'days') {
        prestationData.quantity = parseInt(quantity, 10) || 1;
      } else {
        prestationData.quantity = 1;
      }

      const totalMin = convertDurationToMinutes(durationUnit, durationInput1, durationInput2);
      prestationData.duration = totalMin;
      prestationData.durationUnit = durationUnit;
    } else if (billingType === 'daily') {
      // Journalier
      prestationData.billingType = 'daily';
      if (!fixedPrice || isNaN(fixedPrice)) {
        toast.error('Valeur invalide pour le prix journalier.');
        return;
      }
      prestationData.fixedPrice = parseFloat(fixedPrice);
      prestationData.quantity = 1; // on ignore quantity
      // ex: 3 jours => convertDurationToMinutes('days', 3, '') => 4320
      prestationData.duration = convertDurationToMinutes('days', durationInput1, '');
      prestationData.durationUnit = 'days';
    }

    try {
      if (initialData && initialData._id) {
        await updatePrestation({ _id: initialData._id, ...prestationData });
      } else {
        await addPrestation(prestationData);
      }
      fetchPrestations();
      fetchNextInvoiceNumber();
      handleReset();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error("❌ Erreur lors de la sauvegarde de la prestation.");
    }
  };

  const handleReset = () => {
    setCurrentPrestation(null);
    setDate('');
    setSelectedDescription(null);
    setBillingType('hourly');
    setHours('');
    setHourlyRate('');
    setFixedPrice('');
    setQuantity(1);
    setDurationUnit('minutes');
    setDurationInput1('');
    setDurationInput2('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative min-h-[450px] pb-24 px-4 pt-4 rounded-lg shadow transition-all 
        ${initialData ? 'bg-yellow-100 border-l-4 border-yellow-500' : 'bg-white'}
      `}
    >
      {initialData && (
        <div className="text-yellow-700 mb-4 font-semibold">
          Modifier la prestation #{initialData._id}
        </div>
      )}

      {/* Ligne 1 : Date + Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="mt-1 w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <DescriptionSelect
            value={selectedDescription}
            onChange={setSelectedDescription}
          />
        </div>
      </div>

      {/* Radios */}
      <div className="mb-4">
        <span className="text-sm font-medium text-gray-700">Type de facturation :</span>
        <div className="flex items-center space-x-4 mt-2">
          <label className="inline-flex items-center text-sm">
            <input
              type="radio"
              name="billingType"
              value="hourly"
              checked={billingType === 'hourly'}
              onChange={(e) => setBillingType(e.target.value)}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2">Taux horaire</span>
          </label>
          <label className="inline-flex items-center text-sm">
            <input
              type="radio"
              name="billingType"
              value="fixed"
              checked={billingType === 'fixed'}
              onChange={(e) => setBillingType(e.target.value)}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2">Forfait</span>
          </label>
          <label className="inline-flex items-center text-sm">
            <input
              type="radio"
              name="billingType"
              value="daily"
              checked={billingType === 'daily'}
              onChange={(e) => setBillingType(e.target.value)}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2">Journalier</span>
          </label>
        </div>
      </div>

      {/* 1) Taux horaire */}
      <div
        className={`transition-opacity duration-300 absolute inset-x-0 ${
          billingType === 'hourly'
            ? 'relative opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="grid grid-cols-2 gap-4 mt-2 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Heures</label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded"
              min="0"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Taux horaire (€)</label>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* 2) Forfait */}
      <div
        className={`transition-opacity duration-300 absolute inset-x-0 ${
          billingType === 'fixed'
            ? 'relative opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="grid grid-cols-2 gap-4 mt-2 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Forfait (€)</label>
            <input
              type="number"
              value={fixedPrice}
              onChange={(e) => setFixedPrice(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded"
              min="0"
              step="0.01"
            />
          </div>
          {durationUnit !== 'days' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantité</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded"
                min="1"
              />
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Unité</label>
              <select
                value={durationUnit}
                onChange={(e) => {
                  setDurationUnit(e.target.value);
                  setDurationInput1('');
                  setDurationInput2('');
                }}
                className="mt-1 w-full p-2 border border-gray-300 rounded"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Heures</option>
                <option value="days">Jours</option>
              </select>
            </div>
            <div>
              {durationUnit === 'minutes' && (
                <>
                  <label className="block text-sm font-medium text-gray-700">Durée (min)</label>
                  <input
                    type="number"
                    value={durationInput1}
                    onChange={(e) => setDurationInput1(e.target.value)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded"
                    placeholder="80"
                    min="0"
                  />
                </>
              )}
              {durationUnit === 'hours' && (
                <div className="flex space-x-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">H</label>
                    <input
                      type="number"
                      value={durationInput1}
                      onChange={(e) => setDurationInput1(e.target.value)}
                      className="mt-1 w-16 p-2 border border-gray-300 rounded"
                      placeholder="1"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Min</label>
                    <input
                      type="number"
                      value={durationInput2}
                      onChange={(e) => setDurationInput2(e.target.value)}
                      className="mt-1 w-16 p-2 border border-gray-300 rounded"
                      placeholder="30"
                      min="0"
                      max="59"
                    />
                  </div>
                </div>
              )}
              {durationUnit === 'days' && (
                <>
                  <label className="block text-sm font-medium text-gray-700">Jours</label>
                  <input
                    type="number"
                    value={durationInput1}
                    onChange={(e) => setDurationInput1(e.target.value)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded"
                    placeholder="2"
                    min="0"
                    step="0.5"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3) Journalier */}
      <div
        className={`transition-opacity duration-300 absolute inset-x-0 ${
          billingType === 'daily'
            ? 'relative opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="grid grid-cols-2 gap-4 mt-2 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Prix journalier (€)</label>
            <input
              type="number"
              value={fixedPrice}
              onChange={(e) => setFixedPrice(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded"
              min="0"
              step="0.01"
              placeholder="Ex: 100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Jours</label>
            <input
              type="number"
              value={durationInput1}
              onChange={(e) => setDurationInput1(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded"
              min="0"
              step="0.5"
              placeholder="3"
            />
          </div>
        </div>
      </div>

      {/* Boutons en bas */}
      <div className="absolute bottom-4 left-4 right-4 flex space-x-3 justify-end">
        <button
          type="submit"
          className="bg-blue-600 text-white font-semibold py-2 px-5 rounded hover:bg-blue-700 transition-colors"
        >
          {initialData ? 'Modifier' : 'Ajouter'}
        </button>
        {initialData && (
          <button
            type="button"
            onClick={handleReset}
            className="bg-gray-400 text-white font-semibold py-2 px-5 rounded hover:bg-gray-500 transition-colors"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
};

export default AddPrestation;
