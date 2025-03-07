import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentDuplicateIcon, 
  ArrowPathIcon, 
  LockClosedIcon,
  XMarkIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const RectificationIntroModal = ({ isOpen, onClose, invoiceNumber, factureId }) => {
  const navigate = useNavigate();
  
  if (!isOpen) return null;

  const handleProceed = () => {
    navigate(`/rectify-new/${factureId}`);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-modern border border-white/10 rounded-xl w-full max-w-3xl shadow-2xl">
        {/* En-tête */}
        <div className="relative p-6 border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg border border-white/10 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          
          <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
            <DocumentDuplicateIcon className="h-7 w-7 text-blue-400" />
            Rectification de la facture #{invoiceNumber}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Explication légale */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-blue-300 text-sm leading-relaxed">
              Conformément à la législation française, la rectification d'une facture nécessite l'émission 
              d'une nouvelle facture rectificative. La facture d'origine sera conservée et la nouvelle facture 
              y fera expressément référence.
            </p>
          </div>

          {/* Étapes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
              <DocumentDuplicateIcon className="h-6 w-6 text-blue-400 mb-2" />
              <h3 className="font-medium text-white mb-2">Nouvelle Facture</h3>
              <p className="text-sm text-white/70">
                Une nouvelle facture rectificative sera créée avec un nouveau numéro séquentiel
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
              <ArrowPathIcon className="h-6 w-6 text-yellow-400 mb-2" />
              <h3 className="font-medium text-white mb-2">Motif Légal</h3>
              <p className="text-sm text-white/70">
                Vous devrez indiquer le motif légal de la rectification et les modifications à apporter
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
              <LockClosedIcon className="h-6 w-6 text-green-400 mb-2" />
              <h3 className="font-medium text-white mb-2">Traçabilité</h3>
              <p className="text-sm text-white/70">
                L'historique des modifications sera conservé et les deux factures seront liées
              </p>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-white/70 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleProceed}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Commencer la rectification
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RectificationIntroModal;