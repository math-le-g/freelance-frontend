// frontend/src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import InvoiceRectification from './components/InvoiceRectification';
import ClientList from './components/ClientList';
import AddClient from './components/AddClient';
import AddPrestation from './components/AddPrestation';
import MonthlySummary from './components/MonthlySummary';
import Sidebar from './components/Sidebar';
import InvoiceCreator from './components/InvoiceCreator';
import FactureList from './components/FactureList';
import InvoicePreview from './components/InvoicePreview';
import SuiviPaiements from './components/SuiviPaiements';
import MonEntreprise from './pages/MonEntreprise';
import ParametresFacturation from './pages/ParametresFacturation';
import Homepage from './pages/Homepage';
import { Bars3Icon } from '@heroicons/react/24/solid';
import axios from './utils/axios-config';
import Modal from './components/Modal';
import SigninModalContent from './components/SigninModalContent';
import SignupModalContent from './components/SignupModalContent';
import Dashboard from './components/Dashboard';
import './index.css';
import { useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { usePrestation } from './contexts/PrestationContext';

const queryClient = new QueryClient();

function App() {
  // États locaux
  const [clients, setClients] = useState([]);
  const [currentPrestation, setCurrentPrestation] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [businessInfo, setBusinessInfo] = useState({});
  const [billingSettings, setBillingSettings] = useState({});
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(null);
  const navigate = useNavigate();

  const { isLoggedIn, user, isInitialized } = useAuth();
  const { addPrestation, updatePrestation, deletePrestation, fetchPrestations } = usePrestation();

  // États pour les modals d'inscription et de connexion
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isSigninModalOpen, setIsSigninModalOpen] = useState(false);

  // Configuration des notifications
  const toastConfig = {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: '!font-sans',
  };

  const notifySuccess = (message) =>
    toast.success(message, {
      ...toastConfig,
      className: '!bg-white !text-green-600 !rounded-lg !shadow-lg',
      progressClassName: '!bg-green-500',
    });
  const notifyError = (message) =>
    toast.error(message, {
      ...toastConfig,
      className: '!bg-white !text-red-600 !rounded-lg !shadow-lg',
      progressClassName: '!bg-red-500',
    });

  // Fonction pour récupérer les clients
  const fetchClients = useCallback(async () => {
    try {
      const response = await axios.get('/clients/');
      setClients(response.data);
    } catch (error) {
      notifyError('Erreur lors de la récupération des clients');
      console.error('Erreur lors de la récupération des clients', error);
    }
  }, []);

  // Fonction pour récupérer les informations de l'entreprise
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
  }, []);

  // Fonction pour récupérer les paramètres de facturation
  const fetchBillingSettings = useCallback(async () => {
    try {
      const response = await axios.get('/invoice-settings/');
      setBillingSettings(response.data);
    } catch (error) {
      notifyError('Erreur lors de la récupération des paramètres de facturation');
      console.error('Erreur lors de la récupération des paramètres de facturation', error);
    }
  }, []);

  // Fonction pour récupérer le prochain numéro de facture
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

  // Chargement initial des données
  useEffect(() => {
    if (isLoggedIn && isInitialized) {
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
    } else if (isInitialized && !isLoggedIn) {
      navigate('/');
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
  ]);

  const addClient = (newClientData) => {
    setClients((prev) => [...prev, newClientData]);
    notifySuccess('Client ajouté avec succès');
  };

  // Fonction de modification d'une prestation
  const handleEdit = (prestation) => {
    setCurrentPrestation(prestation);
    const client = clients.find(
      (c) => c._id === prestation.client._id || c._id === prestation.client
    );
    setSelectedClient(client);
    window.scrollTo({ top: 580, behavior: 'smooth' });
  };

  // Fonction pour supprimer une prestation à l'aide du contexte (qui invalide automatiquement la requête)
  const handleDeletePrestation = async (id) => {
    try {
      toast.warning('⚠️ Suppression en cours...');
      await deletePrestation(id);
    } catch (error) {
      toast.error('❌ Erreur lors de la suppression');
      console.error(error);
    }
  };

  // Fonction pour sélectionner un client
  const handleClientSelect = (clientId) => {
    const selected = clients.find((client) => client._id === clientId);
    if (selected) {
      setSelectedClient(selected);
      setCurrentPrestation(null);
      toast.info(`👤 Client sélectionné : ${selected.name}`);
    }
  };

  // Fonction de déconnexion
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    setIsModalOpen(false);
    navigate('/');
    toast.info('👋 Au revoir ! Déconnexion réussie');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100">
        <ToastContainer />
        {isLoggedIn && (
          <>
            <header className="bg-blue-600 text-white py-4 px-6 fixed top-0 left-0 right-0 z-50">
              <div className="container mx-auto flex justify-between items-center">
                <button onClick={() => setIsSidebarOpen(true)} className="focus:outline-none">
                  <Bars3Icon className="h-6 w-6 text-white" />
                </button>
                <h1 className="text-2xl font-bold ml-4">{user ? `${user.firstName} ${user.lastName}` : ''}</h1>
              </div>
            </header>
            <Sidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              handleLogout={handleLogout}
            />
          </>
        )}
        <div className={`container mx-auto py-8 px-6 ${isLoggedIn ? 'mt-16' : ''}`}>
          <Routes>
            <Route
              path="/"
              element={
                <Homepage
                  openSignupModal={() => setIsSignupModalOpen(true)}
                  openSigninModal={() => setIsSigninModalOpen(true)}
                />
              }
            />
            <Route
              path="/login"
              element={<SigninModalContent onClose={() => setIsSigninModalOpen(false)} />}
            />
            <Route
              path="/signup"
              element={<SignupModalContent onClose={() => setIsSignupModalOpen(false)} />}
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <div className="space-y-6">
                    <Dashboard />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="bg-white p-4 rounded-lg shadow-lg col-span-1">
                        <h2 className="text-lg font-semibold mb-4">Sélectionner un client</h2>
                        <div className="space-y-4">
                          <select
                            value={selectedClient?._id || ''}
                            onChange={(e) => handleClientSelect(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
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
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                          >
                            Ajouter un client
                          </button>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-lg col-span-2">
                        {/* Utilisation du PrestationProvider pour encapsuler AddPrestation */}
                        <AddPrestation
                          addPrestation={addPrestation}
                          updatePrestation={updatePrestation}
                          initialData={currentPrestation}
                          selectedClient={selectedClient}
                          setCurrentPrestation={setCurrentPrestation}
                        />
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
                      <MonthlySummary
                        onEdit={handleEdit}
                        onDelete={handleDeletePrestation}
                      />
                    </div>
                    {Object.keys(businessInfo).length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow-lg">
                          <InvoiceCreator businessInfo={businessInfo} clients={clients} />
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-lg">
                          <InvoicePreview businessInfo={businessInfo} invoiceNumber={nextInvoiceNumber} />
                        </div>
                      </div>
                    )}
                  </div>
                </PrivateRoute>
              }
            />
            <Route
              path="/mon-entreprise"
              element={
                <PrivateRoute>
                  <MonEntreprise businessInfo={businessInfo} setBusinessInfo={setBusinessInfo} />
                </PrivateRoute>
              }
            />
            <Route
              path="/parametres-facturation"
              element={
                <PrivateRoute>
                  <ParametresFacturation billingSettings={billingSettings} setBillingSettings={setBillingSettings} />
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
              path="/rectify-facture/:id"
              element={
                <PrivateRoute>
                  <InvoiceRectification />
                </PrivateRoute>
              }
            />

          </Routes>
        </div>
        <Modal isOpen={isSignupModalOpen} onClose={() => setIsSignupModalOpen(false)}>
          <SignupModalContent onClose={() => setIsSignupModalOpen(false)} />
        </Modal>
        <Modal isOpen={isSigninModalOpen} onClose={() => setIsSigninModalOpen(false)}>
          <SigninModalContent onClose={() => setIsSigninModalOpen(false)} />
        </Modal>
        {isLoggedIn && (
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <AddClient addClient={addClient} setIsModalOpen={setIsModalOpen} />
          </Modal>
        )}
      </div>
    </QueryClientProvider>
  );
}

export default App;
