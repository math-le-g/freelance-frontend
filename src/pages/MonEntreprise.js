import React from 'react';
import BusinessInfo from '../components/BusinessInfo';


const MonEntreprise = ({ businessInfo, setBusinessInfo }) => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6">Mon Entreprise</h2>
        <BusinessInfo businessInfo={businessInfo} setBusinessInfo={setBusinessInfo} />
      </div>
    </div>
  );
};

export default MonEntreprise;

