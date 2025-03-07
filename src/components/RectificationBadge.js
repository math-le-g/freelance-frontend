import React from 'react';
import {
  DocumentDuplicateIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';


const RectificationBadge = ({ type }) => {
  if (type === 'rectified') {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-300 rounded-full">
        <ArrowPathIcon className="h-3 w-3" />
        <span>Rectifiée</span>
      </div>
    );
  }

  if (type === 'rectification') {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-300 rounded-full">
        <DocumentDuplicateIcon className="h-3 w-3" />
        <span>Rectificative</span>
      </div>
    );
  }

  return null;
};

export default RectificationBadge;