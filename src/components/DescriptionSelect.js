import React, { useState } from 'react';
import AsyncCreatableSelect from 'react-select/async-creatable';
import axios from '../utils/axios-config';
import debounce from 'lodash/debounce';
import {
  ClockIcon,
  FireIcon,
  StarIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const DescriptionSelect = ({ value, onChange }) => {
  // Petit état local pour forcer le rechargement de la liste (après suppression, etc.)
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Formate la façon dont on affiche "il y a X minutes/heures/jours"
   */
  const formatTimeAgo = (date) => {
    if (!date) return null;
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return "il y a quelques minutes";
    if (hours < 24) return `il y a ${hours}h`;
    if (days === 1) return "hier";
    if (days < 7) return `il y a ${days}j`;
    return new Date(date).toLocaleDateString('fr-FR');
  };

  /**
   * Charge les options depuis l'API, avec une limite de 30.
   * Utilise un "debounce" pour éviter d'appeler l'API à chaque frappe trop rapidement.
   */
  const loadOptions = debounce(async (inputText, callback) => {
    try {
      const response = await axios.get('/descriptions', {
        params: {
          search: inputText,
          limit: 30,
          // On ajoute refreshKey pour forcer un nouvel appel quand refreshKey change
          refreshKey
        }
      });

      const allDescriptions = response.data;
      const now = new Date();

      // Calcul d'un score simple pour classer les descriptions
      const scoredDescriptions = allDescriptions.map((desc) => {
        const lastUsedDays = desc.lastUsed
          ? Math.floor((now - new Date(desc.lastUsed)) / (1000 * 60 * 60 * 24))
          : Infinity;
        // Score basé sur fréquence et récence
        const score = desc.frequency * 10 + 1 / (lastUsedDays + 1);

        return { ...desc, score };
      });

      // Catégories
      const recentlyUsed = scoredDescriptions
        .filter(
          (desc) =>
            desc.lastUsed &&
            new Date(desc.lastUsed) > new Date(now - 7 * 24 * 60 * 60 * 1000)
        )
        .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));

      const mostUsed = scoredDescriptions
        .filter((desc) => desc.frequency > 1)
        .sort((a, b) => b.frequency - a.frequency);

      // Suggestions génériques (tout le reste)
      const suggested = scoredDescriptions
        .filter(
          (desc) => !recentlyUsed.includes(desc) && !mostUsed.includes(desc)
        )
        .sort((a, b) => b.score - a.score);

      // Construction de groupes
      const groups = [];

      if (recentlyUsed.length > 0) {
        groups.push({
          label: 'Récents',
          options: recentlyUsed.map((desc) => ({
            id: desc._id,
            value: desc.text,
            label: desc.text,
            lastUsed: desc.lastUsed,
            frequency: desc.frequency,
            isRecent: true
          }))
        });
      }

      if (mostUsed.length > 0) {
        groups.push({
          label: 'Les plus utilisés',
          options: mostUsed.map((desc) => ({
            id: desc._id,
            value: desc.text,
            label: desc.text,
            lastUsed: desc.lastUsed,
            frequency: desc.frequency,
            isPopular: true
          }))
        });
      }

      // On ne met les "suggestions" que si l’utilisateur tape quelque chose
      if (inputText && suggested.length > 0) {
        groups.push({
          label: 'Suggestions',
          options: suggested.map((desc) => ({
            id: desc._id,
            value: desc.text,
            label: desc.text,
            lastUsed: desc.lastUsed,
            frequency: desc.frequency
          }))
        });
      }

      callback(groups);
    } catch (error) {
      console.error('Erreur lors de la recherche des descriptions :', error);
      callback([]);
    }
  }, 300);

  /**
   * Gère la suppression : on appelle DELETE /descriptions/:id,
   * puis on force un refresh (refreshKey++)
   */
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/descriptions/${id}`);
      setRefreshKey((prev) => prev + 1); // Provoque le rechargement
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
    }
  };

  /**
   * Styles customs pour réact-select
   */
  const customStyles = {
    control: (base) => ({
      ...base,
      borderRadius: '0.75rem',
      borderColor: '#E5E7EB',
      boxShadow: 'none',
      '&:hover': { borderColor: '#3B82F6' },
      padding: '3px',
      minHeight: '45px',
      backgroundColor: '#F9FAFB'
    }),
    option: (base, { isSelected, isFocused }) => ({
      ...base,
      backgroundColor: isSelected
        ? '#EFF6FF'
        : isFocused
        ? '#F3F4F6'
        : 'white',
      color: isSelected ? '#2563EB' : '#374151',
      padding: '10px 12px',
      cursor: 'pointer',
      borderRadius: '0.5rem',
      margin: '2px 5px',
      ':active': {
        backgroundColor: '#DBEAFE'
      },
      ':hover': {
        backgroundColor: isSelected ? '#DBEAFE' : '#F3F4F6'
      }
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '1rem',
      padding: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    }),
    group: (base) => ({
      ...base,
      padding: '5px'
    }),
    groupHeading: (base) => ({
      ...base,
      color: '#6B7280',
      fontSize: '0.875rem',
      textTransform: 'none',
      fontWeight: 600,
      margin: '5px 10px'
    })
  };

  /**
   * Customise l’affichage de chaque option dans la liste,
   * ajout d’un bouton (icône) “Supprimer” pour effacer l’entrée
   */
  const formatOptionLabel = ({
    label,
    id,
    lastUsed,
    frequency,
    isRecent,
    isPopular
  }) => (
    <div className="flex justify-between items-center w-full group">
      <div className="flex items-center gap-2">
        {isRecent && <ClockIcon className="w-4 h-4 text-blue-500" />}
        {isPopular && <FireIcon className="w-4 h-4 text-orange-500" />}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
        {lastUsed && (
          <span className="text-xs">{formatTimeAgo(lastUsed)}</span>
        )}
        {frequency > 1 && (
          <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
            {frequency}×
          </span>
        )}
        {/* Bouton de suppression si on a un id (donc pas une nouvelle création) */}
        {id && (
          <TrashIcon
            className="w-4 h-4 text-red-500 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation(); // Évite de sélectionner l’option au clic
              handleDelete(id);
            }}
          />
        )}
      </div>
    </div>
  );

  /**
   * Quand l’utilisateur sélectionne ou crée une option :
   *  - Si c’est une nouvelle ( __isNew__ ), on appelle POST pour la créer
   *  - Sinon, on appelle POST pour incrémenter la fréquence (ou mettre à jour lastUsed)
   */
  const handleChange = async (selectedOption) => {
    if (!selectedOption) {
      onChange(null);
      return;
    }

    try {
      if (selectedOption.__isNew__) {
        // Nouvelle création
        await axios.post('/descriptions', { text: selectedOption.value });
      } else {
        // Description existante : on “met à jour” la freq/lastUsed
        await axios.post('/descriptions', { text: selectedOption.label });
      }

      // Force le rafraîchissement de la liste au besoin
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Erreur lors de l'ajout/mise à jour de la description :", err);
    }

    // On repasse la sélection au parent
    onChange(selectedOption);
  };

  return (
    <div className="relative">
      <AsyncCreatableSelect
        key={refreshKey} // Pour forcer un re-mount quand refreshKey change
        value={value}
        onChange={handleChange}
        loadOptions={loadOptions}
        defaultOptions
        isClearable
        formatOptionLabel={formatOptionLabel}
        placeholder="Rechercher ou ajouter une description..."
        noOptionsMessage={({ inputValue }) =>
          inputValue
            ? "Aucune suggestion correspondante"
            : "Commencez à taper pour rechercher..."
        }
        formatCreateLabel={(inputValue) => (
          <div className="flex items-center gap-2">
            <StarIcon className="w-4 h-4" />
            <span>Créer "{inputValue}"</span>
          </div>
        )}
        styles={customStyles}
        classNames={{
          control: () => 'hover:border-blue-500 transition-colors',
          input: () => 'text-base',
          placeholder: () => 'text-gray-400'
        }}
      />
    </div>
  );
};

export default DescriptionSelect;
