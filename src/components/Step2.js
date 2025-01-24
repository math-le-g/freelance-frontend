import React, { useState } from 'react';
import { PencilIcon, TrashIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';


const displayDuration = (line) => {
  if (!line.duration || line.duration === 0) return '';

  if (line.billingType === 'daily') {
    const days = line.duration;
    return `${days} jour${days > 1 ? 's' : ''}`;
  }

  const totalMinutes = parseInt(line.duration, 10);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  } else if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h${minutes}min`;
};


const DiffDisplay = ({ oldValue, newValue, label }) => {
  if (oldValue === newValue) return null;
  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className="text-gray-500">{label}:</span>
      <span className="bg-red-100 line-through px-2 py-1 rounded">
        {oldValue}
      </span>
      <ArrowRightIcon className="h-4 w-4 text-gray-400" />
      <span className="bg-green-100 px-2 py-1 rounded">
        {newValue}
      </span>
    </div>
  );
};

const ConfirmChangesModal = ({ changes, onConfirm, onCancel }) => {
  const formatValue = (value, type) => {
    switch (type) {
      case 'duration':
        return value;
      case 'price':
        return `${value}€`;
      case 'type':
        switch (value) {
          case 'hourly': return 'Taux horaire';
          case 'fixed': return 'Forfait';
          case 'daily': return 'Journalier';
          default: return value;
        }
      default:
        return value;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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

const EditModal = ({ line, onClose, onSave }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [changes, setChanges] = useState({});
  
  // Initialisation des heures et minutes pour la durée
  const totalMinutes = line.duration || 0;
  const initialHours = Math.floor(totalMinutes / 60);
  const initialMinutes = totalMinutes % 60;

  const [formData, setFormData] = useState({
    description: line.description || '',
    date: line.date || format(new Date(), 'yyyy-MM-dd'),
    billingType: line.billingType || 'hourly',
    hours: initialHours.toString(),
    minutes: initialMinutes.toString(),
    hourlyRate: line.hourlyRate || '',
    fixedPrice: line.fixedPrice || '',
    quantity: line.quantity || 1,
    duration: totalMinutes,
    durationUnit: line.durationUnit || 'hours',
    days: line.billingType === 'daily' ? line.duration : 1,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let finalDuration;
    if (formData.billingType === 'daily') {
      finalDuration = parseFloat(formData.days);
    } else if (formData.billingType === 'hourly') {
      finalDuration = (parseInt(formData.hours, 10) || 0) * 60 + (parseInt(formData.minutes, 10) || 0);
    } else {
      // Pour le type 'fixed', convertir heures et minutes en minutes
      const hours = parseInt(formData.hours, 10) || 0;
      const minutes = parseInt(formData.minutes, 10) || 0;
      finalDuration = hours * 60 + minutes;
    }

    const updatedLine = {
      ...line,
      description: formData.description,
      date: formData.date,
      billingType: formData.billingType,
      durationUnit: formData.billingType === 'daily' ? 'days' : 'hours',
      duration: finalDuration,
      days: formData.billingType === 'daily' ? parseFloat(formData.days) : undefined,
      hours: formData.billingType === 'hourly' ? parseInt(formData.hours, 10) : Math.floor(finalDuration / 60),
      minutes: formData.billingType === 'hourly' ? parseInt(formData.minutes, 10) : finalDuration % 60,
      hourlyRate: formData.billingType === 'hourly' ? parseFloat(formData.hourlyRate) : undefined,
      fixedPrice: formData.billingType === 'fixed' || formData.billingType === 'daily' ? 
                 parseFloat(formData.fixedPrice) : undefined,
      quantity: formData.billingType === 'fixed' ? parseInt(formData.quantity, 10) : 1,
    };

    // Détecter les changements
    const detectedChanges = {};

    if (updatedLine.description !== line.description) {
      detectedChanges.Description = {
        old: line.description,
        new: updatedLine.description,
        type: 'text'
      };
    }

    if (updatedLine.billingType !== line.billingType) {
      detectedChanges.Type = {
        old: line.billingType,
        new: updatedLine.billingType,
        type: 'type'
      };
    }

    if (formData.billingType === 'daily' && updatedLine.days !== line.days) {
      detectedChanges['Nombre de jours'] = {
        old: line.days,
        new: updatedLine.days,
        type: 'duration'
      };
    }

    if (updatedLine.fixedPrice !== line.fixedPrice) {
      detectedChanges['Prix (€)'] = {
        old: line.fixedPrice,
        new: updatedLine.fixedPrice,
        type: 'price'
      };
    }

    if (formData.billingType === 'hourly') {
      if (updatedLine.hours !== Math.floor(line.duration / 60)) {
        detectedChanges.Heures = {
          old: Math.floor(line.duration / 60),
          new: updatedLine.hours,
          type: 'duration'
        };
      }

      const oldMinutes = line.duration % 60;
      const newMinutes = formData.billingType === 'hourly' ? formData.minutes : 0;
      if (newMinutes !== oldMinutes) {
        detectedChanges.Minutes = {
          old: oldMinutes,
          new: newMinutes,
          type: 'duration'
        };
      }

      if (updatedLine.hourlyRate !== line.hourlyRate) {
        detectedChanges['Taux horaire (€)'] = {
          old: line.hourlyRate,
          new: updatedLine.hourlyRate,
          type: 'price'
        };
      }
    }

    if (Object.keys(detectedChanges).length > 0) {
      setChanges(detectedChanges);
      setShowConfirm(true);
    } else {
      onSave(updatedLine);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-xl">
        <h2 className="text-xl font-bold mb-6">Modifier la prestation</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description et Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full border rounded p-2"
              />
            </div>
          </div>

          {/* Type de facturation */}
          <div className="mb-4">
            <span className="block text-sm font-medium mb-1">Type de facturation :</span>
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center text-sm">
                <input
                  type="radio"
                  name="billingType"
                  value="hourly"
                  checked={formData.billingType === 'hourly'}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    billingType: e.target.value,
                    durationUnit: 'hours',
                    hours: 0,
                    minutes: 0,
                  }))}
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
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    billingType: e.target.value,
                    durationUnit: 'minutes',
                  }))}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-1">Forfait</span>
              </label>
              <label className="inline-flex items-center text-sm">
                <input
                  type="radio"
                  name="billingType"
                  value="daily"
                  checked={formData.billingType === 'daily'}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    billingType: e.target.value,
                    durationUnit: 'days',
                    days: prev.days || 1,
                  }))}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-1">Journalier</span>
              </label>
            </div>
          </div>

          {/* Champs selon le type */}
          {formData.billingType === 'hourly' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Heures</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.hours}
                  onChange={e => setFormData({...formData, hours: e.target.value})}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="1"
                  value={formData.minutes}
                  onChange={e => {
                    const value = parseInt(e.target.value, 10);
                    if (value >= 0 && value <= 59) {
                      setFormData({...formData, minutes: value});
                    }
                  }}
                  className="w-full border rounded p-2"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Taux horaire (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={e => setFormData({...formData, hourlyRate: e.target.value})}
                  className="w-full border rounded p-2"
                  min="0"
                />
              </div>
            </div>
          ) : formData.billingType === 'daily' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre de jours</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.days}
                  onChange={e => setFormData({...formData, days: e.target.value})}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prix journalier (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fixedPrice}
                  onChange={e => setFormData({...formData, fixedPrice: e.target.value})}
                  className="w-full border rounded p-2"
                  min="0"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Prix forfaitaire (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fixedPrice}
                  onChange={e => setFormData({...formData, fixedPrice: e.target.value})}
                  className="w-full border rounded p-2"
                  min="0"
                />
              </div>

              {formData.billingType === 'fixed' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Quantité</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                    className="w-full border rounded p-2"
                  />
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Unité de durée</label>
                  <select
                    value={formData.durationUnit}
                    onChange={e => {
                      setFormData({
                        ...formData,
                        durationUnit: e.target.value,
                        duration: e.target.value === 'hours' ? 0 : '',
                        hours: e.target.value === 'hours' ? 0 : undefined,
                        minutes: e.target.value === 'hours' ? 0 : undefined,
                        days: e.target.value === 'days' ? 1 : undefined,
                      });
                    }}
                    className="w-full border rounded p-2"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Heures</option>
                    <option value="days">Jours</option>
                  </select>
                </div>

                {formData.durationUnit === 'hours' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Heures</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.hours}
                        onChange={e => setFormData({...formData, hours: e.target.value})}
                        className="w-full border rounded p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Minutes</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        step="1"
                        value={formData.minutes}
                        onChange={e => {
                          const value = parseInt(e.target.value, 10);
                          if (value >= 0 && value <= 59) {
                            setFormData({...formData, minutes: value});
                          }
                        }}
                        className="w-full border rounded p-2"
                      />
                    </div>
                  </div>
                ) : formData.durationUnit === 'days' ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre de jours</label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={formData.days}
                      onChange={e => setFormData({...formData, days: e.target.value})}
                      className="w-full border rounded p-2"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">Minutes</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.duration}
                      onChange={e => setFormData({...formData, duration: e.target.value})}
                      className="w-full border rounded p-2"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Boutons */}
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
              let finalDuration;
              if (formData.billingType === 'daily') {
                finalDuration = parseFloat(formData.days);
              } else if (formData.billingType === 'hourly') {
                finalDuration = (parseInt(formData.hours, 10) || 0) * 60 + (parseInt(formData.minutes, 10) || 0);
              } else {
                finalDuration = parseInt(formData.duration, 10) || 0;
              }

              const updatedLine = {
                ...line,
                description: formData.description,
                date: formData.date,
                billingType: formData.billingType,
                durationUnit: formData.billingType === 'daily' ? 'days' : 
                            formData.billingType === 'hourly' ? 'hours' : 'minutes',
                duration: finalDuration,
                days: formData.billingType === 'daily' ? parseFloat(formData.days) : undefined,
                hours: formData.billingType === 'hourly' ? parseInt(formData.hours, 10) : undefined,
                minutes: formData.billingType === 'hourly' ? parseInt(formData.minutes, 10) : undefined,
                hourlyRate: formData.billingType === 'hourly' ? parseFloat(formData.hourlyRate) : undefined,
                fixedPrice: formData.billingType === 'fixed' || formData.billingType === 'daily' ? 
                          parseFloat(formData.fixedPrice) : undefined,
                quantity: formData.billingType === 'fixed' ? parseInt(formData.quantity, 10) : 1,
              };

              onSave(updatedLine);
              setShowConfirm(false);
            }}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </div>
    </div>
  );
};

const Step2 = ({ lines, setLines, prevStep, nextStep }) => {
  const [editingLine, setEditingLine] = useState(null);
  const [modifiedFields, setModifiedFields] = useState({});

  const calculateLineTotal = (line) => {
    if (line.billingType === 'hourly') {
      return (line.duration / 60) * line.hourlyRate;
    } else if (line.billingType === 'fixed') {
      return line.fixedPrice * (line.quantity || 1);
    } else if (line.billingType === 'daily') {
      return line.duration * line.fixedPrice; // duration est déjà en jours
    }
    return 0;
  };

  const totalHT = lines
    .filter(l => !l._deleted)
    .reduce((acc, line) => acc + calculateLineTotal(line), 0);

  const taxeURSSAF = parseFloat((totalHT * 0.232).toFixed(2));
  const net = parseFloat((totalHT - taxeURSSAF).toFixed(2));

  const handleSaveLine = (updatedLine) => {
    const lineIndex = lines.findIndex(l => l._id === updatedLine._id);
    if (lineIndex !== -1) {
      const newLines = [...lines];
      newLines[lineIndex] = updatedLine;
      setLines(newLines);
      setModifiedFields(prev => ({...prev, [updatedLine._id]: true}));
    }
    setEditingLine(null);
  };

  const handleDeleteLine = (idx) => {
    const newLines = [...lines];
    const line = newLines[idx];
    if (line._id) {
      newLines[idx]._deleted = true;
    } else {
      newLines.splice(idx, 1);
    }
    setLines(newLines);
  };

  const groupedLines = lines
    .filter(l => !l._deleted)
    .reduce((acc, line) => {
      const dateKey = format(new Date(line.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(line);
      return acc;
    }, {});
  
  const sortedDates = Object.keys(groupedLines).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className="p-4 space-y-6 bg-gray-50">
      {/* Recap Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-lg shadow-md">
          <h3 className="text-sm text-blue-600 mb-1">Total Prestations</h3>
          <p className="text-2xl font-bold">
            {lines.filter(l => !l._deleted).length}
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

      {/* Prestations List */}
      <div className="overflow-x-auto">
        <div className="flex space-x-4 pb-4">
          {sortedDates.map(dateKey => (
            <div key={dateKey} 
              className="flex-shrink-0 w-full md:w-[350px] bg-gray-100 rounded-lg shadow-lg overflow-hidden">
              <div className="bg-blue-500 p-4">
                <h3 className="text-lg font-bold text-white">
                  {format(new Date(dateKey), 'EEEE d MMMM', { locale: fr })}
                </h3>
              </div>

              <div className="p-4 space-y-4">
                {groupedLines[dateKey].map((line, idx) => {
                  const isModified = modifiedFields[line._id];
                  const lineTotal = calculateLineTotal(line);
                  
                  return (
                    <div key={line._id} 
                      className={`bg-white rounded-lg p-3 transition-all duration-200 ${
                        isModified ? 'ring-2 ring-yellow-400' : ''
                      }`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-md font-medium text-gray-800">
                          {line.description || `Prestation #${idx + 1}`}
                        </h4>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setEditingLine(line)}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLine(idx)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-blue-50/50 p-3 rounded-lg flex justify-between items-center">
                        {line.billingType === 'hourly' ? (
                          <div className="flex flex-col">
                            <span className="text-sm text-blue-600">Durée × Taux horaire</span>
                            <span className="text-md font-medium text-gray-800">
                              {displayDuration(line)} × {line.hourlyRate}€/h
                            </span>
                          </div>
                        ) : line.billingType === 'fixed' ? (
                          <div className="flex flex-col">
                            <span className="text-sm text-blue-600">
                              Forfait{line.quantity > 1 ? ` (×${line.quantity})` : ''}
                            </span>
                            <span className="text-md font-medium text-gray-800">
                              {line.fixedPrice}€ {displayDuration(line) && `- ${displayDuration(line)}`}
                            </span>
                          </div>
                        ) : line.billingType === 'daily' ? (
                          <div className="flex flex-col">
                            <span className="text-sm text-blue-600">Journalier</span>
                            <span className="text-md font-medium text-gray-800">
                              {line.fixedPrice}€ × {displayDuration(line)}
                            </span>
                          </div>
                        ) : null}

                        <div className="flex flex-col text-right">
                          <span className="text-sm text-blue-600">Total</span>
                          <span className="text-lg font-semibold text-blue-600">
                            {lineTotal.toFixed(2)}€
                          </span>
                        </div>
                      </div>

                      {isModified && (
                        <div className="mt-2 flex justify-end">
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                            Modifié
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="bg-gray-200 p-4">
                <p className="text-right font-semibold">
                   Total: {groupedLines[dateKey]
                    .reduce((sum, line) => sum + calculateLineTotal(line), 0)
                    .toFixed(2)} €
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
