import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import Stepper from '../components/Stepper';
import Step2View from '../components/Step2';

const RectifyFacturePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [facture, setFacture] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState('');
  const [dateFacture, setDateFacture] = useState('');
  const [changesComment, setChangesComment] = useState('');
  const [lines, setLines] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const factureResp = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/factures/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFacture(factureResp.data);

        const clientResp = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/clients`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setClients(clientResp.data);

        setClientId(factureResp.data.client?._id || '');
        setDateFacture(format(new Date(), 'yyyy-MM-dd'));
        setChangesComment('');

        if (factureResp.data.prestations) {
          const initialLines = factureResp.data.prestations.map((p) => {
            // Pour facturation journalière
            if (p.billingType === 'daily') {
              return {
                _id: p._id,
                billingType: 'daily',
                description: p.description || '',
                days: p.duration / 1440,
                fixedPrice: p.fixedPrice || 0,
                duration: p.duration / 1440,
                durationUnit: 'days',
                date: p.date ? p.date.split('T')[0] : '',
                _deleted: false,
              };
            }

            // Pour facturation horaire
            if (p.billingType === 'hourly') {
              const hours = Math.floor(p.hours);
              const minutes = Math.round((p.hours - hours) * 60);
              return {
                _id: p._id,
                billingType: 'hourly',
                description: p.description || '',
                hours: hours,
                minutes: minutes,
                hourlyRate: p.hourlyRate || 0,
                duration: p.hours * 60,
                durationUnit: 'hours',
                date: p.date ? p.date.split('T')[0] : '',
                _deleted: false,
              };
            }

            // Pour facturation forfaitaire
            return {
              _id: p._id,
              billingType: 'fixed',
              description: p.description || '',
              fixedPrice: p.fixedPrice || 0,
              quantity: p.quantity || 1,
              duration: p.duration || 0,
              durationUnit: 'hours', // Changé de 'minutes' à 'hours'
              hours: Math.floor(p.duration / 60), // Ajouté
              minutes: p.duration % 60, // Ajouté
              date: p.date ? p.date.split('T')[0] : '',
              _deleted: false,
            };
          });
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

  const nextStep = () => setCurrentStep((s) => s + 1);
  const prevStep = () => setCurrentStep((s) => s - 1);

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

  const Step2Wrapper = () => (
    <Step2View
      lines={lines}
      setLines={setLines}
      prevStep={prevStep}
      nextStep={nextStep}
    />
  );

  const Step3 = () => {
    const calculateLineTotal = (line) => {
      if (line.billingType === 'hourly') {
        return (line.duration / 60) * line.hourlyRate;
      } else if (line.billingType === 'fixed') {
        return line.fixedPrice * (line.quantity || 1);
      } else if (line.billingType === 'daily') {
        return line.duration * line.fixedPrice; // duration est déjà en jours
      }
      return 0;
    };

    const totalHT = lines
      .filter((l) => !l._deleted)
      .reduce((acc, l) => acc + calculateLineTotal(l), 0);

    const taxeURSSAF = parseFloat((totalHT * 0.232).toFixed(2));
    const net = parseFloat((totalHT - taxeURSSAF).toFixed(2));

    return (
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-semibold">Étape 3 : Récapitulatif</h2>
        <p>Facture N°{facture.invoiceNumber}</p>
        <p>Client : {clients.find(c => c._id === clientId)?.name || 'Inconnu'}</p>
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

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token manquant ou session expirée');
        return;
      }

      // Convertir les durées pour l'API
      const prestationsForAPI = lines
        .filter(line => !line._id.startsWith('temp-'))
        .map(line => {
          if (line.billingType === 'daily') {
            return {
              ...line,
              duration: line.duration * 1440,
            };
          }
          return line;
        });

      const payload = {
        clientId,
        dateFacture,
        changesComment,
        prestations: prestationsForAPI,
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
        steps={['Infos générales', 'Prestations', 'Récapitulatif']}
        currentStep={currentStep}
      />

      <div className="bg-white border rounded shadow">
        {content}
      </div>
    </div>
  );
};

export default RectifyFacturePage;



