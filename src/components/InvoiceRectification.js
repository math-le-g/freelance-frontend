import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  PlusIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';
import axios from '../utils/axios-config';
import DescriptionSelect from './DescriptionSelect';
import 'react-datepicker/dist/react-datepicker.css';

// Fonction de formatage de la durée
function formatDuration(duration, durationUnit, billingType) {
  if (!duration) return '';
  if (billingType === 'hourly') {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return minutes > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}` : `${hours}h`;
  }
  switch (durationUnit) {
    case 'minutes':
      return `${duration}min`;
    case 'hours': {
      const h = Math.floor(duration / 60);
      const m = duration % 60;
      return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
    }
    case 'days': {
      const days = duration / 1440;
      return days === 0.5 ? '½ journée' : '1 journée';
    }
    default:
      return `${duration}min`;
  }
}

// Composant pour éditer une prestation dans la rectification
const EditPrestationForm = ({ prestation, onSave, onCancel }) => {
  const [localDate, setLocalDate] = useState(prestation.date ? prestation.date.slice(0, 10) : '');
  const [localDescription, setLocalDescription] = useState({
    value: prestation.description,
    label: prestation.description,
  });
  const [localBillingType, setLocalBillingType] = useState(prestation.billingType);
  const [localHours, setLocalHours] = useState('');
  const [localMinutes, setLocalMinutes] = useState('');
  const [localHourlyRate, setLocalHourlyRate] = useState('');
  const [localFixedPrice, setLocalFixedPrice] = useState('');
  const [localQuantity, setLocalQuantity] = useState(prestation.quantity || 1);
  const [localDurationUnit, setLocalDurationUnit] = useState(prestation.durationUnit || 'minutes');
  const [localDuration, setLocalDuration] = useState('');
  const [localDurationHours, setLocalDurationHours] = useState('');
  const [localDurationMinutes, setLocalDurationMinutes] = useState('');

  useEffect(() => {
    if (prestation) {
      setLocalDate(prestation.date ? prestation.date.slice(0, 10) : '');
      setLocalDescription({ value: prestation.description, label: prestation.description });
      setLocalBillingType(prestation.billingType);
      if (prestation.billingType === 'hourly') {
        const totalMin = prestation.duration || 0;
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        setLocalHours(String(h));
        setLocalMinutes(String(m));
        setLocalHourlyRate(String(prestation.hourlyRate));
      } else {
        setLocalFixedPrice(String(prestation.fixedPrice));
        setLocalQuantity(prestation.quantity || 1);
        setLocalDurationUnit(prestation.durationUnit || 'minutes');
        const totalMin = prestation.duration || 0;
        if (prestation.durationUnit === 'hours') {
          setLocalDurationHours(String(Math.floor(totalMin / 60)));
          setLocalDurationMinutes(String(totalMin % 60));
        } else if (prestation.durationUnit === 'days') {
          setLocalDuration(String(totalMin / 1440));
        } else {
          setLocalDuration(String(totalMin));
        }
      }
    }
  }, [prestation]);

  const handleSubmit = (e) => {
    e.preventDefault();
    let finalDuration = 0;
    let finalTotal = 0;
    if (localBillingType === 'hourly') {
      finalDuration = (parseFloat(localHours || 0) * 60) + parseFloat(localMinutes || 0);
      finalTotal =
        (parseFloat(localHours || 0) + parseFloat(localMinutes || 0) / 60) *
        parseFloat(localHourlyRate || 0);
    } else {
      if (localDurationUnit === 'hours') {
        finalDuration = (parseFloat(localDurationHours || 0) * 60) + parseFloat(localDurationMinutes || 0);
      } else if (localDurationUnit === 'days') {
        finalDuration = parseFloat(localDuration) === 0.5 ? 720 : 1440;
      } else {
        finalDuration = parseFloat(localDuration || 0);
      }
      finalTotal = parseFloat(localFixedPrice || 0) * parseInt(localQuantity || 1, 10);
    }
    const updatedPrestation = {
      ...prestation,
      description: localDescription ? localDescription.value : prestation.description,
      date: localDate || prestation.date,
      billingType: localBillingType,
      hours: localBillingType === 'hourly' ? parseFloat(localHours || 0) : undefined,
      hourlyRate: localBillingType === 'hourly' ? parseFloat(localHourlyRate || 0) : undefined,
      fixedPrice: localBillingType === 'fixed' ? parseFloat(localFixedPrice || 0) : undefined,
      quantity: localBillingType === 'fixed' ? parseInt(localQuantity || 1, 10) : 1,
      duration: finalDuration,
      durationUnit: localDurationUnit,
      total: parseFloat(finalTotal.toFixed(2)),
    };
    onSave(updatedPrestation);
    toast.success('Prestation mise à jour');
  };

  return (
    <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300 mb-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ligne 1 : Date et Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <DatePicker
              selected={localDate ? new Date(localDate) : new Date(prestation.date)}
              onChange={(date) => setLocalDate(format(date, 'yyyy-MM-dd'))}
              dateFormat="dd/MM/yyyy"
              locale={fr}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <DescriptionSelect
              value={localDescription || { value: prestation.description, label: prestation.description }}
              onChange={setLocalDescription}
            />
          </div>
        </div>

        {/* Type de facturation */}
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-700">Type de facturation :</span>
          <div className="flex items-center space-x-4 mt-2">
            <label className="inline-flex items-center text-sm">
              <input
                type="radio"
                name="billingType"
                value="hourly"
                checked={localBillingType === 'hourly'}
                onChange={(e) => setLocalBillingType(e.target.value)}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2">Taux horaire</span>
            </label>
            <label className="inline-flex items-center text-sm">
              <input
                type="radio"
                name="billingType"
                value="fixed"
                checked={localBillingType === 'fixed'}
                onChange={(e) => setLocalBillingType(e.target.value)}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2">Forfait</span>
            </label>
          </div>
        </div>

        {localBillingType === 'hourly' && (
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col bg-blue-50 p-4 rounded-lg">
              <span className="text-sm text-blue-600 mb-2">Durée × Taux horaire</span>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Heures</label>
                  <input
                    type="number"
                    value={localHours}
                    onChange={(e) => setLocalHours(e.target.value)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded"
                    min="0"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Minutes</label>
                  <input
                    type="number"
                    value={localMinutes}
                    onChange={(e) => setLocalMinutes(e.target.value)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded"
                    min="0"
                    max="59"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Taux (€/h)</label>
                  <input
                    type="number"
                    value={localHourlyRate}
                    onChange={(e) => setLocalHourlyRate(e.target.value)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {localBillingType === 'fixed' && (
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col bg-blue-50 p-4 rounded-lg">
              <span className="text-sm text-blue-600 mb-2">Forfait</span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prix forfaitaire (€)</label>
                  <input
                    type="number"
                    value={localFixedPrice}
                    onChange={(e) => setLocalFixedPrice(e.target.value)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantité</label>
                  <input
                    type="number"
                    value={localQuantity}
                    onChange={(e) => setLocalQuantity(e.target.value)}
                    className="mt-1 w-full p-2 border border-gray-300 rounded"
                    min="1"
                  />
                </div>
              </div>
  
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unité de temps</label>
                  <select
                    value={localDurationUnit}
                    onChange={(e) => {
                      setLocalDurationUnit(e.target.value);
                      setLocalDuration('');
                      setLocalDurationHours('');
                      setLocalDurationMinutes('');
                    }}
                    className="mt-1 w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Heures et minutes</option>
                    <option value="days">Jours</option>
                  </select>
                </div>
  
                <div>
                  {localDurationUnit === 'minutes' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Durée (min)</label>
                      <input
                        type="number"
                        value={localDuration}
                        onChange={(e) => setLocalDuration(e.target.value)}
                        className="mt-1 w-full p-2 border border-gray-300 rounded"
                        min="0"
                      />
                    </div>
                  )}
  
                  {localDurationUnit === 'hours' && (
                    <div className="flex gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Heures</label>
                        <input
                          type="number"
                          value={localDurationHours}
                          onChange={(e) => setLocalDurationHours(e.target.value)}
                          className="mt-1 w-20 p-2 border border-gray-300 rounded"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Minutes</label>
                        <input
                          type="number"
                          value={localDurationMinutes}
                          onChange={(e) => setLocalDurationMinutes(e.target.value)}
                          className="mt-1 w-20 p-2 border border-gray-300 rounded"
                          min="0"
                          max="59"
                        />
                      </div>
                    </div>
                  )}
  
                  {localDurationUnit === 'days' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Durée</label>
                      <select
                        value={localDuration}
                        onChange={(e) => setLocalDuration(e.target.value)}
                        className="mt-1 w-full p-2 border border-gray-300 rounded"
                      >
                        <option value="">-- Sélectionner --</option>
                        <option value="0.5">½ journée</option>
                        <option value="1">1 journée</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
  
        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            Sauvegarder
          </button>
        </div>
      </form>
    </div>
  );
};

const InvoiceRectification = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [facture, setFacture] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPrestation, setEditingPrestation] = useState(null);
  const [reason, setReason] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  useEffect(() => {
    const fetchFacture = async () => {
      try {
        const response = await axios.get(`/factures/${id}`);
        setFacture(response.data);
        setIsLoading(false);
      } catch (error) {
        toast.error(`Erreur : ${error.response?.data?.message || error.message}`);
      }
    };
    fetchFacture();
  }, [id]);
  
  const handleSaveRectification = async () => {
    try {
      if (!facture.prestations?.length) {
        throw new Error('Au moins une prestation est requise');
      }
      
      const response = await axios.post(`/factures/${id}/rectify`, {
        modifiedInvoice: facture,
        reason: reason || "Rectification sans motif spécifié"
      });
  
      if (response.data) {
        toast.success('Rectification enregistrée avec succès');
        setHasUnsavedChanges(false);
        navigate('/mes-factures');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(`Erreur : ${message}`);
      console.error('Erreur détaillée:', error);
    }
  };
  
  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(montant || 0);
  };
  
  const handleDeletePrestation = (prestationId) => {
    const updatedPrestations = facture.prestations.filter(p => p._id !== prestationId);
    setFacture(prev => ({ ...prev, prestations: updatedPrestations }));
    setHasUnsavedChanges(true);
    toast.success('Prestation supprimée');
  };
  
  const handleAddPrestation = () => {
    const newPrestation = {
      _id: `temp-${Date.now()}`,
      description: 'Nouvelle prestation',
      date: new Date().toISOString(),
      billingType: 'hourly',
      hours: 0,
      minutes: 0,
      hourlyRate: 0,
      total: 0,
      quantity: 1,
      duration: 0,
      durationUnit: 'minutes'
    };
    setFacture(prev => ({ ...prev, prestations: [...prev.prestations, newPrestation] }));
    setEditingPrestation(newPrestation);
    setHasUnsavedChanges(true);
    toast.success('Prestation ajoutée');
  };

  // Calcul du résumé
  const totalBrut = facture ? facture.montantHT : 0;
  const totalNet = facture ? facture.montantNet : 0;
  const nbPrestations = facture ? facture.prestations.length : 0;
  const nbHeures = facture ? facture.nombreHeures : 0;
  const urssaf = facture ? facture.taxeURSSAF : 0;
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Bouton Retour en haut à gauche */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate('/mes-factures')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Retour
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold mb-4">
            Rectification Facture #{facture.invoiceNumber} - {facture.client?.name || 'Client inconnu'}
          </h1>
  
          {/* Résumé en 5 colonnes */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Total Brut</p>
              <p className="font-semibold">{formatMontant(totalBrut)}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm text-indigo-600 mb-1">Total Net</p>
              <p className="font-semibold">{formatMontant(totalNet)}</p>
            </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 mb-1">Taxe URSSAF</p>
                <p className="font-semibold">{formatMontant(urssaf)}</p>
              </div>


            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 mb-1">Prestations</p>
              <p className="font-semibold">{nbPrestations}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 mb-1">Heures</p>
              <p className="font-semibold">{nbHeures.toFixed(2)} h</p>
            </div>
            
          </div>
  
          {/* Bouton "+ Ajouter une prestation" placé en haut */}
          <div className="mb-6">
            <button
              onClick={handleAddPrestation}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              + Ajouter une prestation
            </button>
          </div>
  
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-6">Prestations</h2>
  
            {editingPrestation && (
              <EditPrestationForm
                prestation={editingPrestation}
                onSave={(updatedPrestation) => {
                  const updatedPrestations = facture.prestations.map(p =>
                    p._id === updatedPrestation._id ? updatedPrestation : p
                  );
                  setFacture({ ...facture, prestations: updatedPrestations });
                  setHasUnsavedChanges(true);
                  setEditingPrestation(null);
                }}
                onCancel={() => setEditingPrestation(null)}
              />
            )}
  
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {facture.prestations.map(prestation => (
                <div key={prestation._id} className="bg-white border border-gray-200 rounded-lg shadow-md p-4 hover:shadow-lg transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium">{prestation.description}</h4>
                      <p className="text-sm text-gray-600">
                        {format(new Date(prestation.date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setEditingPrestation(prestation);
                        }}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePrestation(prestation._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
  
                  <div className="bg-blue-50/50 p-3 rounded-lg">
                    {prestation.billingType === 'hourly' ? (
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-sm text-blue-600">Durée × Taux horaire</span>
                          <span className="text-md font-medium text-gray-800">
                            {formatDuration(prestation.duration, 'hours', 'hourly')} × {prestation.hourlyRate}€/h
                          </span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-sm text-blue-600">Total</span>
                          <span className="text-lg font-semibold text-blue-600">
                            {formatMontant(prestation.total)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-sm text-blue-600">
                            Forfait{prestation.quantity > 1 ? ` (${prestation.quantity}×)` : ''}
                          </span>
                          <span className="text-md font-medium text-gray-800">
                            {prestation.fixedPrice}€ {prestation.duration && `- ${formatDuration(prestation.duration, prestation.durationUnit)}`}
                          </span>
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-sm text-blue-600">Total</span>
                          <span className="text-lg font-semibold text-blue-600">
                            {formatMontant(prestation.total)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
  
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-2">Motif de la rectification</h3>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-300"
              rows="2"
              placeholder="Décrivez en détail la raison de cette rectification..."
            />
          </div>
  
          <div className="mt-6 flex justify-end items-center gap-4">
            {hasUnsavedChanges && (
              <span className="text-sm text-red-600">
                Modifications non sauvegardées !
              </span>
            )}
            <button
              onClick={handleSaveRectification}
              disabled={!hasUnsavedChanges}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Valider la rectification
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceRectification;

