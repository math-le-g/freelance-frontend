
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaUsers, FaDollarSign, FaPiggyBank } from 'react-icons/fa'; // Import des icônes correspondantes

const Dashboard = () => {
  // États pour stocker les réponses de l'API
  const [totals, setTotals] = useState({ totalBrut: 0, totalNet: 0, totalURSSAF: 0 });
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [annualStats, setAnnualStats] = useState([]);
  const [topClients, setTopClients] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour appeler le backend
  const fetchStatistics = async (year = null) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Aucun token, merci de vous reconnecter');
        return;
      }

      // Préparer les params (ex: ?year=2025)
      const params = {};
      if (year) {
        params.year = year;
      }

      // Appel en parallèle à 4 endpoints
      const [totalsRes, monthlyRes, annualRes, topClientsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/dashboard/totals', {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }),
        axios.get('http://localhost:5000/api/dashboard/monthly', {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }),
        axios.get('http://localhost:5000/api/dashboard/annual', {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }),
        axios.get('http://localhost:5000/api/dashboard/top-clients', {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }),
      ]);

      // Logs pour debug
      console.log('fetchStatistics -> year:', year);
      console.log('Réponse /monthly =>', monthlyRes.data);

      // Mettre à jour les états
      setTotals(totalsRes.data || { totalBrut: 0, totalNet: 0, totalURSSAF: 0 });
      setMonthlyStats(monthlyRes.data || []);
      setAnnualStats(annualRes.data || []);
      setTopClients(topClientsRes.data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setIsLoading(false);
    }
  };

  // Au premier rendu, on charge sans param => ça inclut toutes les factures payées
  useEffect(() => {
    const year = selectedYear ? selectedYear.getFullYear() : null;
    fetchStatistics(year);
  }, [selectedYear]);

  // Lorsque l'utilisateur sélectionne une année, on relance fetchStatistics(year)
  const handleYearChange = (date) => {
    const year = date ? date.getFullYear() : null;
    setSelectedYear(date);
    fetchStatistics(year);
  };

  // Si on est en cours de chargement
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <svg
          className="animate-spin h-8 w-8 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  // Couleurs pour les graphiques (alignées avec les icônes)
  const chartColors = {
    totalBrut: '#4F46E5',   // Indigo-600
    totalNet: '#10B981',    // Emerald-500
    totalURSSAF: '#F59E0B', // Amber-500
  };

  // Couleurs distinctes pour Top 5 Clients
  const clientColors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#A833FF']; // Couleurs vives et distinctes

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      
      <div className="flex items-center space-x-4">
        <label className="text-lg font-medium">Filtrer par Année :</label>
        <DatePicker
          selected={selectedYear}
          onChange={handleYearChange}
          showYearPicker
          dateFormat="yyyy"
          className="border rounded p-2"
        />
      </div>

       
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         
        <div className="bg-white p-6 rounded-lg shadow flex items-center">
          <div className="p-3 bg-indigo-600 rounded-full">
            <FaDollarSign className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-gray-500">Total Brut</p>
            <p className="text-xl font-semibold">{totals.totalBrut.toFixed(2)} €</p>
          </div>
        </div>

        
        <div className="bg-white p-6 rounded-lg shadow flex items-center">
          <div className="p-3 bg-emerald-500 rounded-full">
            <FaPiggyBank className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-gray-500">Total Net</p>
            <p className="text-xl font-semibold">{totals.totalNet.toFixed(2)} €</p>
          </div>
        </div>

        
        <div className="bg-white p-6 rounded-lg shadow flex items-center">
          <div className="p-3 bg-amber-500 rounded-full">
            <FaUsers className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-gray-500">Total URSSAF</p>
            <p className="text-xl font-semibold">{totals.totalURSSAF.toFixed(2)} €</p>
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3 flex items-center">
            <FaDollarSign className="mr-2 text-indigo-600" />
            Chiffre d'Affaires Mensuel
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="_id.month"
                tickFormatter={(month) => {
                  
                  const date = new Date(0, month - 1);
                  return date.toLocaleString('fr-FR', { month: 'short' });
                }}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(label) => {
                  
                  const stat = monthlyStats.find((item) => item._id.month === label);
                  if (stat) {
                    return `${stat._id.month}/${stat._id.year}`;
                  }
                  return label;
                }}
              />
              <Legend />
              <Bar dataKey="totalBrut" fill={chartColors.totalBrut} name="Total Brut (€)" />
              <Bar dataKey="totalNet" fill={chartColors.totalNet} name="Total Net (€)" />
              <Bar dataKey="totalURSSAF" fill={chartColors.totalURSSAF} name="Total URSSAF (€)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3 flex items-center">
            <FaDollarSign className="mr-2 text-indigo-600" />
            Chiffre d'Affaires Annuel
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={annualStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id.year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalBrut" fill={chartColors.totalBrut} name="Total Brut (€)" />
              <Bar dataKey="totalNet" fill={chartColors.totalNet} name="Total Net (€)" />
              <Bar dataKey="totalURSSAF" fill={chartColors.totalURSSAF} name="Total URSSAF (€)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3 flex items-center">
            <FaUsers className="mr-2 text-amber-500" />
            Top 5 Clients
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topClients}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="clientName" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} €`, 'Total Brut']} />
              <Legend />
              
              <Bar dataKey="totalBrut" name="Total Brut (€)">
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
    </div>
  );
};

export default Dashboard;
