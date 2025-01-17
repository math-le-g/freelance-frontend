import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BusinessInfo = ({ businessInfo, setBusinessInfo }) => {
  const [localInfo, setLocalInfo] = useState({
    name: '',
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    email: '',
    siret: '',
    companyType: '',
  });

  
  useEffect(() => {
    if (businessInfo && Object.keys(businessInfo).length > 0) {
      setLocalInfo(businessInfo);
    } else {
      // Réinitialiser localInfo si businessInfo est vide
      setLocalInfo({
        name: '',
        address: '',
        postalCode: '',
        city: '',
        phone: '',
        email: '',
        siret: '',
        companyType: '',
      });
    }
  }, [businessInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalInfo({ ...localInfo, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Utilisateur non connecté');
        return;
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      };

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/business-info/`, localInfo, config);
      setBusinessInfo(response.data);
      alert('Informations de l\'entreprise sauvegardées !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des informations de l\'entreprise', error);
      alert('Erreur lors de la sauvegarde des informations de l\'entreprise.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-semibold mb-4">Informations de l'Entreprise</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700">Nom :</label>
          <input
            type="text"
            name="name"
            value={localInfo.name}
            onChange={handleChange}
            required
            className="mt-1 w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-gray-700">Adresse :</label>
          <input
            type="text"
            name="address"
            value={localInfo.address}
            onChange={handleChange}
            required
            className="mt-1 w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-gray-700">Code Postal :</label>
          <input
            type="text"
            name="postalCode"
            value={localInfo.postalCode}
            onChange={handleChange}
            required
            className="mt-1 w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-gray-700">Ville :</label>
          <input
            type="text"
            name="city"
            value={localInfo.city}
            onChange={handleChange}
            required
            className="mt-1 w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-gray-700">Numéro de Portable :</label>
          <input
            type="text"
            name="phone"
            value={localInfo.phone}
            onChange={handleChange}
            required
            className="mt-1 w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-gray-700">Email :</label>
          <input
            type="email"
            name="email"
            value={localInfo.email}
            onChange={handleChange}
            required
            className="mt-1 w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-gray-700">SIRET :</label>
          <input
            type="text"
            name="siret"
            value={localInfo.siret}
            onChange={handleChange}
            required
            className="mt-1 w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label className="block text-gray-700">Type d'Entreprise :</label>
          <input
            type="text"
            name="companyType"
            value={localInfo.companyType}
            onChange={handleChange}
            required
            placeholder="Entreprise Individuelle, SARL, etc."
            className="mt-1 w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
        >
          Sauvegarder
        </button>
      </form>
    </div>
  );
};

export default BusinessInfo;
