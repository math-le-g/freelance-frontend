import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/75 backdrop-blur-sm">
      <div className="min-h-full max-h-screen overflow-y-auto">
        <div className="flex items-start justify-center pt-36 pb-10 px-4">
          <div className="relative w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl overflow-hidden">
            {/* Bouton de fermeture */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            
            {/* Contenu */}
            <div className="p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;









/*
import React from 'react';

const Modal = ({ isOpen, onClose, children, className }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      
      <div
        className={`bg-white rounded-2xl z-50 w-full max-h-[90vh] overflow-y-auto relative p-8 shadow-xl ${
          className || 'max-w-md'
        }`}
      >
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        
        {children}
      </div>
    </div>
  );
};

export default Modal;
*/






