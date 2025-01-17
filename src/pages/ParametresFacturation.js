import React, { useState, useEffect } from 'react';
import axios from '../utils/axios-config';
import { useInvoice } from '../contexts/InvoiceContext';
import { toast } from 'react-toastify';

const ParametresFacturation = () => {
  const { fetchNextInvoiceNumber } = useInvoice();

  // États pour les réglages spécifiques de facturation
  const [invoiceTitle, setInvoiceTitle] = useState('');
  const [invoiceNumberStart, setInvoiceNumberStart] = useState('');
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState('');
  const [previousInvoiceNumberStart, setPreviousInvoiceNumberStart] = useState('');
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState(0);

  // États pour les fonctionnalités (paiement et rappels)
  const [invoiceStatus, setInvoiceStatus] = useState({
    enabled: false,
    paymentDelay: 30,
  });

  const [reminders, setReminders] = useState({
    enabled: false,
    firstReminder: 7,
    secondReminder: 15,
    thirdReminder: 30,
  });

  // Ajout de la propriété showTvaComment dans displayOptions
  const [displayOptions, setDisplayOptions] = useState({
    showDueDateOnInvoice: true,
    showDueDateInHistory: true,
    showTvaComment: false,
  });

  // État pour stocker l'objet complet d'informations d'entreprise
  const [businessInfo, setBusinessInfo] = useState({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        // Récupérer les paramètres spécifiques
        const settingsResponse = await axios.get('/invoice-settings', config);
        const invoiceNumberStartValue = settingsResponse.data.invoiceNumberStart || '';
        setInvoiceTitle(settingsResponse.data.invoiceTitle || '');
        setInvoiceNumberStart(invoiceNumberStartValue);
        setCurrentInvoiceNumber(settingsResponse.data.currentInvoiceNumber || '');
        setPreviousInvoiceNumberStart(invoiceNumberStartValue);

        // Récupérer le dernier numéro de facture émis
        const lastNumberResponse = await axios.get('/invoice-settings/last-number', config);
        setLastInvoiceNumber(lastNumberResponse.data.lastInvoiceNumber || 0);

        // Récupérer les informations d'entreprise complètes
        const businessInfoResponse = await axios.get('/business-info', config);
        const info = businessInfoResponse.data || {};
        setBusinessInfo(info);

        // Initialiser les options à partir de l’objet récupéré
        if (info.features) {
          setReminders({
            enabled: info.features.automaticReminders?.enabled || false,
            firstReminder: parseInt(info.features.automaticReminders?.firstReminder || '7', 10),
            secondReminder: parseInt(info.features.automaticReminders?.secondReminder || '15', 10),
            thirdReminder: parseInt(info.features.automaticReminders?.thirdReminder || '30', 10),
          });
          setInvoiceStatus({
            enabled: info.features.invoiceStatus?.enabled || false,
            paymentDelay: info.features.invoiceStatus?.paymentDelay || 30,
          });
        }
        // On ajoute showTvaComment à partir des options enregistrées, avec une valeur par défaut false
        setDisplayOptions({
          showDueDateOnInvoice: info.displayOptions?.showDueDateOnInvoice ?? true,
          showDueDateInHistory: info.displayOptions?.showDueDateInHistory ?? true,
          showTvaComment: info.displayOptions?.showTvaComment ?? false,
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des paramètres', error);
        toast.error('Erreur lors de la récupération des paramètres de facturation.');
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const invoiceNumberStartInt = parseInt(invoiceNumberStart || '0', 10);
    if (isNaN(invoiceNumberStartInt) || invoiceNumberStartInt <= 0) {
      toast.error('Veuillez entrer un numéro de départ valide.');
      return;
    }
    if (invoiceNumberStartInt <= lastInvoiceNumber) {
      toast.error(`Le numéro de départ doit être supérieur au dernier numéro de facture émis (${lastInvoiceNumber}).`);
      return;
    }
    if (
      invoiceNumberStartInt !== parseInt(previousInvoiceNumberStart, 10) &&
      !window.confirm("Modifier le numéro de départ des factures peut entraîner des incohérences légales. Voulez-vous continuer ?")
    ) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      // Préparation de l'objet complet pour BusinessInfo en fusionnant les valeurs actuelles avec vos modifications.
      const updatedBusinessInfo = {
        name: businessInfo.name || '',
        address: businessInfo.address || '',
        postalCode: businessInfo.postalCode || '',
        city: businessInfo.city || '',
        phone: businessInfo.phone || '',
        email: businessInfo.email || '',
        siret: businessInfo.siret || '',
        companyType: businessInfo.companyType || '',
        invoiceTitle,
        invoiceNumberStart: invoiceNumberStartInt,
        features: {
          invoiceStatus: {
            enabled: invoiceStatus.enabled,
            paymentDelay: invoiceStatus.paymentDelay,
          },
          automaticReminders: {
            enabled: reminders.enabled,
            firstReminder: reminders.firstReminder,
            secondReminder: reminders.secondReminder,
            thirdReminder: reminders.thirdReminder,
          },
        },
        // Inclusion de l'option showTvaComment
        displayOptions: {
          ...displayOptions,
        },
      };

      // Mise à jour via deux endpoints : invoice-settings et business-info
      await Promise.all([
        axios.post('/invoice-settings', { invoiceTitle, invoiceNumberStart: invoiceNumberStartInt }, config),
        axios.post('/business-info', updatedBusinessInfo, config)
      ]);

      await fetchNextInvoiceNumber();
      setPreviousInvoiceNumberStart(invoiceNumberStart);
      toast.success('Paramètres mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres', error);
      toast.error('Erreur lors de la mise à jour des paramètres de facturation.');
    }
  };

  const handleTestReminders = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      toast.info('Lancement du test des rappels...');
      await axios.post('/reminder-service/check-now', {}, config);
      toast.success('Test des rappels effectué. Vérifiez vos emails et les logs du serveur.');
    } catch (error) {
      console.error('Erreur lors du test des rappels:', error);
      toast.error('Erreur lors du test des rappels.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-semibold mb-6">Paramètres de Facturation</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section: Paramètres de base */}
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700">Intitulé de la facture :</label>
            <input
              type="text"
              value={invoiceTitle}
              onChange={(e) => setInvoiceTitle(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700">Numéro de départ des factures :</label>
            <input
              type="number"
              value={invoiceNumberStart}
              onChange={(e) => setInvoiceNumberStart(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700">Numéro de facture actuel :</label>
            <input
              type="number"
              value={currentInvoiceNumber}
              disabled
              className="mt-1 w-full p-2 border border-gray-300 rounded bg-gray-100"
            />
          </div>
          <div>
            <p className="text-gray-600">
              Dernier numéro de facture émis : <strong>{lastInvoiceNumber}</strong>
            </p>
          </div>
        </div>

        {/* Section: Options d'affichage */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Options d'affichage</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showDueDateOnInvoice"
                checked={displayOptions.showDueDateOnInvoice}
                onChange={(e) =>
                  setDisplayOptions((prev) => ({
                    ...prev,
                    showDueDateOnInvoice: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="showDueDateOnInvoice" className="ml-2">
                Afficher la date d'échéance sur les factures
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showDueDateInHistory"
                checked={displayOptions.showDueDateInHistory}
                onChange={(e) =>
                  setDisplayOptions((prev) => ({
                    ...prev,
                    showDueDateInHistory: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="showDueDateInHistory" className="ml-2">
                Afficher la date d'échéance dans l'historique des factures
              </label>
            </div>
            {/* Nouveau contrôle pour afficher/masquer la mention TVA */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showTvaComment"
                checked={displayOptions.showTvaComment}
                onChange={(e) =>
                  setDisplayOptions((prev) => ({
                    ...prev,
                    showTvaComment: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="showTvaComment" className="ml-2">
                Afficher la mention <span className="italic">TVA non applicable - art.293B du CGI</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section: Suivi des paiements */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Suivi des paiements</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="invoiceStatusEnabled"
                checked={invoiceStatus.enabled}
                onChange={(e) =>
                  setInvoiceStatus((prev) => ({
                    ...prev,
                    enabled: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="invoiceStatusEnabled" className="ml-2">
                Activer le suivi des paiements
              </label>
            </div>
            {invoiceStatus.enabled && (
              <div>
                <label className="block text-gray-700">Délai de paiement (jours) :</label>
                <input
                  type="number"
                  value={invoiceStatus.paymentDelay}
                  onChange={(e) =>
                    setInvoiceStatus((prev) => ({
                      ...prev,
                      paymentDelay: parseInt(e.target.value, 10),
                    }))
                  }
                  min="1"
                  className="mt-1 w-full p-2 border border-gray-300 rounded"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section: Rappels automatiques */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Rappels automatiques</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remindersEnabled"
                checked={reminders.enabled}
                onChange={(e) =>
                  setReminders((prev) => ({
                    ...prev,
                    enabled: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="remindersEnabled" className="ml-2">
                Activer les rappels automatiques
              </label>
            </div>
            {reminders.enabled && (
              <div className="space-y-4 pl-6">
                <div>
                  <label className="block text-gray-700">
                    Premier rappel (jours après échéance) :
                  </label>
                  <input
                    type="number"
                    value={reminders.firstReminder}
                    onChange={(e) =>
                      setReminders((prev) => ({
                        ...prev,
                        firstReminder: parseInt(e.target.value, 10),
                      }))
                    }
                    min="1"
                    className="mt-1 w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-700">
                    Deuxième rappel (jours après échéance) :
                  </label>
                  <input
                    type="number"
                    value={reminders.secondReminder}
                    onChange={(e) =>
                      setReminders((prev) => ({
                        ...prev,
                        secondReminder: parseInt(e.target.value, 10),
                      }))
                    }
                    min="1"
                    className="mt-1 w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-700">
                    Troisième rappel (jours après échéance) :
                  </label>
                  <input
                    type="number"
                    value={reminders.thirdReminder}
                    onChange={(e) =>
                      setReminders((prev) => ({
                        ...prev,
                        thirdReminder: parseInt(e.target.value, 10),
                      }))
                    }
                    min="1"
                    className="mt-1 w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleTestReminders}
                    className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
                  >
                    Tester les rappels maintenant
                  </button>
                  <p className="mt-2 text-sm text-gray-500">
                    Ce bouton modifiera la date d'échéance d'une facture impayée pour tester le système de rappels.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors">
          Enregistrer
        </button>
      </form>
    </div>
  );
};

export default ParametresFacturation;

