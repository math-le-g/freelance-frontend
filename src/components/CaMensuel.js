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

const CaMensuel = () => {
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Palette unifiée
  const chartColors = {
    totalBrut: '#c084fc',   // Violet-300 pastel
    totalNet: '#34d399',    // Vert
    totalURSSAF: '#fbbf24', // Jaune
  };

  const fetchMonthlyStats = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Aucun token, merci de vous reconnecter');
        setIsLoading(false);
        return;
      }
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/dashboard/monthly`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMonthlyStats(response.data || []);
    } catch (error) {
      console.error('Erreur CA Mensuel:', error);
      toast.error('Erreur lors du chargement du CA Mensuel');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyStats();
  }, []);

  if (isLoading) {
    return <div className="text-gray-200">Chargement CA Mensuel...</div>;
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">CA Mensuel</h2>
      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyStats}
            margin={{ top: 40, right: 20, bottom: 10, left: 0 }}
          >


            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="_id.month"
              stroke="#9ca3af"
              tickFormatter={(month) => {
                const date = new Date(0, month - 1);
                return date.toLocaleString('fr-FR', { month: 'short' });
              }}
            />
            <YAxis stroke="#9ca3af" />
            <Legend wrapperStyle={{ color: '#9ca3af' }} />

            <Bar
              dataKey="totalBrut"
              fill={chartColors.totalBrut}
              name="Brut (€)"
              animationDuration={800}
              label={{
                position: 'insideTop',  // ou 'inside', 'insideBottom' etc.
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

export default CaMensuel;

