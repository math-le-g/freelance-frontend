import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Icônes Heroicons
import {
    ArrowLeftIcon,
    PlusIcon,
    TrashIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';

// Fonctions utilitaires
function hmToMinutes(h, m) {
    const hh = parseInt(h, 10) || 0;
    const mm = parseInt(m, 10) || 0;
    return hh * 60 + mm;
}
function convertDurationToMinutes(unit, val1, val2) {
    if (unit === 'hours') {
        return hmToMinutes(val1, val2);
    }
    if (unit === 'days') {
        return Math.round(parseFloat(val1) * 1440); // val1 = "0.5" ou "1"
    }
    return parseInt(val1, 10) || 0; // minutes
}

// Calcul rapide de stats
function computeStats(prestations) {
    let totalBrut = 0;
    let totalHeures = 0;
    let nbPrestations = prestations.length;

    prestations.forEach((p) => {
        let subTotal = 0;
        if (p.billingType === 'hourly') {
            // (heures + minutes/60) * taux
            const hrs = parseFloat(p.hours || 0) + (parseFloat(p.minutes || 0) / 60);
            const rate = parseFloat(p.hourlyRate) || 0;
            subTotal = hrs * rate;
            totalHeures += hrs;
        } else {
            // Forfait
            const prix = parseFloat(p.fixedPrice) || 0;
            const quant = parseFloat(p.quantity) || 1;
            subTotal = prix * quant;
        }
        totalBrut += subTotal;
    });

    const tauxUrssaf = 0.246;
    const totalNet = totalBrut * (1 - tauxUrssaf);
    return {
        totalBrut: parseFloat(totalBrut.toFixed(2)),
        totalNet: parseFloat(totalNet.toFixed(2)),
        nbPrestations,
        totalHeures: parseFloat(totalHeures.toFixed(2)),
    };
}

// Fonction utilitaire pour convertir toutes les durées en minutes
const convertToMinutes = (unit, input1, input2 = 0) => {
    switch (unit) {
      case 'minutes':
        return parseInt(input1, 10) || 0;
      case 'hours':
        const hours = parseInt(input1, 10) || 0;
        const minutes = parseInt(input2, 10) || 0;
        return (hours * 60) + minutes;
      case 'days':
        // 0.5 jour = 4 heures = 240 minutes
        // 1 jour = 8 heures = 480 minutes
        return input1 === '0.5' ? 240 : 480;
      default:
        return 0;
    }
  };

const InvoiceRectificationNew = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [originalFacture, setOriginalFacture] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [prestationsData, setPrestationsData] = useState([]);
    const [reason, setReason] = useState('');
    const [stats, setStats] = useState({
        totalBrut: 0,
        totalNet: 0,
        nbPrestations: 0,
        totalHeures: 0,
    });

    // 1) Charger la facture d'origine
    useEffect(() => {
        const fetchFacture = async () => {
            try {
                const token = localStorage.getItem('token');
                const resp = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/factures/${id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!resp.data) {
                    console.log('Facture originale:', resp.data);
                    toast.error('Facture introuvable');
                    return navigate('/mes-factures');
                }
                setOriginalFacture(resp.data);

                if (Array.isArray(resp.data.prestations)) {
                    const clone = resp.data.prestations.map((p) => ({
                        ...p,
                        date: p.date ? p.date.slice(0, 10) : '',
                        billingType: p.billingType || 'hourly',
                        hours: p.hours || 0,
                        minutes: 0,
                        hourlyRate: p.hourlyRate || 0,
                        fixedPrice: p.fixedPrice || 0,
                        quantity: p.quantity || 1,
                        durationUnit: p.durationUnit || 'minutes',
                    }));
                    setPrestationsData(clone);
                }
                setIsLoading(false);
            } catch (err) {
                console.error('Erreur récupération facture:', err);
                toast.error("Impossible de charger la facture d'origine");
                navigate('/mes-factures');
            }
        };
        fetchFacture();
    }, [id, navigate]);

    // 2) Mettre à jour les stats
    useEffect(() => {
        setStats(computeStats(prestationsData));
    }, [prestationsData]);
    console.log('Prestations mises à jour:', prestationsData);

    // 3) Modifier champ
    const handlePrestationChange = (index, field, value) => {
        const updated = [...prestationsData];
        updated[index] = { ...updated[index], [field]: value };
        setPrestationsData(updated);
    };

    // 4) Ajouter prestation
    const handleAddPrestation = () => {
        setPrestationsData((prev) => [
            ...prev,
            {
                _id: `temp-${Date.now()}`,
                date: new Date().toISOString().slice(0, 10),
                description: '',
                billingType: 'hourly',
                hours: 0,
                minutes: 0,
                hourlyRate: 0,
                fixedPrice: 0,
                quantity: 1,
                durationUnit: 'minutes',
            },
        ]);
    };

    // 5) Supprimer
    const handleDeletePrestation = (index) => {
        const updated = [...prestationsData];
        updated.splice(index, 1);
        setPrestationsData(updated);
    };

    // 6) Sauvegarder
    const handleSaveRectification = async () => {
        if (!reason.trim()) {
          toast.error('Veuillez indiquer un motif de rectification');
          return;
        }
        try {
          const token = localStorage.getItem('token');
          const finalPrestations = prestationsData.map((p) => {
            const obj = {
              _id: p._id.startsWith('temp-') ? undefined : p._id,
              date: p.date || new Date().toISOString(),
              description: p.description || 'Sans description',
            };
      
            if (p.billingType === 'hourly') {
              // Pour la facturation horaire
              const minutes = hmToMinutes(p.hours || 0, p.minutes || 0);
              const hourlyRate = parseFloat(p.hourlyRate) || 0;
              const hours = minutes / 60;
      
              obj.billingType = 'hourly';
              obj.hours = parseFloat(hours.toFixed(2));
              obj.hourlyRate = hourlyRate;
              obj.duration = minutes;
              obj.durationUnit = 'hours';
              obj.total = parseFloat((hours * hourlyRate).toFixed(2));
      
            } else {
              // Pour la facturation au forfait
              const duration = convertToMinutes(
                p.durationUnit,
                p.durationInput1,
                p.durationInput2
              );
      
              obj.billingType = 'fixed';
              obj.fixedPrice = parseFloat(p.fixedPrice) || 0;
              obj.quantity = parseInt(p.quantity, 10) || 1;
              obj.duration = duration;
              obj.durationUnit = p.durationUnit;
              obj.total = (parseFloat(p.fixedPrice) || 0) * (parseInt(p.quantity, 10) || 1);
            }
      
            return obj;
          });
      
          const payload = {
            modifiedInvoice: {
              prestations: finalPrestations,
              dateFacture: originalFacture.dateFacture,
              year: originalFacture.year,
              month: originalFacture.month,
              dateEcheance: originalFacture.dateEcheance,
            },
            reason
          };
      
          console.log('Payload à envoyer:', payload);
      
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/api/factures/${id}/rectify-new`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
          );
      
          if (response.data && response.data._id) {
            toast.success('Nouvelle facture rectificative créée !');
            navigate('/mes-factures');
          } else {
            throw new Error('Réponse invalide du serveur');
          }
        } catch (err) {
          console.error('Erreur création facture rectificative:', err);
          const errorMessage = err.response?.data?.message || 'Erreur lors de la rectification';
          toast.error(errorMessage);
        }
      };

    // AFFICHAGE
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-100">
                <p className="animate-pulse">Chargement...</p>
            </div>
        );
    }
    if (!originalFacture) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-100">
                <p>Facture introuvable</p>
            </div>
        );
    }

    return (
        <div className="bg-modern min-h-screen text-gray-100">
            {/* Barre du haut */}
            <div className="w-full py-4 px-6 border-b border-white/20 bg-white/10 backdrop-blur-sm">
                <button
                    onClick={() => navigate('/mes-factures')}
                    className="inline-flex items-center space-x-2 text-white hover:bg-white/20 px-3 py-2 rounded transition-colors"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                    <span>Retour</span>
                </button>
                <h1 className="text-xl font-semibold text-white mt-3">
                    Nouvelle rectification — Facture #{originalFacture.invoiceNumber}
                </h1>
            </div>

            <div className="max-w-7xl mx-auto pt-6 pb-10 px-4">
                {/* 4 cards stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/10 border border-white/20 p-4 rounded-lg text-center">
                        <p className="text-sm text-white/70">Total Brut</p>
                        <p className="text-xl font-bold text-white mt-1">{stats.totalBrut.toFixed(2)} €</p>
                    </div>
                    <div className="bg-white/10 border border-white/20 p-4 rounded-lg text-center">
                        <p className="text-sm text-white/70">Total Net</p>
                        <p className="text-xl font-bold text-white mt-1">{stats.totalNet.toFixed(2)} €</p>
                    </div>
                    <div className="bg-white/10 border border-white/20 p-4 rounded-lg text-center">
                        <p className="text-sm text-white/70">Prestations</p>
                        <p className="text-xl font-bold text-white mt-1">{stats.nbPrestations}</p>
                    </div>
                    <div className="bg-white/10 border border-white/20 p-4 rounded-lg text-center">
                        <p className="text-sm text-white/70">Total Heures</p>
                        <p className="text-xl font-bold text-white mt-1">{stats.totalHeures}</p>
                    </div>
                </div>

                <div className="bg-white/10 border border-white/20 p-6 rounded-xl">
                    {/* Motif */}
                    <div className="mb-4">
                        <label className="block mb-1 font-semibold text-white/90">
                            Motif de la rectification
                        </label>
                        <textarea
                            className="w-full p-2 text-gray-900 rounded border border-white/20 focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            placeholder="Expliquez la raison de cette rectification..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    {/* Prestations en 3/4 colonnes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {prestationsData.map((p, index) => (
                            <div
                                key={p._id || index}
                                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 transition-all hover:shadow-lg hover:border-white/30"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-white">
                                        Prestation #{index + 1}
                                    </h3>
                                    <button
                                        onClick={() => handleDeletePrestation(index)}
                                        className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-lg"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                        <span className="text-sm">Retirer</span>
                                    </button>
                                </div>

                                {/* Date */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-white/80 mb-1">
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            value={p.date}
                                            onChange={(e) => handlePrestationChange(index, 'date', e.target.value)}
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-white/80 mb-1">
                                            Description
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            value={p.description}
                                            onChange={(e) => handlePrestationChange(index, 'description', e.target.value)}
                                            placeholder="Description de la prestation..."
                                        />
                                    </div>

                                    {/* Type facturation */}
                                    <div>
                                        <label className="block text-sm font-medium text-white/80 mb-1">
                                            Type de facturation
                                        </label>
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            value={p.billingType}
                                            onChange={(e) => handlePrestationChange(index, 'billingType', e.target.value)}
                                        >
                                            <option value="hourly">Taux horaire</option>
                                            <option value="fixed">Forfait</option>
                                        </select>
                                    </div>

                                    {/* Champs spécifiques au type de facturation */}
                                    {p.billingType === 'hourly' ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-white/80 mb-1">
                                                        Taux horaire (€)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        value={p.hourlyRate}
                                                        onChange={(e) => handlePrestationChange(index, 'hourlyRate', e.target.value)}
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-white/80 mb-1">
                                                        Heures
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        value={p.hours}
                                                        onChange={(e) => handlePrestationChange(index, 'hours', e.target.value)}
                                                        min="0"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-white/80 mb-1">
                                                    Minutes
                                                </label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    value={p.minutes || 0}
                                                    onChange={(e) => handlePrestationChange(index, 'minutes', e.target.value)}
                                                    min="0"
                                                    max="59"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-white/80 mb-1">
                                                        Prix forfaitaire (€)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        value={p.fixedPrice}
                                                        onChange={(e) => handlePrestationChange(index, 'fixedPrice', e.target.value)}
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-white/80 mb-1">
                                                        Quantité
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        value={p.quantity}
                                                        onChange={(e) => handlePrestationChange(index, 'quantity', e.target.value)}
                                                        min="1"
                                                    />
                                                </div>
                                            </div>

                                            {/* Unité de durée pour le forfait */}
                                            <div>
                                                <label className="block text-sm font-medium text-white/80 mb-1">
                                                    Unité de durée
                                                </label>
                                                <select
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    value={p.durationUnit}
                                                    onChange={(e) => handlePrestationChange(index, 'durationUnit', e.target.value)}
                                                >
                                                    <option value="minutes">Minutes</option>
                                                    <option value="hours">Heures</option>
                                                    <option value="days">Jours</option>
                                                </select>
                                            </div>

                                            {/* Champs de durée conditionnels */}
                                            {p.durationUnit === 'minutes' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-white/80 mb-1">
                                                        Minutes
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        value={p.durationInput1 || 0}
                                                        onChange={(e) => handlePrestationChange(index, 'durationInput1', e.target.value)}
                                                        min="0"
                                                    />
                                                </div>
                                            )}

                                            {p.durationUnit === 'hours' && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-white/80 mb-1">
                                                            Heures
                                                        </label>
                                                        <input
                                                            type="number"
                                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                            value={p.durationInput1 || 0}
                                                            onChange={(e) => handlePrestationChange(index, 'durationInput1', e.target.value)}
                                                            min="0"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-white/80 mb-1">
                                                            Minutes
                                                        </label>
                                                        <input
                                                            type="number"
                                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                            value={p.durationInput2 || 0}
                                                            onChange={(e) => handlePrestationChange(index, 'durationInput2', e.target.value)}
                                                            min="0"
                                                            max="59"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {p.durationUnit === 'days' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-white/80 mb-1">
                                                        Jours
                                                    </label>
                                                    <select
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        value={p.durationInput1 || ''}
                                                        onChange={(e) => handlePrestationChange(index, 'durationInput1', e.target.value)}
                                                    >
                                                        <option value="">Sélectionner...</option>
                                                        <option value="0.5">½ journée</option>
                                                        <option value="1">1 journée</option>
                                                    </select>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bouton d'ajout avec nouveau style */}
                    <button
                        onClick={handleAddPrestation}
                        className="mt-8 inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 
             text-white px-4 py-2 rounded-lg transition-colors shadow-lg"
                    >
                        <PlusIcon className="h-5 w-5" />
                        <span>Ajouter une prestation</span>
                    </button>

                    {/* Validation */}
                    <div className="mt-6 text-right">
                        <button
                            onClick={handleSaveRectification}
                            className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                        >
                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                            Créer la facture rectificative
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceRectificationNew;






