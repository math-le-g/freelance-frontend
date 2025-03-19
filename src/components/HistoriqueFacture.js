import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ClockIcon,
  PaperAirplaneIcon,
  CheckIcon,
  XCircleIcon,
  BanknotesIcon,
  CalendarIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  ReceiptRefundIcon
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

  // Fonction pour déterminer le statut rectificatif de la facture
  const getRectificationStatus = () => {
    if (facture.isRectification) {
      return (
        <div className="flex items-center gap-2 text-sm text-white">
          <DocumentDuplicateIcon className="h-4 w-4 text-blue-400" />
          <span>Facture rectificative</span>
        </div>
      );
    }
    
    if (facture.statut === 'RECTIFIEE') {
      return (
        <div className="flex items-center gap-2 text-sm text-white">
          <ArrowPathIcon className="h-4 w-4 text-yellow-400" />
          <span>Facture rectifiée</span>
        </div>
      );
    }
    
    return null;
  };

  // Formatter une date avec format français
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
    } catch (error) {
      return 'Date invalide';
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
        {/* Statut rectificatif s'il est applicable */}
        {(facture.isRectification || facture.statut === 'RECTIFIEE') && (
          <div className={`
            ${compact ? 'bg-gray-800/50' : 'bg-gray-800'} 
            rounded-lg p-3 border ${facture.isRectification ? 'border-blue-800' : 'border-yellow-800'}
          `}>
            {getRectificationStatus()}
            
            {facture.isRectification && facture.rectificationInfo && (
              <div className="mt-2 pl-6 space-y-1 text-xs">
                <p className="text-gray-300">
                  Original: Facture #{facture.rectificationInfo.originalInvoiceNumber}
                </p>
                {facture.rectificationInfo.motifLegal && (
                  <p className="text-gray-300">
                    Motif: {facture.rectificationInfo.detailsMotif || facture.rectificationInfo.motifLegal}
                  </p>
                )}
                {facture.rectificationInfo.differenceMontantHT !== undefined && (
                  <p className={`${facture.rectificationInfo.differenceMontantHT >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    Différence: {facture.rectificationInfo.differenceMontantHT >= 0 ? '+' : ''}
                    {facture.rectificationInfo.differenceMontantHT?.toFixed(2) || 0} €
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Section Avoir - NOUVELLE SECTION */}
        {facture.avoir && facture.avoir.numero && (
          <div className={`
            ${compact ? 'bg-gray-800/50' : 'bg-gray-800'} 
            rounded-lg p-3 border border-pink-800
          `}>
            <div className="flex items-center gap-2 text-sm text-white">
              <ReceiptRefundIcon className="h-4 w-4 text-pink-400" />
              <span>Avoir émis</span>
            </div>
            
            <div className="mt-2 pl-6 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Numéro:</span>
                <span className="text-white font-medium">{facture.avoir.numero}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Date:</span>
                <span className="text-white">{formatDate(facture.avoir.date)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Montant:</span>
                <span className="text-pink-400 font-bold">-{facture.avoir.montant?.toFixed(2) || 0} €</span>
              </div>
              
              {facture.avoir.motif && (
                <div className="mt-1">
                  <span className="text-gray-300">Motif:</span>
                  <p className="text-white mt-1 border-l-2 border-pink-800/50 pl-2">{facture.avoir.motif}</p>
                </div>
              )}
              
              {facture.avoir.remboursement && (
                <div className="mt-1 pt-1 border-t border-gray-700">
                  <span className="text-gray-300">Remboursement:</span>
                  <div className="flex flex-col mt-1">
                    <span className="text-white">Méthode: {facture.avoir.methodePaiement || 'Non spécifié'}</span>
                    {facture.avoir.dateRemboursement && (
                      <span className="text-white">Date: {formatDate(facture.avoir.dateRemboursement)}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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