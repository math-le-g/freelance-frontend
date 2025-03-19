// frontend/src/components/CreditNoteModal.js
import React, { useState, useEffect } from 'react';
import { BanknotesIcon, XMarkIcon } from '@heroicons/react/24/outline';

const CreditNoteModal = ({ isOpen, onClose, onSubmit, facture }) => {
  const [motif, setMotif] = useState('');
  const [montant, setMontant] = useState('');
  const [remboursement, setRemboursement] = useState(false);
  const [methodePaiement, setMethodePaiement] = useState('');
  const [hasErrors, setHasErrors] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Réinitialiser les valeurs quand une nouvelle facture est sélectionnée
  useEffect(() => {
    if (facture) {
      setMontant(facture.montantHT?.toFixed(2) || '');
      setMotif('');
      setRemboursement(false);
      setMethodePaiement('');
      setHasErrors(false);
      setErrorMessage('');
      
      // Vérifier si la facture a déjà un avoir
      if (facture.avoir && facture.avoir.numero) {
        console.log("=== VÉRIFICATION AVOIR ===");
        console.log("Facture:", facture.invoiceNumber);
        console.log("Avoir présent:", !!facture.avoir);
        console.log("Détails avoir:", facture.avoir);
      }
    }
  }, [facture]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!motif.trim()) {
      setHasErrors(true);
      setErrorMessage('Le motif est requis');
      return;
    }
    
    if (!montant || isNaN(parseFloat(montant)) || parseFloat(montant) <= 0) {
      setHasErrors(true);
      setErrorMessage('Le montant doit être un nombre positif');
      return;
    }
    
    if (parseFloat(montant) > facture?.montantHT) {
      setHasErrors(true);
      setErrorMessage('Le montant ne peut pas dépasser le montant de la facture originale');
      return;
    }
    
    if (remboursement && !methodePaiement) {
      setHasErrors(true);
      setErrorMessage('Veuillez préciser la méthode de remboursement');
      return;
    }
    
    console.log('Données d\'avoir à soumettre:', {
      motif,
      montant: parseFloat(montant),
      remboursement,
      methodePaiement: remboursement ? methodePaiement : null
    });
    
    onSubmit({
      motif,
      montant: parseFloat(montant),
      remboursement,
      methodePaiement: remboursement ? methodePaiement : null
    });
    
    // Reset après soumission
    setMotif('');
    setMontant('');
    setRemboursement(false);
    setMethodePaiement('');
    setHasErrors(false);
    
    console.log("✅ Avoir correctement enregistré!");
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
        
        {/* Modal */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl w-full max-w-md relative z-10">
          {/* En-tête */}
          <div className="flex items-center justify-between p-5 border-b border-slate-700">
            <h3 className="text-xl font-bold text-white flex items-center">
              <BanknotesIcon className="w-6 h-6 text-pink-400 mr-2" />
              Création d'un avoir
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-5">
            {/* Message d'information */}
            <div className="mb-5 bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 text-blue-200">
              <p className="text-sm">
                Un avoir est un document qui annule ou réduit le montant d'une facture déjà payée. 
                Il doit être conservé avec la facture originale.
              </p>
            </div>
            
            {/* Erreurs */}
            {hasErrors && (
              <div className="mb-5 bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-200">
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              {/* Motif */}
              <div className="mb-4">
                <label htmlFor="motif" className="block text-sm font-medium text-gray-300 mb-1">
                  Motif de l'avoir
                </label>
                <input
                  id="motif"
                  type="text"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Erreur de facturation, remboursement partiel..."
                />
              </div>
              
              {/* Montant */}
              <div className="mb-4">
                <label htmlFor="montant" className="block text-sm font-medium text-gray-300 mb-1">
                  Montant de l'avoir (€)
                </label>
                <input
                  id="montant"
                  type="number"
                  step="0.01"
                  min="0"
                  max={facture?.montantHT}
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Le montant ne peut pas dépasser le montant de la facture originale ({facture?.montantHT?.toFixed(2)} €).
                </p>
              </div>
              
              {/* Remboursement */}
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    id="remboursement"
                    type="checkbox"
                    checked={remboursement}
                    onChange={() => setRemboursement(!remboursement)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="remboursement" className="ml-2 text-sm font-medium text-gray-300">
                    Effectuer un remboursement au client
                  </label>
                </div>
              </div>
              
              {/* Méthode de paiement (conditionnelle) */}
              {remboursement && (
                <div className="mb-4 ml-6 border-l-2 border-slate-600 pl-4">
                  <label htmlFor="methodePaiement" className="block text-sm font-medium text-gray-300 mb-1">
                    Méthode de remboursement
                  </label>
                  <select
                    id="methodePaiement"
                    value={methodePaiement}
                    onChange={(e) => setMethodePaiement(e.target.value)}
                    className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionnez une méthode</option>
                    <option value="virement">Virement bancaire</option>
                    <option value="cheque">Chèque</option>
                    <option value="especes">Espèces</option>
                    <option value="carte">Carte bancaire</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              )}
              
              {/* Boutons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
                >
                  <BanknotesIcon className="w-4 h-4 mr-1" />
                  Créer l'avoir
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditNoteModal;

/*
import React, { useState, useCallback } from 'react';
import Modal from './Modal';
import { toast } from 'react-toastify';
import axios from 'axios';

const CreditNoteModal = ({ isOpen, onClose, onSubmit, facture }) => {
  const [motif, setMotif] = useState('');
  const [remboursement, setRemboursement] = useState(false);
  const [methodePaiement, setMethodePaiement] = useState('virement');
  const [montant, setMontant] = useState('');
  
  // Quand le modal s'ouvre, initialiser les valeurs
  React.useEffect(() => {
    if (isOpen && facture) {
      // Initialiser le montant avec le montant de la facture
      setMontant(facture.montantHT?.toString() || '');
      verifyAndLogCreditNote(facture._id);
    }
  }, [isOpen, facture]);
  
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!motif) {
      toast.error('Veuillez indiquer un motif pour l\'avoir.');
      return;
    }
    
    if (!montant || isNaN(parseFloat(montant)) || parseFloat(montant) <= 0) {
      toast.error('Veuillez indiquer un montant valide pour l\'avoir.');
      return;
    }
    

    if (parseFloat(montant) > facture.montantHT) {
      toast.error('Le montant de l\'avoir ne peut pas dépasser le montant de la facture.');
      return;
    }

// Si le remboursement est coché, vérifier la méthode de paiement
    if (remboursement && !methodePaiement) {
      toast.error('Veuillez sélectionner une méthode de remboursement.');
      return;
    }

    console.log("Données d'avoir à soumettre:", { 
      motif, 
      montant: parseFloat(montant), 
      remboursement, 
      methodePaiement: remboursement ? methodePaiement : null 
    });
    
    // Appel à la fonction existante pour créer l'avoir
    onSubmit({
      motif,
      montant: parseFloat(montant),
      remboursement,
      methodePaiement: remboursement ? methodePaiement : null
    });
    
    // Attendre un peu puis vérifier si l'avoir a bien été créé
    setTimeout(async () => {
      if (facture?._id) {
        const avoir = await verifyAndLogCreditNote(facture._id);
        if (avoir) {
          console.log('✅ Avoir correctement enregistré!');
        } else {
          console.log('❌ Problème avec l\'enregistrement de l\'avoir');
        }
      }
    }, 1000);
  }, [motif, montant, remboursement, methodePaiement, onSubmit, facture]);

  const verifyAndLogCreditNote = async (factureId) => {
    if (!factureId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/factures/${factureId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const facture = response.data;
      
      console.log('=== VÉRIFICATION AVOIR ===');
      console.log('Facture:', facture.invoiceNumber);
      console.log('Avoir présent:', !!facture.avoir);
      
      if (facture.avoir) {
        console.log('Détails avoir:', {
          date: facture.avoir.date,
          numero: facture.avoir.numero,
          montant: facture.avoir.montant,
          motif: facture.avoir.motif,
          remboursement: facture.avoir.remboursement
        });
      } else {
        console.log('Aucun avoir trouvé pour cette facture');
      }
      
      return facture.avoir;
    } catch (error) {
      console.error('Erreur vérification avoir:', error);
      return null;
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-lg font-bold mb-4">Création d'un avoir</h3>
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
        <p className="text-blue-700">
          <strong>Information :</strong> Un avoir est un document qui annule ou réduit 
          le montant d'une facture déjà payée. Il doit être conservé avec la facture originale.
        </p>
      </div>
      
      {facture && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p><strong>Facture :</strong> #{facture.invoiceNumber}</p>
          <p><strong>Client :</strong> {facture.client?.name}</p>
          <p><strong>Montant payé :</strong> {facture.montantHT?.toFixed(2)} €</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="motif" className="block text-sm font-medium mb-1">Motif de l'avoir</label>
          <select
            id="motif"
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Sélectionnez un motif...</option>
            <option value="Erreur de facturation">Erreur de facturation</option>
            <option value="Prestation non conforme">Prestation non conforme</option>
            <option value="Remise exceptionnelle">Remise exceptionnelle</option>
            <option value="Annulation de la prestation">Annulation de la prestation</option>
            <option value="Autre">Autre motif</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="montant" className="block text-sm font-medium mb-1">Montant de l'avoir (€)</label>
          <input
            id="montant"
            type="number"
            step="0.01"
            min="0.01"
            max={facture?.montantHT || 99999}
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Le montant ne peut pas dépasser le montant de la facture originale.
          </p>
        </div>
        
        <div className="flex items-center">
          <input
            id="remboursement"
            type="checkbox"
            checked={remboursement}
            onChange={(e) => setRemboursement(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <label htmlFor="remboursement" className="ml-2 block text-sm">
            Effectuer un remboursement au client
          </label>
        </div>
        
        {remboursement && (
          <div>
            <label htmlFor="methodePaiement" className="block text-sm font-medium mb-1">
              Méthode de remboursement
            </label>
            <select
              id="methodePaiement"
              value={methodePaiement}
              onChange={(e) => setMethodePaiement(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="virement">Virement bancaire</option>
              <option value="cheque">Chèque</option>
              <option value="especes">Espèces</option>
              <option value="carte">Carte bancaire</option>
            </select>
          </div>
        )}
        
        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Créer l'avoir
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreditNoteModal;
*/