import mongoose, { Document, Schema } from 'mongoose';

// Enums
export enum LeadStatus {
  ROXO = 'ROXO',         // Pago
  AZUL = 'AZUL',         // Pendência
  VERDE = 'VERDE',       // Interagiu
  VERMELHO = 'VERMELHO', // Reclamação
  LARANJA = 'LARANJA',   // Sem interação
  BRANCO = 'BRANCO',     // Expirada
  REPROVADO = 'REPROVADO'
}

export enum ProposalStatus {
  PENDENTE = 'PENDENTE',
  PAGO = 'PAGO',
  PENDENCIA = 'PENDENCIA',
  EXPIRADA = 'EXPIRADA',
  CANCELADA = 'CANCELADA'
}

export enum CallResult {
  NAO_ATENDEU = 'NAO_ATENDEU',
  DERRUBOU = 'DERRUBOU',
  CAIXA_POSTAL = 'CAIXA_POSTAL',
  INVALIDO = 'INVALIDO',
  INEXISTENTE = 'INEXISTENTE',
  ATENDEU_DIGITOU_1 = 'ATENDEU_DIGITOU_1',
  ATENDEU_SEM_ACAO = 'ATENDEU_SEM_ACAO',
  PEDIU_OPERADOR = 'PEDIU_OPERADOR'
}

export enum ConnectionStatus {
  ATIVA = 'ATIVA',
  BANIDA = 'BANIDA',
  OFFLINE = 'OFFLINE'
}

// Interfaces
export interface IPhone {
  numero: string;
  prioridade: number; // 1 = LP, 2+ = enriquecido
  origem: string;
  inapto?: boolean;
  motivo_inapto?: string;
}

export interface IEmail {
  email: string;
  origem: string;
}

export interface IProposal {
  id_proposta: string;
  data_criacao_proposta: Date;
  valor_liberado: number;
  prazo_meses: number;
  valor_parcela: number;
  banco: string;
  link_assinatura_atual: string;
  data_geracao_link_assinatura: Date;
  status_proposta: ProposalStatus;
}

export interface IStatusHistory {
  status: LeadStatus;
  timestamp: Date;
  motivo: string;
}

export interface IInteractionHistory {
  tipo: string; // LEAD_IMPORTADO, MOTOR_IA_CHAMADA, MOTOR_EMAIL_EVENTO, etc
  dados: any;
  timestamp: Date;
  custo?: number;
}

export interface IWhatsAppAttribution {
  conexao_id: string;
  numero_wa: string;
  status_conexao: ConnectionStatus;
  novas_conversas_hoje: number;
  data_atribuicao: Date;
  ultimo_envio: Date;
}

export interface IAgendamento {
  data_hora: Date;
  motivo: string;
  operador: string;
  criado_em: Date;
  concluido: boolean;
}

export interface IObservacao {
  texto: string;
  operador: string;
  timestamp: Date;
}

export interface ICosts {
  custo_aquisicao: number;
  custo_motores: number;
  custo_total: number;
  detalhamento: Array<{
    motor: string;
    acao: string;
    custo: number;
    timestamp: Date;
  }>;
}

// Document interface
export interface ILead extends Document {
  lead_id: string;
  cpf: string;
  nome_completo: string;
  telefones: IPhone[];
  emails: IEmail[];
  proposta: IProposal;
  status_atual: LeadStatus;
  historico_status: IStatusHistory[];
  historico_interacoes: IInteractionHistory[];
  custos: ICosts;
  atribuicao_whatsapp?: IWhatsAppAttribution;
  agendamentos: IAgendamento[];
  observacoes: IObservacao[];
  humano_obrigatorio: boolean;
  pausar_automacoes: boolean;
  origem: string;
  data_entrada_assinatura: Date;
  criado_em: Date;
  atualizado_em: Date;
}

