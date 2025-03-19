import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BanknotesIcon, ReceiptRefundIcon } from '@heroicons/react/24/outline';

const CreditNoteDisplay = ({ avoir, facture, asModal = false }) => {
  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
    } catch (e) {
      return 'Date invalide';
    }
  };

  // Si pas d'avoir, rien à afficher
  if (!avoir) return null;

  // Structure de base pour l'affichage
  const renderContent = () => (
    <div className="space-y-3">
      {/* En-tête avec montant et numéro */}
      <div className="flex justify-between items-center bg-pink-500/10 p-3 rounded-lg border border-pink-500/30">
        <div className="flex items-center">
          <BanknotesIcon className="h-5 w-5 text-pink-400 mr-2" />
          <div>
            <p className="font-medium text-white">Avoir n°{avoir.numero}</p>
            <p className="text-xs text-gray-300">{formatDate(avoir.date)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-pink-400">-{avoir.montant.toFixed(2)} €</p>
          <p className="text-xs text-gray-300">
            {facture ? `Facture #${facture.invoiceNumber}` : ''}
          </p>
        </div>
      </div>

      {/* Détails de l'avoir */}
      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">Motif</p>
            <p className="text-sm text-white">{avoir.motif}</p>
          </div>

          {avoir.remboursement && (
            <div>
              <p className="text-xs text-gray-400">Remboursement</p>
              <p className="text-sm text-white">
                {avoir.methodePaiement || 'Non spécifié'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Impact financier */}
      {facture && (
        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
          <p className="text-xs text-gray-400 mb-2">Impact financier</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-400">Montant initial</p>
              <p className="text-white">{facture.montantHT.toFixed(2)} €</p>
            </div>
            <div>
              <p className="text-gray-400">Après avoir</p>
              <p className="text-white">{(facture.montantHT - avoir.montant).toFixed(2)} €</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Affichage différent selon le contexte (modal ou composant normal)
  if (asModal) {
    return (
      <div className="p-5">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <ReceiptRefundIcon className="h-5 w-5 mr-2 text-pink-400" />
          Détails de l'avoir
        </h3>
        {renderContent()}
      </div>
    );
  }

  return renderContent();
};

export default CreditNoteDisplay;