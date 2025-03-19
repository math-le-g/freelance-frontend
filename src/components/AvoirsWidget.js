import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BanknotesIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const AvoirsWidget = () => {
    const [avoirsData, setAvoirsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalMontant, setTotalMontant] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const fetchAvoirs = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/factures/avoirs`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data && Array.isArray(response.data)) {
                    setAvoirsData(response.data);

                    // Calculer le total des avoirs
                    const total = response.data.reduce((sum, facture) => {
                        if (facture.avoir && facture.avoir.montant) {
                            return sum + facture.avoir.montant;
                        }
                        return sum;
                    }, 0);

                    setTotalMontant(total);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des avoirs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAvoirs();
    }, []);

    if (loading) {
        return (
            <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-md shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold flex items-center">
                        <BanknotesIcon className="h-5 w-5 text-pink-400 mr-2" />
                        Avoirs émis
                    </h3>
                </div>
                <div className="p-4 text-center text-gray-300">
                    Chargement des avoirs...
                </div>
            </div>
        );
    }

    if (avoirsData.length === 0) {
        return (
            <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-md shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold flex items-center">
                        <BanknotesIcon className="h-5 w-5 text-pink-400 mr-2" />
                        Avoirs émis
                    </h3>
                </div>
                <div className="p-4 text-center text-gray-300">
                    Aucun avoir émis
                </div>
            </div>
        );
    }

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
        } catch (e) {
            return 'Date invalide';
        }
    };

    const chartData = avoirsData.map(facture => ({
        date: new Date(facture.avoir.date).getTime(),
        montant: facture.avoir.montant
    })).sort((a, b) => a.date - b.date);

    // N'afficher que les 3 derniers avoirs par défaut
    const displayedAvoirs = isExpanded ? avoirsData : avoirsData.slice(0, 3);

    return (
        <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-md shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                    <BanknotesIcon className="h-5 w-5 text-pink-400 mr-2" />
                    Avoirs émis
                </h3>
                <div className="text-pink-400 font-bold">
                    Total: {totalMontant.toFixed(2)} €
                </div>
            </div>

            <div className="space-y-3">
                {displayedAvoirs.map((facture) => (
                    <div
                        key={facture._id}
                        className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-white">
                                    Avoir n°{facture.avoir.numero}
                                </p>
                                <p className="text-xs text-gray-300">
                                    {formatDate(facture.avoir.date)} • Facture #{facture.invoiceNumber}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-pink-400 font-bold">-{facture.avoir.montant.toFixed(2)} €</p>
                                <p className="text-xs text-gray-300">
                                    {facture.avoir.motif}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {avoirsData.length > 0 && (
                <div className="h-20 mt-3 mb-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <Line
                                type="monotone"
                                dataKey="montant"
                                stroke="#f87171"
                                strokeWidth={2}
                                dot={{ r: 3, fill: "#f87171" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {avoirsData.length > 3 && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-3 w-full py-2 flex items-center justify-center text-sm text-gray-300 hover:text-white border border-white/10 rounded-md hover:bg-white/5 transition-colors"
                >
                    <ArrowDownIcon className={`h-4 w-4 mr-1 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} />
                    {isExpanded ? 'Afficher moins' : `Voir ${avoirsData.length - 3} de plus`}
                </button>
            )}
        </div>
    );
};

export default AvoirsWidget;