import React, { useState, useMemo } from 'react';
import { Sale, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { analyzeSalesData } from '../services/geminiService';
import { SparklesIcon, DollarIcon, CheckCircleIcon, ClockIcon } from './icons';

interface DashboardProps {
  stats: {
    totalVendas: number;
    totalComissao: number;
    comissaoPaga: number;
    comissaoPendente: number;
  };
  salesData: Sale[];
  user: User | null;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

type ChartView = 'construtora' | 'mes' | 'corretor';

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center space-x-4 transition-transform transform hover:scale-105">
        <div className={`rounded-full p-3 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ stats, salesData, user }) => {
    const [analysis, setAnalysis] = useState('');
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
    const [chartView, setChartView] = useState<ChartView>('construtora');

    const handleAnalyze = async () => {
        setIsLoadingAnalysis(true);
        setAnalysis('');
        try {
            const result = await analyzeSalesData(salesData);
            setAnalysis(result);
        } catch (error) {
            console.error("Error analyzing sales data:", error);
            setAnalysis('Ocorreu um erro ao analisar os dados. Tente novamente.');
        } finally {
            setIsLoadingAnalysis(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const chartDataByConstrutora = useMemo(() => salesData.reduce((acc, sale) => {
        const existing = acc.find(item => item.name === sale.construtora);
        if (existing) {
            existing.vendas += sale.valorTotalVenda;
        } else {
            acc.push({ name: sale.construtora, vendas: sale.valorTotalVenda });
        }
        return acc;
    }, [] as { name: string; vendas: number }[]), [salesData]);
    
    const chartDataByMes = useMemo(() => {
        const salesByMonth = salesData.reduce((acc, sale) => {
            const month = new Date(sale.dataVenda).toLocaleString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }).replace('. de', '');
            const saleDate = new Date(sale.dataVenda.substring(0, 7) + '-01');

            if (!acc[month]) {
                acc[month] = { name: month, vendas: 0, date: saleDate };
            }
            acc[month].vendas += sale.valorTotalVenda;
            return acc;
        }, {} as { [key: string]: { name: string; vendas: number, date: Date } });

        // FIX: Explicitly cast the result of Object.values to ensure proper type inference in the sort method.
        return (Object.values(salesByMonth) as { date: Date }[]).sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [salesData]);


    const chartDataByCorretor = useMemo(() => salesData.reduce((acc, sale) => {
        const existing = acc.find(item => item.name === sale.corretor);
        if (existing) {
            existing.vendas += sale.valorTotalVenda;
        } else {
            acc.push({ name: sale.corretor, vendas: sale.valorTotalVenda });
        }
        return acc;
    }, [] as { name: string; vendas: number }[]), [salesData]);

    const chartData = useMemo(() => {
        switch (chartView) {
            case 'mes': return chartDataByMes;
            case 'corretor': return chartDataByCorretor;
            default: return chartDataByConstrutora;
        }
    }, [chartView, chartDataByConstrutora, chartDataByMes, chartDataByCorretor]);
    
    const chartTitles: Record<ChartView, string> = {
        construtora: 'Vendas por Construtora',
        mes: 'Vendas por Mês',
        corretor: 'Vendas por Corretor'
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];
    
    const availableViews: ChartView[] = useMemo(() => {
        const views: ChartView[] = ['construtora', 'mes'];
        if (user?.role !== 'corretor') {
            views.push('corretor');
        }
        return views;
    }, [user]);

    const ChartViewSelector = () => (
        <div className="flex justify-center sm:justify-start mb-4">
            <div className="flex p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
                {availableViews.map((view) => (
                    <button
                        key={view}
                        onClick={() => setChartView(view)}
                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                            chartView === view
                                ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        {view.charAt(0).toUpperCase() + view.slice(1)}
                    </button>
                ))}
            </div>
        </div>
    );

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Valor Total de Vendas" value={formatCurrency(stats.totalVendas)} icon={<DollarIcon />} color="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400" />
            <StatCard title="Comissão Total" value={formatCurrency(stats.totalComissao)} icon={<DollarIcon />} color="bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400" />
            <StatCard title="Comissão Paga" value={formatCurrency(stats.comissaoPaga)} icon={<CheckCircleIcon />} color="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400" />
            <StatCard title="Comissão Pendente" value={formatCurrency(stats.comissaoPendente)} icon={<ClockIcon />} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">{chartTitles[chartView]}</h3>
                <ChartViewSelector />
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                        <XAxis dataKey="name" stroke="#6b7280"/>
                        <YAxis tickFormatter={formatCurrency} stroke="#6b7280"/>
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }} labelStyle={{color: '#f3f4f6'}} formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="vendas" name="Total de Vendas">
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col">
                 <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Análise Inteligente</h3>
                 <button 
                    onClick={handleAnalyze} 
                    disabled={isLoadingAnalysis}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:bg-indigo-400 disabled:cursor-not-allowed">
                     <SparklesIcon />
                     {isLoadingAnalysis ? 'Analisando...' : 'Analisar com Gemini'}
                 </button>
                 {analysis && (
                    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap flex-grow">
                        {analysis}
                    </div>
                 )}
            </div>
        </div>
    </div>
  );
};

export default Dashboard;