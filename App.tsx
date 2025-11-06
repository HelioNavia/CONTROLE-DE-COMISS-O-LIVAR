import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Sale, User } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import SalesTable from './components/SalesTable';
import SaleFormModal from './components/SaleFormModal';
import ChatWidget from './components/ChatWidget';
import Login from './components/Login';
import { useAuth } from './auth/useAuth';
import { PlusIcon, DownloadIcon, DocumentReportIcon, SaveIcon, ShareIcon } from './components/icons';

declare const jspdf: any;

const initialSales: Sale[] = [
    { id: '1', cliente: 'João Silva', telefone: '(11) 98765-4321', corretor: 'Ana Costa', construtora: 'Construtora A', empreendimento: 'Residencial Sol', bloco: 'A', unidade: '101', dataVenda: '2023-10-15', valorTotalVenda: 500000, porcentagemComissaoTotal: 5, porcentagemComissaoVendedor: 35, valorComissaoPaga: 8750, statusPagamento: 'Pago', statusRepasse: 'Liberado' },
    { id: '2', cliente: 'Maria Oliveira', telefone: '(21) 91234-5678', corretor: 'Bruno Lima', construtora: 'Construtora B', empreendimento: 'Vista do Mar', bloco: 'C', unidade: '305', dataVenda: '2023-11-20', valorTotalVenda: 750000, porcentagemComissaoTotal: 4.5, porcentagemComissaoVendedor: 35, valorComissaoPaga: 5000, statusPagamento: 'Pago Parcialmente', statusRepasse: 'NFS-e pendenciada' },
    { id: '3', cliente: 'Carlos Pereira', telefone: '(31) 99999-8888', corretor: 'Ana Costa', construtora: 'Construtora A', empreendimento: 'Parque das Flores', bloco: 'B', unidade: '202', dataVenda: '2024-01-05', valorTotalVenda: 620000, porcentagemComissaoTotal: 5, porcentagemComissaoVendedor: 35, valorComissaoPaga: 0, statusPagamento: 'Pendente', statusRepasse: 'NFS-e aprovada' },
];

