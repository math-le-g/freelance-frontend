// frontend/src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from '../utils/axios-config';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Vérification du token via /api/auth/validate-token
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setIsLoggedIn(false);
        setIsInitialized(true);
        return;
      }
      try {
        // Appel de la route de validation du token
        const response = await axios.post('/auth/validate-token');
        if (response.data && response.data.valid) {
          setUser(response.data.user);
          setIsLoggedIn(true);
        } else {
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Erreur lors de la validation du token :', error);
        setUser(null);
        setIsLoggedIn(false);
      } finally {
        setIsInitialized(true);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await axios.post('/auth/signin', credentials);
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        setIsLoggedIn(true);
        toast.success('Connexion réussie !');
        return response.data;
      }
      throw new Error('Réponse invalide du serveur');
    } catch (error) {
      console.error('Erreur lors de la connexion :', error);
      toast.error('Échec de la connexion.');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsLoggedIn(false);
    toast.success('Déconnexion réussie !');
  };

  return (
    <AuthContext.Provider value={{ isInitialized, isLoggedIn, user, login, logout  }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
