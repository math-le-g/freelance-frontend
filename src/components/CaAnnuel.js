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
} from 'recharts';
import { toast } from 'react-toastify';

const CaAnnuel = () => {
  const [annualStats, setAnnualStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const chartColors = {
    totalBrut: '#c084fc',   // violet
    totalNet: '#34d399',    // Vert
    totalURSSAF: '#fbbf24', // Jaune
  };

  const fetchAnnualStats = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Aucun token, merci de vous reconnecter');
        setIsLoading(false);
        return;
      }
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/dashboard/annual`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnnualStats(response.data || []);
    } catch (error) {
      console.error('Erreur CA Annuel:', error);
      toast.error('Erreur lors du chargement du CA Annuel');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnualStats();
  }, []);

  if (isLoading) {
    return <div className="text-gray-200">Chargement CA Annuel...</div>;
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">CA Annuel</h2>
      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart data={annualStats} margin={{ top: 40, right: 20, bottom: 10, left: 0 }}>
  {/* Pas de <Tooltip /> */}
  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
  <XAxis dataKey="_id.year" stroke="#9ca3af" />
  <YAxis stroke="#9ca3af" />
  <Legend wrapperStyle={{ color: '#9ca3af' }} />

  <Bar
    dataKey="totalBrut"
    fill={chartColors.totalBrut}
    name="Brut (€)"
    animationDuration={800}
    label={{
      position: 'insideTop',
      fill: '#111827',
      fontSize: 12,
      fontWeight: 'bold',
      formatter: (value) => `${value} €`,
    }}
  />
  <Bar
    dataKey="totalNet"
    fill={chartColors.totalNet}
    name="Net (€)"
    animationDuration={800}
    label={{
      position: 'insideTop',
      fill: '#111827',
      fontSize: 12,
      fontWeight: 'bold',
      formatter: (value) => `${value} €`,
    }}
  />
  <Bar
    dataKey="totalURSSAF"
    fill={chartColors.totalURSSAF}
    name="URSSAF (€)"
    animationDuration={800}
    label={{
      position: 'insideTop',
      fill: '#111827',
      fontSize: 12,
      fontWeight: 'bold',
      formatter: (value) => `${value} €`,
    }}
  />
</BarChart>

        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CaAnnuel;
