import { useState, useEffect } from 'react';
import { FiUser, FiPhone, FiMail, FiDollarSign, FiClock, FiTrendingUp, FiX, FiCalendar, FiFileText, FiLink, FiLogOut } from 'react-icons/fi';
import { supabase } from './lib/supabase';
import Login from './Login';
import './App.css';
import type { Session } from '@supabase/supabase-js';

// ============================================================================
// CORES DA MARCA
// ============================================================================

const BRAND = {
  purple: '#380e74',
  purpleLight: '#f3eaff',
  purpleMid: '#b88aed',
  orange: '#ff791a',
  orangeLight: '#fff4eb',
  orangeDark: '#e06000',
  orangeText: '#a84800',
  white: '#ffffff',
};

// ============================================================================
// TIPOS
// ============================================================================

type StatusCor = 'ROXO' | 'AZUL' | 'VERDE' | 'VERMELHO' | 'LARANJA' | 'BRANCO';

interface Lead {
  id: string;
  lead_id: string;
  cpf: string;
  nomeCompleto: string;
  origem: string;
  statusAtual: StatusCor;
  custoTotal: number;
  custoAquisicao: number;
  custoMotores: number;
  createdAt: string;
  updatedAt: string;
  telefones: Array<{ numero: string; prioridade: number; origem?: string }>;
  emails: Array<{ email: string; origem?: string }>;
  valorLiberado?: number;
  valorParcela?: number;
  propostaId?: string;
  propostaBanco?: string;
  propostaPrazoMeses?: number;
  propostaStatusProposta?: string;
  propostaDataCriacao?: string;
  propostaLinkAssinatura?: string;
  propostaDataGeracaoLink?: string;
  dataEntradaAssinatura?: string;
  humanoObrigatorio: boolean;
  pausarAutomacoes: boolean;
  historicoStatus: Array<{ status: string; timestamp: string; motivo: string }>;
  agendamentos: Array<{ data_hora: string; motivo: string; operador: string; concluido: boolean }>;
  observacoes: Array<{ texto: string; operador: string; timestamp: string }>;
}

