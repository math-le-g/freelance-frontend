import React from 'react';

const PrestationList = ({ prestations, onEdit, onDelete }) => {
  return (
    <div>
      <h2>Liste des Prestations</h2>
      <ul>
        {prestations.map((prestation) => (
          <li key={prestation._id}>
          {prestation.description} - {prestation.hours} heures à {prestation.hourlyRate}€/h
          {prestation.client && prestation.client.name ? (
            <> (Client : {prestation.client.name})</>
          ) : (
            ' (Client non spécifié)'
          )}
          - {prestation.date ? new Date(prestation.date).toLocaleDateString() : 'Date non spécifiée'}
          <button onClick={() => onEdit(prestation)}>Modifier</button>
          <button onClick={() => onDelete(prestation._id)}>Supprimer</button>
        </li>
        ))}  
        
      </ul>
    </div>
  );
};

export default PrestationList;
