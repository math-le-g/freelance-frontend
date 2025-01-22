// frontend/src/components/MonthlySummary.js

import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PencilIcon, TrashIcon, LockClosedIcon, ClockIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePrestation } from '../contexts/PrestationContext';

registerLocale('fr', fr);

/** Format total en minutes => "XhYY" */
const formatTotalDuration = (durationInMinutes) => {
  if (!durationInMinutes) return '0h';
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${String(minutes).padStart(2, '0')}`;
};

/** Format "fixed" ou "daily" => reconstituer la durée en string */
function formatFixedDuration(p) {
  const totalMin = p.duration || 0;
  switch (p.durationUnit) {
    case 'minutes':
      return `${totalMin}min`; 
    case 'hours': {
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return m === 0 ? `${h}h` : `${h}h${m}min`;
    }
    case 'days': {
      const nbDays = totalMin / (24 * 60);
      if (Number.isInteger(nbDays)) {
        return nbDays === 1 ? '1 jour' : `${nbDays} jours`;
      } else {
        return `${nbDays} jours`; 
      }
    }
    default:
      return `${totalMin}min`;
  }
}

const MonthlySummary = ({ onEdit, onDelete }) => {
  const { prestations } = usePrestation();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [filteredPrestations, setFilteredPrestations] = useState([]);

  // Filtrer
  useEffect(() => {
    if (!selectedMonth || prestations.length === 0) {
      setFilteredPrestations([]);
      return;
    }
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    const filtered = prestations.filter((p) => {
      const d = new Date(p.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const sortedPrestations = filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    setFilteredPrestations(sortedPrestations);
  }, [prestations, selectedMonth]);

  // Groupement par date => { 'yyyy-MM-dd': { clientName: [..], ...}, ... }
  const groupedData = filteredPrestations.reduce((acc, p) => {
    const dateKey = format(new Date(p.date), 'yyyy-MM-dd');
    const clientName = p.client?.name || 'Client inconnu';
    if (!acc[dateKey]) acc[dateKey] = {};
    if (!acc[dateKey][clientName]) acc[dateKey][clientName] = [];
    acc[dateKey][clientName].push(p);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedData).sort((a, b) => new Date(a) - new Date(b));

  // Totaux
  const totalMontant = filteredPrestations.reduce((sum, p) => sum + (p.total || 0), 0);

  const totalHeures = filteredPrestations.reduce((sum, p) => {
    if (p.billingType === 'hourly') {
      return sum + (p.hours * 60);
    } else {
      return sum + (p.duration || 0);
    }
  }, 0);

  /** Affichage d’une prestation */
  const RenderPrestation = ({ prestation }) => {
    const isInvoiced = prestation.invoiceId !== null;
    const isPaid = prestation.invoicePaid;

    const renderDurationInfo = () => {
      if (prestation.billingType === 'hourly') {
        // ex: "2h × 50€/h"
        return (
          <div className="flex flex-col">
            <span className="text-sm text-blue-600">
              Durée × Taux horaire
            </span>
            <span className="text-md font-medium text-gray-800">
              {prestation.hours}h × {prestation.hourlyRate}€/h
            </span>
          </div>
        );
      } else if (prestation.billingType === 'fixed') {
        // Forfait => p.fixedPrice, p.quantity, + formatFixedDuration
        const displayedDuration = formatFixedDuration(prestation);
        return (
          <div className="flex flex-col">
            <span className="text-sm text-blue-600">
              Forfait{(prestation.quantity || 1) > 1 ? ` (${prestation.quantity}×)` : ''}
            </span>
            <span className="text-md font-medium text-gray-800">
              {prestation.fixedPrice}€ 
              {displayedDuration ? ` - ${displayedDuration}` : ''}
            </span>
          </div>
        );
      } else if (prestation.billingType === 'daily') {
        // Journalier => ex: "100€ × 3 jours => total"
        // p.duration = 3 * 1440 => 4320
        const nbDays = prestation.duration / (24 * 60);
        let dayStr = '';
        if (Number.isInteger(nbDays)) {
          dayStr = nbDays === 1 ? '1 jour' : `${nbDays} jours`;
        } else {
          dayStr = `${nbDays} jours`; 
        }
        return (
          <div className="flex flex-col">
            <span className="text-sm text-blue-600">
              Journalier
            </span>
            <span className="text-md font-medium text-gray-800">
              {prestation.fixedPrice}€ × {nbDays} → {prestation.total.toFixed(2)}€
              {` - ${dayStr}`}
            </span>
          </div>
        );
      }
      return null;
    };

    return (
      <div
        key={prestation._id}
        className={`p-4 rounded-lg relative transition-all duration-200 ${
          isInvoiced
            ? 'bg-gray-200/90 border-2 border-gray-300'
            : 'bg-white border border-transparent hover:border-blue-200 hover:shadow-md'
        }`}
      >
        {/* Badge facturé/payé */}
        {isInvoiced && (
          <div
            className={`absolute -top-3 -right-3 px-3 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center z-10 ${
              isPaid ? 'bg-gray-600 text-white' : 'bg-yellow-500 text-white'
            }`}
          >
            {isPaid ? (
              <>
                <LockClosedIcon className="h-3 w-3 mr-1" />
                <span>Facturé et payé</span>
              </>
            ) : (
              <>
                <ClockIcon className="h-3 w-3 mr-1" />
                <span>En attente</span>
              </>
            )}
          </div>
        )}

        <div className="mt-2">
          {/* Titre/desc + boutons */}
          <div className="flex items-start mb-3">
            <div className="flex-1 text-gray-800">
              <h4 className="text-lg font-medium">{prestation.description}</h4>
            </div>
            {!isInvoiced && (
              <div className="flex space-x-1 ml-4">
                <button
                  onClick={() => onEdit(prestation)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors duration-200"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(prestation._id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Bloc durée + total */}
          <div
            className={`flex justify-between items-center p-3 rounded-lg ${
              isInvoiced ? 'bg-gray-300/70' : 'bg-blue-50/50'
            }`}
          >
            {renderDurationInfo()}
            <div className="flex flex-col text-right">
              <span className={`text-sm ${isInvoiced ? 'text-gray-700' : 'text-blue-600'}`}>
                Total
              </span>
              <span
                className={`text-lg font-semibold ${
                  isInvoiced ? 'text-gray-800' : 'text-blue-600'
                }`}
              >
                {prestation.total.toFixed(2)}€
              </span>
            </div>
          </div>

          {/* Label "Modifiable" si pas facturé */}
          {!isInvoiced && (
            <div className="mt-2 flex justify-end">
              <div className="bg-green-50 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                Modifiable
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8">
      {/* Sélecteur du mois */}
      <div className="flex justify-between items-center mb-6">
        <div className="w-64">
          <DatePicker
            selected={selectedMonth}
            onChange={(date) => setSelectedMonth(date)}
            dateFormat="MMMM yyyy"
            showMonthYearPicker
            locale="fr"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <h2 className="text-2xl font-semibold">
          {format(selectedMonth, 'MMMM yyyy', { locale: fr })}
        </h2>
      </div>

      {/* Tuiles récap */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-lg shadow-md">
          <h3 className="text-sm text-blue-600 mb-1">Prestations du mois</h3>
          <p className="text-2xl font-bold">{filteredPrestations.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-lg shadow-md">
          <h3 className="text-sm text-green-600 mb-1">Total du mois</h3>
          <p className="text-2xl font-bold">{totalMontant.toFixed(2)} €</p>
        </div>
        <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-lg shadow-md">
          <h3 className="text-sm text-purple-600 mb-1">Heures totales</h3>
          <p className="text-2xl font-bold">{formatTotalDuration(totalHeures)}</p>
        </div>
      </div>

      {/* Liste des prestations groupées par jour */}
      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-4">
          {sortedDates.length === 0 ? (
            <div className="w-full text-center py-8 text-gray-500">
              Aucune prestation pour ce mois.
            </div>
          ) : (
            sortedDates.map((dateKey) => {
              const dailyData = groupedData[dateKey];
              return (
                <div
                  key={dateKey}
                  className="flex-shrink-0 w-full md:w-[350px] bg-gray-100 rounded-lg shadow-lg overflow-hidden"
                >
                  <div className="bg-blue-500 p-4 border-b">
                    <h3 className="text-lg font-bold text-white">
                      {format(new Date(dateKey), 'EEEE d MMMM', { locale: fr })}
                    </h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {Object.entries(dailyData).map(([clientName, prestations]) => (
                      <div
                        key={clientName}
                        className="rounded-lg bg-white overflow-hidden border-l-4"
                        style={{
                          borderLeftColor: `hsl(${(clientName.length * 30) % 360}, 70%, 60%)`,
                          backgroundColor: '#f9fafb',
                        }}
                      >
                        <div className="px-4 py-2 font-semibold bg-gray-50">
                          {clientName}
                        </div>
                        <div className="divide-y divide-gray-200">
                          {prestations.map((prestation) => (
                            <RenderPrestation
                              key={prestation._id}
                              prestation={prestation}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Total de la journée */}
                  <div className="bg-gray-200 p-4 border-t">
                    <p className="text-right font-semibold">
                      Total :{' '}
                      {filteredPrestations
                        .filter((p) => format(new Date(p.date), 'yyyy-MM-dd') === dateKey)
                        .reduce((sum, p) => sum + (p.total || 0), 0)
                        .toFixed(2)}{' '}
                      €
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlySummary;
