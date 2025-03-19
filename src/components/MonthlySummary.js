import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  PencilIcon,
  TrashIcon,
  LockClosedIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  XCircleIcon
} from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePrestation } from '../contexts/PrestationContext';
import { INVOICE_STATUS } from '../utils/constants';

registerLocale('fr', fr);

/**
 * Formate une durée en minutes sous forme "XhYY" ou "0h" si pas de minutes.
 */
function formatTotalDuration(durationInMinutes) {
  if (!durationInMinutes) return '0h';
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${String(minutes).padStart(2, '0')}`;
}

/**
 * Formate la durée d'une prestation "fixed" (ex: 80 min, 2h30, 1 journée...)
 */
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
  const [stats, setStats] = useState({
    totalMontant: 0,
    totalHeures: 0,
    totalPrestations: 0,
    totalNet: 0,
    tauxURSSAF: 0.246
  });

  useEffect(() => {
    if (!selectedMonth || prestations.length === 0) {
      setFilteredPrestations([]);
      return;
    }
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    // Copie des prestations pour filtrage / tri
    const allPrestations = [...prestations];

    // Filtrer par mois, ignorer celles remplacées
    const validPrestations = allPrestations.filter(p => {
      const d = new Date(p.date);
      const isInSelectedMonth = d.getFullYear() === year && d.getMonth() === month;

      // Pas dans le mois sélectionné
      if (!isInSelectedMonth) return false;

      // Si c'est une prestation remplacée, on ne l'affiche pas
      if (p.isReplaced) return false;

      return true;
    });

    // Trier par date
    const sortedPrestations = validPrestations.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    setFilteredPrestations(sortedPrestations);

    // Calculer les stats (montant & heures totales)
    const tauxURSSAF = 0.246; // Idéalement récupéré depuis l'API ou un contexte
    const totalMontant = sortedPrestations.reduce((acc, p) => {
      return acc + (p.total || 0);
    }, 0);

    // Addition des durées (on suppose que p.duration inclut déjà la totalité)
    const totalHeures = sortedPrestations.reduce((sum, p) => {
      if (p.billingType === 'fixed') {
        return sum + ((p.duration || 0) * (p.quantity || 1));
      } else {
        return sum + (p.duration || 0);
      }
    }, 0);

    const totalNet = totalMontant * (1 - tauxURSSAF);

    setStats({
      totalMontant,
      totalHeures,
      totalPrestations: sortedPrestations.length,
      totalNet,
      tauxURSSAF
    });
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

  /**
   * Composant interne pour l'affichage d'une prestation
   */
  const RenderPrestation = ({ prestation }) => {
    const isInvoiced = prestation.invoiceId !== null;
    const isPaid = prestation.invoicePaid;
    const isRectification = prestation.originalPrestationId != null;

    // Durée et taux horaire / forfait
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
        // Forfait
        const displayedDuration = formatFixedDuration(prestation);
        // On vérifie si quantity > 1
        const isMultiple = (prestation.quantity || 1) > 1;
    
        return (
          <div className="flex flex-col text-sm">
            <span className="text-blue-600">
              Forfait{isMultiple ? ` × ${prestation.quantity}` : ''}
            </span>
            <span className="font-medium text-gray-800">
              {prestation.fixedPrice} € 
              {displayedDuration ? ` - ${displayedDuration}` : ''}
            </span>
          </div>
        );
      }
    };

    // Couleur de fond
    let bgColorClass = 'bg-slate-50';
    let borderColorClass = 'border-transparent hover:border-blue-200 hover:shadow-sm';

    if (isRectification && isInvoiced) {
      bgColorClass = 'bg-indigo-50/50';
      borderColorClass = 'border-indigo-200';
    } else if (isInvoiced) {
      bgColorClass = 'bg-slate-100';
      borderColorClass = 'border-slate-300';
    }

    // Badge de statut (Facturée, Payée, etc.)
    let badgeElement = null;
    if (isInvoiced) {
      if (isPaid) {
        // Prestation payée
        badgeElement = (
          <div className="px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm flex items-center bg-green-500 text-white">
            <LockClosedIcon className="h-3 w-3 mr-1" />
            Payée
          </div>
        );
      } else if (
        prestation.invoiceStatus === INVOICE_STATUS.DRAFT ||
        !prestation.invoiceIsSentToClient
      ) {
        // Facture brouillon
        badgeElement = (
          <div className="px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm flex items-center bg-blue-500 text-white">
            <DocumentDuplicateIcon className="h-3 w-3 mr-1" />
            Brouillon
          </div>
        );
      } else if (prestation.invoiceStatus === INVOICE_STATUS.CANCELLED) {
        // Facture annulée
        badgeElement = (
          <div className="px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm flex items-center bg-gray-500 text-white">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Annulée
          </div>
        );
      } else {
        // Facturée, en attente de paiement
        badgeElement = (
          <div className="px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm flex items-center bg-yellow-500 text-white">
            <ClockIcon className="h-3 w-3 mr-1" />
            En attente
          </div>
        );
      }
    }

    return (
      <div
        key={prestation._id}
        className={`relative p-3 mb-2 rounded-md transition-all duration-200 border ${bgColorClass} ${borderColorClass}`}
      >
        {/* Badge statut */}
        {badgeElement && (
          <div className="absolute -top-3 right-2 z-10">
            {badgeElement}
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
              {(prestation.total || 0).toFixed(2)} €
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Nombre de prestations */}
        <div className="bg-slate-200 border border-slate-300 rounded-md p-3 shadow-sm text-center text-gray-800">
          <h3 className="text-sm text-blue-600 uppercase mb-1">
            Nombre de Prestations
          </h3>
          <p className="text-2xl font-bold">{stats.totalPrestations}</p>
        </div>
        {/* Total du mois BRUT */}
        <div className="bg-slate-200 border border-slate-300 rounded-md p-3 shadow-sm text-center text-gray-800">
          <h3 className="text-sm text-green-600 uppercase mb-1">Total du mois BRUT</h3>
          <p className="text-2xl font-bold">{(stats.totalMontant || 0).toFixed(2)}€</p>
        </div>
        {/* Total du mois NET */}
        <div className="bg-slate-200 border border-slate-300 rounded-md p-3 shadow-sm text-center text-gray-800">
          <h3 className="text-sm text-purple-600 uppercase mb-1">Total du mois NET</h3>
          <p className="text-2xl font-bold">{(stats.totalNet || 0).toFixed(2)}€</p>
          <p className="text-xs text-gray-500">
            Après déduction URSSAF ({((stats.tauxURSSAF || 0.246) * 100).toFixed(1)}%)
          </p>
        </div>
        {/* Heures totales */}
        <div className="bg-slate-200 border border-slate-300 rounded-md p-3 shadow-sm text-center text-gray-800">
          <h3 className="text-sm text-purple-600 uppercase mb-1">Heures totales</h3>
          <p className="text-2xl font-bold">
            {formatTotalDuration(stats.totalHeures)}
          </p>
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
              // Récupérer toutes les prestations de la journée
              const allPrestationsForDay = Object.values(dailyData).flat();

              // Calcul du total de la journée
              const dayTotal = allPrestationsForDay.reduce(
                (sum, p) => sum + (p.total || 0),
                0
              );

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


