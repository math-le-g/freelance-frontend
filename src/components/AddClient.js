import React, { useState } from 'react';
import axios from 'axios';

const AddClient = ({ addClient, setIsModalOpen }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Récupérer le token depuis le localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Utilisateur non connecté');
      return;
    }

    const newClient = { name, email, street,postalCode, city };

    // Configurer les en-têtes avec le token JWT
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    };

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/clients`, newClient, config);
      addClient(response.data);

      // Réinitialiser le formulaire après soumission
      setName('');
      setEmail('');
      setStreet('');
      setPostalCode('');
      setCity('');
      setIsModalOpen(false); // Fermer le modal après l'ajout du client
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        console.error('Erreur lors de l\'ajout du client', error);
        alert('Une erreur est survenue lors de l\'ajout du client. Veuillez réessayer.');
      }
    }
  };


  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-center">Ajouter un Client</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700">Nom :</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-gray-700">Email :</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Nouveau champ : Rue */}
        <div>
          <label className="block text-gray-700">Rue :</label>
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            required
            className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Nouveau champ : Code Postal */}
        <div>
          <label className="block text-gray-700">Code Postal :</label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            required
            className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Nouveau champ : Ville */}
        <div>
          <label className="block text-gray-700">Ville :</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="mt-1 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
        >
          Ajouter
        </button>
      </form>
    </div>
  );
};

export default AddClient;