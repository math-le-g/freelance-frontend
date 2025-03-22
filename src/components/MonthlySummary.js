import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  PencilIcon,
  TrashIcon,
  LockClosedIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  XCircleIcon,
  CalendarIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon as ClockIconOutline
} from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePrestation } from '../contexts/PrestationContext';
import { INVOICE_STATUS } from '../utils/constants';

// Importer la palette de couleurs pour les clients
import { clientColorPalette } from '../utils/clientColors';

registerLocale('fr', fr);

/**
 * Formate une durée en minutes sous forme "XhYY".
 */
function formatTotalDuration(durationInMinutes) {
  if (!durationInMinutes) return '0h';
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h${String(minutes).padStart(2, '0')}`;
}

/**
 * Formate la durée d'une prestation "fixed" (ex: 80 min, 2h30, 1 journée...).
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
    // 'minutes'
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

  // Map pour stocker l'association client -> couleur
  const [clientColorMap, setClientColorMap] = useState({});

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
      // 1) Sélection par date
      const d = new Date(p.date);
      const isInSelectedMonth = d.getFullYear() === year && d.getMonth() === month;
      if (!isInSelectedMonth) return false;
      // 2) Exclure les "SUPPRIMEE"
      if (p.rectificationState === 'SUPPRIMEE') {
        return false;
      }

      if (p.isReplaced) return false;
      // 3) Exclure les "annulées" si vous voulez
      if (p.invoiceStatus === 'cancelled') return false;

      return true;
    });

    // Trier par date
    const sortedPrestations = validPrestations.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    setFilteredPrestations(sortedPrestations);

    // Calculer les stats (montant & heures totales)
    const tauxURSSAF = 0.246; // Idéalement récupéré depuis l'API ou un contexte
    const totalMontant = validPrestations.reduce((acc, p) => {
      // Si la prestation est annulée, on n'ajoute pas son total
      if (p.invoiceStatus === 'cancelled') {
        return acc;
      }
      return acc + (p.total || 0);
    }, 0);

    // Même logique pour totalHeures
    const totalHeures = validPrestations.reduce((sum, p) => {
      // S'il est annulé, on ne l'ajoute pas
      if (p.invoiceStatus === 'cancelled') {
        return sum;
      }

      // Si c'est un forfait, multiplier la durée par p.quantity
      if (p.billingType === 'fixed') {
        return sum + (p.duration || 0) * (p.quantity || 1);
      }

      // Sinon, on ajoute p.duration...
      return sum + (p.duration || 0);
    }, 0);

    const totalPrestations = validPrestations.filter(
      (p) => p.invoiceStatus !== 'cancelled'
    ).length;

    const totalNet = totalMontant * (1 - tauxURSSAF);

    setStats({
      totalMontant,
      totalHeures,
      totalPrestations,
      totalNet,
      tauxURSSAF
    });

    // Générer la map des couleurs pour les clients
    const newClientColorMap = {};
    const uniqueClients = [...new Set(validPrestations.map(p => p.client?.name || 'Client inconnu'))];

    uniqueClients.forEach((clientName, index) => {
      // Utiliser la palette de couleurs de manière cyclique
      const colorIndex = index % clientColorPalette.length;
      newClientColorMap[clientName] = clientColorPalette[colorIndex];
    });

    setClientColorMap(newClientColorMap);

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

  const RenderPrestation = ({ prestation, clientStyle }) => {
    // 1) On considère qu'une prestation est "facturée" dès qu'elle a invoiceId ou un invoiceStatus
    //    Notamment si invoiceStatus === 'draft', c'est déjà un brouillon "facturé".
    const isInvoiced = prestation.invoiceId !== null || prestation.invoiceStatus;
    // 2) Est-elle payée ?
    const isPaid = prestation.invoicePaid;
    // 3) Est-ce une rectification ?
    const isRectification = prestation.originalPrestationId != null;

    // 4) Badge de statut (facturée, brouillon, payée, annulée...)
    let badgeElement = null;
    if (isInvoiced) {
      // invoiceStatus peut être 'draft', 'unpaid', 'paid', 'cancelled', etc.
      if (isPaid) {
        // => Payée
        badgeElement = (
          <div className="px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm flex items-center bg-green-500 text-white">
            <LockClosedIcon className="h-3 w-3 mr-1" />
            Payée
          </div>
        );
      } else if (prestation.invoiceStatus === INVOICE_STATUS.DRAFT) {
        // => Brouillon
        badgeElement = (
          <div className="px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm flex items-center bg-blue-500 text-white">
            <DocumentDuplicateIcon className="h-3 w-3 mr-1" />
            Brouillon
          </div>
        );
      } else if (prestation.invoiceStatus === INVOICE_STATUS.CANCELLED) {
        // => Annulée
        badgeElement = (
          <div className="px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm flex items-center bg-gray-500 text-white">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Annulée
          </div>
        );
      } else {
        // => Facturée et non payée => "En attente"
        badgeElement = (
          <div className="px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm flex items-center bg-yellow-500 text-white">
            <ClockIcon className="h-3 w-3 mr-1" />
            En attente
          </div>
        );
      }
    }

    // Déterminer le contenu à afficher en fonction du type de facturation
    const renderContent = () => {
      if (prestation.billingType === 'hourly') {
        const totalMin = prestation.duration || 0;
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;

        return (
          <div className="flex flex-col">
            <div className="text-xs text-gray-600 opacity-75">Durée × Taux</div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-800 text-sm">
                {h}h{m ? `${m}min` : ''} × {prestation.hourlyRate}€/h
              </span>
            </div>
          </div>
        );
      } else {
        // Forfait
        const displayedDuration = formatFixedDuration(prestation);
        const isMultiple = (prestation.quantity || 1) > 1;

        return (
          <div className="flex flex-col">
            <div className="text-xs text-gray-600 opacity-75">
              Forfait{isMultiple ? ` × ${prestation.quantity}` : ''}
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-800 text-sm">
                {prestation.fixedPrice}€{displayedDuration ? ` - ${displayedDuration}` : ''}
              </span>
            </div>
          </div>
        );
      }
    };

    return (
      <div className={`
        ${clientStyle.bg} rounded-md shadow-sm overflow-hidden 
        transition-all duration-200 hover:shadow-md mb-2
        border-l-4 ${clientStyle.borderColor}
      `}>
        {/* En-tête avec description et badges/boutons */}
        <div className="flex justify-between items-start p-2">
          <h4 className={`font-semibold ${clientStyle.text} text-sm`}>
            {prestation.description}
          </h4>
          <div className="flex space-x-1">
            {badgeElement && (
              <div className="mr-1">{badgeElement}</div>
            )}
            {!isInvoiced && (
              <>
                <button
                  onClick={() => onEdit && onEdit(prestation)}
                  className="p-1 bg-white/80 text-blue-600 rounded-full hover:bg-white transition-colors"
                  title="Modifier"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete && onDelete(prestation._id)}
                  className="p-1 bg-white/80 text-red-600 rounded-full hover:bg-white transition-colors"
                  title="Supprimer"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Contenu principal : durée, taux, total */}
        <div className="p-2 flex justify-between items-center bg-white/60 border-t border-white/20">
          {renderContent()}
          <div className="text-right">
            <div className="text-xs text-gray-600 opacity-75">Total</div>
            <div className="font-bold text-gray-900">
              {(prestation.total || 0).toFixed(2)} €
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Formatter le nom du mois en français
  const formattedMonthName = format(selectedMonth, 'MMMM yyyy', { locale: fr });

  return (
    <div>
      {/* Header avec titre et sélecteur de mois */}
      <div className="flex flex-wrap items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-300 to-indigo-400 text-transparent bg-clip-text">
            Récap Mensuel
          </h2>
          <p className="text-sm text-gray-300">
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
              w-full p-2 bg-slate-800/50 border border-slate-700 rounded-md
              text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500
              shadow-sm backdrop-blur-sm
            "
          />
        </div>
      </div>

      {/* Stats globales du mois */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
  {/* Nombre de prestations */}
  <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-4 shadow-lg flex items-center">
    <div className="p-2 rounded-full bg-blue-500/20 mr-3">
      <ChartBarIcon className="h-5 w-5 text-blue-300" />
    </div>
    <div className="flex-1 text-center">
      <h3 className="text-xs font-semibold text-blue-300 uppercase mb-1">
        Nombre de Prestations
      </h3>
      <p className="text-2xl font-bold text-white">{stats.totalPrestations}</p>
    </div>
  </div>
  {/* Total du mois BRUT */}
  <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-4 shadow-lg flex items-center">
    <div className="p-2 rounded-full bg-emerald-500/20 mr-3">
      <CurrencyDollarIcon className="h-5 w-5 text-emerald-300" />
    </div>
    <div className="flex-1 text-center">
      <h3 className="text-xs font-semibold text-emerald-300 uppercase mb-1">Total du mois BRUT</h3>
      <p className="text-2xl font-bold text-white">{(stats.totalMontant || 0).toFixed(2)}€</p>
    </div>
  </div>
  {/* Total du mois NET */}
  <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-4 shadow-lg flex items-center">
    <div className="p-2 rounded-full bg-indigo-500/20 mr-3">
      <CurrencyDollarIcon className="h-5 w-5 text-indigo-300" />
    </div>
    <div className="flex-1 text-center">
      <h3 className="text-xs font-semibold text-indigo-300 uppercase mb-1">Total du mois NET</h3>
      <p className="text-2xl font-bold text-white">{(stats.totalNet || 0).toFixed(2)}€</p>
      <p className="text-xs text-gray-400">
        Après déduction URSSAF ({((stats.tauxURSSAF || 0.246) * 100).toFixed(1)}%)
      </p>
    </div>
  </div>
  {/* Heures totales */}
  <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg p-4 shadow-lg flex items-center">
    <div className="p-2 rounded-full bg-sky-500/20 mr-3">
      <ClockIconOutline className="h-5 w-5 text-sky-300" />
    </div>
    <div className="flex-1 text-center">
      <h3 className="text-xs font-semibold text-sky-300 uppercase mb-1">Heures totales</h3>
      <p className="text-2xl font-bold text-white">
        {formatTotalDuration(stats.totalHeures)}
      </p>
    </div>
  </div>
</div>

      {/* Contenu : Liste des journées avec scroll horizontal */}
      <div className="overflow-x-auto pb-4">
        {sortedDates.length === 0 ? (
          <div className="w-full text-center py-8 text-gray-300">
            Aucune prestation pour ce mois.
          </div>
        ) : (
          <div className="flex space-x-4">
            {sortedDates.map((dateKey) => {
              const dailyData = groupedData[dateKey];
              // Récupérer toutes les prestations de la journée
              const allPrestationsForDay = Object.values(dailyData).flat();

              // Calcul du total de la journée
              const dayTotal = allPrestationsForDay.reduce(
                (sum, p) => {
                  if (p.invoiceStatus === 'cancelled') {
                    return sum;
                  }
                  return sum + (p.total || 0);
                },
                0
              );

              const formattedDate = format(new Date(dateKey), 'EEEE d MMMM', { locale: fr });
              const formattedDayName = format(new Date(dateKey), 'EEEE', { locale: fr });
              const formattedDayNumber = format(new Date(dateKey), 'd', { locale: fr });
              const formattedMonthName = format(new Date(dateKey), 'MMMM', { locale: fr });

              return (
                <div
                  key={dateKey}
                  className="
                    flex-shrink-0
                    w-72
                    bg-slate-800/80
                    text-gray-100
                    border border-slate-700
                    rounded-lg
                    shadow-lg
                    overflow-hidden
                    backdrop-blur-sm
                  "
                >
                  {/* En-tête date */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 flex justify-between items-center shadow-md">
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-2 text-blue-200" />
                      <div>
                        <div className="font-bold text-white capitalize">{formattedDayName} {formattedDayNumber}</div>
                        <div className="text-xs text-blue-200 capitalize">{formattedMonthName}</div>
                      </div>
                    </div>
                    <div className="font-bold text-white">
                      {dayTotal.toFixed(2)}€
                    </div>
                  </div>

                  {/* Contenu de la journée */}
                  <div className="p-3">
                    {Object.entries(dailyData).map(([clientName, prestations]) => {
                      // Récupérer la couleur associée au client
                      const colorStyle = clientColorMap[clientName] || clientColorPalette[0];

                      return (
                        <div key={clientName} className="mb-3 last:mb-0">
                          <div
                            className={`
                              px-2 py-1 mb-2
                              ${colorStyle.bg}
                              ${colorStyle.text}
                              rounded-md
                              font-semibold
                              text-sm
                              shadow-sm
                              border-l-4 ${colorStyle.borderColor}
                            `}
                          >
                            {clientName}
                          </div>
                          <div className="space-y-2">
                            {prestations.map((p) => (
                              <RenderPrestation key={p._id} prestation={p} clientStyle={colorStyle} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Légende des clients */}
      {Object.keys(clientColorMap).length > 0 && (
        <div className="mt-6 p-4 bg-slate-800/60 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700/50">
          <h3 className="text-sm font-medium text-blue-300 mb-3">Légende des clients</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(clientColorMap).map(([clientName, colors]) => (
              <div
                key={clientName}
                className={`
                  flex items-center px-3 py-1.5 rounded-md text-xs font-medium 
                  ${colors.bg} ${colors.text}
                  border-l-4 ${colors.borderColor}
                `}
              >
                {clientName}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlySummary;