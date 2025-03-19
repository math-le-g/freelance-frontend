// Dans PDFPreviewModal.js, modifiez l'en-tête pour inclure le statut de la facture
import React from 'react';
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import HistoriqueFacture from './HistoriqueFacture';
import FactureRelations from './FactureRelation';
import StatusBadge from './common/StatutsBadge';

const PDFPreviewModal = ({ isOpen, onClose, pdfUrl, facture, onDownload }) => {
  if (!isOpen || !facture) return null;
    
  return (
    <div className="fixed inset-0 z-[1000] bg-black/75 backdrop-blur-sm">
      <div className="min-h-full max-h-screen overflow-y-auto">
        <div className="flex items-start justify-center pt-20 pb-10 px-4">
          <div className="relative w-full max-w-5xl">
            {/* Bouton Fermer avec cercle plein et position absolue */}
            <div className="absolute -top-5 -right-5 z-[1001]">
              <button
                onClick={onClose}
                className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center shadow-lg border border-white/10 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* Contenu du modal */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl overflow-hidden">
              {/* En-tête */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-white">
                    Facture n°{facture.invoiceNumber}
                  </h2>
                  
                  {/* Ajout du badge de statut */}
                  <StatusBadge 
                    status={facture.status} 
                    isSentToClient={facture.isSentToClient} 
                    isLocked={facture.locked} 
                  />
                </div>
                
                <button 
                  onClick={() => onDownload && onDownload(facture)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>Télécharger</span>
                </button>
              </div>
              
              {/* Contenu */}
              <div className="flex flex-col md:flex-row h-[600px]">
                {/* PDF Viewer */}
                <div className="w-full md:w-2/3 bg-white/5 h-[400px] md:h-full">
                  <iframe
                    src={pdfUrl}
                    title="Prévisualisation PDF"
                    className="w-full h-full"
                  />
                </div>
                
                {/* Info panel */}
                <div className="w-full md:w-1/3 bg-gray-900/50 h-[200px] md:h-full overflow-auto">
                  <div className="h-full flex flex-col">
                    {/* Historique */}
                    <div className="flex-grow overflow-auto">
                      <HistoriqueFacture facture={facture} compact={true} />
                    </div>
                    
                    {/* Relations entre factures */}
                    <div className="p-4">
                      <FactureRelations factureId={facture._id} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewModal;




/*
import React from 'react';
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import HistoriqueFacture from './HistoriqueFacture';

const PDFPreviewModal = ({ isOpen, onClose, pdfUrl, facture, onDownload }) => {
  if (!isOpen || !facture) return null;
  
  return (
    <div className="fixed inset-0 z-[1000] bg-black/75 backdrop-blur-sm">
      <div className="min-h-full max-h-screen overflow-y-auto">
        <div className="flex items-start justify-center pt-20 pb-10 px-4">
          <div className="relative w-full max-w-5xl">
            
            <div className="absolute -top-5 -right-5 z-[1001]">
              <button
                onClick={onClose}
                className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center shadow-lg border border-white/10 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl overflow-hidden">
              
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">
                  Facture n°{facture.invoiceNumber}
                </h2>

                <button 
                  onClick={() => onDownload && onDownload(facture)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>Télécharger</span>
                </button>
              </div>

              
              <div className="flex h-[500px]">
                
                <div className="w-2/3 bg-white/5">
                  <iframe
                    src={pdfUrl}
                    title="Prévisualisation PDF"
                    className="w-full h-full"
                  />
                </div>

                
                <div className="w-1/3 bg-gray-900/50">
                  <HistoriqueFacture facture={facture} compact={true} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewModal;
*/