import mongoose, { Document, Schema } from 'mongoose';

export enum WhatsAppConnectionStatus {
  ATIVA = 'ATIVA',
  BANIDA = 'BANIDA',
  OFFLINE = 'OFFLINE',
  MANUTENCAO = 'MANUTENCAO'
}

export interface IWhatsAppConnection extends Document {
  conexao_id: string;
  numero_wa: string;
  nome_conexao: string;
  status: WhatsAppConnectionStatus;
  novas_conversas_hoje: number;
  limite_diario: number;
  ultima_mensagem: Date;
  criado_em: Date;
  atualizado_em: Date;
  metadata: {
    api_key?: string;
    webhook_url?: string;
    ultimas_mensagens: Array<{
      lead_id: string;
      timestamp: Date;
    }>;
  };
}

const WhatsAppConnectionSchema: Schema = new Schema(
  {
    conexao_id: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true 
    },
    numero_wa: { 
      type: String, 
      required: true, 
      unique: true 
    },
    nome_conexao: { 
      type: String, 
      required: true 
    },
    status: { 
      type: String, 
      enum: Object.values(WhatsAppConnectionStatus), 
      default: WhatsAppConnectionStatus.ATIVA,
      index: true
    },
    novas_conversas_hoje: { 
      type: Number, 
      default: 0,
      index: true
    },
    limite_diario: { 
      type: Number, 
      default: 25 
    },
    ultima_mensagem: { 
      type: Date 
    },
    metadata: {
      api_key: String,
      webhook_url: String,
      ultimas_mensagens: [{
        lead_id: String,
        timestamp: Date
      }]
    },
    criado_em: { type: Date, default: Date.now },
    atualizado_em: { type: Date, default: Date.now }
  },
  {
    timestamps: { createdAt: 'criado_em', updatedAt: 'atualizado_em' }
  }
);

// Indexes
WhatsAppConnectionSchema.index({ status: 1, novas_conversas_hoje: 1 });

// Methods
WhatsAppConnectionSchema.methods.podeReceberNovaMensagem = function(): boolean {
  return (
    this.status === WhatsAppConnectionStatus.ATIVA &&
    this.novas_conversas_hoje < this.limite_diario
  );
};

WhatsAppConnectionSchema.methods.incrementarContador = function() {
  this.novas_conversas_hoje += 1;
  this.ultima_mensagem = new Date();
};

// Statics
WhatsAppConnectionSchema.statics.resetarContadoresDiarios = async function() {
  return this.updateMany(
    {},
    { 
      $set: { novas_conversas_hoje: 0 },
      $push: {
        'metadata.historico_diario': {
          data: new Date(),
          total_conversas: '$novas_conversas_hoje'
        }
      }
    }
  );
};

WhatsAppConnectionSchema.statics.obterProximaConexaoDisponivel = async function() {
  return this.findOne({
    status: WhatsAppConnectionStatus.ATIVA,
    novas_conversas_hoje: { $lt: 25 }
  }).sort({ novas_conversas_hoje: 1, ultima_mensagem: 1 });
};

export default mongoose.model<IWhatsAppConnection>('WhatsAppConnection', WhatsAppConnectionSchema);
