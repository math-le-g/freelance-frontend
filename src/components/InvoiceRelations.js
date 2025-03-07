import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import {
  DocumentDuplicateIcon,
  InformationCircleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const InvoiceRelations = ({ facture, originalFacture, rectifications }) => {
  console.log('Props reçues:', { facture, originalFacture, rectifications });
  if (!facture) return null;

  const formatMontant = (montant) => {
    const nombre = parseFloat(montant);
    return nombre >= 0 ? `+${nombre.toFixed(2)}` : nombre.toFixed(2);
  };

  return (
    <div className="bg-white/10 border border-white/20 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <DocumentDuplicateIcon className="h-5 w-5 text-blue-400" />
        Relations entre factures
      </h3>

      {/* Pour une facture rectificative */}
      {facture.isRectification && originalFacture && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <InformationCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-200">
                Cette facture est une rectification de la facture #{originalFacture.invoiceNumber}
              </p>
              <Link 
                to={`/factures/${originalFacture._id}`}
                className="inline-flex items-center gap-1 mt-2 text-sm text-blue-400 hover:text-blue-300"
              >
                Voir la facture d'origine
                <ChevronRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Motif de rectification */}
          <div className="mt-3">
            <h4 className="text-sm font-medium text-white/80 mb-2">Motif de la rectification</h4>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <p className="text-sm text-white/90 font-medium">
                {facture.rectificationInfo?.motifLegalLibelle}
              </p>
              {facture.rectificationInfo?.detailsMotif && (
                <p className="text-sm text-white/70 mt-1">
                  {facture.rectificationInfo.detailsMotif}
                </p>
              )}
            </div>
          </div>

          {/* Différences de montants */}
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-white/80">Différences de montants</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Montant HT', key: 'differenceMontantHT' },
                { label: 'URSSAF', key: 'differenceTaxeURSSAF' },
                { label: 'Net', key: 'differenceMontantNet' },
                { label: 'TTC', key: 'differenceMontantTTC' }
              ].map((item) => (
                <div 
                  key={item.key}
                  className="bg-white/5 border border-white/10 rounded-lg p-3"
                >
                  <p className="text-sm text-white/70">{item.label}</p>
                  <p className={`text-lg font-medium ${
                    facture.rectificationInfo[item.key] >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatMontant(facture.rectificationInfo[item.key])} €
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pour une facture originale avec des rectifications */}
      {!facture.isRectification && rectifications?.length > 0 && (
        <div className="space-y-3">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-200">
              Cette facture a été rectifiée par {rectifications.length} facture{rectifications.length > 1 ? 's' : ''} :
            </p>
            <div className="mt-3 space-y-2">
              {rectifications.map((rect) => (
                <Link
                  key={rect._id}
                  to={`/factures/${rect._id}`}
                  className="flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <DocumentDuplicateIcon className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-white">
                      Facture #{rect.invoiceNumber}
                    </span>
                  </div>
                  <div className="text-sm text-white/70">
                    {format(new Date(rect.dateFacture), 'dd MMM yyyy', { locale: fr })}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceRelations;