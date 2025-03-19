// frontend/src/components/CreditNoteBadge.js
import React from 'react';
import { BanknotesIcon } from '@heroicons/react/24/outline';

const CreditNoteBadge = ({ montant, onClick, className }) => {
  return (
    <div 
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-pink-500/20 text-pink-300 rounded-full cursor-pointer hover:bg-pink-500/30 transition-colors ${className || ''}`}
      onClick={onClick}
      title={`Avoir de ${montant ? montant.toFixed(2) + ' €' : ''}`}
    >
      <BanknotesIcon className="h-3 w-3" />
      <span>Avoir</span>
      {montant && <span className="font-bold ml-1">{montant.toFixed(2)}€</span>}
    </div>
  );
};

export default CreditNoteBadge;