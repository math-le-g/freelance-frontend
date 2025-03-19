import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import {
  DocumentDuplicateIcon,
  InformationCircleIcon,
  ChevronRightIcon,
  BanknotesIcon,
  ArrowPathIcon
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

          {/* Détails des prestations modifiées */}
          {facture.rectificationInfo?.prestationsModifiees?.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="text-sm font-medium text-white/80">Détails des modifications</h4>
              {facture.rectificationInfo.prestationsModifiees.map((pm, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      {pm.type === 'MODIFIEE' ? 'Prestation modifiée' : 
                      pm.type === 'AJOUTEE' ? 'Nouvelle prestation' : 'Prestation supprimée'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      pm.type === 'MODIFIEE' ? 'bg-yellow-500/30 text-yellow-300' :
                      pm.type === 'AJOUTEE' ? 'bg-green-500/30 text-green-300' : 
                      'bg-red-500/30 text-red-300'
                    }`}>
                      {pm.type}
                    </span>
                  </div>
                  
                  {pm.type === 'MODIFIEE' && (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="bg-red-900/20 border border-red-900/30 rounded-lg p-2">
                        <div className="text-xs text-red-300 mb-1">Avant</div>
                        <div className="text-sm">{pm.anciensDetails.description}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {pm.anciensDetails.billingType === 'hourly' 
                            ? `${pm.anciensDetails.hours}h × ${pm.anciensDetails.hourlyRate}€` 
                            : `${pm.anciensDetails.fixedPrice}€ ${pm.anciensDetails.quantity > 1 ? `× ${pm.anciensDetails.quantity}` : ''}`}
                        </div>
                        <div className="text-xs font-bold mt-1">{pm.anciensDetails.total}€</div>
                      </div>
                      <div className="bg-green-900/20 border border-green-900/30 rounded-lg p-2">
                        <div className="text-xs text-green-300 mb-1">Après</div>
                        <div className="text-sm">{pm.nouveauxDetails.description}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {pm.nouveauxDetails.billingType === 'hourly' 
                            ? `${pm.nouveauxDetails.hours}h × ${pm.nouveauxDetails.hourlyRate}€` 
                            : `${pm.nouveauxDetails.fixedPrice}€ ${pm.nouveauxDetails.quantity > 1 ? `× ${pm.nouveauxDetails.quantity}` : ''}`}
                        </div>
                        <div className="text-xs font-bold mt-1">{pm.nouveauxDetails.total}€</div>
                      </div>
                    </div>
                  )}
                  
                  {pm.type === 'AJOUTEE' && (
                    <div className="bg-green-900/20 border border-green-900/30 rounded-lg p-2 mt-2">
                      <div className="text-sm">{pm.nouveauxDetails.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {pm.nouveauxDetails.billingType === 'hourly' 
                          ? `${pm.nouveauxDetails.hours}h × ${pm.nouveauxDetails.hourlyRate}€` 
                          : `${pm.nouveauxDetails.fixedPrice}€ ${pm.nouveauxDetails.quantity > 1 ? `× ${pm.nouveauxDetails.quantity}` : ''}`}
                      </div>
                      <div className="text-xs font-bold mt-1">{pm.nouveauxDetails.total}€</div>
                    </div>
                  )}
                  
                  {pm.type === 'SUPPRIMEE' && (
                    <div className="bg-red-900/20 border border-red-900/30 rounded-lg p-2 mt-2">
                      <div className="text-sm">{pm.anciensDetails.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {pm.anciensDetails.billingType === 'hourly' 
                          ? `${pm.anciensDetails.hours}h × ${pm.anciensDetails.hourlyRate}€` 
                          : `${pm.anciensDetails.fixedPrice}€ ${pm.anciensDetails.quantity > 1 ? `× ${pm.anciensDetails.quantity}` : ''}`}
                      </div>
                      <div className="text-xs font-bold mt-1">{pm.anciensDetails.total}€</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

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

      {/* Nouvelle section pour les avoirs liés */}
      {facture.avoir && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center">
            <BanknotesIcon className="h-4 w-4 mr-2 text-pink-400" />
            Avoir lié
          </h4>
          <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BanknotesIcon className="h-4 w-4 text-pink-400" />
                <span className="text-sm">
                  Avoir n°{facture.avoir.numero} du {format(new Date(facture.avoir.date), 'dd/MM/yyyy', { locale: fr })}
                </span>
              </div>
              <span className="font-bold text-pink-400">-{facture.avoir.montant.toFixed(2)} €</span>
            </div>
            {facture.avoir.motif && (
              <p className="text-xs text-gray-300 mt-2">
                Motif: {facture.avoir.motif}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceRelations;