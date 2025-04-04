import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


import { Bars3Icon } from '@heroicons/react/24/solid';
import axios from './utils/axios-config';

import Homepage from './pages/Homepage';
import MonEntreprise from './pages/MonEntreprise';
import ParametresFacturation from './pages/ParametresFacturation';

import Sidebar from './components/Sidebar';
import Modal from './components/Modal';
import SigninModalContent from './components/SigninModalContent';
import SignupModalContent from './components/SignupModalContent';

import AddClient from './components/AddClient';
import AddPrestation from './components/AddPrestation';
import MonthlySummary from './components/MonthlySummary';
import InvoiceCreator from './components/InvoiceCreator';
import InvoicePreview from './components/InvoicePreview';
import FactureList from './components/FactureList';
import SuiviPaiements from './components/SuiviPaiements';
import ClientList from './components/ClientList';

import CaAnnuel from './components/CaAnnuel';
import CaMensuel from './components/CaMensuel';
import TopClients from './components/TopClients';


import { useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { usePrestation } from './contexts/PrestationContext';
import { INVOICE_STATUS } from './utils/constants';

import './index.css';
import RectificationForm from './components/RectificationForm';

const queryClient = new QueryClient();

function App() {
  // ========================
  // 1) Etats
  // ========================
  const [clients, setClients] = useState([]);
  const [currentPrestation, setCurrentPrestation] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false); // pour "Ajouter un client"
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [businessInfo, setBusinessInfo] = useState({});
  const [billingSettings, setBillingSettings] = useState({});
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(null);

  // Modals pour Signup / Signin
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isSigninModalOpen, setIsSigninModalOpen] = useState(false);

  // Auth et Prestations
  const navigate = useNavigate();
  const { isLoggedIn, user, isInitialized, logout } = useAuth();
  const { prestations, addPrestation, updatePrestation, deletePrestation, fetchPrestations } = usePrestation();

  // ========================
  // 2) Config Notifications
  // ========================
  const toastConfig = useMemo(
    () => ({
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      className: '!font-sans',
    }),
    []
  );

  const notifySuccess = useCallback(
    (message) =>
      toast.success(message, {
        ...toastConfig,
        className: '!bg-white !text-green-600 !rounded-lg !shadow-lg',
        progressClassName: '!bg-green-500',
      }),
    [toastConfig]
  );

  const notifyError = useCallback(
    (message) =>
      toast.error(message, {
        ...toastConfig,
        className: '!bg-white !text-red-600 !rounded-lg !shadow-lg',
        progressClassName: '!bg-red-500',
      }),
    [toastConfig]
  );

  // ========================
  // 3) Fonctions de récupération (API)
  // ========================
  const fetchClients = useCallback(async () => {
    try {
      const response = await axios.get('/clients/');
      setClients(response.data);
    } catch (error) {
      notifyError('Erreur lors de la récupération des clients');
      console.error('Erreur lors de la récupération des clients', error);
    }
  }, [notifyError]);

  const fetchBusinessInfo = useCallback(async () => {
    try {
      const response = await axios.get('/business-info/');
      setBusinessInfo(response.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setBusinessInfo({});
      } else {
        notifyError("Erreur lors de la récupération des informations de l'entreprise");
        console.error("Erreur lors de la récupération des informations de l'entreprise", error);
      }
    }
  }, [notifyError]);

  const fetchBillingSettings = useCallback(async () => {
    try {
      const response = await axios.get('/invoice-settings/');
      setBillingSettings(response.data);
    } catch (error) {
      notifyError('Erreur lors de la récupération des paramètres de facturation');
      console.error('Erreur lors de la récupération des paramètres de facturation', error);
    }
  }, [notifyError]);

  const fetchNextInvoiceNumber = useCallback(async () => {
    try {
      const [businessInfoResponse, lastNumberResponse] = await Promise.all([
        axios.get('/business-info/'),
        axios.get('/factures/last-number'),
      ]);
      const lastNumber = lastNumberResponse.data.lastInvoiceNumber;
      const startNumber = businessInfoResponse.data.invoiceNumberStart || 1;
      setNextInvoiceNumber(Math.max(startNumber, lastNumber + 1));
    } catch (error) {
      console.error('Erreur lors de la récupération du prochain numéro de facture', error);
    }
  }, []);

  // ========================
  // 4) useEffect principal
  // ========================
  useEffect(() => {
    if (isInitialized) {
      if (isLoggedIn) {
        Promise.all([
          fetchClients(),
          fetchBusinessInfo(),
          fetchBillingSettings(),
          fetchNextInvoiceNumber(),
          fetchPrestations(),
        ]).catch((error) => {
          console.error('Erreur lors du chargement des données:', error);
          notifyError('Erreur lors du chargement des données');
        });
      } else {
        navigate('/');
      }
    }
  }, [
    isInitialized,
    isLoggedIn,
    navigate,
    fetchClients,
    fetchBusinessInfo,
    fetchBillingSettings,
    fetchNextInvoiceNumber,
    fetchPrestations,
    notifyError,
  ]);

  // ========================
  // 5) Handlers
  // ========================
  const addClient = (newClientData) => {
    setClients((prev) => [...prev, newClientData]);
    notifySuccess('Client ajouté avec succès');
  };

  const handleEdit = (prestation) => {
    // Vérifier si la prestation est liée à une facture ou est une rectification
    const isInvoiced = prestation.invoiceId !== null || prestation.invoiceStatus === INVOICE_STATUS.DRAFT;
    const isRectification = prestation.originalPrestationId != null;

    // Ne pas permettre l'édition si la prestation est facturée ou c'est une rectification
    if (isInvoiced || isRectification || prestation.invoiceStatus) {
      toast.warning("Cette prestation fait partie d'une facture et ne peut pas être modifiée.");
      return;
    }

    setCurrentPrestation(prestation);
    const client = clients.find(
      (c) => c._id === prestation.client._id || c._id === prestation.client
    );
    setSelectedClient(client);

    // Scroll plus doux et précis vers la section d'ajout/modification de prestation
    setTimeout(() => {
      const addPrestationSection = document.getElementById('add-prestation-section');
      if (addPrestationSection) {
        addPrestationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Fallback à l'ancienne méthode si l'élément n'est pas trouvé
        window.scrollTo({ top: 580, behavior: 'smooth' });
      }
    }, 100); // Court délai pour s'assurer que le rendu est terminé
  };

  const handleDeletePrestation = async (id) => {
    try {
      // Vérifier d'abord si la prestation est modifiable
      const prestationToDelete = prestations.find(p => p._id === id);

      if (!prestationToDelete) {
        toast.error('Prestation non trouvée.');
        return;
      }

      const isInvoiced = prestationToDelete.invoiceId !== null || prestationToDelete.invoiceStatus === INVOICE_STATUS.DRAFT;
      const isRectification = prestationToDelete.originalPrestationId != null;

      if (isInvoiced || isRectification || prestationToDelete.invoiceStatus) {
        toast.warning("Cette prestation fait partie d'une facture et ne peut pas être supprimée.");
        return;
      }

      toast.warning('⚠️ Suppression en cours...');
      await deletePrestation(id);
    } catch (error) {
      toast.error('❌ Erreur lors de la suppression');
      console.error(error);
    }
  };

  const handleClientSelect = (clientId) => {
    const selected = clients.find((client) => client._id === clientId);
    if (selected) {
      setSelectedClient(selected);
      setCurrentPrestation(null);
      toast.info(`👤 Client sélectionné : ${selected.name}`);
    }
  };

  const handleLogout = () => {
    logout();
    setIsModalOpen(false);
    navigate('/');
    toast.info('👋 Au revoir ! Déconnexion réussie');
  };

  // ========================
  // 6) Rendu
  // ========================
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-modern fixed inset-0 overflow-auto">
        <ToastContainer />

        {/* Header + Sidebar (uniquement si connecté) */}
        {isLoggedIn && (
          <>
            <header className="fixed top-0 left-0 right-0 z-50 h-36 overflow-hidden">
              {/* Zone SVG = vague */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <svg
                  className="w-full h-full"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                  viewBox="0 0 1200 400"
                >
                  <defs>
                    <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0ea5e9" />   {/* sky-500 */}
                      <stop offset="100%" stopColor="#6366f1" /> {/* indigo-500 */}
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,0 L0,280 Q 300,350 600,280 T 1200,280 L1200,0 Z"
                    fill="url(#waveGradient)"
                  />
                </svg>
              </div>

              {/* Contenu flex = bouton gauche, texte droite */}
              <div className="relative h-full flex items-center justify-between px-6">
                {/* Bouton (Bars) à gauche */}
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="text-white hover:text-gray-200"
                >
                  <Bars3Icon className="h-7 w-7" />
                </button>

                {/* “Salut …” à droite */}
                <h1 className="text-white text-xl sm:text-2xl font-semibold">
                  {user ? `Salut ${user.firstName} ${user.lastName}` : ''}
                </h1>
              </div>
            </header>

            <Sidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              handleLogout={handleLogout}
            />
          </>
        )}

        {/* Routes */}
        <div className="pt-36 min-h-screen">
          <Routes>
            {/* Page d’accueil */}
            <Route
              path="/"
              element={
                <Homepage
                  openSignupModal={() => setIsSignupModalOpen(true)}
                  openSigninModal={() => setIsSigninModalOpen(true)}
                />
              }
            />

            {/* Dashboard (privé) */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  {/* 
                  On veut 2 rangées et 3 colonnes alignées 
                  + d'autres rangées en-dessous "text-2xl font-bold mb-2 relative z-10"
                */}
                  <div className="container mx-auto px-6 pt-30 space-y-6">
                    <h1 id="dashboard-header" className="text-2xl font-bold text-white">
                      Tableau de bord
                    </h1>
                    {/* RANGEE 1 : Mensuel / Annuel / Top Clients */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* CA Mensuel */}
                      <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-md shadow-sm p-4">
                        <CaMensuel />
                      </div>
                      {/* CA Annuel */}
                      <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-md shadow-sm p-4">
                        <CaAnnuel />
                      </div>
                      {/* Top Clients */}
                      <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-md shadow-sm p-4">
                        <TopClients />
                      </div>



                      {/* RANGEE 2 : Sélection client (col1), AddPrestation (col2-3) */}
                      <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-md shadow-sm p-4 col-span-1">
                        <h2 className="text-lg font-semibold mb-4">Sélectionner un client</h2>
                        <div className="space-y-4">
                          <select
                            value={selectedClient?._id || ''}
                            onChange={(e) => handleClientSelect(e.target.value)}
                            className="
                            w-full p-2 border border-gray-300 rounded-md
                            text-gray-900
                            focus:outline-none focus:ring-2 focus:ring-blue-500
                          "
                          >
                            <option value="">- Sélectionner un client -</option>
                            {clients.map((client) => (
                              <option key={client._id} value={client._id}>
                                {client.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => setIsModalOpen(true)}
                            className="
                            bg-gradient-to-r from-sky-500 to-indigo-500
    text-white font-semibold py-2 px-5 rounded-md
    hover:from-sky-600 hover:to-indigo-600
    transition-colors flex items-center
                          "
                          >
                            Ajouter un client
                          </button>
                        </div>
                      </div>
                      {/* AddPrestation */}
                      <div
                        id="add-prestation-section"
                        className="
    bg-white/10 border border-white/20 backdrop-blur-sm
    rounded-md shadow-sm p-4 col-span-2
  "
                      >
                        <h2 className="text-lg font-semibold mb-4">
                          {currentPrestation ? 'Modifier une prestation' : 'Ajouter une prestation'}
                        </h2>
                        <AddPrestation
                          addPrestation={addPrestation}
                          updatePrestation={updatePrestation}
                          initialData={currentPrestation}
                          selectedClient={selectedClient}
                          setCurrentPrestation={setCurrentPrestation}
                        />
                      </div>
                    </div>

                    {/* RANGEE 3 : MonthlySummary */}
                    <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-md shadow-sm p-4">
                      <MonthlySummary onEdit={handleEdit} onDelete={handleDeletePrestation} />
                    </div>

                    {/* RANGEE 4 : InvoiceCreator + InvoicePreview */}
                    {Object.keys(businessInfo).length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                        <InvoiceCreator businessInfo={businessInfo} clients={clients} />
                        <InvoicePreview />
                      </div>
                    )}
                  </div>
                </PrivateRoute>
              }
            />

            {/* Autres routes privées */}
            <Route
              path="/mon-entreprise"
              element={
                <PrivateRoute>
                  <MonEntreprise
                    businessInfo={businessInfo}
                    setBusinessInfo={setBusinessInfo}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/parametres-facturation"
              element={
                <PrivateRoute>
                  <ParametresFacturation
                    billingSettings={billingSettings}
                    setBillingSettings={setBillingSettings}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="/mes-factures"
              element={
                <PrivateRoute>
                  <FactureList />
                </PrivateRoute>
              }
            />
            <Route
              path="/suivi-paiements"
              element={
                <PrivateRoute>
                  <SuiviPaiements />
                </PrivateRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <PrivateRoute>
                  <ClientList clients={clients} />
                </PrivateRoute>
              }
            />
            <Route
              path="/rectify-new/:id"
              element={
                <PrivateRoute>
                  <RectificationForm />
                </PrivateRoute>
              }
            />


          </Routes>
        </div>
        {/* Modals pour Signup / Signin */}
        <Modal isOpen={isSignupModalOpen} onClose={() => setIsSignupModalOpen(false)}>
          <SignupModalContent onClose={() => setIsSignupModalOpen(false)} />
        </Modal>
        <Modal isOpen={isSigninModalOpen} onClose={() => setIsSigninModalOpen(false)}>
          <SigninModalContent onClose={() => setIsSigninModalOpen(false)} />
        </Modal>

        {/* Modal AddClient (si connecté) */}
        {isLoggedIn && (
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <AddClient addClient={addClient} setIsModalOpen={setIsModalOpen} />
          </Modal>
        )}
      </div>

    </QueryClientProvider >
  );
}

export default App;