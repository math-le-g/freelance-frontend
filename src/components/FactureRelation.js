import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import {
  DocumentDuplicateIcon,
  InformationCircleIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

const FactureRelations = ({ factureId }) => {
  const [loading, setLoading] = useState(true);
  const [relations, setRelations] = useState(null);
  const [chainedFactures, setChainedFactures] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRelations = async () => {
      if (!factureId) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/factures/${factureId}/relations`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('Données de relations récupérées:', response.data);
        setRelations(response.data);
        
        // Si c'est une facture rectificative et qu'elle a une chaîne de rectifications
        if (response.data.factureType === 'rectificative' && 
            response.data.rectificationChain && 
            response.data.rectificationChain.length > 0) {
          
          // Récupérer les détails de toutes les factures dans la chaîne
          const chainPromises = response.data.rectificationChain.map(id => 
            axios.get(
              `${process.env.REACT_APP_API_URL}/api/factures/${id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
          );
          
          const chainResults = await Promise.all(chainPromises);
          setChainedFactures(chainResults.map(res => res.data));
        }
      } catch (err) {
        console.error('Erreur récupération relations:', err);
        setError("Impossible de charger les relations entre factures");
      } finally {
        setLoading(false);
      }
    };

    fetchRelations();
  }, [factureId]);

  if (loading) {
    return <div className="py-3 text-center text-sm text-gray-400">Chargement des relations...</div>;
  }

  if (error) {
    return <div className="py-3 text-center text-sm text-red-400">{error}</div>;
  }

  if (!relations || ((!relations.relations || relations.relations.length === 0) && chainedFactures.length === 0)) {
    return null;
  }

  // Fonction pour afficher les détails des prestations modifiées
  const renderPrestationsModifiees = (prestationsModifiees) => {
    if (!prestationsModifiees || prestationsModifiees.length === 0) return null;
    
    return (
      <div className="mt-4 space-y-3">
        <h4 className="text-xs font-semibold text-gray-300 mb-2">Détails des modifications</h4>
        {prestationsModifiees.map((pm, idx) => (
          <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium">
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
    );
  };

  // Fonction pour afficher une version courte de l'historique des rectifications
  const renderRectificationHistory = () => {
    if (chainedFactures.length === 0) return null;
    
    return (
      <div className="mt-4">
        <h4 className="text-xs font-semibold text-gray-300 mb-2">Historique des rectifications</h4>
        <div className="flex flex-col space-y-1">
          {chainedFactures.map((facture, index) => (
            <div key={facture._id} className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <span className="text-gray-400 mr-2">{index + 1}.</span>
                <span>
                  Facture #{facture.invoiceNumber} 
                  <span className="text-gray-400 ml-1">
                    ({format(new Date(facture.dateFacture), 'dd/MM/yyyy', { locale: fr })})
                  </span>
                </span>
              </div>
              <Link
                to={`/factures/${facture._id}`}
                className="text-blue-400 hover:text-blue-300"
              >
                Voir
              </Link>
            </div>
          ))}
          {/* Facture actuelle */}
          <div className="flex items-center justify-between text-xs bg-blue-900/30 p-1 rounded">
            <div className="flex items-center">
              <span className="text-gray-400 mr-2">{chainedFactures.length + 1}.</span>
              <span className="font-semibold">
                Facture #{relations.currentInvoiceNumber} (actuelle)
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="border-t border-white/10 pt-4 mt-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center">
        <DocumentDuplicateIcon className="h-4 w-4 mr-2 text-blue-400" />
        {relations.factureType === 'rectificative' ? 'Facture d\'origine' : 'Factures rectificatives'}
      </h3>

      {/* Pour les factures rectificatives, afficher l'original */}
      {relations.factureType === 'rectificative' && relations.relations.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          {relations.relations.map(rel => (
            <div key={rel.factureId} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ArrowPathIcon className="h-4 w-4 text-blue-400" />
                <span className="text-sm">
                  Facture originale #{rel.invoiceNumber} du {format(new Date(rel.dateFacture), 'dd/MM/yyyy', { locale: fr })}
                </span>
              </div>
              <Link
                to={`/factures/${rel.factureId}`}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                Voir <ChevronRightIcon className="h-3 w-3" />
              </Link>
            </div>
          ))}
          
          {/* Afficher les prestations modifiées */}
          {renderPrestationsModifiees(relations.prestationsModifiees)}
          
          {/* Historique des rectifications */}
          {renderRectificationHistory()}
        </div>
      )}

      {/* Pour les factures originales, afficher les rectifications */}
      {relations.factureType === 'originale' && relations.relations.length > 0 && (
        <div className="space-y-2">
          {relations.relations.map(rect => (
            <div key={rect.factureId} className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <DocumentDuplicateIcon className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium">
                    Facture rectificative #{rect.invoiceNumber}
                  </span>
                </div>
                <Link
                  to={`/factures/${rect.factureId}`}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  Voir <ChevronRightIcon className="h-3 w-3" />
                </Link>
              </div>
              
              <p className="text-xs text-gray-400 mb-2">
                {format(new Date(rect.dateFacture), 'dd MMMM yyyy', { locale: fr })}
              </p>
              
              {rect.motif && (
                <p className="text-xs text-gray-300 mb-2">
                  Motif: {rect.motif}
                </p>
              )}
              
              <div className="flex items-center gap-2 mt-1">
                <BanknotesIcon className="h-3 w-3 text-green-400" />
                <span className={`text-xs ${rect.difference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Différence: {rect.difference >= 0 ? '+' : ''}{rect.difference.toFixed(2)}€
                </span>
              </div>
              
              {/* Afficher les prestations modifiées de cette rectification */}
              {renderPrestationsModifiees(rect.prestationsModifiees)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FactureRelations;