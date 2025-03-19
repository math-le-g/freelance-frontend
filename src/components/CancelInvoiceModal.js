// frontend/src/components/CancelInvoiceModal.js
import React, { useState, useCallback } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const CancelInvoiceModal = ({ isOpen, onClose, onSubmit, facture }) => {
  const [motif, setMotif] = useState('Erreur de facturation');
  const [commentaire, setCommentaire] = useState('');
  
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!motif) {
      toast.error('Veuillez sélectionner un motif d\'annulation.');
      return;
    }
    
    onSubmit({
      motif,
      commentaire
    });
  }, [motif, commentaire, onSubmit]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[1000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-slate-800 border border-slate-700 rounded-xl shadow-xl w-full max-w-lg">
        {/* En-tête */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h3 className="text-xl font-bold text-white">Annulation de la facture</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          {/* Message d'avertissement */}
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4 text-amber-200 flex gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-medium">Attention</p>
              <p className="text-sm mt-1">
                L'annulation d'une facture est une opération irréversible.
                La facture sera marquée comme annulée et restera visible dans l'historique.
              </p>
            </div>
          </div>
          
          {/* Résumé de la facture */}
          {facture && (
            <div className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Facture:</span>
                <span className="text-white font-medium">#{facture.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Client:</span>
                <span className="text-white">{facture.client?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Montant:</span>
                <span className="text-white font-medium">{facture.montantHT?.toFixed(2)} €</span>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="motif" className="block text-sm font-medium text-gray-300 mb-1">
                Motif de l'annulation
              </label>
              <select
                id="motif"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="Erreur de facturation">Erreur de facturation</option>
                <option value="Annulation de la prestation">Annulation de la prestation</option>
                <option value="Doublon">Facture en doublon</option>
                <option value="A la demande du client">À la demande du client</option>
                <option value="Autre">Autre motif</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="commentaire" className="block text-sm font-medium text-gray-300 mb-1">
                Commentaire (optionnel)
              </label>
              <textarea
                id="commentaire"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                placeholder="Précisions sur l'annulation..."
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Confirmer l'annulation
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CancelInvoiceModal;