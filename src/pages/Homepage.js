import React from 'react';

const Homepage = ({ openSignupModal, openSigninModal }) => {
  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Bienvenue sur l'Application Freelance</h1>
      <p className="mb-8">Gérez facilement vos prestations et facturez vos clients en quelques clics.</p>
      
      <div className="flex justify-center space-x-4">
        <button 
          onClick={openSignupModal}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition duration-300"
        >
          S'inscrire
        </button>
        <button 
          onClick={openSigninModal}
          className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition duration-300"
        >
          Se connecter
        </button>
      </div>
    </div>
  );
};

export default Homepage;

