import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { usePrestation } from '../contexts/PrestationContext';
import {
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

// Fonctions utilitaires
function hmToMinutes(h, m) {
  const hh = parseInt(h, 10) || 0;
  const mm = parseInt(m, 10) || 0;
  return hh * 60 + mm;
}
function convertDurationToMinutes(unit, val1, val2 = 0) {
  switch (unit) {
    case 'hours':
      return hmToMinutes(val1, val2);
    case 'days':
      // ex. val1 = '0.5' pour 1/2 journée, '1' pour 1 journée
      return Math.round(parseFloat(val1) * 1440);
    default:
      // minutes
      return parseInt(val1, 10) || 0;
  }
}

// Liste des motifs légaux
const MOTIFS_LEGAUX = [
  {
    value: 'ERREUR_MONTANT',
    label: 'Erreur sur les montants',
    description: 'Correction d’une erreur dans le calcul des montants',
  },
  {
    value: 'ERREUR_TVA',
    label: 'Erreur de TVA',
    description: 'Correction d’une erreur dans le calcul de la TVA',
  },
  {
    value: 'ERREUR_CLIENT',
    label: 'Erreur sur les informations client',
    description: 'Correction des infos client (nom, adresse, etc.)',
  },
  {
    value: 'PRESTATION_MODIFIEE',
    label: 'Modification des prestations',
    description: 'Contenu ou durée de prestations à modifier',
  },
  {
    value: 'REMISE_EXCEPTIONNELLE',
    label: 'Remise exceptionnelle',
    description: 'Application d’une remise non prévue initialement',
  },
  {
    value: 'AUTRE',
    label: 'Autre motif',
    description: 'Autre motif de rectification (à préciser)',
  },
];

export default function RectificationForm() {
  const { id } = useParams();  // ID de la facture à rectifier
  const navigate = useNavigate();
  const { fetchPrestations } = usePrestation();

  // Facture d’origine
  const [originalFacture, setOriginalFacture] = useState(null);
  const [loading, setLoading] = useState(true);

  // Motif légal
  const [motifLegal, setMotifLegal] = useState('');
  const [autreMotif, setAutreMotif] = useState('');

  // Prestations => on stocke la logique de durée (durationInput1, durationInput2) pour "fixed"
  const [prestations, setPrestations] = useState([]);

  // ------------------------------------------------------------------------
  // 1) Charger la facture d’origine
  // ------------------------------------------------------------------------
  useEffect(() => {
    const fetchFacture = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/factures/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.data) {
          toast.error('Facture introuvable');
          return navigate('/mes-factures');
        }

        setOriginalFacture(response.data);

        // On "prépare" les prestations pour qu'elles aient
        // -> hours, minutes, hourlyRate si billingType === 'hourly'
        // -> fixedPrice, quantity, durationUnit, durationInput1, durationInput2 si billingType === 'fixed'
        // On part de ce que tu avais dans InvoiceRectificationNew.js
        if (Array.isArray(response.data.prestations)) {
          const cloned = response.data.prestations.map((p) => {
            // Valeurs par défaut
            const base = {
              _id: p._id,
              date: p.date ? p.date.slice(0, 10) : '',
              description: p.description || '',
              billingType: p.billingType || 'hourly',
            };

            if (p.billingType === 'hourly') {
              // Convertir p.hours en une partie hours/minutes, si tu veux
              // Mais souvent, on stocke p.hours comme un decimal (ex. 3.5)
              // Ici, on part du principe que tu avais p.hours, p.minutes
              const totalMinutes = p.duration || 0;
              const h = Math.floor(totalMinutes / 60);
              const m = totalMinutes % 60;
              return {
                ...base,
                hours: h,
                minutes: m,
                hourlyRate: p.hourlyRate || 0,
              };
            } else {
              // Forfait
              // On convertit p.duration => (durationUnit, durationInput1, durationInput2)
              const totalMin = p.duration || 0;
              let durationUnit = p.durationUnit || 'minutes';
              let d1 = '';
              let d2 = '';

              if (durationUnit === 'hours') {
                const hh = Math.floor(totalMin / 60);
                const mm = totalMin % 60;
                d1 = hh.toString();
                d2 = mm.toString();
              } else if (durationUnit === 'days') {
                const nbDays = totalMin / 1440;
                d1 = nbDays.toString(); // ex. "0.5" ou "1"
                d2 = '';
              } else {
                // minutes
                d1 = totalMin.toString();
                d2 = '';
              }

              return {
                ...base,
                fixedPrice: p.fixedPrice || 0,
                quantity: p.quantity || 1,
                durationUnit,
                durationInput1: d1,
                durationInput2: d2,
              };
            }
          });
          setPrestations(cloned);
        }

        setLoading(false);
      } catch (error) {
        console.error('Erreur récupération facture:', error);
        toast.error("Impossible de charger la facture d'origine");
        navigate('/mes-factures');
      }
    };
    fetchFacture();
  }, [id, navigate]);

  // ------------------------------------------------------------------------
  // 2) Handlers du motif légal
  // ------------------------------------------------------------------------
  const handleSelectMotif = (value) => {
    setMotifLegal(value);
    if (value !== 'AUTRE') {
      setAutreMotif('');
    }
  };

  // ------------------------------------------------------------------------
  // 3) Modification des prestations
  // ------------------------------------------------------------------------
  const handlePrestationChange = (index, field, value) => {
    const updated = [...prestations];
    updated[index] = { ...updated[index], [field]: value };
    setPrestations(updated);
  };

  const handleAddPrestation = () => {
    // Nouvelle prestation par défaut
    // On part sur un "fixed" ou "hourly"? À toi de voir.
    setPrestations((prev) => [
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
        durationInput1: '',
        durationInput2: '',
      },
    ]);
  };

  const handleRemovePrestation = (index) => {
    const updated = [...prestations];
    updated.splice(index, 1);
    setPrestations(updated);
  };

  // ------------------------------------------------------------------------
  // 4) Soumission => POST /api/factures/:id/rectify-new
  // ------------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!motifLegal) {
      return toast.error('Veuillez sélectionner un motif légal');
    }
    if (motifLegal === 'AUTRE' && !autreMotif.trim()) {
      return toast.error('Veuillez préciser le motif de la rectification');
    }

    try {
      const token = localStorage.getItem('token');

      // Reconstruire un tableau "final" pour l'API
      const payloadPrestations = prestations.map((p) => {
        if (p.billingType === 'hourly') {
          // On convertit hours/minutes => total en decimal ou en minutes
          const totalMinutes = hmToMinutes(p.hours, p.minutes);
          const hoursDecimal = totalMinutes / 60;
          const rate = parseFloat(p.hourlyRate) || 0;
          return {
            _id: p._id.startsWith('temp-') ? undefined : p._id,
            description: p.description || 'Sans description',
            billingType: 'hourly',
            duration: totalMinutes,
            durationUnit: 'hours', // on stocke l’info "hours" pour signifier qu’on calcule en HH:MM
            hours: hoursDecimal,   // si ton backend stocke hours en décimal
            hourlyRate: rate,
            total: parseFloat((hoursDecimal * rate).toFixed(2)),
            date: p.date || new Date().toISOString(),
          };
        } else {
          // Forfait
          const dUnit = p.durationUnit || 'minutes';
          const val1 = p.durationInput1 || '0';
          const val2 = p.durationInput2 || '0';
          const totalMin = convertDurationToMinutes(dUnit, val1, val2);
          const prix = parseFloat(p.fixedPrice) || 0;
          const qty = parseInt(p.quantity, 10) || 1;

          return {
            _id: p._id.startsWith('temp-') ? undefined : p._id,
            description: p.description || 'Sans description',
            billingType: 'fixed',
            fixedPrice: prix,
            quantity: qty,
            duration: totalMin,
            durationUnit: dUnit,
            total: parseFloat((prix * qty).toFixed(2)),
            date: p.date || new Date().toISOString(),
          };
        }
      });

      const body = {
        motifLegal,
        detailsMotif: motifLegal === 'AUTRE' ? autreMotif : '',
        prestations: payloadPrestations,
      };

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/factures/${id}/rectify-new`,
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchPrestations();
      console.log('[DEBUG] useQuery Prestations =', prestations);

      toast.success('Facture rectificative créée avec succès !');
      navigate('/mes-factures');
    } catch (err) {
      console.error('Erreur rectification:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la rectification');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-300">
        <p>Chargement...</p>
      </div>
    );
  }
  if (!originalFacture) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        <p>Facture introuvable</p>
      </div>
    );
  }

  // ------------------------------------------------------------------------
  // RENDU
  // ------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-modern text-white">
      {/* Barre de titre */}
      <div className="p-4 border-b border-white/20 bg-white/10 backdrop-blur-sm flex items-center gap-3">
        <button
          onClick={() => navigate('/mes-factures')}
          className="inline-flex items-center space-x-2 text-white hover:bg-white/20 px-3 py-2 rounded transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Retour</span>
        </button>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <DocumentDuplicateIcon className="h-6 w-6 text-blue-400" />
          Rectification de la facture #{originalFacture.invoiceNumber}
        </h1>
      </div>

      {/* Contenu principal */}
      <div className="max-w-6xl mx-auto mt-8 p-4">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* MOTIF LÉGAL */}
          <div>
            <h2 className="text-xl font-medium mb-4">1. Sélection du motif légal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOTIFS_LEGAUX.map((motif) => (
                <div
                  key={motif.value}
                  className={`
                    p-3 rounded-md border cursor-pointer transition-all
                    ${
                      motifLegal === motif.value
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }
                  `}
                  onClick={() => handleSelectMotif(motif.value)}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={motifLegal === motif.value}
                      onChange={() => {}}
                      className="h-4 w-4"
                    />
                    <label className="font-medium">{motif.label}</label>
                  </div>
                  <p className="mt-1 text-sm text-white/70 pl-6">
                    {motif.description}
                  </p>
                </div>
              ))}
            </div>

            {motifLegal === 'AUTRE' && (
              <div className="mt-4">
                <label className="block mb-1 text-sm font-medium">Détails du motif :</label>
                <textarea
                  rows={2}
                  className="w-full p-2 text-gray-900 rounded"
                  placeholder="Précisez ici..."
                  value={autreMotif}
                  onChange={(e) => setAutreMotif(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* INFOS */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex gap-3">
            <InformationCircleIcon className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-200">
              En créant une facture rectificative, vous générez un nouveau document.
              La facture #{originalFacture.invoiceNumber} sera conservée avec le statut 
              « Rectifiée ». Toutes les modifications (montants, TVA, etc.) doivent être 
              répercutées dans ce nouveau document.
            </p>
          </div>

          {/* PRESTATIONS : affichage en cartes 3-4 colonnes */}
          <div>
            <h2 className="text-xl font-medium mb-4">2. Modification des prestations</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {prestations.map((p, idx) => (
                <div
                  key={p._id}
                  className="bg-white/5 border border-white/20 p-3 rounded-lg shadow-sm space-y-2"
                >
                  {/* Date */}
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold">Date</label>
                    <input
                      type="date"
                      className="mt-1 p-1 text-gray-900 rounded w-full"
                      value={p.date}
                      onChange={(e) =>
                        handlePrestationChange(idx, 'date', e.target.value)
                      }
                    />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold">Description</label>
                    <input
                      type="text"
                      className="mt-1 p-1 text-gray-900 rounded w-full"
                      placeholder="Ex: Dév site web"
                      value={p.description}
                      onChange={(e) =>
                        handlePrestationChange(idx, 'description', e.target.value)
                      }
                    />
                  </div>

                  {/* Type */}
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold">Type</label>
                    <select
                      className="mt-1 p-1 text-gray-900 rounded"
                      value={p.billingType}
                      onChange={(e) =>
                        handlePrestationChange(idx, 'billingType', e.target.value)
                      }
                    >
                      <option value="hourly">Horaire</option>
                      <option value="fixed">Forfait</option>
                    </select>
                  </div>

                  {/* SI HORAIRE */}
                  {p.billingType === 'hourly' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-xs font-semibold">Heures</label>
                          <input
                            type="number"
                            className="mt-1 p-1 text-gray-900 rounded w-full"
                            value={p.hours}
                            onChange={(e) =>
                              handlePrestationChange(idx, 'hours', e.target.value)
                            }
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-semibold">Minutes</label>
                          <input
                            type="number"
                            className="mt-1 p-1 text-gray-900 rounded w-full"
                            value={p.minutes}
                            onChange={(e) =>
                              handlePrestationChange(idx, 'minutes', e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold">Taux horaire (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="mt-1 p-1 text-gray-900 rounded w-full"
                          value={p.hourlyRate}
                          onChange={(e) =>
                            handlePrestationChange(idx, 'hourlyRate', e.target.value)
                          }
                        />
                      </div>
                    </>
                  )}

                  {/* SI FORFAIT */}
                  {p.billingType === 'fixed' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold">Prix unitaire (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="mt-1 p-1 text-gray-900 rounded w-full"
                          value={p.fixedPrice || ''}
                          onChange={(e) =>
                            handlePrestationChange(idx, 'fixedPrice', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold">Quantité</label>
                        <input
                          type="number"
                          className="mt-1 p-1 text-gray-900 rounded w-full"
                          value={p.quantity}
                          onChange={(e) =>
                            handlePrestationChange(idx, 'quantity', e.target.value)
                          }
                        />
                      </div>

                      {/* Durée */}
                      <div>
                        <label className="text-xs font-semibold">Unité de durée</label>
                        <select
                          className="mt-1 p-1 text-gray-900 rounded w-full"
                          value={p.durationUnit}
                          onChange={(e) =>
                            handlePrestationChange(idx, 'durationUnit', e.target.value)
                          }
                        >
                          <option value="minutes">Minutes</option>
                          <option value="hours">Heures</option>
                          <option value="days">Jours</option>
                        </select>
                      </div>
                      {/* durationInput1 / durationInput2 */}
                      {p.durationUnit === 'minutes' && (
                        <div>
                          <label className="text-xs font-semibold">Durée (min)</label>
                          <input
                            type="number"
                            className="mt-1 p-1 text-gray-900 rounded w-full"
                            value={p.durationInput1 || ''}
                            onChange={(e) =>
                              handlePrestationChange(idx, 'durationInput1', e.target.value)
                            }
                          />
                        </div>
                      )}
                      {p.durationUnit === 'hours' && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-xs font-semibold">H</label>
                            <input
                              type="number"
                              className="mt-1 p-1 text-gray-900 rounded w-full"
                              value={p.durationInput1 || ''}
                              onChange={(e) =>
                                handlePrestationChange(idx, 'durationInput1', e.target.value)
                              }
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-semibold">Min</label>
                            <input
                              type="number"
                              className="mt-1 p-1 text-gray-900 rounded w-full"
                              value={p.durationInput2 || ''}
                              onChange={(e) =>
                                handlePrestationChange(idx, 'durationInput2', e.target.value)
                              }
                            />
                          </div>
                        </div>
                      )}
                      {p.durationUnit === 'days' && (
                        <div>
                          <label className="text-xs font-semibold">Nb jours (Ex: 0.5, 1...)</label>
                          <input
                            type="number"
                            step="0.1"
                            className="mt-1 p-1 text-gray-900 rounded w-full"
                            value={p.durationInput1 || ''}
                            onChange={(e) =>
                              handlePrestationChange(idx, 'durationInput1', e.target.value)
                            }
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* BOUTON SUPPRIMER */}
                  <button
                    type="button"
                    onClick={() => handleRemovePrestation(idx)}
                    className="mt-2 w-full bg-red-500 text-white py-1 rounded text-sm hover:bg-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddPrestation}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              + Ajouter une prestation
            </button>
          </div>

          {/* BOUTON FINAL */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded font-semibold"
            >
              Créer la facture rectificative
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




