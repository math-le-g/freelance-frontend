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
  CalendarIcon,
  ClockIcon,
  BanknotesIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  UserIcon,
  XMarkIcon,
  DocumentPlusIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import axios from '../utils/axios-config';
import DescriptionSelect from './DescriptionSelect';
import 'react-datepicker/dist/react-datepicker.css';

// Fonction utilitaire pour formater la durée
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

// Composant de carte résumé
const SummaryCard = ({ icon: Icon, title, value, unit, trend }) => (
  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4
                  transform hover:scale-105 transition-all duration-200">
    <div className="flex justify-between items-start mb-2">
      <span className="text-sm text-white/70">{title}</span>
      <Icon className="h-5 w-5 text-white/40" />
    </div>
    <div className="flex items-baseline">
      <span className="text-2xl font-bold text-white">{value}</span>
      {unit && <span className="ml-1 text-white/70">{unit}</span>}
    </div>
    {trend && (
      <div className={`mt-1 text-sm ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </div>
    )}
  </div>
)

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
        setLocalHours(String(Math.floor(totalMin / 60)));
        setLocalMinutes(String(totalMin % 60));
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

  const calculateTotal = () => {
    let finalDuration = 0;
    let finalTotal = 0;

    if (localBillingType === 'hourly') {
      finalDuration = (parseFloat(localHours || 0) * 60) + parseFloat(localMinutes || 0);
      finalTotal = (parseFloat(localHours || 0) + parseFloat(localMinutes || 0) / 60) *
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

    return {
      duration: finalDuration,
      total: parseFloat(finalTotal.toFixed(2))
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { duration, total } = calculateTotal();

    const updatedPrestation = {
      ...prestation,
      description: localDescription.value,
      date: localDate || prestation.date,
      billingType: localBillingType,
      hours: localBillingType === 'hourly' ? parseFloat(localHours || 0) : undefined,
      hourlyRate: localBillingType === 'hourly' ? parseFloat(localHourlyRate || 0) : undefined,
      fixedPrice: localBillingType === 'fixed' ? parseFloat(localFixedPrice || 0) : undefined,
      quantity: localBillingType === 'fixed' ? parseInt(localQuantity || 1, 10) : 1,
      duration: duration,
      durationUnit: localDurationUnit,
      total: total
    };

    onSave(updatedPrestation);
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
      <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">
          {prestation._id.startsWith('temp-') ? 'Nouvelle prestation' : 'Modifier la prestation'}
        </h3>
        <button
          onClick={onCancel}
          className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Date et Description */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">Date</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
              <DatePicker
                selected={localDate ? new Date(localDate) : new Date(prestation.date)}
                onChange={(date) => setLocalDate(format(date, 'yyyy-MM-dd'))}
                dateFormat="dd/MM/yyyy"
                locale={fr}
                className="w-full pl-10 py-2 bg-white/10 border border-white/20 rounded-lg text-white
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-1">Description</label>
            <DescriptionSelect
              value={localDescription}
              onChange={setLocalDescription}
              styles={{
                control: (base) => ({
                  ...base,
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.3)'
                  }
                }),
                input: (base) => ({
                  ...base,
                  color: 'white'
                }),
                singleValue: (base) => ({
                  ...base,
                  color: 'white'
                }),
                menu: (base) => ({
                  ...base,
                  background: 'rgba(30, 41, 59, 0.95)',
                  backdropFilter: 'blur(8px)'
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(59, 130, 246, 0.3)'
                  }
                })
              }}
            />
          </div>
        </div>

        {/* Type de facturation */}
        <div>
          <label className="block text-sm font-medium text-white/90 mb-3">Type de facturation</label>
          <div className="flex gap-6">
            <label className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="billingType"
                value="hourly"
                checked={localBillingType === 'hourly'}
                onChange={(e) => setLocalBillingType(e.target.value)}
                className="text-blue-500 focus:ring-blue-500 h-4 w-4 border-white/20 bg-white/10"
              />
              <span className="ml-2 text-white/90 group-hover:text-white">Taux horaire</span>
            </label>
            <label className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="billingType"
                value="fixed"
                checked={localBillingType === 'fixed'}
                onChange={(e) => setLocalBillingType(e.target.value)}
                className="text-blue-500 focus:ring-blue-500 h-4 w-4 border-white/20 bg-white/10"
              />
              <span className="ml-2 text-white/90 group-hover:text-white">Forfait</span>
            </label>
          </div>
        </div>

        {/* Champs conditionnels selon le type de facturation */}
        {localBillingType === 'hourly' ? (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">Heures</label>
              <div className="relative">
                <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <input
                  type="number"
                  value={localHours}
                  onChange={(e) => setLocalHours(e.target.value)}
                  min="0"
                  className="w-full pl-10 py-2 bg-white/10 border border-white/20 rounded-lg text-white
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">Minutes</label>
              <div className="relative">
                <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <input
                  type="number"
                  value={localMinutes}
                  onChange={(e) => setLocalMinutes(e.target.value)}
                  min="0"
                  max="59"
                  className="w-full pl-10 py-2 bg-white/10 border border-white/20 rounded-lg text-white
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">Taux horaire (€)</label>
              <div className="relative">
                <BanknotesIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <input
                  type="number"
                  value={localHourlyRate}
                  onChange={(e) => setLocalHourlyRate(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full pl-10 py-2 bg-white/10 border border-white/20 rounded-lg text-white
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">Prix forfaitaire (€)</label>
                <div className="relative">
                  <BanknotesIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <input
                    type="number"
                    value={localFixedPrice}
                    onChange={(e) => setLocalFixedPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full pl-10 py-2 bg-white/10 border border-white/20 rounded-lg text-white
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-1">Quantité</label>
                <div className="relative">
                  <DocumentTextIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <input
                    type="number"
                    value={localQuantity}
                    onChange={(e) => setLocalQuantity(e.target.value)}
                    min="1"
                    className="w-full pl-10 py-2 bg-white/10 border border-white/20 rounded-lg text-white
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-1">Durée</label>
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={localDurationUnit}
                  onChange={(e) => {
                    setLocalDurationUnit(e.target.value);
                    setLocalDuration('');
                    setLocalDurationHours('');
                    setLocalDurationMinutes('');
                  }}
                  className="w-full py-2 pl-3 bg-white/10 border border-white/20 rounded-lg text-white
            focus:ring-2 focus:ring-blue-500 focus:border-transparent [&>option]:text-gray-900 [&>option]:bg-white"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Heures et minutes</option>
                  <option value="days">Jours</option>
                </select>

                {localDurationUnit === 'minutes' && (
                  <div className="relative">
                    <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                    <input
                      type="number"
                      value={localDuration}
                      onChange={(e) => setLocalDuration(e.target.value)}
                      min="0"
                      className="w-full pl-10 py-2 bg-white/10 border border-white/20 rounded-lg text-white
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Minutes"
                    />
                  </div>
                )}

                {localDurationUnit === 'hours' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        value={localDurationHours}
                        onChange={(e) => setLocalDurationHours(e.target.value)}
                        min="0"
                        className="w-full pl-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Heures"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={localDurationMinutes}
                        onChange={(e) => setLocalDurationMinutes(e.target.value)}
                        min="0"
                        max="59"
                        className="w-full pl-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Minutes"
                      />
                    </div>
                  </div>
                )}

                {localDurationUnit === 'days' && (
                  <select
                    value={localDuration}
                    onChange={(e) => setLocalDuration(e.target.value)}
                    className="w-full py-2 pl-3 bg-white/10 border border-white/20 rounded-lg text-white
              focus:ring-2 focus:ring-blue-500 focus:border-transparent [&>option]:text-gray-900 [&>option]:bg-white"
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="0.5">½ journée</option>
                    <option value="1">1 journée</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Récapitulatif des calculs */}
        <div className="mt-6 p-4 bg-white/5 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-white/70">Total calculé</span>
              <div className="text-xl font-bold text-white mt-1">
                {calculateTotal().total.toFixed(2)}€
              </div>
            </div>
            <div>
              <span className="text-sm text-white/70">Durée totale</span>
              <div className="text-xl font-bold text-white mt-1">
                {formatDuration(calculateTotal().duration, localDurationUnit, localBillingType)}
              </div>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 
                  hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg transition-colors"
          >
            <CheckCircleIcon className="h-5 w-5 mr-2" />
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
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const fetchFacture = async () => {
    try {
      const response = await axios.get(`/factures/${id}`);
      setFacture(response.data);
      setIsLoading(false);
    } catch (error) {
      toast.error(`Erreur : ${error.response?.data?.message || error.message}`);
      navigate('/mes-factures');
    }
  };

  // Utiliser fetchFacture dans useEffect
  useEffect(() => {
    fetchFacture();
  }, [id, navigate]);

  // Fonctions de gestion
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
    setFacture(prev => ({
      ...prev,
      prestations: [...prev.prestations, newPrestation]
    }));
    setEditingPrestation(newPrestation);
    setHasUnsavedChanges(true);
    toast.success('Nouvelle prestation ajoutée');
  };

  const handleDeletePrestation = (prestationId) => {
    const updatedPrestations = facture.prestations.filter(p => p._id !== prestationId);
    setFacture(prev => ({ ...prev, prestations: updatedPrestations }));
    setHasUnsavedChanges(true);
    toast.success('Prestation supprimée');
  };

  const handleSavePrestation = (updatedPrestation) => {
    const updatedPrestations = facture.prestations.map(p =>
      p._id === updatedPrestation._id ? updatedPrestation : p
    );
    setFacture(prev => ({ ...prev, prestations: updatedPrestations }));
    setHasUnsavedChanges(true);
    setEditingPrestation(null);
    toast.success('Prestation mise à jour');
  };

  const handleSaveRectification = async () => {
    try {
      if (!facture.prestations?.length) {
        throw new Error('Au moins une prestation est requise');
      }

      setIsConfirmModalOpen(true);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleConfirmSave = async () => {
    try {
      const response = await axios.post(`/factures/${id}/rectify`, {
        modifiedInvoice: facture,
        reason: reason.trim()
      });

      if (response.data) {
        toast.success('Rectification enregistrée avec succès');
        setHasUnsavedChanges(false);
        setIsConfirmModalOpen(false);
        navigate('/mes-factures');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      toast.error(`Erreur : ${message}`);
      setIsConfirmModalOpen(false);
    }
  };

  // Calculs des totaux
  const calculateTotals = () => {
    if (!facture?.prestations) return {
      montantHT: 0,
      montantNet: 0,
      taxeURSSAF: 0,
      nombreHeures: 0
    };

    // Calcul du montant HT et heures totales
    const prestationTotals = facture.prestations.reduce((acc, p) => {
      const prestationTotal = p.total || 0;
      const duration = p.duration || 0;

      return {
        montantHT: acc.montantHT + prestationTotal,
        nombreHeures: acc.nombreHeures + duration / 60,
      };
    }, { montantHT: 0, nombreHeures: 0 });

    // Taux URSSAF (24.6% par défaut si non défini)
    const tauxURSSAF = 0.246;
    const taxeURSSAF = parseFloat((prestationTotals.montantHT * tauxURSSAF).toFixed(2));

    return {
      montantHT: prestationTotals.montantHT,
      montantNet: parseFloat((prestationTotals.montantHT - taxeURSSAF).toFixed(2)),
      taxeURSSAF: taxeURSSAF,
      nombreHeures: prestationTotals.nombreHeures
    };
  };

  return (
    <div className="min-h-screen bg-modern">
      {/* Header fixe avec vague */}
      <div className="fixed top-0 left-0 right-0 h-36 z-10 overflow-hidden">
        <div className="absolute inset-0">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 1200 400">
            <defs>
              <linearGradient id="rectificationGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            <path d="M0,0 L0,280 Q 300,350 600,280 T 1200,280 L1200,0 Z" fill="url(#rectificationGradient)" />
          </svg>
        </div>

        {/* Contenu du header */}
        <div className="relative h-full flex items-center justify-between px-6">
          <button
            onClick={() => navigate('/mes-factures')}
            className="flex items-center space-x-2 text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Retour</span>
          </button>

          <div className="flex flex-col items-end">
            <h1 className="text-2xl font-bold text-white">
              Rectification de facture
            </h1>
            {!isLoading && (
              <p className="text-white/80">
                #{facture?.invoiceNumber} - {facture?.client?.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-6 pb-24">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin">
              <ArrowPathIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cards de résumé */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="col-span-2">
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-400/20 backdrop-blur-sm 
                  border border-white/20 rounded-xl p-4 h-full">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm text-white/70">Client</span>
                      <span className="text-xl font-bold text-white mt-1">
                        {facture.client?.name}
                      </span>
                    </div>
                    <UserIcon className="h-8 w-8 text-white/40" />
                  </div>
                </div>
              </div>

              <SummaryCard
                icon={BanknotesIcon}
                title="Total Brut"
                value={Number(calculateTotals().montantHT || 0).toFixed(2)}
                unit="€"
              />

              <SummaryCard
                icon={BanknotesIcon}
                title="Total Net"
                value={Number(calculateTotals().montantNet || 0).toFixed(2)}
                unit="€"
              />

              <SummaryCard
                icon={DocumentTextIcon}
                title="Prestations"
                value={facture?.prestations?.length || 0}
              />

              <SummaryCard
                icon={ClockIcon}
                title="Heures totales"
                value={Number(calculateTotals().nombreHeures || 0).toFixed(1)}
                unit="h"
              />
            </div>

            {/* Zone principale avec prestations et édition */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Liste des prestations */}
              <div className="lg:w-2/3">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Prestations</h2>
                    <button
                      onClick={handleAddPrestation}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500
                               hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-colors"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Nouvelle prestation
                    </button>
                  </div>

                  <div className="space-y-4">
                    {facture.prestations.map(prestation => (
                      <div
                        key={prestation._id}
                        className={`bg-white/5 border border-white/10 rounded-lg p-4 
                                  ${editingPrestation?._id === prestation._id ? 'ring-2 ring-blue-500' : 'hover:bg-white/10'} 
                                  transition-all duration-200`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-medium text-white">
                                {prestation.description}
                              </h3>
                              <span className="text-sm text-white/50">
                                {format(new Date(prestation.date), 'dd MMM yyyy', { locale: fr })}
                              </span>
                            </div>

                            <div className="mt-2 flex items-center gap-4 text-sm text-white/70">
                              <span className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {formatDuration(prestation.duration, prestation.durationUnit, prestation.billingType)}
                              </span>
                              <span className="flex items-center">
                                <BanknotesIcon className="h-4 w-4 mr-1" />
                                {prestation.billingType === 'hourly'
                                  ? `${prestation.hourlyRate}€/h`
                                  : `${prestation.fixedPrice}€${prestation.quantity > 1 ? ` × ${prestation.quantity}` : ''}`
                                }
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start space-x-2">
                            <span className="text-lg font-semibold text-white">
                              {prestation.total.toFixed(2)}€
                            </span>
                            <div className="flex">
                              <button
                                onClick={() => setEditingPrestation(prestation)}
                                className="p-1 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePrestation(prestation._id)}
                                className="p-1 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors ml-1"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {facture.prestations.length === 0 && (
                      <div className="text-center py-8 text-white/50">
                        Aucune prestation. Cliquez sur "Nouvelle prestation" pour commencer.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Zone d'édition ou motif */}
              <div className="lg:w-1/3">
                <div className="sticky top-40">
                  {editingPrestation ? (
                    <EditPrestationForm
                      prestation={editingPrestation}
                      onSave={handleSavePrestation}
                      onCancel={() => setEditingPrestation(null)}
                    />
                  ) : (
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">
                          Motif de la rectification
                        </h3>
                        <span className="text-sm text-white/60 italic">Facultatif</span>
                      </div>
                      <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white 
                                 placeholder-white/30 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="4"
                        placeholder="Décrivez en détail la raison de cette rectification (facultatif)..."
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer flottant avec message de modification */}
      {hasUnsavedChanges && (
  <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-sm">
    <div className="container mx-auto px-6 py-4 flex items-center justify-between">
      <div className="flex items-center">
        <div className="animate-pulse mr-3">⚠️</div>
        <span className="text-white font-medium">
          Des modifications sont en attente de validation
        </span>
      </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditingPrestation(null);
                  setHasUnsavedChanges(false);
                  // Recharger la facture originale
                  fetchFacture();
                }}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
        >
                Annuler les modifications
              </button>
              <button
                onClick={handleSaveRectification}
                
                className="px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-white/90 transition-colors
                    flex items-center"
              >
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                {reason.trim() ? 'Sauvegarder avec motif' : 'Sauvegarder sans motif'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" />

            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                  <DocumentTextIcon className="h-6 w-6 text-orange-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">
                    Confirmer la rectification
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Cette action va générer une nouvelle version de la facture.
                      Voulez-vous continuer ?
                    </p>

                    <div className="mt-4 bg-orange-50 p-4 rounded-lg">
                      {reason.trim() ? (
                        <>
                          <p className="text-sm font-medium text-orange-800">
                            Motif de la rectification :
                          </p>
                          <p className="mt-1 text-sm text-orange-700">
                            {reason}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-orange-700 italic">
                          Aucun motif spécifié pour cette rectification
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="inline-flex w-full justify-center rounded-md bg-orange-600 px-3 py-2 text-sm 
                            font-semibold text-white shadow-sm hover:bg-orange-500 sm:ml-3 sm:w-auto"
                >
                  Confirmer la rectification
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm 
                            font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 
                            hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceRectification;


/*
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
*/
