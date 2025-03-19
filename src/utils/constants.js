// Statuts de facture
export const INVOICE_STATUS = {
    DRAFT: 'draft',           // Brouillon (non envoyée)
    UNPAID: 'unpaid',         // Envoyée mais non payée
    PAID: 'paid',             // Payée
    OVERDUE: 'overdue',       // En retard
    CANCELLED: 'cancelled',   // Annulée
    RECTIFIED: 'RECTIFIEE'    // Rectifiée (remplacée par une autre)
  };
  
  // Types de facturation
  export const BILLING_TYPES = {
    HOURLY: 'hourly',         // Facturation horaire
    FIXED: 'fixed'            // Forfait
  };
  
  // Unités de temps
  export const TIME_UNITS = {
    MINUTES: 'minutes',
    HOURS: 'hours',
    DAYS: 'days'
  };
  
  // Couleurs pour les badges de statut
  export const STATUS_COLORS = {
    [INVOICE_STATUS.DRAFT]: {
      bg: 'bg-blue-500',
      text: 'text-white',
      hover: 'hover:bg-blue-600'
    },
    [INVOICE_STATUS.UNPAID]: {
      bg: 'bg-orange-500',
      text: 'text-white',
      hover: 'hover:bg-orange-600'
    },
    [INVOICE_STATUS.PAID]: {
      bg: 'bg-green-500',
      text: 'text-white',
      hover: 'hover:bg-green-600'
    },
    [INVOICE_STATUS.OVERDUE]: {
      bg: 'bg-red-500',
      text: 'text-white',
      hover: 'hover:bg-red-600'
    },
    [INVOICE_STATUS.CANCELLED]: {
      bg: 'bg-gray-600',
      text: 'text-white',
      hover: 'hover:bg-gray-700'
    },
    [INVOICE_STATUS.RECTIFIED]: {
      bg: 'bg-gray-600',
      text: 'text-white',
      hover: 'hover:bg-gray-700'
    },
    locked: {
      bg: 'bg-gray-600',
      text: 'text-white',
      hover: 'hover:bg-gray-700'
    }
  };