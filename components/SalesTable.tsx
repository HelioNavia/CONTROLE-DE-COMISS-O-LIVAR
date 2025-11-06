
import React from 'react';
import { Sale, User } from '../types';
import { EditIcon, TrashIcon } from './icons';

interface SalesTableProps {
  sales: Sale[];
  user: User | null;
  onEdit: (sale: Sale) => void;
  onDelete: (id: string) => void;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusClasses: { [key: string]: string } = {
        'Pago': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'Pendente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        'Pago Parcialmente': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
        'NFS-e pendenciada': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        'Caixinha': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'NFS-e aprovada': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
        'Liberado': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'Antecipado': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
        'Flash': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        'Inadimplente': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };

    const baseClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
    const colorClass = statusClasses[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';

    return (
        <span className={`${baseClasses} ${colorClass}`}>
            {status}
        </span>
    );
};


const SalesTable: React.FC<SalesTableProps> = ({ sales, user, onEdit, onDelete }) => {
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const canPerformActions = user?.role === 'admin';

  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {['Cliente', 'Corretor', 'Construtora', 'Empreendimento', 'Data da Venda', 'Valor da Venda', 'Comissão Vendedor', 'Status Pagamento', 'Status Repasse', canPerformActions && 'Ações'].filter(Boolean).map(header => (
              <th key={header as string} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {sales.length > 0 ? sales.map((sale) => {
            const sellerCommissionValue = sale.valorTotalVenda * (sale.porcentagemComissaoTotal / 100) * (sale.porcentagemComissaoVendedor / 100);
            const remainingCommission = sellerCommissionValue - sale.valorComissaoPaga;
            return (
              <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{sale.cliente}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{sale.telefone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{sale.corretor}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{sale.construtora}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{sale.empreendimento}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{`Bl. ${sale.bloco}, Un. ${sale.unidade}`}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDate(sale.dataVenda)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatCurrency(sale.valorTotalVenda)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="font-semibold text-gray-700 dark:text-gray-200">{formatCurrency(sellerCommissionValue)}</div>
                  <div className="text-xs text-green-600 dark:text-green-400">Pago: {formatCurrency(sale.valorComissaoPaga)}</div>
                  <div className="text-xs text-red-600 dark:text-red-400">Resta: {formatCurrency(remainingCommission)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <StatusBadge status={sale.statusPagamento} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                   <StatusBadge status={sale.statusRepasse} />
                </td>
                {canPerformActions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-4">
                      <button onClick={() => onEdit(sale)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                        <EditIcon />
                      </button>
                      <button onClick={() => onDelete(sale.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            )
          }) : (
            <tr>
              <td colSpan={canPerformActions ? 10 : 9} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                Nenhuma venda registrada ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SalesTable;