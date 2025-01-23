import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import Stepper from '../components/Stepper';

// Renommer l'import pour éviter le conflit de nom
import Step2View from '../components/Step2'; 

const RectifyFacturePage = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();

  // Étape active
  const [currentStep, setCurrentStep] = useState(0);

  // Données facture
  const [facture, setFacture] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Step1
  const [clientId, setClientId] = useState('');
  const [dateFacture, setDateFacture] = useState('');
  const [changesComment, setChangesComment] = useState('');

  // Step2: lignes
  const [lines, setLines] = useState([]);

  // Chargement : fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // 1) Facture
        const factureResp = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/factures/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFacture(factureResp.data);

        // 2) Clients
        const clientResp = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/clients`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setClients(clientResp.data);

        // 3) Pré-remplir
        setClientId(factureResp.data.client?._id || '');
        setDateFacture(format(new Date(), 'yyyy-MM-dd'));
        setChangesComment('');

        // 4) Prestations => reconstruction
        if (factureResp.data.prestations) {
          const initialLines = factureResp.data.prestations.map((p) => ({
            _id: p._id,
            billingType: p.billingType || 'hourly',
            description: p.description || '',
            hours: p.hours || 0,
            hourlyRate: p.hourlyRate || 0,
            fixedPrice: p.fixedPrice || 0,
            quantity: p.quantity || 1,
            duration: p.duration || 0,
            durationUnit: p.durationUnit || 'minutes',
            date: p.date ? p.date.split('T')[0] : '',
            _deleted: false,
          }));
          setLines(initialLines);
        }
      } catch (error) {
        toast.error('Impossible de charger la facture');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Wizard
  const nextStep = () => setCurrentStep((s) => s + 1);
  const prevStep = () => setCurrentStep((s) => s - 1);

  // Step1
  const Step1 = () => (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Étape 1 : Infos générales</h2>

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

      <div>
        <label className="block text-sm font-medium mb-1">
          Date de la facture :
        </label>
        <input
          type="date"
          className="border p-2 rounded w-full"
          value={dateFacture}
          onChange={(e) => setDateFacture(e.target.value)}
          required
        />
      </div>

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

      <div className="flex justify-end">
        <button
          onClick={nextStep}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Continuer
        </button>
      </div>
    </div>
  );

  // Step2 => utilise le composant Step2View importé
  const Step2Wrapper = () => (
    <Step2View
      lines={lines}
      setLines={setLines}
      prevStep={prevStep}
      nextStep={nextStep}
    />
  );

  // Step3
  const Step3 = () => {
    // Petit calcul du total final
    const totalHT = lines
      .filter((l) => !l._deleted)
      .reduce((acc, l) => {
        if (l.billingType === 'hourly') {
          return acc + (l.hours * l.hourlyRate);
        } else if (l.billingType === 'fixed') {
          return acc + (l.fixedPrice * (l.quantity || 1));
        } else if (l.billingType === 'daily') {
          const nbDays = l.duration / (24 * 60);
          return acc + nbDays * l.fixedPrice;
        }
        return acc;
      }, 0);

    const taxeURSSAF = parseFloat((totalHT * 0.232).toFixed(2));
    const net = parseFloat((totalHT - taxeURSSAF).toFixed(2));

    return (
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-semibold">Étape 3 : Récapitulatif</h2>
        <p>Facture N°{facture.invoiceNumber}</p>
        <p>Client : {clientId}</p>
        <p>Date Facture : {dateFacture}</p>
        <p>Commentaire : {changesComment}</p>

        <p>Nombre de prestations : {lines.filter((l) => !l._deleted).length}</p>
        <p>Total HT : {totalHT.toFixed(2)} €</p>
        <p>URSSAF : {taxeURSSAF} €</p>
        <p>Net : {net} €</p>

        <div className="flex justify-between pt-4">
          <button
            onClick={prevStep}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Retour
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Valider la rectification
          </button>
        </div>
      </div>
    );
  };

  // Soumission finale
  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token manquant ou session expirée');
        return;
      }

      const payload = {
        clientId,
        dateFacture,
        changesComment,
        prestations: lines,
      };

      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/factures/${id}/rectify`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Facture rectifiée avec succès');
      navigate('/mes-factures');
    } catch (error) {
      toast.error('Impossible de rectifier la facture');
      console.error(error);
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }
  if (!facture) {
    return <div>Facture introuvable</div>;
  }

  // Rendu conditionnel
  let content;
  if (currentStep === 0) {
    content = <Step1 />;
  } else if (currentStep === 1) {
    content = <Step2Wrapper />;
  } else if (currentStep === 2) {
    content = <Step3 />;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Rectifier la Facture N°{facture.invoiceNumber}
      </h1>

      <Stepper
        steps={['Infos générales', 'Prestations', 'Récap']}
        currentStep={currentStep}
      />

      <div className="bg-white border rounded shadow">
        {content}
      </div>
    </div>
  );
};

export default RectifyFacturePage;

