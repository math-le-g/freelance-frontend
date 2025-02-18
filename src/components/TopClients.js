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
  {/* Pas de <Tooltip /> */}
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

