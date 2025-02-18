import React from 'react';
import BusinessInfo from '../components/BusinessInfo';

const MonEntreprise = ({ businessInfo, setBusinessInfo }) => {
  return (
    <div className="container mx-auto pt-34 px-6 pb-8">
      {/* Carte translucide “glass” */}
      <div className="
        bg-white/10
        border border-white/20
        backdrop-blur-sm
        rounded-md
        shadow-sm
        p-6
        text-gray-100
        relative
        overflow-hidden
      ">

        {/* Petite vague décorative en haut (optionnel) */}
        <div className="absolute top-0 left-0 w-full pointer-events-none">
          <svg
            className="block w-full h-12"
            viewBox="0 0 1200 120"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0,40 C 300,120 900,-40 1200,40 L1200,0 L0,0 Z"
              fill="rgba(255,255,255,0.05)"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold mb-2 relative z-10">
          Mon Entreprise
        </h2>
        <p className="text-sm text-gray-300 mb-6 relative z-10">
          Renseignez ici vos informations légales et coordonnées.
        </p>

        {/* Formulaire BusinessInfo */}
        <BusinessInfo
          businessInfo={businessInfo}
          setBusinessInfo={setBusinessInfo}
        />
      </div>
    </div>
  );
};

export default MonEntreprise;




/*
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
*/
