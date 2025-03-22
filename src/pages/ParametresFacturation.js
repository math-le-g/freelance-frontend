import React, { useState, useEffect } from 'react';
import axios from '../utils/axios-config';
import { useInvoice } from '../contexts/InvoiceContext';
import { toast } from 'react-toastify';
import {
  CogIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  BellAlertIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  CurrencyEuroIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

function ParametresFacturation() {
  const { fetchNextInvoiceNumber } = useInvoice();

  const [activeTab, setActiveTab] = useState('facturation');

  // -----------------------
  // États "Facturation"
  // -----------------------
  const [invoiceTitle, setInvoiceTitle] = useState('');
  const [invoiceNumberStart, setInvoiceNumberStart] = useState('');
  const [previousInvoiceNumberStart, setPreviousInvoiceNumberStart] = useState('');
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState('');
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState(0);
  const [errors, setErrors] = useState({});

  // URSSAF
  const [taxeURSSAF, setTaxeURSSAF] = useState(0.246);

  // TVA
  const [soumisTVA, setSoumisTVA] = useState(false);
  const [tauxTVA, setTauxTVA] = useState(0);

  // Délai de paiement
  const [invoiceStatus, setInvoiceStatus] = useState({
    enabled: false,
    paymentDelay: 30,
  });

  // -----------------------
  // Onglet "Rappels"
  // -----------------------
  const [reminders, setReminders] = useState({
    enabled: false,
    firstReminder: 7,
    secondReminder: 15,
    thirdReminder: 30,
  });

  // -----------------------
  // Onglet "PDF & Messages"
  // -----------------------
  const [displayOptions, setDisplayOptions] = useState({
    showDueDateOnInvoice: true,
    showDueDateInHistory: true,
    showTvaComment: true,
  });
  const [legalMessages, setLegalMessages] = useState({
    enableLatePaymentComment: false,
    latePaymentText: "Par défaut, indemnité 40 € en cas de retard (art. L441-10 Code commerce).",
    enableCustomComment: false,
    customCommentText: "",
  });

  // -----------------------
  // Chargement initial
  // -----------------------
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // GET /invoice-settings
        const settingsResp = await axios.get('/invoice-settings', config);
        const dataSet = settingsResp.data || {};
        setInvoiceTitle(dataSet.invoiceTitle || '');
        setInvoiceNumberStart(dataSet.invoiceNumberStart || '');
        setCurrentInvoiceNumber(dataSet.currentInvoiceNumber || '');
        setPreviousInvoiceNumberStart(dataSet.invoiceNumberStart || '');

        // GET /invoice-settings/last-number
        const lastNumResp = await axios.get('/invoice-settings/last-number', config);
        setLastInvoiceNumber(lastNumResp.data.lastInvoiceNumber || 0);

        // GET /business-info
        const bizResp = await axios.get('/business-info', config);
        const biz = bizResp.data || {};

        // Facturation
        setTauxTVA(biz.tauxTVA || 0);
        setTaxeURSSAF(biz.taxeURSSAF || 0.246);
        setSoumisTVA((biz.tauxTVA || 0) > 0);

        // Features
        const invStatus = biz.features?.invoiceStatus || {};
        setInvoiceStatus({
          enabled: invStatus.enabled ?? false,
          paymentDelay: invStatus.paymentDelay ?? 30,
        });

        // Rappels
        const autoReminders = biz.features?.automaticReminders || {};
        setReminders({
          enabled: autoReminders.enabled ?? false,
          firstReminder: autoReminders.firstReminder ?? 7,
          secondReminder: autoReminders.secondReminder ?? 15,
          thirdReminder: autoReminders.thirdReminder ?? 30,
        });

        // Display
        setDisplayOptions({
          showDueDateOnInvoice: biz.displayOptions?.showDueDateOnInvoice ?? true,
          showDueDateInHistory: biz.displayOptions?.showDueDateInHistory ?? true,
          showTvaComment: biz.displayOptions?.showTvaComment ?? true,
        });

        // Messages
        setLegalMessages({
          enableLatePaymentComment: biz.legalMessages?.enableLatePaymentComment ?? false,
          latePaymentText: biz.legalMessages?.latePaymentText || "Tout retard de paiement = indemnité forfaitaire de 40 €.",
          enableCustomComment: biz.legalMessages?.enableCustomComment ?? false,
          customCommentText: biz.legalMessages?.customCommentText || "",
        });

      } catch (err) {
        console.error('Erreur fetch settings:', err);
        toast.error('Erreur récupération paramètres.');
      }
    };
    fetchSettings();
  }, [fetchNextInvoiceNumber]);

  // -----------------------
  // Validation et Submit
  // -----------------------
  const validateForm = () => {
    const newErrors = {};
    const intStart = parseInt(invoiceNumberStart || '0', 10);

    if (isNaN(intStart) || intStart <= 0) {
      newErrors.invoiceNumberStart = 'Numéro de départ invalide.';
    }
    if (intStart <= lastInvoiceNumber) {
      newErrors.invoiceNumberStart = `Doit être > dernier numéro émis (${lastInvoiceNumber}).`;
    }
    if (invoiceStatus.enabled) {
      if (isNaN(invoiceStatus.paymentDelay) || invoiceStatus.paymentDelay <= 0) {
        newErrors.paymentDelay = 'Délai paiement invalide.';
      }
    }
    if (reminders.enabled) {
      if (reminders.firstReminder < 1) {
        newErrors.firstReminder = 'Premier rappel: min 1j.';
      }
      if (reminders.secondReminder <= reminders.firstReminder) {
        newErrors.secondReminder = 'Second rappel > premier.';
      }
      if (reminders.thirdReminder <= reminders.secondReminder) {
        newErrors.thirdReminder = 'Troisième rappel > second.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Corrigez les erreurs avant de sauvegarder.');
      return;
    }

    const intStart = parseInt(invoiceNumberStart || '0', 10);
    if (
      intStart !== parseInt(previousInvoiceNumberStart, 10) &&
      !window.confirm("Changer le numéro de départ peut créer des incohérences légales. Continuer ?")
    ) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const realTVA = soumisTVA ? tauxTVA : 0;

      const updatedInfo = {
        invoiceTitle,
        invoiceNumberStart: intStart,
        taxeURSSAF,
        tauxTVA: realTVA,
        features: {
          invoiceStatus: {
            enabled: invoiceStatus.enabled,
            paymentDelay: parseInt(invoiceStatus.paymentDelay, 10) || 30,
          },
          automaticReminders: {
            enabled: reminders.enabled,
            firstReminder: parseInt(reminders.firstReminder, 10) || 7,
            secondReminder: parseInt(reminders.secondReminder, 10) || 15,
            thirdReminder: parseInt(reminders.thirdReminder, 10) || 30,
          },
        },
        displayOptions: { ...displayOptions },
        legalMessages: { ...legalMessages },
      };

      // On poste à 2 endpoints : /invoice-settings et /business-info
      await Promise.all([
        axios.post('/invoice-settings', { invoiceTitle, invoiceNumberStart: intStart }, config),
        axios.post('/business-info', updatedInfo, config),
      ]);

      // On refresh le "next invoice number"
      await fetchNextInvoiceNumber();
      setPreviousInvoiceNumberStart(invoiceNumberStart);
      toast.success('Paramètres enregistrés.');
    } catch (err) {
      console.error('Erreur update settings:', err);
      toast.error('Erreur lors de la mise à jour des paramètres.');
    }
  };

  // -----------------------
  // Test des rappels
  // -----------------------
  const handleTestReminders = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      toast.info('Test rappels en cours...');
      await axios.post('/reminder-service/check-now', {}, config);
      toast.success('Test rappels OK, voir emails/logs.');
    } catch (error) {
      console.error('Erreur test rappels:', error);
      toast.error('Erreur test rappels.');
    }
  };

  // -----------------------
  // Rendu par onglet
  // -----------------------
  function renderFacturationTab() {
    return (
      <div className="space-y-5">
        <h3 className="text-xl font-semibold">Paramètres de Facturation</h3>

        {/* Numérotation */}
        <div className="bg-white/10 border border-white/20 p-5 rounded-md space-y-4 shadow-sm backdrop-blur-sm">
          <div>
            <label className="block mb-2">Intitulé de la facture :</label>
            <input
              type="text"
              value={invoiceTitle}
              onChange={(e) => setInvoiceTitle(e.target.value)}
              className="w-full p-2.5 bg-blue-900/30 border border-white/20 rounded-md text-white"
              placeholder="Ex: Prestations mensuelles"
            />
          </div>
          <div>
            <label className="block mb-2">Numéro de départ des factures :</label>
            <input
              type="number"
              value={invoiceNumberStart}
              onChange={(e) => setInvoiceNumberStart(e.target.value)}
              min="1"
              className={`w-full p-2.5 bg-blue-900/30 border ${errors.invoiceNumberStart ? 'border-red-500' : 'border-white/20'
                } rounded-md text-white`}
            />
            {errors.invoiceNumberStart && (
              <p className="text-xs text-red-400 mt-1">{errors.invoiceNumberStart}</p>
            )}
          </div>
          <div className="text-sm text-blue-100">
            Dernier numéro émis : <strong>{lastInvoiceNumber}</strong>
          </div>
        </div>

        {/* TVA / URSSAF */}
        <div className="bg-white/10 border border-white/20 p-5 rounded-md space-y-4 shadow-sm backdrop-blur-sm">
          <h4 className="text-white font-medium">TVA & URSSAF</h4>
          <div className="flex items-center space-x-2">
            <input
              id="soumisTVA"
              type="checkbox"
              checked={soumisTVA}
              onChange={(e) => setSoumisTVA(e.target.checked)}
              className="h-4 w-4 text-blue-500 border-blue-300 rounded"
            />
            <label htmlFor="soumisTVA">Entreprise soumise à la TVA ?</label>
          </div>
          {soumisTVA && (
            <div>
              <label className="block mb-2">Taux de TVA (%) :</label>
              <input
                type="number"
                step="0.1"
                value={(tauxTVA * 100).toFixed(1)}
                onChange={(e) => setTauxTVA(parseFloat(e.target.value) / 100)}
                className="w-full p-2.5 bg-blue-900/30 border border-white/20 rounded-md text-white"
              />
            </div>
          )}

          <div>
            <label className="block mb-2">Taux URSSAF (%) :</label>
            <input
              type="number"
              step="0.1"
              value={(taxeURSSAF * 100).toFixed(1)}
              onChange={(e) => setTaxeURSSAF(parseFloat(e.target.value) / 100)}
              className="w-full p-2.5 bg-blue-900/30 border border-white/20 rounded-md text-white"
            />
            <p className="text-xs text-blue-200 mt-1">
              Pour calculer le Net = Brut - (Brut × tauxURSSAF).
            </p>
          </div>
        </div>

        {/* Délai de paiement */}
        <div className="bg-white/10 border border-white/20 p-5 rounded-md space-y-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <input
              id="invStatusEnabled"
              type="checkbox"
              checked={invoiceStatus.enabled}
              onChange={(e) =>
                setInvoiceStatus((prev) => ({ ...prev, enabled: e.target.checked }))
              }
              className="h-4 w-4 text-blue-500 border-blue-300 rounded"
            />
            <label htmlFor="invStatusEnabled" className="text-white">
              Activer le suivi des paiements
            </label>
          </div>
          {invoiceStatus.enabled && (
            <div>
              <label className="block mb-2">Délai de paiement (jours) :</label>
              <input
                type="number"
                value={invoiceStatus.paymentDelay}
                onChange={(e) =>
                  setInvoiceStatus((prev) => ({
                    ...prev,
                    paymentDelay: parseInt(e.target.value, 10),
                  }))
                }
                className={`w-full p-2.5 bg-blue-900/30 border ${errors.paymentDelay ? 'border-red-500' : 'border-white/20'
                  } rounded-md text-white`}
              />
              {errors.paymentDelay && (
                <p className="text-xs text-red-400 mt-1">{errors.paymentDelay}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderRemindersTab() {
    return (
      <div className="space-y-5">
        <h3 className="text-xl font-semibold">Rappels automatiques</h3>

        <div className="bg-white/10 border border-white/20 p-5 rounded-md space-y-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <input
              id="remindersEnabled"
              type="checkbox"
              checked={reminders.enabled}
              onChange={(e) =>
                setReminders((prev) => ({ ...prev, enabled: e.target.checked }))
              }
              className="h-4 w-4 text-blue-500 border-blue-300 rounded"
            />
            <label htmlFor="remindersEnabled">Activer les rappels automatiques</label>
          </div>

          {reminders.enabled && (
            <div className="space-y-3 pl-4 border-l-2 border-blue-500/40">
              <div>
                <label>Premier rappel (jours après échéance) :</label>
                <input
                  type="number"
                  value={reminders.firstReminder}
                  onChange={(e) =>
                    setReminders((prev) => ({
                      ...prev,
                      firstReminder: parseInt(e.target.value, 10),
                    }))
                  }
                  className={`w-full p-2.5 bg-blue-900/30 border ${errors.firstReminder ? 'border-red-500' : 'border-white/20'
                    } rounded-md text-white mt-1`}
                />
                {errors.firstReminder && (
                  <p className="text-xs text-red-400">{errors.firstReminder}</p>
                )}
              </div>
              <div>
                <label>Deuxième rappel :</label>
                <input
                  type="number"
                  value={reminders.secondReminder}
                  onChange={(e) =>
                    setReminders((prev) => ({
                      ...prev,
                      secondReminder: parseInt(e.target.value, 10),
                    }))
                  }
                  className={`w-full p-2.5 bg-blue-900/30 border ${errors.secondReminder ? 'border-red-500' : 'border-white/20'
                    } rounded-md text-white mt-1`}
                />
                {errors.secondReminder && (
                  <p className="text-xs text-red-400">{errors.secondReminder}</p>
                )}
              </div>
              <div>
                <label>Troisième rappel :</label>
                <input
                  type="number"
                  value={reminders.thirdReminder}
                  onChange={(e) =>
                    setReminders((prev) => ({
                      ...prev,
                      thirdReminder: parseInt(e.target.value, 10),
                    }))
                  }
                  className={`w-full p-2.5 bg-blue-900/30 border ${errors.thirdReminder ? 'border-red-500' : 'border-white/20'
                    } rounded-md text-white mt-1`}
                />
                {errors.thirdReminder && (
                  <p className="text-xs text-red-400">{errors.thirdReminder}</p>
                )}
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleTestReminders}
                  className="px-4 py-2.5 bg-blue-700 hover:bg-blue-600 rounded-md text-white flex items-center space-x-2 transition-colors"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  <span>Tester les rappels</span>
                </button>
                <p className="text-xs text-blue-200 mt-1">
                  Force l'envoi de rappels sur une facture impayée pour test.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderPdfMessagesTab() {
    return (
      <div className="space-y-5">
        <h3 className="text-xl font-semibold">PDF & Messages</h3>

        {/* Options d'affichage sur le PDF */}
        <div className="bg-white/10 border border-white/20 p-5 rounded-md space-y-4 shadow-sm backdrop-blur-sm">
          <h4 className="font-medium">Affichage sur la facture</h4>
          <div className="flex items-center space-x-2">
            <input
              id="showDueDateOnInvoice"
              type="checkbox"
              checked={displayOptions.showDueDateOnInvoice}
              onChange={(e) =>
                setDisplayOptions((prev) => ({ ...prev, showDueDateOnInvoice: e.target.checked }))
              }
              className="h-4 w-4 text-blue-500 border-blue-300 rounded"
            />
            <label htmlFor="showDueDateOnInvoice">Afficher la date d'échéance</label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              id="showDueDateInHistory"
              type="checkbox"
              checked={displayOptions.showDueDateInHistory}
              onChange={(e) =>
                setDisplayOptions((prev) => ({ ...prev, showDueDateInHistory: e.target.checked }))
              }
              className="h-4 w-4 text-blue-500 border-blue-300 rounded"
            />
            <label htmlFor="showDueDateInHistory">Afficher la date d'échéance dans l'historique</label>
          </div>
          {!soumisTVA && (
            <div className="flex items-center space-x-2">
              <input
                id="showTvaComment"
                type="checkbox"
                checked={displayOptions.showTvaComment}
                onChange={(e) =>
                  setDisplayOptions((prev) => ({ ...prev, showTvaComment: e.target.checked }))
                }
                className="h-4 w-4 text-blue-500 border-blue-300 rounded"
              />
              <label htmlFor="showTvaComment">
                Afficher la mention "<em>TVA non applicable - art.293B du CGI</em>"
              </label>
            </div>
          )}
        </div>

        {/* Messages légaux et commentaires */}
        <div className="bg-white/10 border border-white/20 p-5 rounded-md space-y-4 shadow-sm backdrop-blur-sm">
          <h4 className="font-medium">Messages / Mentions légales</h4>
          {/* Retard de paiement */}
          <div className="flex items-center space-x-2">
            <input
              id="enableLatePaymentComment"
              type="checkbox"
              checked={legalMessages.enableLatePaymentComment}
              onChange={(e) =>
                setLegalMessages((prev) => ({ ...prev, enableLatePaymentComment: e.target.checked }))
              }
              className="h-4 w-4 text-blue-500 border-blue-300 rounded"
            />
            <label htmlFor="enableLatePaymentComment">
              Ajouter un texte légal en cas de retard de paiement
            </label>
          </div>
          {legalMessages.enableLatePaymentComment && (
            <div>
              <label className="block text-sm mb-1">Texte en cas de retard :</label>
              <textarea
                rows="2"
                value={legalMessages.latePaymentText}
                onChange={(e) =>
                  setLegalMessages((prev) => ({ ...prev, latePaymentText: e.target.value }))
                }
                className="w-full p-2.5 bg-blue-900/30 border border-white/20 rounded-md text-white"
              />
            </div>
          )}
          {/* Commentaire personnalisé */}
          <div className="flex items-center space-x-2">
            <input
              id="enableCustomComment"
              type="checkbox"
              checked={legalMessages.enableCustomComment}
              onChange={(e) =>
                setLegalMessages((prev) => ({ ...prev, enableCustomComment: e.target.checked }))
              }
              className="h-4 w-4 text-blue-500 border-blue-300 rounded"
            />
            <label htmlFor="enableCustomComment">Commentaire personnalisé sur la facture</label>
          </div>
          {legalMessages.enableCustomComment && (
            <div>
              <label className="block text-sm mb-1">Commentaire :</label>
              <textarea
                rows="2"
                value={legalMessages.customCommentText}
                onChange={(e) =>
                  setLegalMessages((prev) => ({ ...prev, customCommentText: e.target.value }))
                }
                className="w-full p-2.5 bg-blue-900/30 border border-white/20 rounded-md text-white"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // -----------------------
  // Rendu principal
  // -----------------------
  return (
    <div className="container mx-auto pt-34 px-6 pb-8">
      <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-md shadow-sm p-6 text-white relative overflow-hidden">
        {/* Petite vague décorative en haut (comme dans MonEntreprise) */}
        <div className="absolute top-0 left-0 w-full pointer-events-none">
          <svg
            className="block w-full h-12"
            viewBox="0 0 1200 120"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0,40 C 300,120 900,-40 1200,40 L1200,0 L0,0 Z"
              fill="rgba(255,255,255,0.05)"
            />
          </svg>
        </div>

        {/* Titre à l'intérieur du panneau */}
        <h2 className="text-2xl font-bold mb-6 flex items-center relative z-10 text-white">
          <CogIcon className="h-6 w-6 text-blue-300 mr-2" />
          Paramètres
        </h2>

        <div className="flex flex-col md:flex-row gap-6 relative z-10">
          {/* Navigation gauche */}
          <div className="md:w-1/4">
            <div className="bg-white/15 border border-white/20 backdrop-blur-md rounded-md overflow-hidden shadow-md h-full">
              <nav className="flex flex-col h-full">
                <button
                  onClick={() => setActiveTab('facturation')}
                  className={`px-4 py-3.5 text-left flex items-center space-x-2 transition-colors border-l-4 ${activeTab === 'facturation'
                    ? 'bg-blue-900/50 border-blue-400'
                    : 'border-transparent hover:bg-white/5'
                    }`}
                >
                  <CurrencyEuroIcon className="h-5 w-5 text-blue-300" />
                  <span>Facturation</span>
                </button>

                <button
                  onClick={() => setActiveTab('pdfmessages')}
                  className={`px-4 py-3.5 text-left flex items-center space-x-2 transition-colors border-l-4 ${activeTab === 'pdfmessages'
                    ? 'bg-blue-900/50 border-blue-400'
                    : 'border-transparent hover:bg-white/5'
                    }`}
                >
                  <DocumentTextIcon className="h-5 w-5 text-blue-300" />
                  <span>PDF & Messages</span>
                </button>
                <button
                  onClick={() => setActiveTab('reminders')}
                  className={`px-4 py-3.5 text-left flex items-center space-x-2 transition-colors border-l-4 ${activeTab === 'reminders'
                    ? 'bg-blue-900/50 border-blue-400'
                    : 'border-transparent hover:bg-white/5'
                    }`}
                >
                  <BellAlertIcon className="h-5 w-5 text-blue-300" />
                  <span>Rappels</span>
                </button>



              </nav>
            </div>
          </div>

          {/* Contenu */}
          <div className="md:w-3/4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
                {activeTab === 'facturation' && renderFacturationTab()}
                {activeTab === 'reminders' && renderRemindersTab()}
                {activeTab === 'pdfmessages' && renderPdfMessagesTab()}
              </div>

              {/* Bouton global de sauvegarde */}
              <div className="text-right mt-6">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-md text-white font-semibold shadow-md flex items-center space-x-2 transition-colors ml-auto"
                >
                  <CogIcon className="h-5 w-5" />
                  <span>Enregistrer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParametresFacturation;