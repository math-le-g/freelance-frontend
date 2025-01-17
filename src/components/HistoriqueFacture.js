// frontend/src/components/HistoriqueFacture.js

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

      {/* Informations de base */}
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

      {/* Rappels */}
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

      {/* Paiements */}
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

      {/* Versions (rectifications) */}
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

