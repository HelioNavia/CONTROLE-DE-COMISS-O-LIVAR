
import React, { useState, useEffect, useMemo } from 'react';
import { Sale, StatusPagamento, StatusRepasse } from '../types';

interface SaleFormModalProps {
  sale: Sale | null;
  onClose: () => void;
  onSave: (sale: Sale) => void;
}

const SaleFormModal: React.FC<SaleFormModalProps> = ({ sale, onClose, onSave }) => {
  const [formData, setFormData] = useState<Omit<Sale, 'id'>>({
    cliente: '',
    telefone: '',
    corretor: '',
    construtora: '',
    empreendimento: '',
    bloco: '',
    unidade: '',
    dataVenda: new Date().toISOString().split('T')[0],
    valorTotalVenda: 0,
    porcentagemComissaoTotal: 5,
    porcentagemComissaoVendedor: 35,
    valorComissaoPaga: 0,
    statusPagamento: 'Pendente',
    statusRepasse: 'NFS-e pendenciada',
  });

  const totalSellerCommission = useMemo(() => {
    return (formData.valorTotalVenda * (formData.porcentagemComissaoTotal / 100) * (formData.porcentagemComissaoVendedor / 100));
  }, [formData.valorTotalVenda, formData.porcentagemComissaoTotal, formData.porcentagemComissaoVendedor]);

  useEffect(() => {
    if (sale) {
      setFormData({
        ...sale,
        dataVenda: new Date(sale.dataVenda).toISOString().split('T')[0],
      });
    }
  }, [sale]);

  useEffect(() => {
    const paidAmount = Number(formData.valorComissaoPaga) || 0;
    let newStatus: StatusPagamento = 'Pendente';
    
    if (paidAmount <= 0) {
      newStatus = 'Pendente';
    } else if (paidAmount < totalSellerCommission) {
      newStatus = 'Pago Parcialmente';
    } else {
      newStatus = 'Pago';
    }
    
    setFormData(prev => ({ ...prev, statusPagamento: newStatus }));

  }, [formData.valorComissaoPaga, totalSellerCommission]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumericField = ['valorTotalVenda', 'porcentagemComissaoTotal', 'porcentagemComissaoVendedor', 'valorComissaoPaga'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumericField ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: sale?.id || '', 
      ...formData,
      valorTotalVenda: Number(formData.valorTotalVenda),
      porcentagemComissaoTotal: Number(formData.porcentagemComissaoTotal),
      porcentagemComissaoVendedor: Number(formData.porcentagemComissaoVendedor),
      valorComissaoPaga: Number(formData.valorComissaoPaga)
    });
  };
  
  const remainingCommission = totalSellerCommission - (formData.valorComissaoPaga || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {sale ? 'Editar Venda' : 'Adicionar Nova Venda'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField name="cliente" label="Cliente" value={formData.cliente} onChange={handleChange} required />
              <InputField name="telefone" label="Telefone" value={formData.telefone} onChange={handleChange} />
              <InputField name="corretor" label="Corretor" value={formData.corretor} onChange={handleChange} required />
              <InputField name="construtora" label="Construtora" value={formData.construtora} onChange={handleChange} required />
              <InputField name="empreendimento" label="Empreendimento" value={formData.empreendimento} onChange={handleChange} required />
              <InputField name="bloco" label="Bloco" value={formData.bloco} onChange={handleChange} />
              <InputField name="unidade" label="Unidade" value={formData.unidade} onChange={handleChange} />
              <InputField name="dataVenda" label="Data da Venda" type="date" value={formData.dataVenda} onChange={handleChange} required />
              <InputField name="valorTotalVenda" label="Valor Total da Venda" type="number" step="0.01" value={formData.valorTotalVenda} onChange={handleChange} required />
              <InputField name="porcentagemComissaoTotal" label="Comissão Total (%)" type="number" step="0.1" value={formData.porcentagemComissaoTotal} onChange={handleChange} required />
              <InputField name="porcentagemComissaoVendedor" label="Comissão Vendedor (%)" type="number" step="0.1" value={formData.porcentagemComissaoVendedor} onChange={handleChange} required />
              
              <div className="md:col-span-2">
                <InputField name="valorComissaoPaga" label="Valor da Comissão Paga (R$)" type="number" step="0.01" value={formData.valorComissaoPaga} onChange={handleChange} />
                {formData.statusPagamento === 'Pago Parcialmente' && (
                    <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                        Alerta: Falta receber: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remainingCommission)}
                    </p>
                )}
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                <SelectField
                    name="statusPagamento"
                    label="Status Pagamento"
                    value={formData.statusPagamento}
                    onChange={handleChange}
                    disabled={true}
                    options={[
                        { value: 'Pendente', label: 'Pendente' },
                        { value: 'Pago Parcialmente', label: 'Pago Parcialmente' },
                        { value: 'Pago', label: 'Pago' },
                    ]}
                />
                <SelectField
                    name="statusRepasse"
                    label="Status Repasse"
                    value={formData.statusRepasse}
                    onChange={handleChange}
                    options={[
                        { value: 'NFS-e pendenciada', label: 'NFS-e Pendenciada' },
                        { value: 'NFS-e aprovada', label: 'NFS-e Aprovada' },
                        { value: 'Liberado', label: 'Liberado' },
                        { value: 'Antecipado', label: 'Antecipado' },
                        { value: 'Caixinha', label: 'Caixinha' },
                        { value: 'Flash', label: 'Flash' },
                        { value: 'Inadimplente', label: 'Inadimplente' },
                    ]}
                />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface InputFieldProps {
    name: string;
    label: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    required?: boolean;
    step?: string;
}

const InputField: React.FC<InputFieldProps> = ({ name, label, type = 'text', ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
        </label>
        <input
            id={name}
            name={name}
            type={type}
            {...props}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
    </div>
);

interface SelectFieldProps {
    name: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: StatusPagamento | StatusRepasse; label: string }[];
    disabled?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({ name, label, options, disabled = false, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
        </label>
        <select
            id={name}
            name={name}
            {...props}
            disabled={disabled}
            className={`mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
            {options.map(option => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </div>
);


export default SaleFormModal;