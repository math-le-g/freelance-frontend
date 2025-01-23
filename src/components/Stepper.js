// src/components/Stepper.js
import React from 'react';

function Stepper({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((label, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        // Couleurs de style pour l'étape active ou déjà réalisée
        const stepCircleStyle = isActive
          ? 'bg-blue-600 text-white'
          : isCompleted
          ? 'bg-green-600 text-white'
          : 'bg-gray-300 text-gray-600';

        return (
          <div key={index} className="flex-1 flex flex-col items-center">
            {/* Cercle numéroté */}
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full ${stepCircleStyle}`}
            >
              {index + 1}
            </div>
            {/* Label */}
            <div
              className={`mt-2 text-sm ${
                isActive || isCompleted ? 'font-semibold text-gray-800' : 'text-gray-400'
              }`}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Stepper;