// Schema
const LeadSchema: Schema = new Schema(
  {
    lead_id: { type: String, required: true, unique: true, index: true },
    cpf: { type: String, required: true, index: true },
    nome_completo: { type: String, required: true },
    
    telefones: [{
      numero: { type: String, required: true },
      prioridade: { type: Number, required: true, default: 1 },
      origem: { type: String, required: true },
      inapto: { type: Boolean, default: false },
      motivo_inapto: String
    }],
    
    emails: [{
      email: { type: String, required: true },
      origem: { type: String, required: true }
    }],
    
    proposta: {
      id_proposta: { type: String, required: true, index: true },
      data_criacao_proposta: { type: Date, required: true },
      valor_liberado: { type: Number, required: true },
      prazo_meses: { type: Number, required: true },
      valor_parcela: { type: Number, required: true },
      banco: { type: String, required: true },
      link_assinatura_atual: { type: String, required: true },
      data_geracao_link_assinatura: { type: Date, required: true },
      status_proposta: { 
        type: String, 
        enum: Object.values(ProposalStatus), 
        default: ProposalStatus.PENDENTE 
      }
    },
    
    status_atual: { 
      type: String, 
      enum: Object.values(LeadStatus), 
      required: true,
      index: true
    },
    
    historico_status: [{
      status: { type: String, enum: Object.values(LeadStatus), required: true },
      timestamp: { type: Date, required: true, default: Date.now },
      motivo: { type: String, required: true }
    }],
    
    historico_interacoes: [{
      tipo: { type: String, required: true, index: true },
      dados: { type: Schema.Types.Mixed, required: true },
      timestamp: { type: Date, required: true, default: Date.now },
      custo: Number
    }],
    
    custos: {
      custo_aquisicao: { type: Number, default: 0 },
      custo_motores: { type: Number, default: 0 },
      custo_total: { type: Number, default: 0 },
      detalhamento: [{
        motor: String,
        acao: String,
        custo: Number,
        timestamp: Date
      }]
    },
    
    atribuicao_whatsapp: {
      conexao_id: String,
      numero_wa: String,
      status_conexao: { type: String, enum: Object.values(ConnectionStatus) },
      novas_conversas_hoje: { type: Number, default: 0 },
      data_atribuicao: Date,
      ultimo_envio: Date
    },
    
    agendamentos: [{
      data_hora: { type: Date, required: true },
      motivo: { type: String, required: true },
      operador: { type: String, required: true },
      criado_em: { type: Date, default: Date.now },
      concluido: { type: Boolean, default: false }
    }],
    
    observacoes: [{
      texto: { type: String, required: true },
      operador: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }],
    
    humano_obrigatorio: { type: Boolean, default: false },
    pausar_automacoes: { type: Boolean, default: false },
    origem: { type: String, required: true },
    data_entrada_assinatura: { type: Date, required: true },
    
    criado_em: { type: Date, default: Date.now },
    atualizado_em: { type: Date, default: Date.now }
  },
  {
    timestamps: { createdAt: 'criado_em', updatedAt: 'atualizado_em' }
  }
);

// Indexes
LeadSchema.index({ status_atual: 1, criado_em: -1 });
LeadSchema.index({ 'proposta.id_proposta': 1 });
LeadSchema.index({ origem: 1 });
LeadSchema.index({ humano_obrigatorio: 1 });

// Methods
LeadSchema.methods.addInteraction = function(tipo: string, dados: any, custo?: number) {
  this.historico_interacoes.push({
    tipo,
    dados,
    timestamp: new Date(),
    custo
  });
  
  if (custo) {
    this.custos.custo_motores += custo;
    this.custos.custo_total = this.custos.custo_aquisicao + this.custos.custo_motores;
    this.custos.detalhamento.push({
      motor: tipo.split('_')[1],
      acao: tipo,
      custo,
      timestamp: new Date()
    });
  }
};

LeadSchema.methods.updateStatus = function(novoStatus: LeadStatus, motivo: string) {
  this.historico_status.push({
    status: this.status_atual,
    timestamp: new Date(),
    motivo: `Mudança de ${this.status_atual} para ${novoStatus}: ${motivo}`
  });
  
  this.status_atual = novoStatus;
  
  // Regras automáticas
  if (novoStatus === LeadStatus.VERMELHO) {
    this.pausar_automacoes = true;
  }
  
  if (novoStatus === LeadStatus.ROXO || novoStatus === LeadStatus.BRANCO) {
    this.pausar_automacoes = true;
  }
};

export default mongoose.model<ILead>('Lead', LeadSchema);
