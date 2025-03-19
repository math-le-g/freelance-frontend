import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  LabelList
} from 'recharts';
import { toast } from 'react-toastify';

const TopClients = () => {
  const [topClients, setTopClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClientIndex, setSelectedClientIndex] = useState(0);

  // Palette de couleurs harmonieuses mais distinctes
  const clientColors = [
    '#8b5cf6', // violet-500
    '#3b82f6', // blue-500
    '#06b6d4', // cyan-500
    '#0ea5e9', // sky-500
    '#10b981', // emerald-500
  ];

  const fetchTopClients = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Aucun token, merci de vous reconnecter');
        setIsLoading(false);
        return;
      }
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/dashboard/top-clients`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Formater les données
      const formattedData = (response.data || []).slice(0, 5).map((client, index) => ({
        ...client,
        clientName: client.clientName,
        totalBrut: client.totalBrut || 0,
        // Format du montant pour l'affichage - avec symbole € sur la même ligne
        displayAmount: `${(client.totalBrut || 0).toLocaleString('fr-FR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })} €`,
        // Assigner une couleur à chaque client
        color: clientColors[index % clientColors.length],
        index
      }));
      
      setTopClients(formattedData);
      
      // Sélectionner le premier client par défaut
      if (formattedData.length > 0) {
        setSelectedClientIndex(0);
      }
    } catch (error) {
      console.error('Erreur top clients:', error);
      toast.error('Erreur lors du chargement des top clients');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopClients();
  }, []);

  // Fonction pour formater les nombres
  const formatMoney = (value) => {
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  };

  // Fonction personnalisée pour le rendu des labels
  const renderCustomizedLabel = (props) => {
    const { x, y, width, value } = props;
    
    return (
      <text 
        x={x + width / 2} 
        y={y - 10} 
        fill="#ffffff" 
        textAnchor="middle" 
        dominantBaseline="middle"
        style={{ fontSize: '11px', fontWeight: 500 }}
      >
        {value}
      </text>
    );
  };

  // Client sélectionné pour l'affichage détaillé
  const selectedClient = topClients[selectedClientIndex];

  if (isLoading) {
    return <div className="text-gray-200">Chargement Top Clients...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-300 to-indigo-400 text-transparent bg-clip-text">
          Top 5 Clients
        </h2>
      </div>
      
      <div className="w-full h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={topClients} 
            margin={{ top: 30, right: 30, bottom: 10, left: 0 }}
            barGap={0}
            barCategoryGap="25%"
            onClick={(data) => {
              if (data && data.activeTooltipIndex !== undefined) {
                setSelectedClientIndex(data.activeTooltipIndex);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="clientName"
              stroke="#9ca3af"
              tick={{ fill: '#e5e7eb', fontSize: 12 }}
              height={30}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#e5e7eb' }}
              tickFormatter={(value) => value.toLocaleString('fr-FR')}
            />
            
            <Bar
              dataKey="totalBrut"
              name="Total Brut (€)"
              radius={[2, 2, 0, 0]}
              barSize={30}
            >
              <LabelList 
                dataKey="displayAmount"
                position="top"
                content={renderCustomizedLabel}
              />
              {topClients.map((client, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={client.color}
                  fillOpacity={selectedClientIndex === index ? 1 : 0.8}
                  stroke={selectedClientIndex === index ? "#fff" : "none"}
                  strokeWidth={selectedClientIndex === index ? 1 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Informations détaillées sur le client sélectionné */}
      {selectedClient && (
        <div className="w-full bg-white/5 rounded-md p-3 mt-1">
          <h3 className="text-sm font-medium text-blue-200 mb-2">
            Détails pour {selectedClient.clientName}
          </h3>
          
          <div className="flex items-center">
            <div 
              className="w-3 h-3 rounded-sm mr-2" 
              style={{ backgroundColor: selectedClient.color }}
            ></div>
            <div className="text-sm">
              <div className="text-gray-400">Total Brut</div>
              <div className="text-white font-medium">{formatMoney(selectedClient.totalBrut)}</div>
            </div>
            <div className="ml-auto text-xs text-gray-400">
              {selectedClientIndex + 1} sur {topClients.length} clients
              <div>{((selectedClient.totalBrut / topClients[0].totalBrut) * 100).toFixed(0)}% du client principal</div>
            </div>
          </div>
        </div>
      )}
      
      {topClients.length === 0 && (
        <div className="text-center text-gray-400 text-sm mt-4">
          Aucun client à afficher
        </div>
      )}
    </div>
  );
};

export default TopClients;



/*
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import { toast } from 'react-toastify';

const TopClients = () => {
  const [topClients, setTopClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pastel palette
  const clientColors = [
    '#fde047', // yellow-300
    '#86efac', // green-200
    '#a5b4fc', // indigo-200
    '#f9a8d4', // pink-200
    '#fcd34d', // yellow-400
    '#fdba74', // orange-300 (au cas où >5)
    '#67e8f9', // cyan-200
  ];

  const fetchTopClients = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Aucun token, merci de vous reconnecter');
        setIsLoading(false);
        return;
      }
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/dashboard/top-clients`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTopClients(response.data || []);
    } catch (error) {
      console.error('Erreur top clients:', error);
      toast.error('Erreur lors du chargement des top clients');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopClients();
  }, []);

  if (isLoading) {
    return <div className="text-gray-200">Chargement Top Clients...</div>;
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">Top 5 Clients</h2>
      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart data={topClients} margin={{ top: 40, right: 20, bottom: 10, left: 0 }}>
  
  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
  <XAxis dataKey="clientName" stroke="#9ca3af" />
  <YAxis stroke="#9ca3af" />
  <Legend wrapperStyle={{ color: '#9ca3af' }} />

  <Bar
    dataKey="totalBrut"
    name="Total Brut (€)"
    animationDuration={800}
    label={{
      position: 'insideTop',
      fill: '#111827',
      fontSize: 12,
      fontWeight: 'bold',
      formatter: (value) => `${value} €`,
    }}
  >
    {topClients.map((client, index) => (
      <Cell
        key={`cell-${index}`}
        fill={clientColors[index % clientColors.length]}
      />
    ))}
  </Bar>
</BarChart>

        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopClients;
*/
