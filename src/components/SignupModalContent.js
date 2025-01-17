// frontend/src/components/SignupModalContent.js

import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const SignupModalContent = ({ onClose }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // Appel de l'API pour s'inscrire
      const response = await axios.post('http://localhost:5000/api/auth/signup', { 
        firstName, 
        lastName, 
        email, 
        password 
      });
  
      // Si la réponse contient un token
      if (response.data.token) {
        // Utiliser la fonction de login du contexte
        login(response.data.token, response.data.user);
  
        //console.log('Token stocké dans le localStorage');
  
        // Fermer le modal d'inscription
        onClose();
  
        // Rediriger vers le dashboard
        navigate('/dashboard');
      } else {
        toast.error('Inscription échouée: Token manquant');
      }
    } catch (error) {
      if (error.response) {
        console.error('Erreur lors de l\'inscription:', error.response.data);
        toast.error(error.response.data.message || 'Erreur lors de l\'inscription. Veuillez réessayer.');
      } else if (error.request) {
        console.error('Aucune réponse du serveur:', error.request);
        toast.error('Aucune réponse du serveur. Veuillez vérifier votre connexion.');
      } else {
        console.error('Erreur lors de la configuration de la requête:', error.message);
        toast.error('Une erreur s\'est produite. Veuillez réessayer.');
      }
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-center">Inscription</h2>
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-gray-700">Prénom :</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Nom :</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Email :</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Mot de passe :</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          S'inscrire
        </button>
      </form>
    </div>
  );
};

export default SignupModalContent;




