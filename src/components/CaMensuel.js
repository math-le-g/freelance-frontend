import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts';
import { toast } from 'react-toastify';
import chartColors from '../utils/chartColors';

const CaMensuel = () => {
  const [allMonthlyStats, setAllMonthlyStats] = useState([]);
  const [currentMonthData, setCurrentMonthData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [activeChart, setActiveChart] = useState('main'); // 'main' ou 'avoirs'
  
  // Récupérer les données de toutes les années
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Aucun token, merci de vous reconnecter');
        setIsLoading(false);
        return;
      }
      
      // Récupérer les données pour l'année en cours et l'année précédente pour avoir assez de mois
      const currentYearResp = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/dashboard/monthly`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          params: { year: currentYear } 
        }
      );
      
      const prevYearResp = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/dashboard/monthly`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          params: { year: currentYear - 1 } 
        }
      );
      
      const nextYearResp = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/dashboard/monthly`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          params: { year: currentYear + 1 } 
        }
      );
      
      // Combiner et formater toutes les données
      const combinedData = [
        ...prevYearResp.data.map(formatMonthData),
        ...currentYearResp.data.map(formatMonthData),
        ...nextYearResp.data.map(formatMonthData)
      ];
      
      // Trier par année et mois
      const sortedData = combinedData.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.monthIndex - b.monthIndex;
      });
      
      setAllMonthlyStats(sortedData);
      
      // Sélectionner le mois actuel
      updateCurrentMonthData(sortedData, currentYear, currentMonth);
    } catch (error) {
      console.error('Erreur CA Mensuel:', error);
      toast.error('Erreur lors du chargement du CA Mensuel');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Formater les données mensuelles
  const formatMonthData = (item) => {
    const monthDate = new Date(0, item._id.month - 1);
    const monthName = monthDate.toLocaleString('fr-FR', { month: 'short' });
    
    return {
      ...item,
      year: item._id.year,
      month: monthName,
      monthIndex: item._id.month,
      totalBrut: item.totalBrut || 0,
      totalNet: item.totalNet || 0,
      totalURSSAF: item.totalURSSAF || 0,
      totalAvoirs: item.totalAvoirs || 0,
      netApresAvoirs: item.netApresAvoirs || item.totalNet || 0,
    };
  };
  
  // Mettre à jour les données pour le mois courant
  const updateCurrentMonthData = (data, year, month) => {
    // Filtrer les données pour le mois actuel
    const monthData = data.find(
      d => d.year === year && d.monthIndex === month
    );
    
    if (monthData) {
      // Si on a des données pour ce mois, on les affiche
      setCurrentMonthData([monthData]);
    } else {
      // Sinon on affiche un mois vide
      setCurrentMonthData([]);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);
  
  useEffect(() => {
    if (allMonthlyStats.length > 0) {
      updateCurrentMonthData(allMonthlyStats, currentYear, currentMonth);
    }
  }, [currentYear, currentMonth, allMonthlyStats]);

  // Fonction pour changer de mois
  const handleMonthChange = (change) => {
    let newMonth = currentMonth + change;
    let newYear = currentYear;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  // Obtenir le nom du mois actuel
  const getCurrentMonthName = () => {
    const date = new Date(currentYear, currentMonth - 1);
    return date.toLocaleString('fr-FR', { month: 'long' });
  };

  // Calcul pour déterminer s'il y a des avoirs ce mois-ci
  const totalAvoirs = currentMonthData.reduce((sum, month) => sum + (month.totalAvoirs || 0), 0);
  const hasAvoirs = totalAvoirs > 0;

  // Fonction pour formater les nombres
  const formatMoney = (value) => {
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  };

  if (isLoading) {
    return <div className="text-gray-200">Chargement CA Mensuel...</div>;
  }

  // Données du mois actuel pour l'affichage détaillé
  const currentData = currentMonthData.length > 0 ? currentMonthData[0] : null;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-300 to-indigo-400 text-transparent bg-clip-text">
          {activeChart === 'main' ? 'CA Mensuel' : 'Avoirs Mensuels'}
        </h2>
        <div className="flex items-center space-x-2 text-sm">
          {/* Boutons pour changer de mois */}
          <button 
            onClick={() => handleMonthChange(-1)} 
            className="px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-md transition-colors hover:from-blue-600 hover:to-indigo-600"
            aria-label="Mois précédent"
          >
            &lt;
          </button>
          <span className="font-medium text-blue-200">
            {getCurrentMonthName()} {currentYear}
          </span>
          <button 
            onClick={() => handleMonthChange(1)}
            className="px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-md transition-colors hover:from-blue-600 hover:to-indigo-600"
            aria-label="Mois suivant"
          >
            &gt;
          </button>
        </div>
      </div>
      
      {/* Contrôles pour basculer entre les graphiques */}
      {hasAvoirs && (
        <div className="flex justify-center items-center space-x-1 mb-2">
          <button
            onClick={() => setActiveChart('main')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeChart === 'main'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-gray-200'
            }`}
          >
            CA Principal
          </button>
          <button
            onClick={() => setActiveChart('avoirs')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeChart === 'avoirs'
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-gray-200'
            }`}
          >
            Avoirs
          </button>
        </div>
      )}
      
      {/* Conteneur des graphiques avec effet de défilement */}
      <div className="relative w-full h-48 overflow-hidden">
        {/* Graphique principal : Brut, Net, URSSAF */}
        <div 
          className={`absolute top-0 w-full h-full transition-transform duration-500 ease-in-out ${
            activeChart === 'main' ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={currentMonthData}
              margin={{ top: 10, right: 30, bottom: 10, left: 0 }}
              barGap={10} // Espace entre les barres d'un même groupe
              barCategoryGap="25%" // Espace entre les groupes
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="month"
                stroke="#9ca3af"
                tick={{ fill: '#e5e7eb' }}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#e5e7eb' }}
                tickFormatter={(value) => value.toLocaleString('fr-FR')}
              />
              
              <Bar
                dataKey="totalBrut"
                name="Brut (€)"
                fill={chartColors.totalBrut}
                radius={[2, 2, 0, 0]}
                barSize={20} // Largeur fixe des barres
              />
              <Bar
                dataKey="totalNet"
                name="Net (€)"
                fill={chartColors.totalNet}
                radius={[2, 2, 0, 0]}
                barSize={20}
              />
              <Bar
                dataKey="totalURSSAF"
                name="URSSAF (€)"
                fill={chartColors.totalURSSAF}
                radius={[2, 2, 0, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Graphique des avoirs */}
        <div 
          className={`absolute top-0 w-full h-full transition-transform duration-500 ease-in-out ${
            activeChart === 'avoirs' ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={currentMonthData}
              margin={{ top: 10, right: 30, bottom: 10, left: 0 }}
              barGap={10}
              barCategoryGap="25%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
              <XAxis 
                dataKey="month"
                stroke="#9ca3af"
                tick={{ fill: '#e5e7eb' }}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#e5e7eb' }}
                tickFormatter={(value) => value.toLocaleString('fr-FR')}
              />
              
              <Bar
                dataKey="totalAvoirs"
                name="Avoirs (€)"
                fill={chartColors.totalAvoirs}
                radius={[2, 2, 0, 0]}
                barSize={20}
              />
              <Bar
                dataKey="netApresAvoirs"
                name="Net après avoirs (€)"
                fill={chartColors.netApresAvoirs}
                radius={[2, 2, 0, 0]}
                barSize={20}
              />
              <ReferenceLine y={0} stroke="#666" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Informations détaillées sur le mois sélectionné en dessous du graphique */}
      {currentData && (
        <div className="w-full bg-white/5 rounded-md p-3 mt-1">
          <h3 className="text-sm font-medium text-blue-200 mb-2">
            Détails pour {getCurrentMonthName()} {currentYear}
          </h3>
          
          {activeChart === 'main' ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-sm mr-2" 
                  style={{ backgroundColor: chartColors.totalBrut }}
                ></div>
                <div className="text-sm">
                  <div className="text-gray-400">Brut</div>
                  <div className="text-white font-medium">{formatMoney(currentData.totalBrut)}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-sm mr-2" 
                  style={{ backgroundColor: chartColors.totalNet }}
                ></div>
                <div className="text-sm">
                  <div className="text-gray-400">Net</div>
                  <div className="text-white font-medium">{formatMoney(currentData.totalNet)}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-sm mr-2" 
                  style={{ backgroundColor: chartColors.totalURSSAF }}
                ></div>
                <div className="text-sm">
                  <div className="text-gray-400">URSSAF</div>
                  <div className="text-white font-medium">{formatMoney(currentData.totalURSSAF)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-sm mr-2" 
                  style={{ backgroundColor: chartColors.totalAvoirs }}
                ></div>
                <div className="text-sm">
                  <div className="text-gray-400">Avoirs</div>
                  <div className="text-white font-medium">{formatMoney(currentData.totalAvoirs)}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-sm mr-2" 
                  style={{ backgroundColor: chartColors.netApresAvoirs }}
                ></div>
                <div className="text-sm">
                  <div className="text-gray-400">Net après avoirs</div>
                  <div className="text-white font-medium">{formatMoney(currentData.netApresAvoirs)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {currentMonthData.length === 0 && (
        <div className="text-center text-gray-400 text-sm mt-4">
          Aucune donnée disponible pour {getCurrentMonthName()} {currentYear}
        </div>
      )}
    </div>
  );
};

export default CaMensuel;


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
  Tooltip,
} from 'recharts';
import { toast } from 'react-toastify';
import chartColors from '../utils/chartColors';

const CaMensuel = () => {
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const fetchMonthlyStats = async (year = currentYear) => {
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
        { 
          headers: { Authorization: `Bearer ${token}` },
          params: { year } 
        }
      );
      
      // Transformer les données pour le graphique
      const formattedData = response.data.map(item => {
        const monthDate = new Date(0, item._id.month - 1);
        const monthName = monthDate.toLocaleString('fr-FR', { month: 'short' });
        
        return {
          ...item,
          month: monthName,
          // S'assurer que tous les champs sont définis
          totalBrut: item.totalBrut || 0,
          totalNet: item.totalNet || 0,
          totalURSSAF: item.totalURSSAF || 0,
          totalAvoirs: item.totalAvoirs || 0,
          netApresAvoirs: item.netApresAvoirs || item.totalNet || 0,
        };
      });
      
      setMonthlyStats(formattedData);
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

  // Fonction pour changer l'année
  const handleYearChange = (change) => {
    const newYear = currentYear + change;
    setCurrentYear(newYear);
    fetchMonthlyStats(newYear);
  };

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 rounded shadow-lg text-white text-xs">
          <p className="text-sm font-bold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)} €
            </p>
          ))}
          {payload.find(p => p.name === "Avoirs (€)") && (
            <div className="border-t border-gray-600 mt-2 pt-2">
              <p className="font-bold text-blue-300">
                Net après avoirs: {payload.find(p => p.dataKey === "netApresAvoirs").value.toFixed(2)} €
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return <div className="text-gray-200">Chargement CA Mensuel...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">CA Mensuel</h2>
        <div className="flex items-center space-x-2 text-sm">
          <button 
            onClick={() => handleYearChange(-1)} 
            className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors"
          >
            &lt;
          </button>
          <span className="font-medium">{currentYear}</span>
          <button 
            onClick={() => handleYearChange(1)}
            className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors"
          >
            &gt;
          </button>
        </div>
      </div>
      
      <div className="w-full h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyStats}
            margin={{ top: 10, right: 30, bottom: 10, left: 0 }}
            barGap={0}
            barCategoryGap="10%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="month"
              stroke="#9ca3af"
              tick={{ fill: '#e5e7eb' }}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#e5e7eb' }}
              tickFormatter={(value) => value.toLocaleString('fr-FR')}
            />
            <Tooltip content={customTooltip} />
            <Legend 
              wrapperStyle={{ color: '#e5e7eb' }}
              formatter={(value) => <span style={{ color: '#e5e7eb' }}>{value}</span>}
            />
            
            <Bar
              dataKey="totalBrut"
              name="Brut (€)"
              fill={chartColors.totalBrut}
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="totalNet"
              name="Net (€)"
              fill={chartColors.totalNet}
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="totalURSSAF"
              name="URSSAF (€)"
              fill={chartColors.totalURSSAF}
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="totalAvoirs"
              name="Avoirs (€)"
              fill={chartColors.totalAvoirs}
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="netApresAvoirs"
              name="Net après avoirs (€)"
              fill={chartColors.netApresAvoirs}
              radius={[2, 2, 0, 0]}
              // On cache cette barre mais on l'utilise pour le tooltip
              fillOpacity={0}
              stroke={chartColors.netApresAvoirs}
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {monthlyStats.length === 0 && (
        <div className="text-center text-gray-400 text-sm">
          Aucune donnée disponible pour {currentYear}
        </div>
      )}
    </div>
  );
};

export default CaMensuel;
*/