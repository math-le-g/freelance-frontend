import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ClockIcon,
  PaperAirplaneIcon,
  CheckIcon,
  XCircleIcon,
  BanknotesIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const HistoriqueFacture = ({ facture, compact = false }) => {
  if (!facture) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <PaperAirplaneIcon className="h-4 w-4 text-blue-400" />;
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-red-400" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className={`p-3 border-b border-gray-700 ${compact ? 'text-center' : ''}`}>
        <h3 className="text-sm font-medium text-gray-200">
          {compact ? 'Détails' : 'Historique de la facture'}
        </h3>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-sm">
        {/* Infos principales */}
        <div className="space-y-2">
          <div className={`
            ${compact ? 'bg-gray-800/50' : 'bg-gray-800'} 
            rounded-lg p-3 border border-gray-700
          `}>
            <div className="flex items-center gap-2 text-gray-300 mb-2">
              <CalendarIcon className="h-4 w-4 text-blue-400" />
              <span>Dates</span>
            </div>
            <div className="pl-6 space-y-1 text-sm">
              <p className="text-gray-300">
                Créée : {format(new Date(facture.createdAt), 'dd MMM yyyy', { locale: fr })}
              </p>
              {facture.datePaiement && (
                <p className="text-green-400">
                  Payée : {format(new Date(facture.datePaiement), 'dd MMM yyyy', { locale: fr })}
                </p>
              )}
            </div>
          </div>

          {/* Montants */}
          <div className={`
            ${compact ? 'bg-gray-800/50' : 'bg-gray-800'} 
            rounded-lg p-3 border border-gray-700
          `}>
            <div className="flex items-center gap-2 text-gray-300 mb-2">
              <BanknotesIcon className="h-4 w-4 text-green-400" />
              <span>Montants</span>
            </div>
            <div className="pl-6 space-y-1 text-sm">
              <p className="text-gray-300">
                HT : {facture.montantHT?.toFixed(2) || 0} €
              </p>
              <p className="text-gray-300">
                Net : {facture.montantNet?.toFixed(2) || 0} €
              </p>
            </div>
          </div>
        </div>

        {/* Rappels */}
        {facture.rappels?.length > 0 && (
          <div className={`
            ${compact ? 'bg-gray-800/50' : 'bg-gray-800'} 
            rounded-lg p-3 border border-gray-700
          `}>
            <h4 className="text-xs font-medium text-gray-300 mb-2 flex items-center gap-2">
              <PaperAirplaneIcon className="h-4 w-4 text-indigo-400" />
              Rappels
            </h4>
            <div className="space-y-2 pl-6">
              {facture.rappels.map((rappel, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-300 text-sm">
                  {getStatusIcon(rappel.status)}
                  <span>{format(new Date(rappel.date), 'dd/MM/yyyy', { locale: fr })}</span>
                  {rappel.status === 'failed' && (
                    <span className="text-xs text-red-400">Échec</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paiements */}
        {facture.historiquePaiements?.length > 0 && (
          <div className={`
            ${compact ? 'bg-gray-800/50' : 'bg-gray-800'} 
            rounded-lg p-3 border border-gray-700
          `}>
            <h4 className="text-xs font-medium text-gray-300 mb-2 flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-green-400" />
              Paiements
            </h4>
            <div className="space-y-2 pl-6">
              {facture.historiquePaiements.map((paiement, index) => (
                <div key={index} className="text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <span>{paiement.montant.toFixed(2)} €</span>
                    <span className="text-gray-400">({paiement.methode})</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {format(new Date(paiement.date), 'dd MMMM yyyy', { locale: fr })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoriqueFacture;




/*
import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, Send, Check, XCircle } from 'lucide-react';

const HistoriqueFacture = ({ facture }) => {
  if (!facture) {
    return <p>Aucune facture sélectionnée.</p>;
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Send className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRappelLabel = (type) => {
    switch (type) {
      case 'premier':
        return 'Premier rappel';
      case 'deuxieme':
        return 'Deuxième rappel';
      case 'troisieme':
        return 'Dernier rappel';
      default:
        return 'Rappel';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full">
      <h3 className="text-lg font-semibold mb-4">Historique de la facture</h3>

      
      <div className="mb-6 text-sm text-gray-700">
        <p>
          Créée le :{' '}
          {format(new Date(facture.createdAt), 'dd MMMM yyyy', { locale: fr })}
        </p>
        {facture.dateFacture && (
          <p>
            Date facture :{' '}
            {format(new Date(facture.dateFacture), 'dd MMMM yyyy', { locale: fr })}
          </p>
        )}
        {facture.dateEcheance && (
          <p>
            Date d'échéance :{' '}
            {format(new Date(facture.dateEcheance), 'dd MMMM yyyy', { locale: fr })}
          </p>
        )}


        {facture.datePaiement && (
          <p className="text-green-600">
            Payée le :{' '}
            {format(new Date(facture.datePaiement), 'dd MMMM yyyy', { locale: fr })}
          </p>
        )}
      </div>

      
      {facture.rappels && facture.rappels.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium mb-2">Rappels envoyés</h4>
          <div className="space-y-2">
            {facture.rappels.map((rappel, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                {getStatusIcon(rappel.status)}
                <span>{getRappelLabel(rappel.type)}</span>
                <span className="text-gray-500">
                  -{' '}
                  {format(new Date(rappel.date), 'dd/MM/yyyy HH:mm', {
                    locale: fr,
                  })}
                </span>
                {rappel.status === 'failed' && (
                  <span className="text-red-500 text-xs">Échec d'envoi</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      
      {facture.historiquePaiements && facture.historiquePaiements.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium mb-2">Paiements</h4>
          <div className="space-y-2">
            {facture.historiquePaiements.map((paiement, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>{paiement.montant.toFixed(2)} €</span>
                <span className="text-gray-500">
                  -{' '}
                  {format(new Date(paiement.date), 'dd/MM/yyyy', {
                    locale: fr,
                  })}
                </span>
                <span className="text-gray-600">({paiement.methode})</span>
                {paiement.commentaire && (
                  <span className="text-gray-500 italic">
                    "{paiement.commentaire}"
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      
      {facture.versions && facture.versions.length > 0 && (
        <div>
          <h4 className="text-md font-medium mb-2">Rectifications</h4>
          <div className="space-y-2">
            {facture.versions.map((version, idx) => (
              <div key={idx} className="p-3 border border-gray-200 rounded-lg text-sm">
                <p className="font-semibold">
                  Version du{' '}
                  {format(new Date(version.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </p>
                <p>Client : {version.client}</p>
                {version.dateFacture && (
                  <p>
                    Date facture :{' '}
                    {format(new Date(version.dateFacture), 'dd/MM/yyyy', {
                      locale: fr,
                    })}
                  </p>
                )}
                <p>Description : {version.description}</p>
                <p>Heures : {version.hours}</p>
                <p>Taux horaire : {version.hourlyRate}</p>
                <p>MontantHT : {version.montantHT?.toFixed(2)} €</p>
                <p>Montant Net : {version.montantNet?.toFixed(2)} €</p>
                <p>Montant TTC : {version.montantTTC?.toFixed(2)} €</p>
                {version.changesComment && (
                  <p className="italic">Commentaire : {version.changesComment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoriqueFacture;
*/
