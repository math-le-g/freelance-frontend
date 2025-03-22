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

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Utilisateur non connecté');
      return;
    }

    const newClient = { name, email, street, postalCode, city };
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/clients`,
        newClient,
        config
      );
      addClient(response.data);

      // Réinitialiser le formulaire
      setName('');
      setEmail('');
      setStreet('');
      setPostalCode('');
      setCity('');
      setIsModalOpen(false);
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
    <div
      className="
        bg-white/10 border border-white/20 backdrop-blur-sm
        p-6 rounded-md shadow-sm text-gray-100
        max-w-md mx-auto
      "
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Ajouter un Client</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-200 mb-1">Nom :</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="
              w-full p-2 rounded-md border border-gray-300 text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
        </div>

        <div>
          <label className="block text-gray-200 mb-1">Email :</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="
              w-full p-2 rounded-md border border-gray-300 text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
        </div>

        <div>
          <label className="block text-gray-200 mb-1">Rue :</label>
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            required
            className="
              w-full p-2 rounded-md border border-gray-300 text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
        </div>

        <div>
          <label className="block text-gray-200 mb-1">Code Postal :</label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            required
            className="
              w-full p-2 rounded-md border border-gray-300 text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
        </div>

        <div>
          <label className="block text-gray-200 mb-1">Ville :</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="
              w-full p-2 rounded-md border border-gray-300 text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
        </div>

        <button
          type="submit"
          className="
            w-full bg-blue-600 text-white py-2 px-4 rounded-md
            hover:bg-blue-700 transition-colors font-semibold
          "
        >
          Ajouter
        </button>
      </form>
    </div>
  );
};

export default AddClient;