// ============================================================================
// CONFIGURAÇÕES DE CORES DOS STATUS
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
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<StatusCor | 'TODOS'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Verificar sessão ao montar
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Carregar leads quando autenticado
  useEffect(() => {
    if (session) {
      carregarLeads();
    }
  }, [session]);

  const carregarLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro Supabase:', error);
        return;
      }

      const mapped: Lead[] = (data || []).map((row: any) => ({
        id: row.id,
        lead_id: row.lead_id,
        cpf: row.cpf,
        nomeCompleto: row.nome_completo,
        origem: row.origem,
        statusAtual: row.status_atual as StatusCor,
        custoTotal: Number(row.custo_total) || 0,
        custoAquisicao: Number(row.custo_aquisicao) || 0,
        custoMotores: Number(row.custo_motores) || 0,
        createdAt: row.criado_em,
        updatedAt: row.atualizado_em || row.criado_em,
        telefones: row.telefones || [],
        emails: row.emails || [],
        valorLiberado: row.proposta_valor_liberado ? Number(row.proposta_valor_liberado) : undefined,
        valorParcela: row.proposta_valor_parcela ? Number(row.proposta_valor_parcela) : undefined,
        propostaId: row.proposta_id_proposta || undefined,
        propostaBanco: row.proposta_banco || undefined,
        propostaPrazoMeses: row.proposta_prazo_meses ? Number(row.proposta_prazo_meses) : undefined,
        propostaStatusProposta: row.proposta_status_proposta || undefined,
        propostaDataCriacao: row.proposta_data_criacao || undefined,
        propostaLinkAssinatura: row.proposta_link_assinatura || undefined,
        propostaDataGeracaoLink: row.proposta_data_geracao_link || undefined,
        dataEntradaAssinatura: row.data_entrada_assinatura || undefined,
        humanoObrigatorio: row.humano_obrigatorio || false,
        pausarAutomacoes: row.pausar_automacoes || false,
        historicoStatus: row.historico_status || [],
        agendamentos: row.agendamentos || [],
        observacoes: row.observacoes || [],
      }));

      setAllLeads(mapped);
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar leads por status selecionado
  const leadsDoStatus = selectedStatus === 'TODOS'
    ? allLeads
    : allLeads.filter(l => l.statusAtual === selectedStatus);

  // Filtrar leads por busca
  const leadsFiltrados = leadsDoStatus.filter(lead =>
    lead.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.cpf.includes(searchTerm)
  );

  // Calcular estatísticas sempre a partir de TODOS os leads
  const stats = {
    total: allLeads.length,
    roxo: allLeads.filter(l => l.statusAtual === 'ROXO').length,
    azul: allLeads.filter(l => l.statusAtual === 'AZUL').length,
    verde: allLeads.filter(l => l.statusAtual === 'VERDE').length,
    vermelho: allLeads.filter(l => l.statusAtual === 'VERMELHO').length,
    laranja: allLeads.filter(l => l.statusAtual === 'LARANJA').length,
    branco: allLeads.filter(l => l.statusAtual === 'BRANCO').length,
  };

  // Tela de carregamento da autenticação
  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${BRAND.purple} 0%, #1a0538 100%)` }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent"></div>
      </div>
    );
  }

  // Tela de login
  if (!session) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: `linear-gradient(135deg, ${BRAND.purpleLight} 0%, ${BRAND.white} 50%, ${BRAND.orangeLight} 100%)` }}
    >
      {/* Header */}
      <header
        className="shadow-lg animate-slide-in-left"
        style={{ backgroundColor: BRAND.purple }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={supabase.storage.from('img').getPublicUrl('logo.webp').data.publicUrl}
                alt="Logo"
                className="h-16 w-auto object-contain"
              />
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Dashboard de Conversão
                </h1>
                <p className="mt-1 text-sm" style={{ color: BRAND.purpleMid }}>
                  Legal é Viver - Gestão Inteligente de Leads
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm" style={{ color: BRAND.purpleMid }}>Total de Leads</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <button
                onClick={async () => { await supabase.auth.signOut(); setSession(null); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: BRAND.white }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)')}
              >
                <FiLogOut />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 animate-fade-in-up">
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
        <div className="rounded-lg shadow p-6 mb-6 animate-fade-in-up" style={{ animationDelay: '0.15s', background: 'linear-gradient(to right, #e8e0f0, #ffffff)' }}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none transition-all duration-300"
                style={{ boxShadow: searchTerm ? `0 0 0 2px ${BRAND.purple}` : undefined }}
              />
            </div>
            {selectedStatus !== 'TODOS' && (
              <button
                onClick={() => setSelectedStatus('TODOS')}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 hover:scale-[1.02] active:scale-95 text-gray-700 rounded-lg font-medium transition-all duration-200"
              >
                Limpar Filtros
              </button>
            )}
            <button
              onClick={carregarLeads}
              className="px-6 py-2 hover:scale-[1.02] active:scale-95 text-white rounded-lg font-medium transition-all duration-200"
              style={{ backgroundColor: BRAND.orange }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND.orangeDark)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND.orange)}
            >
              Atualizar
            </button>
          </div>
        </div>

        {/* Lista de Leads */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2"
              style={{ borderBottomColor: BRAND.orange }}
            ></div>
          </div>
        ) : leadsFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">Nenhum lead encontrado</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {leadsFiltrados.map((lead, index) => (
              <LeadCard key={lead.id} lead={lead} index={index} onVerDetalhes={() => setSelectedLead(lead)} />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedLead && (
        <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}

      {/* Footer */}
      <footer
        className="mt-12 py-6 fade-in"
        style={{ backgroundColor: BRAND.purple, animationDelay: '0.3s' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center" style={{ color: BRAND.purpleMid }}>
          <img
            src={supabase.storage.from('img').getPublicUrl('logo.webp').data.publicUrl}
            alt="Logo"
            className="h-10 w-auto object-contain mb-3"
          />
          <p>Dashboard de Conversão - Legal é Viver &copy; 2026</p>
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
        rounded-lg p-4 shadow-md
        hover:shadow-xl hover:-translate-y-1 hover:scale-[1.03]
        transition-all duration-300 ease-out
        ${selected ? `ring-4 ring-opacity-50 scale-[1.02] -translate-y-0.5` : ''}
      `}
      style={selected ? { boxShadow: `0 0 0 4px ${BRAND.purple}44` } : undefined}
    >
      <p className="text-sm font-medium mb-1 transition-all duration-200">{config.label}</p>
      <p className="text-3xl font-bold transition-all duration-200">{count}</p>
    </button>
  );
}

// ============================================================================
// COMPONENTE: CARD DE LEAD
// ============================================================================

interface LeadCardProps {
  lead: Lead;
  index: number;
  onVerDetalhes: () => void;
}

function LeadCard({ lead, index, onVerDetalhes }: LeadCardProps) {
  const config = STATUS_CONFIG[lead.statusAtual];
  
  return (
    <div
      className={`bg-white rounded-lg shadow-md border-l-4 ${config.border} p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out animate-fade-in-up`}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
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
            <FiUser style={{ color: BRAND.purple }} />
            {lead.nomeCompleto}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FiPhone style={{ color: BRAND.purple }} />
              <span>{lead.telefones[0]?.numero || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <FiMail style={{ color: BRAND.orange }} />
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
            <div className="rounded-lg p-3" style={{ backgroundColor: BRAND.orangeLight }}>
              <div className="flex items-center gap-2 mb-1">
                <FiDollarSign style={{ color: BRAND.orange }} />
                <span className="text-xs text-gray-600 font-medium">Valor Liberado</span>
              </div>
              <p className="text-lg font-bold" style={{ color: BRAND.orangeText }}>
                R$ {lead.valorLiberado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}

          {lead.valorParcela && (
            <div className="rounded-lg p-3" style={{ backgroundColor: BRAND.purpleLight }}>
              <div className="flex items-center gap-2 mb-1">
                <FiTrendingUp style={{ color: BRAND.purple }} />
                <span className="text-xs text-gray-600 font-medium">Parcela</span>
              </div>
              <p className="text-lg font-bold" style={{ color: BRAND.purple }}>
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
        <button
          onClick={onVerDetalhes}
          className="flex-1 px-4 py-2 hover:scale-[1.02] active:scale-95 text-white rounded-lg font-medium transition-all duration-200"
          style={{ backgroundColor: BRAND.purple }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#6a2dab')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND.purple)}
        >
          Ver Detalhes
        </button>
        <button
          className="flex-1 px-4 py-2 hover:scale-[1.02] active:scale-95 rounded-lg font-medium transition-all duration-200"
          style={{ backgroundColor: BRAND.orangeLight, color: BRAND.orangeText }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ffe4cc')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND.orangeLight)}
        >
          Timeline
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE: MODAL DE DETALHES DO LEAD
// ============================================================================

interface LeadDetailModalProps {
  lead: Lead;
  onClose: () => void;
}

function LeadDetailModal({ lead, onClose }: LeadDetailModalProps) {
  const config = STATUS_CONFIG[lead.statusAtual];

  const formatDate = (d?: string) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (v?: number) => {
    if (v === undefined || v === null) return 'N/A';
    return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Modal */}
        <div
          className="flex items-center justify-between p-6 rounded-t-2xl"
          style={{ backgroundColor: BRAND.purple }}
        >
          <div className="flex items-center gap-3">
            <FiUser className="text-white text-xl" />
            <div>
              <h2 className="text-xl font-bold text-white">{lead.nomeCompleto}</h2>
              <p className="text-sm" style={{ color: BRAND.purpleMid }}>ID: {lead.lead_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Status e Datas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-sm font-medium inline-block mb-1`}>
                {config.label}
              </div>
              <p className="text-xs text-gray-500">Status Atual</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800">{lead.cpf}</p>
              <p className="text-xs text-gray-500">CPF</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800">{lead.origem}</p>
              <p className="text-xs text-gray-500">Origem</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800">{formatDate(lead.createdAt)}</p>
              <p className="text-xs text-gray-500">Criado em</p>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Contatos */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <FiPhone style={{ color: BRAND.purple }} /> Telefones
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {lead.telefones.length > 0 ? lead.telefones.map((t, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                  <span className="font-medium">{t.numero}</span>
                  <span className="text-xs text-gray-400">Prioridade {t.prioridade}</span>
                  {t.origem && <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">{t.origem}</span>}
                </div>
              )) : <p className="text-sm text-gray-400">Nenhum telefone</p>}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <FiMail style={{ color: BRAND.orange }} /> E-mails
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {lead.emails.length > 0 ? lead.emails.map((e, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                  <span className="font-medium">{e.email}</span>
                  {e.origem && <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">{e.origem}</span>}
                </div>
              )) : <p className="text-sm text-gray-400">Nenhum e-mail</p>}
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Proposta */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <FiFileText style={{ color: BRAND.purple }} /> Dados da Proposta
            </h3>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50 w-1/3">ID Proposta</td>
                    <td className="px-4 py-3 text-gray-800">{lead.propostaId || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50">Banco</td>
                    <td className="px-4 py-3 text-gray-800">{lead.propostaBanco || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50">Status Proposta</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: BRAND.orangeLight, color: BRAND.orangeText }}>
                        {lead.propostaStatusProposta || 'N/A'}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50">Valor Liberado</td>
                    <td className="px-4 py-3 font-bold" style={{ color: BRAND.orange }}>{formatCurrency(lead.valorLiberado)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50">Valor Parcela</td>
                    <td className="px-4 py-3 font-bold" style={{ color: BRAND.purple }}>{formatCurrency(lead.valorParcela)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50">Prazo</td>
                    <td className="px-4 py-3 text-gray-800">{lead.propostaPrazoMeses ? `${lead.propostaPrazoMeses} meses` : 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50">Data Criação Proposta</td>
                    <td className="px-4 py-3 text-gray-800">{formatDate(lead.propostaDataCriacao)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50">Link Assinatura</td>
                    <td className="px-4 py-3">
                      {lead.propostaLinkAssinatura ? (
                        <a
                          href={lead.propostaLinkAssinatura}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 underline"
                          style={{ color: BRAND.purple }}
                        >
                          <FiLink /> Abrir link
                        </a>
                      ) : 'N/A'}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-500 bg-gray-50">Data Geração Link</td>
                    <td className="px-4 py-3 text-gray-800">{formatDate(lead.propostaDataGeracaoLink)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Custos */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <FiDollarSign style={{ color: BRAND.orange }} /> Custos
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg p-3 text-center" style={{ backgroundColor: BRAND.orangeLight }}>
                <p className="text-xs text-gray-500 mb-1">Aquisição</p>
                <p className="font-bold" style={{ color: BRAND.orangeText }}>{formatCurrency(lead.custoAquisicao)}</p>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ backgroundColor: BRAND.purpleLight }}>
                <p className="text-xs text-gray-500 mb-1">Motores</p>
                <p className="font-bold" style={{ color: BRAND.purple }}>{formatCurrency(lead.custoMotores)}</p>
              </div>
              <div className="rounded-lg p-3 text-center bg-gray-100">
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="font-bold text-gray-800">{formatCurrency(lead.custoTotal)}</p>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Flags */}
          <div className="flex gap-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${lead.humanoObrigatorio ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
              {lead.humanoObrigatorio ? '⚠️ Humano Obrigatório' : '✅ Automação Ativa'}
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${lead.pausarAutomacoes ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
              {lead.pausarAutomacoes ? '⏸️ Automações Pausadas' : '▶️ Automações Rodando'}
            </div>
          </div>

          {/* Histórico de Status */}
          {lead.historicoStatus.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <FiClock style={{ color: BRAND.purple }} /> Histórico de Status
              </h3>
              <div className="space-y-2">
                {lead.historicoStatus.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg px-4 py-2 text-sm">
                    <span className="font-medium text-gray-700 whitespace-nowrap">{formatDate(h.timestamp)}</span>
                    <span className="font-semibold" style={{ color: BRAND.purple }}>{h.status}</span>
                    <span className="text-gray-500">{h.motivo}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agendamentos */}
          {lead.agendamentos.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <FiCalendar style={{ color: BRAND.orange }} /> Agendamentos
              </h3>
              <div className="space-y-2">
                {lead.agendamentos.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2 text-sm">
                    <span className="font-medium text-gray-700">{formatDate(a.data_hora)}</span>
                    <span className="text-gray-600">{a.motivo}</span>
                    <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">{a.operador}</span>
                    <span className={`text-xs font-medium ${a.concluido ? 'text-green-600' : 'text-yellow-600'}`}>
                      {a.concluido ? '✅ Concluído' : '⏳ Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          {lead.observacoes.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <FiFileText style={{ color: BRAND.purple }} /> Observações
              </h3>
              <div className="space-y-2">
                {lead.observacoes.map((o, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg px-4 py-2 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-700">{o.operador}</span>
                      <span className="text-xs text-gray-400">{formatDate(o.timestamp)}</span>
                    </div>
                    <p className="text-gray-600">{o.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 pt-2 border-t border-gray-200">
            <div>Entrada Assinatura: <span className="font-medium text-gray-700">{formatDate(lead.dataEntradaAssinatura)}</span></div>
            <div>Última Atualização: <span className="font-medium text-gray-700">{formatDate(lead.updatedAt)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
