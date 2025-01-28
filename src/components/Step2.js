import React, { useState } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/** Composant d'affichage des différences (pour la confirmation) */
const DiffDisplay = ({ oldValue, newValue, label }) => {
  if (oldValue === newValue) return null;
  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className="text-gray-500">{label} :</span>
      <span className="bg-red-100 line-through px-2 py-1 rounded">
        {String(oldValue)}
      </span>
      <span className="text-gray-400">→</span>
      <span className="bg-green-100 px-2 py-1 rounded">
        {String(newValue)}
      </span>
    </div>
  );
};

/** Modal de confirmation de modifications */
const ConfirmChangesModal = ({ changes, onConfirm, onCancel }) => {
  const formatValue = (value, type) => {
    switch (type) {
      case 'price':
        return `${value} €`;
      case 'type':
        switch (value) {
          case 'hourly':
            return 'Taux horaire';
          case 'fixed':
            return 'Forfait';
          default:
            return value;
        }
      default:
        return value;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-xl w-full">
        <h3 className="text-xl font-bold mb-4">Confirmer les modifications</h3>
        <div className="space-y-3 mb-6">
          {Object.entries(changes).map(([field, { old, new: newVal, type }]) => (
            <DiffDisplay
              key={field}
              label={field}
              oldValue={formatValue(old, type)}
              newValue={formatValue(newVal, type)}
            />
          ))}
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
};

/** Modal d'édition d'une prestation */
const EditModal = ({ line, onClose, onSave }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [changes, setChanges] = useState({});

  // On initialise les champs avec les valeurs de la line (ou vides si creation)
  // S'il y a un durationUnit, on l'utilise, sinon 'minutes' par défaut
  const initialBillingType = line.billingType || 'hourly';
  const initialDurationUnit = line.durationUnit || 'minutes';

  // Reconstituer heures + minutes si on est en hourly
  let initHours = 0;
  let initMinutes = 0;
  if (line.billingType === 'hourly') {
    const totalMin = line.duration || 0;
    initHours = Math.floor(totalMin / 60);
    initMinutes = totalMin % 60;
  }

  // S'il s'agit d'un forfait à base de jours (durationUnit === 'days'),
  // on stocke la valeur en "days" (ex : 720 => 0.5 jour, 1440 => 1 jour)
  const initDays =
    initialDurationUnit === 'days' && line.duration
      ? line.duration / 1440
      : 1;

  // S'il s'agit d'un forfait à base de minutes/hours, on garde la duration brute
  let initDuration = line.duration || 0;
  if (initialDurationUnit === 'days') {
    // on a déjà transformé en initDays plus haut
    initDuration = 0;
  }

  const [formData, setFormData] = useState({
    description: line.description || '',
    date: line.date || format(new Date(), 'yyyy-MM-dd'),
    billingType: initialBillingType,
    hours: String(initHours),
    minutes: String(initMinutes),
    hourlyRate: line.hourlyRate || '',

    fixedPrice: line.fixedPrice || '',
    quantity: line.quantity || 1,

    duration: initDuration, // minutes
    durationUnit: initialDurationUnit,
    days: initDays, // ex: 0.5 ou 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // On prépare la détection de changements
    const detectedChanges = {};

    // Comparer champ à champ
    // 1) description
    if (formData.description !== (line.description ?? '')) {
      detectedChanges.Description = {
        old: line.description ?? '',
        new: formData.description,
        type: 'text',
      };
    }

    // 2) Type de facturation
    if (formData.billingType !== (line.billingType ?? 'hourly')) {
      detectedChanges['Type facturation'] = {
        old: line.billingType ?? 'hourly',
        new: formData.billingType,
        type: 'type',
      };
    }

    // 3) Forfait ou horaire => comparer
    if (formData.billingType === 'hourly') {
      // hours + minutes + hourlyRate
      // On calcule l'ancien total
      const oldH = Math.floor((line.duration ?? 0) / 60);
      const oldM = (line.duration ?? 0) % 60;

      if (parseInt(formData.hours, 10) !== oldH) {
        detectedChanges.Heures = {
          old: oldH,
          new: parseInt(formData.hours, 10),
          type: 'duration',
        };
      }
      if (parseInt(formData.minutes, 10) !== oldM) {
        detectedChanges.Minutes = {
          old: oldM,
          new: parseInt(formData.minutes, 10),
          type: 'duration',
        };
      }
      if (parseFloat(formData.hourlyRate) !== (line.hourlyRate ?? 0)) {
        detectedChanges['Taux horaire'] = {
          old: line.hourlyRate ?? 0,
          new: parseFloat(formData.hourlyRate),
          type: 'price',
        };
      }
    } else if (formData.billingType === 'fixed') {
      // fixedPrice, quantity, durationUnit, etc.
      if (parseFloat(formData.fixedPrice) !== (line.fixedPrice ?? 0)) {
        detectedChanges['Prix forfait'] = {
          old: line.fixedPrice ?? 0,
          new: parseFloat(formData.fixedPrice),
          type: 'price',
        };
      }
      if (formData.durationUnit !== line.durationUnit) {
        detectedChanges['Unité durée'] = {
          old: line.durationUnit ?? 'minutes',
          new: formData.durationUnit,
          type: 'text',
        };
      }
      if (parseInt(formData.quantity, 10) !== (line.quantity ?? 1)) {
        detectedChanges['Quantité'] = {
          old: line.quantity ?? 1,
          new: parseInt(formData.quantity, 10),
          type: 'duration',
        };
      }
    }

    // Si on n'a aucun changement, on enregistre direct
    if (Object.keys(detectedChanges).length === 0) {
      doSave();
    } else {
      setChanges(detectedChanges);
      setShowConfirm(true);
    }
  };

  const doSave = () => {
    // Calculer la vraie duration en minutes
    let finalDuration = 0;
    let finalUnit = formData.durationUnit;

    if (formData.billingType === 'hourly') {
      const h = parseInt(formData.hours ?? 0, 10);
      const m = parseInt(formData.minutes ?? 0, 10);
      finalDuration = h * 60 + m;
      finalUnit = 'hours';
    } else if (formData.billingType === 'fixed') {
      if (formData.durationUnit === 'days') {
        // ex: days = 0.5 => 720 minutes
        finalDuration = parseFloat(formData.days ?? 1) * 1440;
      } else if (formData.durationUnit === 'hours') {
        const h = parseInt(formData.hours ?? 0, 10);
        const m = parseInt(formData.minutes ?? 0, 10);
        finalDuration = h * 60 + m;
      } else {
        // minutes direct
        finalDuration = parseInt(formData.duration ?? 0, 10);
      }
    }

    const updatedLine = {
      ...line, // garde _id, _deleted, etc.
      description: formData.description,
      date: formData.date,
      billingType: formData.billingType,
      durationUnit: finalUnit,
      duration: finalDuration,

      hourlyRate:
        formData.billingType === 'hourly' ? parseFloat(formData.hourlyRate || 0) : undefined,

      // Forfait
      fixedPrice:
        formData.billingType === 'fixed' ? parseFloat(formData.fixedPrice || 0) : undefined,
      quantity:
        formData.billingType === 'fixed' && formData.durationUnit !== 'days'
          ? parseInt(formData.quantity || 1, 10)
          : 1, // si 'days', on force quantity = 1

      // On stocke hours/minutes pour la forme
      hours:
        formData.billingType === 'hourly' || formData.durationUnit === 'hours'
          ? parseInt(formData.hours ?? 0, 10)
          : undefined,
      minutes:
        formData.billingType === 'hourly' || formData.durationUnit === 'hours'
          ? parseInt(formData.minutes ?? 0, 10)
          : undefined,

      // Pour 'days'
      days: formData.durationUnit === 'days' ? parseFloat(formData.days || 1) : undefined,
    };

    onSave(updatedLine);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-xl relative">
        <h2 className="text-xl font-bold mb-6">Modifier la prestation</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>
          </div>

          {/* Type de facturation (sans le daily) */}
          <div>
            <span className="block text-sm font-medium mb-1">Type de facturation :</span>
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center text-sm">
                <input
                  type="radio"
                  name="billingType"
                  value="hourly"
                  checked={formData.billingType === 'hourly'}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      billingType: e.target.value,
                      durationUnit: 'hours',
                      hours: '0',
                      minutes: '0',
                    }))
                  }
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-1">Horaire</span>
              </label>
              <label className="inline-flex items-center text-sm">
                <input
                  type="radio"
                  name="billingType"
                  value="fixed"
                  checked={formData.billingType === 'fixed'}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      billingType: e.target.value,
                      durationUnit: 'minutes',
                    }))
                  }
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-1">Forfait</span>
              </label>
            </div>
          </div>

          {/* Selon le type */}
          {formData.billingType === 'hourly' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Heures</label>
                <input
                  type="number"
                  min="0"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={formData.minutes}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (val >= 0 && val <= 59) {
                      setFormData({ ...formData, minutes: e.target.value });
                    }
                  }}
                  className="w-full border rounded p-2"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Taux horaire (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  className="w-full border rounded p-2"
                />
              </div>
            </div>
          ) : (
            // Sinon "forfait"
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Prix forfait (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.fixedPrice}
                  onChange={(e) => setFormData({ ...formData, fixedPrice: e.target.value })}
                  className="w-full border rounded p-2"
                />
              </div>

              {/* Sélection de l'unité de durée */}
              <div>
                <label className="block text-sm font-medium mb-1">Unité de durée</label>
                <select
                  value={formData.durationUnit}
                  onChange={(e) => {
                    let updated = { ...formData, durationUnit: e.target.value };
                    if (e.target.value === 'days') {
                      updated.days = 1;
                      updated.duration = 0;
                    } else if (e.target.value === 'hours') {
                      updated.hours = '0';
                      updated.minutes = '0';
                    } else {
                      // 'minutes'
                      updated.duration = 0;
                    }
                    setFormData(updated);
                  }}
                  className="w-full border rounded p-2"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Heures</option>
                  <option value="days">Jours</option>
                </select>
              </div>

              {/* Affichage conditionnel selon l'unité */}
              {formData.durationUnit === 'days' && (
                <>
                  <label className="block text-sm font-medium mb-1">Nombre de jours</label>
                  <select
                    value={formData.days}
                    onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                    className="w-full border rounded p-2"
                  >
                    <option value="0.5">½ journée</option>
                    <option value="1">1 journée</option>
                  </select>
                  {/* On ne montre pas la quantité si 'days' */}
                </>
              )}
              {formData.durationUnit === 'hours' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Heures</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Minutes</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={formData.minutes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (val >= 0 && val <= 59) {
                          setFormData({ ...formData, minutes: e.target.value });
                        }
                      }}
                      className="w-full border rounded p-2"
                    />
                  </div>
                </div>
              )}
              {formData.durationUnit === 'minutes' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full border rounded p-2"
                  />
                </div>
              )}

              {/* On masque la quantité si c'est days */}
              {formData.durationUnit !== 'days' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Quantité</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full border rounded p-2"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Enregistrer
            </button>
          </div>
        </form>

        {/* Modal de confirmation */}
        {showConfirm && (
          <ConfirmChangesModal
            changes={changes}
            onConfirm={() => {
              setShowConfirm(false);
              doSave();
            }}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </div>
    </div>
  );
};

function displayDuration(line) {
  if (!line.duration || line.duration === 0) return '';

  if (line.billingType === 'hourly') {
    const h = Math.floor(line.duration / 60);
    const m = line.duration % 60;
    return `${h}h${m ? `${m}m` : ''}`;
  }

  // "fixed"
  if (line.durationUnit === 'days') {
    const d = line.duration / 1440; // ex: 0.5 => 720 min
    if (d === 0.5) return '½ journée';
    if (d === 1) return '1 journée';
    return `${d} jours`;
  } else if (line.durationUnit === 'hours') {
    const h = Math.floor(line.duration / 60);
    const m = line.duration % 60;
    if (h === 0) return `${m} min`;
    return `${h}h${m ? `${m}m` : ''}`;
  } else {
    // minutes
    return `${line.duration} min`;
  }
}

const Step2 = ({ lines, setLines, prevStep, nextStep }) => {
  const [editingLine, setEditingLine] = useState(null);

  // Fonction de calcul du total d'une line
  const calculateLineTotal = (line) => {
    if (line.billingType === 'hourly') {
      // duration => minutes => heure(s) × hourlyRate
      return ((line.duration ?? 0) / 60) * (line.hourlyRate ?? 0);
    }
    if (line.billingType === 'fixed') {
      return (line.fixedPrice ?? 0) * (line.quantity ?? 1);
    }
    return 0;
  };

  // Calcul global
  const totalHT = lines
    .filter((l) => !l._deleted)
    .reduce((acc, line) => acc + calculateLineTotal(line), 0);

  const taxeURSSAF = parseFloat((totalHT * 0.232).toFixed(2));
  const net = parseFloat((totalHT - taxeURSSAF).toFixed(2));

  // Groupement par date
  const groupedLines = lines
    .filter((l) => !l._deleted)
    .reduce((acc, line) => {
      const dateKey = format(new Date(line.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(line);
      return acc;
    }, {});
  const sortedDates = Object.keys(groupedLines).sort((a, b) => new Date(a) - new Date(b));

  const handleSaveLine = (updatedLine) => {
    if (!updatedLine._id) {
      // Nouvelle prestation
      const newLine = {
        ...updatedLine,
        _id: `temp-${Date.now()}`, // Id temporaire
        _deleted: false,
      };
      setLines((prev) => [...prev, newLine]);
    } else {
      // Mise à jour d'une prestation existante
      setLines((prev) =>
        prev.map((l) => (l._id === updatedLine._id ? { ...updatedLine } : l))
      );
    }
    setEditingLine(null);
  };

  const handleDeleteLine = (line) => {
    if (!line._id.startsWith('temp-')) {
      // Marquer _deleted => sera supprimé au backend
      setLines((prev) => prev.map((l) => (l._id === line._id ? { ...l, _deleted: true } : l)));
    } else {
      // C'était une line "temporaire" => on peut la retirer du tableau
      setLines((prev) => prev.filter((l) => l._id !== line._id));
    }
  };

  const handleAddLine = () => {
    // Ouvrir la modale sur une ligne vierge
    setEditingLine({});
  };

  return (
    <div className="p-4 space-y-6 bg-gray-50">
      {/* Recap Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-lg shadow-md">
          <h3 className="text-sm text-blue-600 mb-1">Total Prestations</h3>
          <p className="text-2xl font-bold">
            {lines.filter((l) => !l._deleted).length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-lg shadow-md">
          <h3 className="text-sm text-green-600 mb-1">Total HT</h3>
          <p className="text-2xl font-bold">{totalHT.toFixed(2)} €</p>
        </div>
        <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-lg shadow-md">
          <h3 className="text-sm text-purple-600 mb-1">Net</h3>
          <p className="text-2xl font-bold">{net.toFixed(2)} €</p>
        </div>
      </div>

      <button
        onClick={handleAddLine}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Ajouter une prestation
      </button>

      {/* Prestations List */}
      <div className="overflow-x-auto">
        <div className="flex space-x-4 pb-4">
          {sortedDates.length === 0 && (
            <p className="w-full text-center py-8 text-gray-500">
              Aucune prestation pour l'instant
            </p>
          )}
          {sortedDates.map((dateKey) => (
            <div
              key={dateKey}
              className="flex-shrink-0 w-full md:w-[350px] bg-gray-100 rounded-lg shadow-lg overflow-hidden"
            >
              <div className="bg-blue-500 p-4">
                <h3 className="text-lg font-bold text-white">
                  {format(new Date(dateKey), 'EEEE d MMMM', { locale: fr })}
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {groupedLines[dateKey].map((line) => {
                  const lineTotal = calculateLineTotal(line);
                  return (
                    <div
                      key={line._id}
                      className="bg-white rounded-lg p-3 transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-md font-medium text-gray-800">
                          {line.description || 'Sans description'}
                        </h4>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setEditingLine(line)}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLine(line)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-blue-50/50 p-3 rounded-lg flex justify-between items-center">
                        {/* Détails */}
                        {line.billingType === 'hourly' ? (
                          <div className="flex flex-col">
                            <span className="text-sm text-blue-600">Horaire</span>
                            <span className="text-md font-medium text-gray-800">
                              {displayDuration(line)} × {line.hourlyRate}€/h
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-sm text-blue-600">
                              Forfait{(line.quantity ?? 1) > 1 ? ` ×${line.quantity}` : ''}
                            </span>
                            <span className="text-md font-medium text-gray-800">
                              {line.fixedPrice}€ {displayDuration(line) && `- ${displayDuration(line)}`}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-col text-right">
                          <span className="text-sm text-blue-600">Total</span>
                          <span className="text-lg font-semibold text-blue-600">
                            {lineTotal.toFixed(2)}€
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="bg-gray-200 p-4">
                <p className="text-right font-semibold">
                  Total jour :{' '}
                  {groupedLines[dateKey]
                    .reduce((sum, l) => sum + calculateLineTotal(l), 0)
                    .toFixed(2)}{' '}
                  €
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={prevStep}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
        >
          Retour
        </button>
        <button
          onClick={nextStep}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Continuer
        </button>
      </div>

      {/* Modal d'édition */}
      {editingLine && (
        <EditModal
          line={editingLine}
          onClose={() => setEditingLine(null)}
          onSave={handleSaveLine}
        />
      )}
    </div>
  );
};

export default Step2;