const App: React.FC = () => {
  const { user, login, logout, register } = useAuth();
  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const savedSales = localStorage.getItem('salesData');
      return savedSales ? JSON.parse(savedSales) : initialSales;
    } catch (error) {
      console.error("Failed to load sales data from localStorage", error);
      return initialSales;
    }
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const handleThemeToggle = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    try {
      localStorage.setItem('salesData', JSON.stringify(sales));
    } catch (error) {
      console.error("Failed to save sales data to localStorage", error);
    }
  }, [sales]);
  
  const userCan = useCallback((action: 'add' | 'edit' | 'delete', user: User | null) => {
    if (!user) return false;
    switch(user.role) {
      case 'admin':
        return true;
      case 'gerente':
        return action === 'add';
      default:
        return false;
    }
  }, []);

  const visibleSales = useMemo(() => {
    if (!user) return [];
    if (user.role === 'corretor') {
      return sales.filter(sale => sale.corretor === user.name);
    }
    return sales;
  }, [sales, user]);


  const handleSaveToLocal = useCallback(() => {
    try {
      localStorage.setItem('salesData', JSON.stringify(sales));
      alert('Dados salvos com sucesso!');
    } catch (error) {
      console.error("Failed to save sales data to localStorage", error);
      alert('Ocorreu um erro ao salvar os dados.');
    }
  }, [sales]);

  const handleOpenModal = useCallback(() => {
    setEditingSale(null);
    setIsModalOpen(true);
  }, []);

  const handleEditSale = useCallback((sale: Sale) => {
    setEditingSale(sale);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingSale(null);
  }, []);

  const handleSaveSale = useCallback((saleToSave: Sale) => {
    setSales(prevSales =>
      editingSale
        ? prevSales.map(s => (s.id === saleToSave.id ? saleToSave : s))
        : [...prevSales, { ...saleToSave, id: new Date().toISOString() }]
    );
    handleCloseModal();
  }, [editingSale, handleCloseModal]);

  const handleDeleteSale = useCallback((saleId: string) => {
    if (window.confirm('Tem certeza que deseja excluir?')) {
      setSales(prevSales => prevSales.filter(s => s.id !== saleId));
    }
  }, []);

  const dashboardStats = useMemo(() => {
    const totalVendas = visibleSales.reduce((acc, sale) => acc + sale.valorTotalVenda, 0);
    
    const getSellerCommission = (sale: Sale) => 
        sale.valorTotalVenda * (sale.porcentagemComissaoTotal / 100) * (sale.porcentagemComissaoVendedor / 100);

    const totalComissao = visibleSales.reduce((acc, sale) => acc + getSellerCommission(sale), 0);
    const comissaoPaga = visibleSales.reduce((acc, sale) => acc + sale.valorComissaoPaga, 0);
    const comissaoPendente = totalComissao - comissaoPaga;
    
    return { totalVendas, totalComissao, comissaoPaga, comissaoPendente };
  }, [visibleSales]);
  
  const handleExportCSV = useCallback(() => {
    if (visibleSales.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }

    const headers = [
        "ID", "Cliente", "Telefone", "Corretor", "Construtora", "Empreendimento", 
        "Bloco", "Unidade", "Data da Venda", "Valor Total da Venda", 
        "Comissão Total (%)", "Comissão Vendedor (%)", "Valor Comissão Paga", "Status Pagamento", "Status Repasse"
    ];

    const escapeCSV = (str: any): string => {
        const value = String(str);
        if (value.search(/("|,|\n)/g) >= 0) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    };

    const rows = visibleSales.map(sale => {
        const rowData = [
            sale.id,
            sale.cliente,
            sale.telefone,
            sale.corretor,
            sale.construtora,
            sale.empreendimento,
            sale.bloco,
            sale.unidade,
            new Date(sale.dataVenda).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
            sale.valorTotalVenda,
            sale.porcentagemComissaoTotal,
            sale.porcentagemComissaoVendedor,
            sale.valorComissaoPaga,
            sale.statusPagamento,
            sale.statusRepasse
        ];
        return rowData.map(escapeCSV).join(',');
    });
    
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");

    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "relatorio_vendas.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}, [visibleSales]);

const handleExportPDF = useCallback(() => {
    if (visibleSales.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

    doc.setFontSize(18);
    doc.text("Relatório Geral de Vendas", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    const summaryY = 32;
    doc.text(`Valor Total de Vendas: ${formatCurrency(dashboardStats.totalVendas)}`, 14, summaryY);
    doc.text(`Comissão Total dos Vendedores: ${formatCurrency(dashboardStats.totalComissao)}`, 14, summaryY + 6);
    doc.text(`Total de Comissão Paga: ${formatCurrency(dashboardStats.comissaoPaga)}`, 14, summaryY + 12);
    doc.text(`Total de Comissão Pendente: ${formatCurrency(dashboardStats.comissaoPendente)}`, 14, summaryY + 18);

    const tableColumn = ["Cliente", "Corretor", "Data", "Valor Venda", "Comissão Vendedor", "Valor Pago", "Status Pagamento", "Status Repasse"];
    const tableRows: any[] = [];

    visibleSales.forEach(sale => {
        const sellerCommissionValue = sale.valorTotalVenda * (sale.porcentagemComissaoTotal / 100) * (sale.porcentagemComissaoVendedor / 100);
        const saleData = [
            sale.cliente,
            sale.corretor,
            formatDate(sale.dataVenda),
            formatCurrency(sale.valorTotalVenda),
            formatCurrency(sellerCommissionValue),
            formatCurrency(sale.valorComissaoPaga),
            sale.statusPagamento,
            sale.statusRepasse
        ];
        tableRows.push(saleData);
    });

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: summaryY + 28,
        theme: 'grid'
    });
    
    doc.save('relatorio_vendas.pdf');
}, [visibleSales, dashboardStats]);

const handleShare = useCallback(async () => {
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const summaryText = `Resumo de Vendas:\n- Total de Vendas: ${formatCurrency(dashboardStats.totalVendas)}\n- Comissão Total: ${formatCurrency(dashboardStats.totalComissao)}\n- Comissão Paga: ${formatCurrency(dashboardStats.comissaoPaga)}\n- Comissão Pendente: ${formatCurrency(dashboardStats.comissaoPendente)}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Resumo de Vendas e Comissões',
                text: summaryText,
            });
        } catch (error) {
            console.error('Erro ao compartilhar:', error);
        }
    } else {
        try {
            await navigator.clipboard.writeText(summaryText);
            alert('Resumo copiado para a área de transferência!');
        } catch (err) {
            console.error('Falha ao copiar:', err);
            alert('Não foi possível compartilhar ou copiar o resumo.');
        }
    }
}, [dashboardStats]);

  if (!user) {
    return <Login onLogin={login} onRegister={register} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      <Header theme={theme} onThemeToggle={handleThemeToggle} user={user} onLogout={logout} />
      <main className="p-4 sm:p-6 lg:p-8">
        <Dashboard stats={dashboardStats} salesData={visibleSales} user={user} />
        
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-y-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Registro de Vendas</h2>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
               <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-transform transform hover:scale-105">
                <ShareIcon />
                <span className="hidden sm:inline">Compartilhar</span>
              </button>
               <button onClick={handleSaveToLocal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-transform transform hover:scale-105">
                <SaveIcon />
                <span className="hidden sm:inline">Salvar</span>
              </button>
               <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-transform transform hover:scale-105">
                <DocumentReportIcon />
                <span className="hidden sm:inline">Gerar PDF</span>
              </button>
              <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-transform transform hover:scale-105">
                <DownloadIcon />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>
              {userCan('add', user) && (
                <button onClick={handleOpenModal} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-transform transform hover:scale-105">
                  <PlusIcon />
                  <span className="hidden sm:inline">Adicionar Venda</span>
                </button>
              )}
            </div>
          </div>
          <SalesTable sales={visibleSales} onEdit={handleEditSale} onDelete={handleDeleteSale} user={user} />
        </div>
      </main>

      {isModalOpen && (
        <SaleFormModal
          sale={editingSale}
          onClose={handleCloseModal}
          onSave={handleSaveSale}
        />
      )}
      <ChatWidget salesData={visibleSales} />
    </div>
  );
};

export default App;