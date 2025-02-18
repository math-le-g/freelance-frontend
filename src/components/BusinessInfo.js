import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Import d'icônes heroicons pour illustrer le design
import {
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  AtSymbolIcon,
  IdentificationIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

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
    setLocalInfo((prev) => ({ ...prev, [name]: value }));
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
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/business-info/`,
        localInfo,
        config
      );
      setBusinessInfo(response.data);
      alert("Informations de l'entreprise sauvegardées !");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'entreprise", error);
      alert("Erreur lors de la sauvegarde de l'entreprise.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
      {/* Section Coordonnées */}
      <h3 className="text-lg font-semibold border-b border-white/20 pb-1 mb-3">
        <span className="inline-flex items-center">
          <MapPinIcon className="h-5 w-5 mr-2 text-white/60" />
          Coordonnées
        </span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nom de l'entreprise */}
        <div>
          <label className="block text-sm font-medium text-gray-200">
            <BuildingOfficeIcon className="inline-block h-4 w-4 mr-1 text-gray-400" />
            Nom de l'entreprise
          </label>
          <input
            type="text"
            name="name"
            value={localInfo.name}
            onChange={handleChange}
            required
            className="
              mt-1
              w-full max-w-md
              p-1.5
              bg-slate-50
              border border-gray-300
              rounded-md
              text-sm
              text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
            "
          />
        </div>

        {/* Ville */}
        <div>
          <label className="block text-sm font-medium text-gray-200">
            <MapPinIcon className="inline-block h-4 w-4 mr-1 text-gray-400" />
            Ville
          </label>
          <input
            type="text"
            name="city"
            value={localInfo.city}
            onChange={handleChange}
            required
            className="
              mt-1
              w-full max-w-md
              p-1.5
              bg-slate-50
              border border-gray-300
              rounded-md
              text-sm
              text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
            "
          />
        </div>
      </div>

      {/* Adresse + Code Postal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-200">
            Adresse
          </label>
          <input
            type="text"
            name="address"
            value={localInfo.address}
            onChange={handleChange}
            required
            className="
              mt-1
              w-full max-w-md
              p-1.5
              bg-slate-50
              border border-gray-300
              rounded-md
              text-sm
              text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
            "
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200">
            Code Postal
          </label>
          <input
            type="text"
            name="postalCode"
            value={localInfo.postalCode}
            onChange={handleChange}
            required
            className="
              mt-1
              w-full max-w-md
              p-1.5
              bg-slate-50
              border border-gray-300
              rounded-md
              text-sm
              text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
            "
          />
        </div>
      </div>

      {/* Tel + Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-200">
            <PhoneIcon className="inline-block h-4 w-4 mr-1 text-gray-400" />
            Numéro de Portable
          </label>
          <input
            type="text"
            name="phone"
            value={localInfo.phone}
            onChange={handleChange}
            required
            className="
              mt-1
              w-full max-w-md
              p-1.5
              bg-slate-50
              border border-gray-300
              rounded-md
              text-sm
              text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
            "
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200">
            <AtSymbolIcon className="inline-block h-4 w-4 mr-1 text-gray-400" />
            Email
          </label>
          <input
            type="email"
            name="email"
            value={localInfo.email}
            onChange={handleChange}
            required
            className="
              mt-1
              w-full max-w-md
              p-1.5
              bg-slate-50
              border border-gray-300
              rounded-md
              text-sm
              text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
            "
          />
        </div>
      </div>

      {/* Section Infos Légales */}
      <h3 className="text-lg font-semibold border-b border-white/20 pb-1 mb-3 mt-6">
        <span className="inline-flex items-center">
          <IdentificationIcon className="h-5 w-5 mr-2 text-white/60" />
          Informations Légales
        </span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SIRET */}
        <div>
          <label className="block text-sm font-medium text-gray-200">
            <DocumentTextIcon className="inline-block h-4 w-4 mr-1 text-gray-400" />
            SIRET
          </label>
          <input
            type="text"
            name="siret"
            value={localInfo.siret}
            onChange={handleChange}
            required
            className="
              mt-1
              w-full max-w-md
              p-1.5
              bg-slate-50
              border border-gray-300
              rounded-md
              text-sm
              text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
            "
          />
        </div>
        {/* Type d'entreprise */}
        <div>
          <label className="block text-sm font-medium text-gray-200">
            Type d'Entreprise
          </label>
          <input
            type="text"
            name="companyType"
            value={localInfo.companyType}
            onChange={handleChange}
            required
            placeholder="Ex: SARL, EI, EURL..."
            className="
              mt-1
              w-full max-w-md
              p-1.5
              bg-slate-50
              border border-gray-300
              rounded-md
              text-sm
              text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
            "
          />
        </div>
      </div>

      {/* Bouton Sauvegarder */}
      <div className="flex justify-end mt-4">
  <button
    type="submit"
    className="
      bg-gradient-to-r from-sky-500 to-indigo-500
      text-white
      px-6 py-2
      rounded-md
      hover:from-sky-600 hover:to-indigo-600
      transition-colors
      font-semibold
    "
  >
    Sauvegarder
  </button>
</div>

      {/* Carte de visite (optionnel) */}
      {businessInfo?.name && (
        <div className="
          mt-8 p-4
          bg-white/10
          border border-white/20
          rounded-md shadow-sm
          text-gray-100
        ">
          <h4 className="text-md font-semibold mb-1">
            {businessInfo.name}
          </h4>
          <p className="text-sm text-gray-200">
            {businessInfo.address} {businessInfo.postalCode} {businessInfo.city}<br />
            Tél : {businessInfo.phone} - Email : {businessInfo.email}<br />
            SIRET : {businessInfo.siret}<br />
            Forme : {businessInfo.companyType}
          </p>
        </div>
      )}
    </form>
  );
};

export default BusinessInfo;







/*
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
*/