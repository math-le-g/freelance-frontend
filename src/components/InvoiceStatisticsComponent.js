import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const InvoiceStatisticsComponent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    byStatus: [],
    byType: []
  });

  // Couleurs pour les statuts
  const STATUS_COLORS = {
    paid: '#10b981',      // Vert
    unpaid: '#f59e0b',    // Jaune/orange
    overdue: '#ef4444',   // Rouge
    cancelled: '#6b7280'  // Gris
  };

  // Couleurs pour les types
  const TYPE_COLORS = {
    normal: '#60a5fa',         // Bleu
    rectification: '#8b5cf6',  // Violet
    rectifiee: '#fbbf24',      // Jaune
    avoir: '#f43f5e'           // Rose/rouge
  };

  const fetchInvoiceStats = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/factures/statistics`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Traiter et organiser les données pour les graphiques
      const { byStatus, byType } = response.data;
      
      // Transformer les données pour le graphique de statut
      const statusData = Object.entries(byStatus).map(([status, data]) => ({
        name: getStatusLabel(status),
        value: data.count,
        amount: data.total,
        status
      }));
      
      // Transformer les données pour le graphique de type
      const typeData = Object.entries(byType).map(([type, data]) => ({
        name: getTypeLabel(type),
        value: data.count,
        amount: data.total,
        type
      }));
      
      setStats({
        byStatus: statusData,
        byType: typeData
      });
      
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      toast.error('Erreur lors du chargement des statistiques des factures');
    } finally {
      setIsLoading(false);
    }
  };

  // Labels lisibles
  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid': return 'Payées';
      case 'unpaid': return 'En attente';
      case 'overdue': return 'En retard';
      case 'cancelled': return 'Annulées';
      default: return status;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'normal': return 'Standards';
      case 'rectification': return 'Rectificatives';
      case 'rectifiee': return 'Rectifiées';
      case 'avoir': return 'Avoirs';
      default: return type;
    }
  };

  useEffect(() => {
    fetchInvoiceStats();
  }, []);

  // Format pour les montants
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg">
          <p className="font-semibold">{payload[0].name}</p>
          <p>Nombre: {payload[0].payload.value}</p>
          <p>Montant: {formatAmount(payload[0].payload.amount)}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return <div className="text-gray-200">Chargement des statistiques...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Statistiques des Factures</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Graphique par statut */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">Par Statut</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.byStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {stats.byStatus.map((entry, index) => (
                    <Cell 
                      key={`cell-status-${index}`} 
                      fill={STATUS_COLORS[entry.status] || '#94a3b8'} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Graphique par type */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">Par Type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.byType}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {stats.byType.map((entry, index) => (
                    <Cell 
                      key={`cell-type-${index}`} 
                      fill={TYPE_COLORS[entry.type] || '#94a3b8'} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceStatisticsComponent;