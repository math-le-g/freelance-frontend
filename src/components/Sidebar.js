import React from 'react';
import { Link } from 'react-router-dom';
import {
  XMarkIcon,
  HomeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/solid';

const Sidebar = ({ isOpen, onClose, handleLogout }) => {
  return (
    <>
      {/* Overlay */}
      <div
        className={`
          fixed inset-0 bg-black bg-opacity-50
          transition-opacity duration-300
          ${isOpen ? 'opacity-100 visible z-40' : 'opacity-0 invisible'}
        `}
        onClick={onClose}
      ></div>

      {/* Sidebar container “wave glass” */}
      <div
        className={`
          fixed top-0 left-0
          w-64 h-full
          z-50
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* 
          1) BG translucide + wave en haut 
          On fait un parent 'relative h-full' 
        */}
        <div className="relative h-full bg-white/10 backdrop-blur-sm border border-white/20 text-white">
          {/* 
            2) La vague en haut (SVG) 
            On la place “absolu” en haut 
          */}
          <div className="absolute top-0 left-0 w-full overflow-hidden pointer-events-none">
            <svg
              className="block w-full h-24"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              viewBox="0 0 1200 120"
            >
              <defs>
                <linearGradient id="sidebarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <path
                d="M0,20 C 150,100 350,0 600,20 S 1050,50 1200,20 L1200,0 L0,0 Z"
                fill="url(#sidebarGradient)"
              />
            </svg>
          </div>

          {/* 
            3) Header du sidebar (croix de fermeture) 
            On met un padding-top + margin top 
            pour ne pas recouvrir la vague 
          */}
          <div className="relative flex items-center justify-between px-4 pt-6 pb-2">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button onClick={onClose} className="focus:outline-none">
              <XMarkIcon className="h-6 w-6 text-white hover:text-gray-300" />
            </button>
          </div>

          {/* 4) Navigation */}
          <nav className="relative px-4 pb-6">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/dashboard"
                  className="
                    flex items-center px-3 py-2 rounded-md
                    text-sm font-medium
                    text-white
                    hover:bg-white/20
                    transition-colors
                  "
                  onClick={onClose}
                >
                  <HomeIcon className="h-5 w-5 mr-2 text-white/80" />
                  Tableau de bord
                </Link>
              </li>
              <li>
                <Link
                  to="/mon-entreprise"
                  className="
                    flex items-center px-3 py-2 rounded-md
                    text-sm font-medium
                    text-white
                    hover:bg-white/20
                    transition-colors
                  "
                  onClick={onClose}
                >
                  <BuildingOfficeIcon className="h-5 w-5 mr-2 text-white/80" />
                  Mon Entreprise
                </Link>
              </li>
              <li>
                <Link
                  to="/mes-factures"
                  className="
                    flex items-center px-3 py-2 rounded-md
                    text-sm font-medium
                    text-white
                    hover:bg-white/20
                    transition-colors
                  "
                  onClick={onClose}
                >
                  <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-white/80" />
                  Mes Factures
                </Link>
              </li>
              <li>
                <Link
                  to="/clients"
                  className="
                    flex items-center px-3 py-2 rounded-md
                    text-sm font-medium
                    text-white
                    hover:bg-white/20
                    transition-colors
                  "
                  onClick={onClose}
                >
                  <UsersIcon className="h-5 w-5 mr-2 text-white/80" />
                  Clients
                </Link>
              </li>
              <li>
                <Link
                  to="/prestations"
                  className="
                    flex items-center px-3 py-2 rounded-md
                    text-sm font-medium
                    text-white
                    hover:bg-white/20
                    transition-colors
                  "
                  onClick={onClose}
                >
                  <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-white/80" />
                  Prestations
                </Link>
              </li>
              <li>
                <Link
                  to="/parametres-facturation"
                  className="
                    flex items-center px-3 py-2 rounded-md
                    text-sm font-medium
                    text-white
                    hover:bg-white/20
                    transition-colors
                  "
                  onClick={onClose}
                >
                  <Cog6ToothIcon className="h-5 w-5 mr-2 text-white/80" />
                  Paramètres
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="
                    w-full flex items-center px-3 py-2 rounded-md
                    text-sm font-medium
                    text-red-200
                    hover:bg-red-500/20
                    transition-colors
                  "
                >
                  Se déconnecter
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;


/*
import React from 'react';
import { Link } from 'react-router-dom'; // Importer Link de react-router-dom
import { XMarkIcon, HomeIcon, UsersIcon, ClipboardDocumentListIcon, BuildingOfficeIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';

const Sidebar = ({ isOpen, onClose, handleLogout }) => {
  return (
    <>
      
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 visible z-40' : 'opacity-0 invisible'}`}
        onClick={onClose}
      ></div>

      
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
            
            <li>
              <Link to="/dashboard" className="flex items-center px-2 py-1 rounded hover:bg-gray-200 w-full" onClick={onClose}>
                <HomeIcon className="h-5 w-5 mr-2 text-gray-600" />
                Dashboard
              </Link>
            </li>
           
            <li>
              <Link to="/mon-entreprise" className="flex items-center px-2 py-1 rounded hover:bg-gray-200 w-full" onClick={onClose}>
                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-gray-600" />
                Mon Entreprise
              </Link>
            </li>

            
            <li>
              <Link to="/mes-factures" className="flex items-center px-2 py-1 rounded hover:bg-gray-200 w-full" onClick={onClose}>
                <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-gray-600" />
                Mes Factures
              </Link>
            </li>

            
            <li>
              <Link to="/clients" className="flex items-center px-2 py-1 rounded hover:bg-gray-200 w-full" onClick={onClose}>
                <UsersIcon className="h-5 w-5 mr-2 text-gray-600" />
                Clients
              </Link>
            </li>
            
            <li>
              <Link to="/prestations" className="flex items-center px-2 py-1 rounded hover:bg-gray-200 w-full" onClick={onClose}>
                <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-gray-600" />
                Prestations
              </Link>
            </li>
           
            <li>
              <Link to="/parametres-facturation" className="flex items-center px-2 py-1 rounded hover:bg-gray-200 w-full" onClick={onClose}>
                <Cog6ToothIcon className="h-5 w-5 mr-2 text-gray-600" />
                Paramètres de facturation
              </Link>
            </li>
           
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
*/