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

const CaAnnuel = () => {
  const [allYearsStats, setAllYearsStats] = useState([]);
  const [currentYearData, setCurrentYearData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [activeChart, setActiveChart] = useState('main'); // 'main' ou 'avoirs'

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

      // Transformer les données pour le graphique
      const formattedData = response.data.map(item => ({
        ...item,
        year: item._id.year,
        // S'assurer que tous les champs sont définis
        totalBrut: item.totalBrut || 0,
        totalNet: item.totalNet || 0,
        totalURSSAF: item.totalURSSAF || 0,
        totalAvoirs: item.totalAvoirs || 0,
        netApresAvoirs: item.netApresAvoirs || item.totalNet || 0,
      }));

      // Trier par année
      const sortedData = formattedData.sort((a, b) => a.year - b.year);
      setAllYearsStats(sortedData);

      // Sélectionner l'année courante
      updateCurrentYearData(sortedData, currentYear);
    } catch (error) {
      console.error('Erreur CA Annuel:', error);
      toast.error('Erreur lors du chargement du CA Annuel');
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour les données pour l'année courante
  const updateCurrentYearData = (data, year) => {
    // Filtrer les données pour l'année actuelle
    const yearData = data.find(d => d.year === year);
    
    if (yearData) {
      // Si on a des données pour cette année, on les affiche
      setCurrentYearData([yearData]);
    } else {
      // Sinon on affiche une année vide
      setCurrentYearData([]);
    }
  };

  useEffect(() => {
    fetchAnnualStats();
  }, []);

  useEffect(() => {
    if (allYearsStats.length > 0) {
      updateCurrentYearData(allYearsStats, currentYear);
    }
  }, [currentYear, allYearsStats]);

  // Fonction pour changer d'année
  const handleYearChange = (change) => {
    const newYear = currentYear + change;
    setCurrentYear(newYear);
  };

  // Calcul pour déterminer s'il y a des avoirs cette année
  const totalAvoirs = currentYearData.reduce((sum, year) => sum + (year.totalAvoirs || 0), 0);
  const hasAvoirs = totalAvoirs > 0;

  // Fonction pour formater les nombres
  const formatMoney = (value) => {
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  };

  if (isLoading) {
    return <div className="text-gray-200">Chargement CA Annuel...</div>;
  }

  // Données de l'année actuelle pour l'affichage détaillé
  const currentData = currentYearData.length > 0 ? currentYearData[0] : null;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-300 to-indigo-400 text-transparent bg-clip-text">
          {activeChart === 'main' ? 'CA Annuel' : 'Avoirs Annuels'}
        </h2>
        <div className="flex items-center space-x-2 text-sm">
          {/* Boutons pour changer d'année */}
          <button 
            onClick={() => handleYearChange(-1)} 
            className="px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-md transition-colors hover:from-blue-600 hover:to-indigo-600"
            aria-label="Année précédente"
          >
            &lt;
          </button>
          <span className="font-medium text-blue-200">{currentYear}</span>
          <button 
            onClick={() => handleYearChange(1)}
            className="px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-md transition-colors hover:from-blue-600 hover:to-indigo-600"
            aria-label="Année suivante"
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
              data={currentYearData}
              margin={{ top: 10, right: 30, bottom: 10, left: 0 }}
              barGap={10} // Espace entre les barres d'un même groupe
              barCategoryGap="25%" // Espace entre les groupes
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="year"
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
              data={currentYearData}
              margin={{ top: 10, right: 30, bottom: 10, left: 0 }}
              barGap={10}
              barCategoryGap="25%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
              <XAxis 
                dataKey="year"
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
      
      {/* Informations détaillées sur l'année sélectionnée en dessous du graphique */}
      {currentData && (
        <div className="w-full bg-white/5 rounded-md p-3 mt-1">
          <h3 className="text-sm font-medium text-blue-200 mb-2">
            Détails pour {currentYear}
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
      
      {currentYearData.length === 0 && (
        <div className="text-center text-gray-400 text-sm mt-4">
          Aucune donnée disponible pour {currentYear}
        </div>
      )}
    </div>
  );
};

export default CaAnnuel;

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
*/