import { useState, useEffect } from 'react';
import { FiUser, FiPhone, FiMail, FiDollarSign, FiClock, FiTrendingUp } from 'react-icons/fi';
import './App.css';

// ============================================================================
// TIPOS
// ============================================================================

type StatusCor = 'ROXO' | 'AZUL' | 'VERDE' | 'VERMELHO' | 'LARANJA' | 'BRANCO';

interface Lead {
  id: string;
  cpf: string;
  nomeCompleto: string;
  origem: string;
  statusAtual: StatusCor;
  custoTotal: number;
  createdAt: string;
  telefones: Array<{ numero: string; prioridade: number }>;
  emails: Array<{ email: string }>;
  valorLiberado?: number;
  valorParcela?: number;
}

// ============================================================================
// CONFIGURAÇÕES DE CORES
// ============================================================================

const STATUS_CONFIG: Record<StatusCor, { bg: string; text: string; border: string; label: string }> = {
  ROXO: {
    bg: 'bg-purple-100',
    text: 'text-purple-900',
    border: 'border-purple-400',
    label: '🟣 Pago',
  },
  AZUL: {
    bg: 'bg-blue-100',
    text: 'text-blue-900',
    border: 'border-blue-400',
    label: '🔵 Pendência',
  },
  VERDE: {
    bg: 'bg-green-100',
    text: 'text-green-900',
    border: 'border-green-400',
    label: '🟢 Engajado',
  },
  VERMELHO: {
    bg: 'bg-red-100',
    text: 'text-red-900',
    border: 'border-red-400',
    label: '🔴 Reclamação',
  },
  LARANJA: {
    bg: 'bg-orange-100',
    text: 'text-orange-900',
    border: 'border-orange-400',
    label: '🟠 Sem Interação',
  },
  BRANCO: {
    bg: 'bg-gray-100',
    text: 'text-gray-900',
    border: 'border-gray-400',
    label: '⚪ Expirada',
  },
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<StatusCor | 'TODOS'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar leads ao montar
  useEffect(() => {
    carregarLeads();
  }, [selectedStatus]);

  const carregarLeads = async () => {
    setLoading(true);
    try {
      const params = selectedStatus !== 'TODOS' ? `?statusAtual=${selectedStatus}` : '';
      const response = await fetch(`/api/leads${params}`);
      const data = await response.json();
      
      if (data.success) {
        setLeads(data.data.items);
      }
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar leads por busca
  const leadsFiltrados = leads.filter(lead =>
    lead.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.cpf.includes(searchTerm)
  );

  // Calcular estatísticas
  const stats = {
    total: leads.length,
    roxo: leads.filter(l => l.statusAtual === 'ROXO').length,
    azul: leads.filter(l => l.statusAtual === 'AZUL').length,
    verde: leads.filter(l => l.statusAtual === 'VERDE').length,
    vermelho: leads.filter(l => l.statusAtual === 'VERMELHO').length,
    laranja: leads.filter(l => l.statusAtual === 'LARANJA').length,
    branco: leads.filter(l => l.statusAtual === 'BRANCO').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard de Conversão
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Legal é Viver - Gestão Inteligente de Leads
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total de Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatusCard
            status="ROXO"
            count={stats.roxo}
            onClick={() => setSelectedStatus('ROXO')}
            selected={selectedStatus === 'ROXO'}
          />
          <StatusCard
            status="AZUL"
            count={stats.azul}
            onClick={() => setSelectedStatus('AZUL')}
            selected={selectedStatus === 'AZUL'}
          />
          <StatusCard
            status="VERDE"
            count={stats.verde}
            onClick={() => setSelectedStatus('VERDE')}
            selected={selectedStatus === 'VERDE'}
          />
          <StatusCard
            status="VERMELHO"
            count={stats.vermelho}
            onClick={() => setSelectedStatus('VERMELHO')}
            selected={selectedStatus === 'VERMELHO'}
          />
          <StatusCard
            status="LARANJA"
            count={stats.laranja}
            onClick={() => setSelectedStatus('LARANJA')}
            selected={selectedStatus === 'LARANJA'}
          />
          <StatusCard
            status="BRANCO"
            count={stats.branco}
            onClick={() => setSelectedStatus('BRANCO')}
            selected={selectedStatus === 'BRANCO'}
          />
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {selectedStatus !== 'TODOS' && (
              <button
                onClick={() => setSelectedStatus('TODOS')}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
              >
                Limpar Filtros
              </button>
            )}
            <button
              onClick={carregarLeads}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              Atualizar
            </button>
          </div>
        </div>

        {/* Lista de Leads */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : leadsFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">Nenhum lead encontrado</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {leadsFiltrados.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>Dashboard de Conversão - Legal é Viver © 2026</p>
          <p className="text-sm mt-1">Sistema de Orquestração de Motores de Marketing</p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// COMPONENTE: CARD DE STATUS
// ============================================================================

interface StatusCardProps {
  status: StatusCor;
  count: number;
  onClick: () => void;
  selected: boolean;
}

function StatusCard({ status, count, onClick, selected }: StatusCardProps) {
  const config = STATUS_CONFIG[status];
  
  return (
    <button
      onClick={onClick}
      className={`
        ${config.bg} ${config.text} 
        rounded-lg p-4 shadow-md hover:shadow-lg transition
        ${selected ? `ring-4 ${config.border} ring-opacity-50` : ''}
      `}
    >
      <p className="text-sm font-medium mb-1">{config.label}</p>
      <p className="text-3xl font-bold">{count}</p>
    </button>
  );
}

// ============================================================================
// COMPONENTE: CARD DE LEAD
// ============================================================================

interface LeadCardProps {
  lead: Lead;
}

function LeadCard({ lead }: LeadCardProps) {
  const config = STATUS_CONFIG[lead.statusAtual];
  
  return (
    <div className={`bg-white rounded-lg shadow-md border-l-4 ${config.border} p-6 hover:shadow-xl transition`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Informações Principais */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-sm font-medium`}>
              {config.label}
            </div>
            <span className="text-sm text-gray-500">
              {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <FiUser className="text-gray-600" />
            {lead.nomeCompleto}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FiPhone className="text-blue-600" />
              <span>{lead.telefones[0]?.numero || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <FiMail className="text-green-600" />
              <span>{lead.emails[0]?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">CPF:</span>
              <span>{lead.cpf}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Origem:</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded">{lead.origem}</span>
            </div>
          </div>
        </div>

        {/* Informações Financeiras */}
        <div className="flex flex-col gap-3 min-w-[200px]">
          {lead.valorLiberado && (
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <FiDollarSign className="text-green-600" />
                <span className="text-xs text-gray-600 font-medium">Valor Liberado</span>
              </div>
              <p className="text-lg font-bold text-green-700">
                R$ {lead.valorLiberado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}

          {lead.valorParcela && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <FiTrendingUp className="text-blue-600" />
                <span className="text-xs text-gray-600 font-medium">Parcela</span>
              </div>
              <p className="text-lg font-bold text-blue-700">
                R$ {lead.valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FiClock className="text-gray-600" />
              <span className="text-xs text-gray-600 font-medium">Custo Total</span>
            </div>
            <p className="text-lg font-bold text-gray-700">
              R$ {lead.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2 mt-4 pt-4 border-t">
        <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
          Ver Detalhes
        </button>
        <button className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition">
          Timeline
        </button>
      </div>
    </div>
  );
}

export default App;
