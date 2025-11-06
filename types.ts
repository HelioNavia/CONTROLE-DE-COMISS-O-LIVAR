
export type StatusRepasse = 'NFS-e pendenciada' | 'NFS-e aprovada' | 'Liberado' | 'Antecipado' | 'Caixinha' | 'Flash' | 'Inadimplente';
export type StatusPagamento = 'Pendente' | 'Pago Parcialmente' | 'Pago';

export interface Sale {
  id: string;
  cliente: string;
  telefone: string;
  corretor: string;
  construtora: string;
  empreendimento: string;
  bloco: string;
  unidade: string;
  dataVenda: string;
  valorTotalVenda: number;
  porcentagemComissaoTotal: number;
  porcentagemComissaoVendedor: number;
  valorComissaoPaga: number;
  statusRepasse: StatusRepasse;
  statusPagamento: StatusPagamento;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  sources?: { uri: string; title: string }[];
}

export type UserRole = 'admin' | 'gerente' | 'corretor' | 'financeiro';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}