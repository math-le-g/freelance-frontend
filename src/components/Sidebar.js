import React from 'react';
import { Link } from 'react-router-dom'; // Importer Link de react-router-dom
import { XMarkIcon, HomeIcon, UsersIcon, ClipboardDocumentListIcon, BuildingOfficeIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';

const Sidebar = ({ isOpen, onClose, handleLogout }) => {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 visible z-40' : 'opacity-0 invisible'}`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div
        className={`fixed top-16 left-0 w-64 bg-white h-full shadow-lg transform transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button onClick={onClose} className="focus:outline-none">
            <XMarkIcon className="h-6 w-6 text-gray-700" />
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {/* Lien vers Dashboard */}
            <li>
              <Link to="/dashboard" className="flex items-center px-2 py-1 rounded hover:bg-gray-200 w-full" onClick={onClose}>
                <HomeIcon className="h-5 w-5 mr-2 text-gray-600" />
                Dashboard
              </Link>
            </li>
            {/* Lien vers Mon Entreprise */}
            <li>
              <Link to="/mon-entreprise" className="flex items-center px-2 py-1 rounded hover:bg-gray-200 w-full" onClick={onClose}>
                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-gray-600" />
                Mon Entreprise
              </Link>
            </li>

            {/* Lien vers Mes factures */}
            <li>
              <Link to="/mes-factures" className="flex items-center px-2 py-1 rounded hover:bg-gray-200 w-full" onClick={onClose}>
                <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-gray-600" />
                Mes Factures
              </Link>
            </li>

            {/* Lien vers Clients */}
            <li>
              <Link to="/clients" className="flex items-center px-2 py-1 rounded hover:bg-gray-200 w-full" onClick={onClose}>
                <UsersIcon className="h-5 w-5 mr-2 text-gray-600" />
                Clients
              </Link>
            </li>
            {/* Lien vers Prestations */}
            <li>
              <Link to="/prestations" className="flex items-center px-2 py-1 rounded hover:bg-gray-200 w-full" onClick={onClose}>
                <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-gray-600" />
                Prestations
              </Link>
            </li>
            {/* Lien vers Paramètres de facturation */}
            <li>
              <Link to="/parametres-facturation" className="flex items-center px-2 py-1 rounded hover:bg-gray-200 w-full" onClick={onClose}>
                <Cog6ToothIcon className="h-5 w-5 mr-2 text-gray-600" />
                Paramètres de facturation
              </Link>
            </li>
            {/* Bouton de déconnexion */}
            <li>
              <button onClick={handleLogout} className="flex items-center px-2 py-1 rounded hover:bg-red-200 w-full text-red-600">
                Se déconnecter
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
