import React from 'react';
import {
    LockClosedIcon,
    ClockIcon,
    DocumentDuplicateIcon,
    XCircleIcon,
    CheckIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/solid';
import { STATUS_COLORS, INVOICE_STATUS } from '../../utils/constants';

const StatusBadge = ({ status, isSentToClient, isLocked }) => {
    // Déterminer le statut à afficher
    let displayStatus = status;
    let Icon = null;

    // Si annulée (maintenant en première position pour priorité maximale)
    if (status === INVOICE_STATUS.CANCELLED) {
        Icon = XCircleIcon;
    }
    // Si verrouillée (déplacée en seconde position)
    else if (isLocked) {
        displayStatus = 'locked';
        Icon = LockClosedIcon;
    }
    // Si payée
    else if (status === INVOICE_STATUS.PAID) {
        Icon = CheckIcon;
    }
    // Si brouillon (pas encore envoyée)
    else if (status === INVOICE_STATUS.DRAFT || !isSentToClient) {
        displayStatus = INVOICE_STATUS.DRAFT;
        Icon = DocumentDuplicateIcon;
    }
    // Si en retard
    else if (status === INVOICE_STATUS.OVERDUE) {
        Icon = ExclamationCircleIcon;
    }
    // Si en attente de paiement
    else if (status === INVOICE_STATUS.UNPAID) {
        Icon = ClockIcon;
    }
    // Si rectifiée
    else if (status === INVOICE_STATUS.RECTIFIED) {
        Icon = LockClosedIcon;
    }

    // Récupérer les couleurs du statut
    const colors = STATUS_COLORS[displayStatus] || STATUS_COLORS[INVOICE_STATUS.UNPAID];

    // Déterminer le texte à afficher
    let badgeText = '';
    switch (displayStatus) {
        case 'locked':
            badgeText = 'Verrouillée';
            break;
        case INVOICE_STATUS.CANCELLED:
            badgeText = 'Annulée';
            break;
        case INVOICE_STATUS.PAID:
            badgeText = 'Payée';
            break;
        case INVOICE_STATUS.DRAFT:
            badgeText = 'Brouillon';
            break;
        case INVOICE_STATUS.OVERDUE:
            badgeText = 'En retard';
            break;
        case INVOICE_STATUS.RECTIFIED:
            badgeText = 'Rectifiée';
            break;
        case INVOICE_STATUS.UNPAID:
        default:
            badgeText = 'En attente';
            break;
    }

    return (
        <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm items-center ${colors.bg} ${colors.text}`}>
            {Icon && <Icon className="h-3 w-3 mr-1 flex-shrink-0" />}
            <span className="whitespace-nowrap">{badgeText}</span>
        </div>
    );
};

export default StatusBadge;