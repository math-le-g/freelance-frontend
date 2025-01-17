// frontend/src/utils/axios-config.js
import axios from 'axios';

// Créer un événement personnalisé
export const logoutEvent = new Event('logout');

// Créer une instance Axios
const axiosInstance = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api/`, // Base URL pour toutes les requêtes
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour les requêtes
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'null' && token.trim()) {
      config.headers.Authorization = `Bearer ${token.trim()}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour les réponses
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Déclencher l'événement de déconnexion
      window.dispatchEvent(logoutEvent);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

