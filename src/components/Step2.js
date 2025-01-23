import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Fonction utilitaire de conversion de la durée
const convertMinutesToDisplay = (minutes, type) => {
  if (!minutes) return '';
  
  if (type === 'daily') {
    const days = minutes / (24 * 60);
    return `${days} jour${days > 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (minutes < 60) return `${minutes} min`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h${remainingMinutes}`;
};

// Composant pour afficher les différences lors des modifications
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

// Modal de confirmation des modifications
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

// Modal d'édition
const EditModal = ({ line, onClose, onSave }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [changes, setChanges] = useState({});
  const [formData, setFormData] = useState({
    description: line.description || '',
    date: line.date || format(new Date(), 'yyyy-MM-dd'),
    billingType: line.billingType || 'hourly',
    // Données pour type horaire
    hours: line.hours || '',
    hourlyRate: line.hourlyRate || '',
    // Données pour type forfait/journalier
    fixedPrice: line.fixedPrice || '',
    quantity: line.quantity || 1,
    // Gestion de la durée
    duration: line.duration || '',
    durationUnit: line.billingType === 'daily' ? 'days' : 'minutes'
  });

  // Conversion de la durée pour l'affichage initial
  useEffect(() => {
    if (line.duration) {
      if (line.billingType === 'daily') {
        setFormData(prev => ({
          ...prev,
          duration: line.duration / (24 * 60)
        }));
      }
    }
  }, [line]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let finalDuration = formData.duration;
    if (formData.durationUnit === 'days') {
      finalDuration = formData.duration * 24 * 60;
    } else if (formData.durationUnit === 'hours') {
      finalDuration = formData.duration * 60;
    }

    const updatedLine = {
      ...line,
      ...formData,
      duration: finalDuration,
      quantity: formData.billingType === 'daily' ? 1 : formData.quantity
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
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'hourly', label: 'Taux horaire' },
              { id: 'fixed', label: 'Forfait' },
              { id: 'daily', label: 'Journalier' }
            ].map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  billingType: type.id,
                  durationUnit: type.id === 'daily' ? 'days' : 'minutes'
                }))}
                className={`p-3 rounded-lg text-sm font-medium ${
                  formData.billingType === type.id
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                    : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Champs selon le type */}
          {formData.billingType === 'hourly' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Heures</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.hours}
                  onChange={e => setFormData({...formData, hours: parseFloat(e.target.value)})}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Taux horaire (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={e => setFormData({...formData, hourlyRate: parseFloat(e.target.value)})}
                  className="w-full border rounded p-2"
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {formData.billingType === 'daily' ? 'Taux journalier (€)' : 'Prix forfaitaire (€)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fixedPrice}
                  onChange={e => setFormData({...formData, fixedPrice: parseFloat(e.target.value)})}
                  className="w-full border rounded p-2"
                />
              </div>

              {formData.billingType === 'fixed' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Quantité</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
                    className="w-full border rounded p-2"
                  />
                </div>
              )}

              {/* Durée */}
              <div className="space-y-3">
                {formData.billingType !== 'daily' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Unité de durée</label>
                    <select
                      value={formData.durationUnit}
                      onChange={e => setFormData({
                        ...formData,
                        durationUnit: e.target.value,
                        duration: ''
                      })}
                      className="w-full border rounded p-2"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Heures</option>
                      <option value="days">Jours</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {formData.durationUnit === 'days' 
                      ? 'Nombre de jours' 
                      : formData.durationUnit === 'hours'
                      ? 'Heures'
                      : 'Minutes'
                    }
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={formData.durationUnit === 'days' ? '0.5' : '1'}
                    value={formData.duration}
                    onChange={e => setFormData({...formData, duration: parseFloat(e.target.value)})}
                    className="w-full border rounded p-2"
                  />
                </div>
              </div>
            </>
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
      </div>

      {/* Modal de confirmation */}
      {showConfirm && (
        <ConfirmChangesModal
          changes={changes}
          onConfirm={() => {
            let finalDuration = formData.duration;
            if (formData.durationUnit === 'days') {
              finalDuration = formData.duration * 24 * 60;
            } else if (formData.durationUnit === 'hours') {
              finalDuration = formData.duration * 60;
            }
            
            onSave({
              ...line,
              ...formData,
              duration: finalDuration,
              quantity: formData.billingType === 'daily' ? 1 : formData.quantity
            });
            setShowConfirm(false);
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
};

// Composant principal Step2
const Step2 = ({ lines, setLines, prevStep, nextStep }) => {
  const [editingLine, setEditingLine] = useState(null);
  const [modifiedFields, setModifiedFields] = useState({});
  const [groupedLines, setGroupedLines] = useState({});
  const [sortedDates, setSortedDates] = useState([]);

  useEffect(() => {
    const newGroupedLines = lines
      .filter(l => !l._deleted)
      .reduce((acc, line) => {
        const dateKey = format(new Date(line.date), 'yyyy-MM-dd');
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(line);
        return acc;
      }, {});

    setGroupedLines(newGroupedLines);
    setSortedDates(Object.keys(newGroupedLines).sort());
  }, [lines]);

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
    if (newLines[idx]._id) {
      newLines[idx]._deleted = true;
    } else {
      newLines.splice(idx, 1);
    }
    setLines(newLines);
  };

  const calculateLineTotal = (line) => {
    if (line.billingType === 'hourly') {
      return line.hours * line.hourlyRate;
    } else if (line.billingType === 'fixed') {
      return line.fixedPrice * (line.quantity || 1);
    } else if (line.billingType === 'daily') {
      const days = line.duration / (24 * 60);
      return days * line.fixedPrice;
    }
    return 0;
  };

  const totalHT = lines
    .filter(l => !l._deleted)
    .reduce((acc, line) => acc + calculateLineTotal(line), 0);

  const taxeURSSAF = parseFloat((totalHT * 0.232).toFixed(2));
  const net = parseFloat((totalHT - taxeURSSAF).toFixed(2));

  const renderLineInfo = (line) => {
    const duration = convertMinutesToDisplay(line.duration, line.billingType);
    
    if (line.billingType === 'hourly') {
      return (
        <div className="flex flex-col">
          <span className="text-sm text-blue-600">Durée × Taux horaire</span>
          <span className="text-md font-medium text-gray-800">
            {line.hours}h × {line.hourlyRate}€/h
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        <span className="text-sm text-blue-600">
          {line.billingType === 'daily' ? 'Journalier' : 'Forfait'}
          {line.quantity > 1 ? ` (×${line.quantity})` : ''}
        </span>
        <span className="text-md font-medium text-gray-800">
          {line.fixedPrice}€ {duration && `- ${duration}`}
        </span>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6 bg-gray-50">
      {/* Tuiles récap */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-lg shadow-md">
          <h3 className="text-sm text-blue-600 mb-1">Prestations</h3>
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

      {/* Liste des prestations */}
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
                      className={`bg-white rounded-lg p-4 transition-all duration-200 ${
                        isModified ? 'ring-2 ring-yellow-400' : ''
                      }`}>
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-lg font-medium text-gray-800">
                          {line.description || `Prestation #${idx + 1}`}
                        </h4>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setEditingLine(line)}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLine(idx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-blue-50/50 p-3 rounded-lg flex justify-between items-center">
                        {renderLineInfo(line)}
                        <div className="flex flex-col text-right">
                          <span className="text-sm text-blue-600">Total</span>
                          <span className="text-lg font-semibold text-blue-600">
                            {lineTotal.toFixed(2)}€
                          </span>
                        </div>
                      </div>

                      {isModified && (
                        <div className="mt-2 flex justify-end">
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
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
                  Total jour : {groupedLines[dateKey]
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