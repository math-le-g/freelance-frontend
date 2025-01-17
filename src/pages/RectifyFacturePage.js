// frontend/src/pages/RectifyFacturePage.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { usePrestation } from '../contexts/PrestationContext'; // Utilisation du hook personnalisé
import { format } from 'date-fns'; // Assurez-vous d'importer format

const RectifyFacturePage = () => {
  const { id } = useParams(); // l'_id de la facture
  const navigate = useNavigate();

  const { fetchPrestations } = usePrestation(); // Utilisation du hook personnalisé

  // États
  const [loading, setLoading] = useState(true);
  const [facture, setFacture] = useState(null);
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState('');
  const [dateFacture, setDateFacture] = useState('');
  const [changesComment, setChangesComment] = useState('');

  // On stocke la liste des "lignes" de prestation dans un state
  // Chaque item : { _id?: string, description, hours, hourlyRate, _deleted?: bool }
  const [lines, setLines] = useState([]);

  // Récupérer la facture existante + la liste clients
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // 1) Récup la facture
        const factureResp = await axios.get(`${process.env.REACT_APP_API_URL}/api/factures/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setFacture(factureResp.data);

        // 2) Récup la liste de clients
        const clientResp = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClients(clientResp.data);

        // 3) Pré-remplir le state
        setClientId(factureResp.data.client?._id || '');
        setDateFacture(format(new Date(), 'yyyy-MM-dd')); // Définit la date à aujourd'hui
        // changesComment peut être vide
        setChangesComment('');

        // On reconstruit un array lines[] à partir de factureResp.data.prestations
        if (factureResp.data.prestations) {
          // On suppose que chaque "Prestation" a _id, description, hours, hourlyRate, total...
          const initialLines = factureResp.data.prestations.map((p) => ({
            _id: p._id,
            description: p.description,
            hours: p.hours,
            hourlyRate: p.hourlyRate,
            date: p.date ? p.date.split('T')[0] : '',
            _deleted: false,
          }));
          setLines(initialLines);
        }

        setLoading(false);
      } catch (error) {
        console.error('Erreur fetch facture:', error);
        toast.error('Impossible de charger la facture');
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Fonctions pour manipuler lines[]
  const handleLineChange = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    setLines(newLines);
  };

  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      {
        description: '',
        hours: 1,
        hourlyRate: 0,
        date: '',
        _deleted: false,
      },
    ]);
  };

  const handleDeleteLine = (index) => {
    // Soit on supprime du state
    //   => si la ligne a un _id, on doit marquer _deleted = true
    const newLines = [...lines];
    if (newLines[index]._id) {
      newLines[index]._deleted = true;
    } else {
      // sinon c'est une nouvelle ligne => on l'enlève carrément
      newLines.splice(index, 1);
    }
    setLines(newLines);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Date de la facture:', dateFacture);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token manquant ou session expirée');
        return;
      }

      const payload = {
        clientId,
        dateFacture, // Format : 'YYYY-MM-DD'
        changesComment,
        prestations: lines,
      };

      console.log('Payload envoyé au backend:', payload); // Pour débogage

      // Appel au backend
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/factures/${id}/rectify`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Facture rectifiée avec succès');

      // Mettre à jour les prestations dans le Context
      await fetchPrestations(); // Re-fetch les prestations

      // On peut rediriger vers la liste des factures ou la page de la facture
      navigate('/mes-factures');
    } catch (error) {
      console.error('Erreur lors de la rectification:', error);
      toast.error('Impossible de rectifier la facture');
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!facture) {
    return <div>Facture introuvable</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Rectifier la Facture N°{facture.invoiceNumber}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Sélection Client */}
        <div>
          <label className="block text-sm font-medium mb-1">Client :</label>
          <select
            className="border p-2 rounded w-full"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">-- Sélectionner --</option>
            {clients.map((cli) => (
              <option key={cli._id} value={cli._id}>
                {cli.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date de la facture */}
        <div>
          <label className="block text-sm font-medium mb-1">Date de la facture :</label>
          <input
            type="date"
            className="border p-2 rounded w-full"
            value={dateFacture}
            onChange={(e) => setDateFacture(e.target.value)}
            required
          />
        </div>

        {/* Motif de modification */}
        <div>
          <label className="block text-sm font-medium mb-1">Commentaire :</label>
          <textarea
            className="border p-2 rounded w-full"
            rows={2}
            placeholder="Raison / commentaire sur la rectification"
            value={changesComment}
            onChange={(e) => setChangesComment(e.target.value)}
          />
        </div>

        {/* Table Prestations */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Prestations</h2>
          <button
            type="button"
            onClick={handleAddLine}
            className="px-3 py-1 bg-blue-500 text-white rounded mb-2"
          >
            Ajouter une prestation
          </button>

          <table className="min-w-full bg-white border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Heures</th>
                <th className="px-4 py-2">Taux Horaire (€)</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => {
                if (line._deleted) {
                  // On masque complètement les lignes supprimées
                  return null;
                }
                return (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        className="border rounded p-1 w-full"
                        value={line.description}
                        onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.1"
                        className="border rounded p-1 w-full"
                        value={line.hours}
                        onChange={(e) => handleLineChange(index, 'hours', parseFloat(e.target.value))}
                        required
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        className="border rounded p-1 w-full"
                        value={line.hourlyRate}
                        onChange={(e) => handleLineChange(index, 'hourlyRate', parseFloat(e.target.value))}
                        required
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="date"
                        className="border rounded p-1 w-full"
                        value={line.date}
                        onChange={(e) => handleLineChange(index, 'date', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteLine(index)}
                        className="px-2 py-1 bg-red-500 text-white rounded"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </div>
  );
};

export default RectifyFacturePage;
