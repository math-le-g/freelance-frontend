import React, { useState, useCallback } from 'react';
import Modal from './Modal';
import { toast } from 'react-toastify'; // Assurez-vous d'avoir installé react-toastify

const PaymentModal = ({ isOpen, onClose, onSubmit }) => {
  const [paymentMethod, setPaymentMethod] = useState('virement');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [comment, setComment] = useState('');

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    // Validation supplémentaire
    if (!paymentMethod) {
      toast.error('Veuillez sélectionner une méthode de paiement.');
      return;
    }
    
    if (!paymentDate) {
      toast.error('Veuillez sélectionner une date de paiement.');
      return;
    }

    onSubmit({
      methodePaiement: paymentMethod,
      datePaiement: paymentDate,
      commentaire: comment
    });
  }, [paymentMethod, paymentDate, comment, onSubmit]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-lg font-bold mb-4">Enregistrer le paiement</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium mb-1">Mode de paiement</label>
          <select 
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full p-2 border rounded"
            required
          >
            <option value="virement">Virement bancaire</option>
            <option value="cheque">Chèque</option>
            <option value="especes">Espèces</option>
            <option value="carte">Carte bancaire</option>
          </select>
        </div>

        <div>
          <label htmlFor="paymentDate" className="block text-sm font-medium mb-1">Date du paiement</label>
          <input
            id="paymentDate"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium mb-1">Commentaire (optionnel)</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2 border rounded resize-none"
            rows={3}
            placeholder="Ajouter un commentaire..."
          />
        </div>

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
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Confirmer
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentModal;
