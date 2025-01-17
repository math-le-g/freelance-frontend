// frontend/src/contexts/PrestationContext.js
import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../utils/axios-config';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const PrestationContext = createContext({
  prestations: [],
  isLoading: false,
  error: null,
  clients: [],
  isClientsLoading: false,
  clientsError: null,
  addPrestation: async () => {},
  updatePrestation: async () => {},
  deletePrestation: async () => {},
  fetchPrestations: () => {},
});

export const PrestationProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const { isLoggedIn, isInitialized } = useAuth();

  // Récupérer les prestations
  const { data: prestations = [], isLoading, error } = useQuery({
    queryKey: ['prestations'],
    queryFn: async () => {
      const response = await axios.get('/prestations/');
      return response.data;
    },
    enabled: isLoggedIn && isInitialized,
    onError: () => {
      toast.error('Erreur lors de la récupération des prestations');
    },
  });

  // Récupérer les clients
  const { data: clients = [], isLoading: isClientsLoading, error: clientsError } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await axios.get('/clients/');
      return response.data;
    },
    enabled: isLoggedIn && isInitialized,
    onError: () => {
      toast.error('Erreur lors de la récupération des clients');
    },
  });

  const addPrestationMutation = useMutation({
    mutationFn: (newPrestation) => axios.post('/prestations/', newPrestation),
    onSuccess: () => {
      queryClient.invalidateQueries(['prestations']);
      toast.success('✨ Prestation ajoutée avec succès !');
    },
    onError: () => {
      toast.error("❌ Erreur lors de l'ajout de la prestation");
    },
  });


  const updatePrestationMutation = useMutation({
    mutationFn: (updatedPrestation) => {
      if (updatedPrestation.isInvoiced) {
        throw new Error("Les prestations facturées ne peuvent pas être modifiées");
      }
      return axios.put(`/prestations/${updatedPrestation._id}`, updatedPrestation);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['prestations']);
      toast.success('🔄 Prestation mise à jour avec succès !');
    },
    onError: (error) => {
      toast.error(error.message || "❌ Erreur lors de la modification de la prestation");
    },
  });



  const deletePrestationMutation = useMutation({
    mutationFn: async (id) => {
      const prestation = prestations.find(p => p._id === id);
      if (prestation?.isInvoiced) {
        throw new Error("Les prestations facturées ne peuvent pas être supprimées");
      }
      return axios.delete(`/prestations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['prestations']);
      toast.success('🗑️ Prestation supprimée avec succès');
    },
    onError: (error) => {
      toast.error(error.message || '❌ Erreur lors de la suppression');
    },
  });





  const fetchPrestations = () => queryClient.invalidateQueries(['prestations']);

  return (
    <PrestationContext.Provider
      value={{
        prestations,
        isLoading,
        error,
        clients,
        isClientsLoading,
        clientsError,
        addPrestation: addPrestationMutation.mutateAsync,
        updatePrestation: updatePrestationMutation.mutateAsync,
        deletePrestation: deletePrestationMutation.mutateAsync,
        fetchPrestations,
      }}
    >
      {children}
    </PrestationContext.Provider>
  );
};

export const usePrestation = () => {
  const context = useContext(PrestationContext);
  if (!context) throw new Error('usePrestation must be used within a PrestationProvider');
  return context;
};