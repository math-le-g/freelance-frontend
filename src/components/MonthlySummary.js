import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PencilIcon, TrashIcon, LockClosedIcon, ClockIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePrestation } from '../contexts/PrestationContext';

registerLocale('fr', fr);

const formatTotalDuration = (durationInMinutes) => {
  if (!durationInMinutes) return '0h';
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${String(minutes).padStart(2, '0')}`;
};

function formatFixedDuration(p) {
  const totalMin = p.duration || 0;
  if (p.durationUnit === 'days') {
    const d = totalMin / 1440;
    if (d === 0.5) return '½ journée';
    if (d === 1) return '1 journée';
    return `${d} jours`;
  } else if (p.durationUnit === 'hours') {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h${m}min`;
  } else {
    return `${totalMin} minutes`;
  }
}

const MonthlySummary = ({ onEdit, onDelete }) => {
  const { prestations } = usePrestation();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [filteredPrestations, setFilteredPrestations] = useState([]);

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

  // Groupement par date => { 'yyyy-MM-dd': { clientName: [p1, p2...] } }
  const groupedData = filteredPrestations.reduce((acc, p) => {
    const dateKey = format(new Date(p.date), 'yyyy-MM-dd');
    const clientName = p.client?.name || 'Client inconnu';
    if (!acc[dateKey]) acc[dateKey] = {};
    if (!acc[dateKey][clientName]) acc[dateKey][clientName] = [];
    acc[dateKey][clientName].push(p);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedData).sort((a, b) => new Date(a) - new Date(b));

  // Totaux globaux (pour le mois entier)
  const totalMontant = filteredPrestations.reduce((acc, p) => acc + (p.total || 0), 0);
  const totalHeures = filteredPrestations.reduce((sum, p) => sum + (p.duration || 0), 0);

  const RenderPrestation = ({ prestation }) => {
    const isInvoiced = prestation.invoiceId !== null;
    const isPaid = prestation.invoicePaid;

    const renderDurationInfo = () => {
      if (prestation.billingType === 'hourly') {
        const totalMin = prestation.duration || 0;
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        return (
          <div className="flex flex-col text-sm">
            <span className="text-blue-600">Durée × Taux horaire</span>
            <span className="font-medium text-gray-800">
              {h}h{m ? `${m}min` : ''} × {prestation.hourlyRate} €/h
            </span>
          </div>
        );
      } else {
        const displayedDuration = formatFixedDuration(prestation);
        return (
          <div className="flex flex-col text-sm">
            <span className="text-blue-600">
              Forfait{(prestation.quantity || 1) > 1 ? ` (${prestation.quantity}×)` : ''}
            </span>
            <span className="font-medium text-gray-800">
              {prestation.fixedPrice} € {displayedDuration ? `- ${displayedDuration}` : ''}
            </span>
          </div>
        );
      }
    };

    return (
      <div
        key={prestation._id}
        className={`relative p-3 mb-2 rounded-md transition-all duration-200 border ${
          isInvoiced
            ? 'bg-slate-100 border-slate-300'
            : 'bg-slate-50 border-transparent hover:border-blue-200 hover:shadow-sm'
        }`}
      >
        {isInvoiced && (
          <div
            className={`absolute -top-3 -right-3 px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm flex items-center z-10 ${
              isPaid ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
            }`}
          >
            {isPaid ? (
              <>
                <LockClosedIcon className="h-3 w-3 mr-1" />
                Payée
              </>
            ) : (
              <>
                <ClockIcon className="h-3 w-3 mr-1" />
                Facturée
              </>
            )}
          </div>
        )}

        {/* Titre + Actions */}
        <div className="flex justify-between items-start mb-2">
          <div className="text-sm font-semibold text-gray-700">
            {prestation.description}
          </div>
          {!isInvoiced && (
            <div className="flex space-x-1">
              <button
                onClick={() => onEdit && onEdit(prestation)}
                className="p-1 text-blue-500 hover:bg-blue-50 rounded-full transition-colors duration-200"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete && onDelete(prestation._id)}
                className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Durée + Total */}
        <div className="flex justify-between items-center bg-slate-200 rounded-md p-2">
          {renderDurationInfo()}
          <div className="flex flex-col text-right">
            <span className="text-xs text-gray-500">Total</span>
            <span className="text-lg font-semibold text-gray-800">
              {prestation.total?.toFixed(2)} €
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header & Sélecteur de mois */}
      <div className="flex flex-wrap items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Récap Mensuel</h2>
          <p className="text-sm text-gray-200">
            Prestations pour le mois sélectionné
          </p>
        </div>
        <div className="w-48 mt-3 md:mt-0">
          <DatePicker
            selected={selectedMonth}
            onChange={(date) => setSelectedMonth(date)}
            dateFormat="MMMM yyyy"
            showMonthYearPicker
            locale="fr"
            className="
              w-full p-2 border border-gray-300 rounded-md
              text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
        </div>
      </div>

      {/* Stats globales du mois */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Nombre de prestations */}
        <div className="bg-slate-200 border border-slate-300 rounded-md p-3 shadow-sm text-center text-gray-800">
          <h3 className="text-sm text-blue-600 uppercase mb-1">
            Nombre de Prestations
          </h3>
          <p className="text-2xl font-bold">{filteredPrestations.length}</p>
        </div>
        {/* Total du mois */}
        <div className="bg-slate-200 border border-slate-300 rounded-md p-3 shadow-sm text-center text-gray-800">
          <h3 className="text-sm text-green-600 uppercase mb-1">Total du mois</h3>
          <p className="text-2xl font-bold">{totalMontant.toFixed(2)}€</p>
        </div>
        {/* Heures totales */}
        <div className="bg-slate-200 border border-slate-300 rounded-md p-3 shadow-sm text-center text-gray-800">
          <h3 className="text-sm text-purple-600 uppercase mb-1">Heures totales</h3>
          <p className="text-2xl font-bold">{formatTotalDuration(totalHeures)}</p>
        </div>
      </div>

      {/* Contenu : Liste des journées */}
      <div className="overflow-x-auto pb-4">
        {sortedDates.length === 0 ? (
          <div className="w-full text-center py-8 text-gray-300">
            Aucune prestation pour ce mois.
          </div>
        ) : (
          <div className="flex space-x-6">
            {sortedDates.map((dateKey) => {
              const dailyData = groupedData[dateKey];
              const allPrestationsForDay = Object.values(dailyData).flat();
              const dayTotal = allPrestationsForDay.reduce((sum, p) => sum + (p.total || 0), 0);

              return (
                <div
                  key={dateKey}
                  className="
                    flex-shrink-0
                    w-full md:w-72
                    bg-slate-200
                    text-gray-800
                    border border-slate-300
                    rounded-md
                    shadow-sm
                    overflow-hidden
                  "
                >
                  {/* En-tête date */}
                  <div className="bg-sky-600 p-3 border-b border-sky-700">
                    <h3 className="text-md font-bold text-white">
                      {format(new Date(dateKey), 'EEEE d MMMM', { locale: fr })}
                    </h3>
                  </div>

                  {/* Contenu de la journée */}
                  <div className="p-4 space-y-4">
                    {Object.entries(dailyData).map(([clientName, prestations]) => (
                      <div key={clientName}>
                        <div
                          className="
                            px-2 py-1 mb-1
                            bg-slate-300
                            text-gray-800
                            rounded-md
                            font-semibold
                            text-sm
                          "
                        >
                          {clientName}
                        </div>
                        <div className="space-y-2">
                          {prestations.map((p) => (
                            <RenderPrestation key={p._id} prestation={p} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer : total de la journée */}
                  <div className="bg-sky-50 border-t border-sky-100 p-3 text-right">
                    <p className="font-semibold text-sky-700">
                      Total Jour : {dayTotal.toFixed(2)} €
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlySummary;






/*
import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { PencilIcon, TrashIcon, LockClosedIcon, ClockIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePrestation } from '../contexts/PrestationContext';

registerLocale('fr', fr);

const formatTotalDuration = (durationInMinutes) => {
  if (!durationInMinutes) return '0h';
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${String(minutes).padStart(2, '0')}`;
};

function formatFixedDuration(p) {
  const totalMin = p.duration || 0;
  if (p.durationUnit === 'days') {
    const d = totalMin / 1440;
    if (d === 0.5) return '½ journée';
    if (d === 1) return '1 journée';
    return `${d} jours`;
  } else if (p.durationUnit === 'hours') {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h${m}min`;
  } else {
    return `${totalMin} minutes`;
  }
}

const MonthlySummary = ({ onEdit, onDelete }) => {
  const { prestations } = usePrestation();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [filteredPrestations, setFilteredPrestations] = useState([]);

  // Filtrer par mois
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

  // Groupement par date => { 'yyyy-MM-dd': { clientName: [p1, p2...] } }
  const groupedData = filteredPrestations.reduce((acc, p) => {
    const dateKey = format(new Date(p.date), 'yyyy-MM-dd');
    const clientName = p.client?.name || 'Client inconnu';
    if (!acc[dateKey]) acc[dateKey] = {};
    if (!acc[dateKey][clientName]) acc[dateKey][clientName] = [];
    acc[dateKey][clientName].push(p);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedData).sort((a, b) => new Date(a) - new Date(b));

  // Totaux globaux (pour le mois entier)
  const totalMontant = filteredPrestations.reduce((acc, p) => acc + (p.total || 0), 0);
  const totalHeures = filteredPrestations.reduce((sum, p) => sum + (p.duration || 0), 0);

  const RenderPrestation = ({ prestation }) => {
    const isInvoiced = prestation.invoiceId !== null;
    const isPaid = prestation.invoicePaid;

    const renderDurationInfo = () => {
      if (prestation.billingType === 'hourly') {
        const totalMin = prestation.duration || 0;
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        return (
          <div className="flex flex-col">
            <span className="text-sm text-blue-600">Durée × Taux horaire</span>
            <span className="text-md font-medium text-gray-800">
              {h}h{m ? `${m}min` : ''} × {prestation.hourlyRate}€/h
            </span>
          </div>
        );
      } else {
        const displayedDuration = formatFixedDuration(prestation);
        return (
          <div className="flex flex-col">
            <span className="text-sm text-blue-600">
              Forfait{(prestation.quantity || 1) > 1 ? ` (${prestation.quantity}×)` : ''}
            </span>
            <span className="text-md font-medium text-gray-800">
              {prestation.fixedPrice}€ {displayedDuration ? `- ${displayedDuration}` : ''}
            </span>
          </div>
        );
      }
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
          <div className="flex items-start mb-3">
            <div className="flex-1 text-gray-800">
              <h4 className="text-lg font-medium">{prestation.description}</h4>
            </div>
            {!isInvoiced && (
              <div className="flex space-x-1 ml-4">
                <button
                  onClick={() => onEdit && onEdit(prestation)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors duration-200"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete && onDelete(prestation._id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

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
                {prestation.total?.toFixed(2)}€
              </span>
            </div>
          </div>

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

      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-4">
          {sortedDates.length === 0 ? (
            <div className="w-full text-center py-8 text-gray-500">
              Aucune prestation pour ce mois.
            </div>
          ) : (
            sortedDates.map((dateKey) => {
              const dailyData = groupedData[dateKey];

              // (★) On récupère **toutes** les prestations de cette journée,
              //     peu importe le client:
              const allPrestationsForDay = Object.values(dailyData).flat();
              const dayTotal = allPrestationsForDay.reduce(
                (sum, p) => sum + (p.total || 0),
                0
              );

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
                          borderLeftColor: `hsl(${
                            (clientName.length * 30) % 360
                          }, 70%, 60%)`,
                          backgroundColor: '#f9fafb',
                        }}
                      >
                        <div className="px-4 py-2 font-semibold bg-gray-50">
                          {clientName}
                        </div>
                        <div className="divide-y divide-gray-200">
                          {prestations.map((p) => (
                            <RenderPrestation key={p._id} prestation={p} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  
                  <div className="bg-gray-200 p-4 border-t">
                    <p className="text-right font-semibold">
                      Total : {dayTotal.toFixed(2)} €
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
*/
