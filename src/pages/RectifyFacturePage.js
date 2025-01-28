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

  // Étape 1 : infos générales
  const [clientId, setClientId] = useState('');
  const [dateFacture, setDateFacture] = useState('');
  const [changesComment, setChangesComment] = useState('');

  // Prestations
  const [lines, setLines] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Token manquant ou session expirée');
          setLoading(false);
          return;
        }

        // 1) Charger la facture
        const factureResp = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/factures/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const fetchedFacture = factureResp.data;
        setFacture(fetchedFacture);

        // 2) Charger les clients
        const clientResp = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/clients`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setClients(clientResp.data);

        // Pré-remplir l'étape 1
        setClientId(fetchedFacture.client?._id || '');
        // On met par défaut la date du jour (ou la dateFacture d'origine, à vous de choisir)
        setDateFacture(format(new Date(), 'yyyy-MM-dd'));
        setChangesComment('');

        // 3) Construire les lines à partir des prestations
        if (fetchedFacture.prestations) {
          const initialLines = fetchedFacture.prestations.map((p) => {
            // Reconvertir p.duration, p.durationUnit, etc.
            if (p.billingType === 'hourly') {
              const totalMin = p.duration || 0;
              const hh = Math.floor(totalMin / 60);
              const mm = totalMin % 60;
              return {
                _id: p._id,
                billingType: 'hourly',
                description: p.description,
                date: p.date ? p.date.split('T')[0] : '',
                hourlyRate: p.hourlyRate ?? 0,
                duration: totalMin,
                durationUnit: p.durationUnit || 'hours',
                hours: hh,
                minutes: mm,
                _deleted: false,
              };
            } else {
              // "fixed"
              // Note: si c'est 'daily' coté base, vous voulez le convertir en "fixed" + 'days'
              let actualUnit = p.durationUnit || 'minutes';
              let dd = 0;
              let hh = 0;
              let mm = 0;

              if (actualUnit === 'days') {
                dd = (p.duration ?? 1440) / 1440; // ex 720 => 0.5
              } else if (actualUnit === 'hours') {
                const tot = p.duration || 0;
                hh = Math.floor(tot / 60);
                mm = tot % 60;
              } else {
                // minutes direct
                // on laisse p.duration tel quel
              }

              return {
                _id: p._id,
                billingType: 'fixed',
                description: p.description,
                date: p.date ? p.date.split('T')[0] : '',
                fixedPrice: p.fixedPrice ?? 0,
                quantity: p.quantity ?? 1,
                duration: p.duration ?? 0,
                durationUnit: actualUnit,
                days: dd,
                hours: hh,
                minutes: mm,
                _deleted: false,
              };
            }
          });
          setLines(initialLines);
        }
      } catch (error) {
        console.error(error);
        toast.error('Impossible de charger la facture');
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
        <label className="block text-sm font-medium mb-1">Date de la facture :</label>
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
    <Step2View lines={lines} setLines={setLines} prevStep={prevStep} nextStep={nextStep} />
  );

  const Step3 = () => {
    // Petit calcul du total
    const calculateLineTotal = (line) => {
      if (line.billingType === 'hourly') {
        return (line.duration / 60) * (line.hourlyRate ?? 0);
      } else if (line.billingType === 'fixed') {
        return (line.fixedPrice ?? 0) * (line.quantity ?? 1);
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
        {facture && <p>Facture N°{facture.invoiceNumber}</p>}
        <p>Client : {clients.find((c) => c._id === clientId)?.name || 'Inconnu'}</p>
        <p>Date Facture : {dateFacture}</p>
        <p>Commentaire : {changesComment}</p>

        <p>Nombre de prestations : {lines.filter((l) => !l._deleted).length}</p>
        <p>Total HT : {totalHT.toFixed(2)} €</p>
        <p>URSSAF : {taxeURSSAF} €</p>
        <p>Net : {net.toFixed(2)} €</p>

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

      // On envoie toutes les lines, y compris celles marquées _deleted, afin que le backend sache
      // lesquelles supprimer, lesquelles créer, etc.
      const prestationsForAPI = lines.map((line) => {
        // Convertir hours+minutes => duration (minutes) si horaire
        let finalDuration = line.duration ?? 0;
        let finalUnit = line.durationUnit ?? 'minutes';

        if (line.billingType === 'hourly') {
          const h = parseInt(line.hours ?? 0, 10);
          const m = parseInt(line.minutes ?? 0, 10);
          finalDuration = h * 60 + m;
          finalUnit = 'hours';
        } else if (line.billingType === 'fixed') {
          // si 'days'
          if (line.durationUnit === 'days') {
            finalDuration = (line.days ?? 1) * 1440; // ex 0.5 => 720
            finalUnit = 'days';
          } else if (line.durationUnit === 'hours') {
            const h = parseInt(line.hours ?? 0, 10);
            const m = parseInt(line.minutes ?? 0, 10);
            finalDuration = h * 60 + m;
            finalUnit = 'hours';
          } else {
            // 'minutes'
            finalDuration = parseInt(line.duration ?? 0, 10);
            finalUnit = 'minutes';
          }
        }

        return {
          _id: line._id, // s'il n'y en a pas, le backend créera
          _deleted: !!line._deleted,
          billingType: line.billingType,
          description: line.description || '',
          fixedPrice: parseFloat(line.fixedPrice ?? 0),
          quantity: parseInt(line.quantity ?? 1, 10),
          hourlyRate: parseFloat(line.hourlyRate ?? 0),
          duration: finalDuration,
          durationUnit: finalUnit,
          date: line.date ?? new Date().toISOString(),
        };
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
      console.error(error);
      toast.error('Impossible de rectifier la facture');
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (!facture) return <div>Facture introuvable</div>;

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

      <Stepper steps={['Infos générales', 'Prestations', 'Récapitulatif']} currentStep={currentStep} />

      <div className="bg-white border rounded shadow">
        {content}
      </div>
    </div>
  );
};

export default RectifyFacturePage;

