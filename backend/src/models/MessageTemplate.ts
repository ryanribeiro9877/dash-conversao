import mongoose, { Document, Schema } from 'mongoose';

export enum TemplateContext {
  WHATSAPP_INICIAL = 'WHATSAPP_INICIAL',
  WHATSAPP_CUTUCADA_MENOS_3_DIAS = 'WHATSAPP_CUTUCADA_MENOS_3_DIAS',
  WHATSAPP_CUTUCADA_MAIS_3_DIAS = 'WHATSAPP_CUTUCADA_MAIS_3_DIAS',
  WHATSAPP_REATIVACAO = 'WHATSAPP_REATIVACAO',
  IA_CALL_JANELA_1 = 'IA_CALL_JANELA_1',
  IA_CALL_JANELA_2 = 'IA_CALL_JANELA_2',
  IA_CALL_JANELA_3 = 'IA_CALL_JANELA_3',
  IA_CALL_RELIGACAO = 'IA_CALL_RELIGACAO',
  RCS_INICIAL = 'RCS_INICIAL',
  SMS_INICIAL = 'SMS_INICIAL',
  EMAIL_INICIAL = 'EMAIL_INICIAL',
  EMAIL_PARABENS_PAGO = 'EMAIL_PARABENS_PAGO'
}

export interface IMessageTemplate extends Document {
  contexto: TemplateContext;
  titulo: string;
  conteudo: string;
  variaveis: string[]; // Ex: ['nome_completo', 'valor_liberado', 'link_assinatura']
  ativo: boolean;
  prioridade: number; // Peso para seleção aleatória
  criado_em: Date;
  atualizado_em: Date;
}

const MessageTemplateSchema: Schema = new Schema(
  {
    contexto: {
      type: String,
      enum: Object.values(TemplateContext),
      required: true,
      index: true
    },
    titulo: {
      type: String,
      required: true
    },
    conteudo: {
      type: String,
      required: true
    },
    variaveis: [{
      type: String
    }],
    ativo: {
      type: Boolean,
      default: true,
      index: true
    },
    prioridade: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    },
    criado_em: { type: Date, default: Date.now },
    atualizado_em: { type: Date, default: Date.now }
  },
  {
    timestamps: { createdAt: 'criado_em', updatedAt: 'atualizado_em' }
  }
);

// Indexes
MessageTemplateSchema.index({ contexto: 1, ativo: 1 });

// Statics
MessageTemplateSchema.statics.obterTemplateAleatorio = async function(contexto: TemplateContext) {
  const templates = await this.find({ contexto, ativo: true });
  
  if (templates.length === 0) {
    throw new Error(`Nenhum template ativo encontrado para contexto: ${contexto}`);
  }
  
  // Seleção ponderada baseada na prioridade
  const totalPeso = templates.reduce((sum: number, t: any) => sum + t.prioridade, 0);
  let random = Math.random() * totalPeso;
  
  for (const template of templates) {
    random -= template.prioridade;
    if (random <= 0) {
      return template;
    }
  }
  
  return templates[templates.length - 1];
};

MessageTemplateSchema.statics.substituirVariaveis = function(
  template: IMessageTemplate, 
  dados: Record<string, any>
): string {
  let conteudo = template.conteudo;
  
  template.variaveis.forEach(variavel => {
    const regex = new RegExp(`\\{\\{${variavel}\\}\\}`, 'g');
    conteudo = conteudo.replace(regex, dados[variavel] || '');
  });
  
  return conteudo;
};

export default mongoose.model<IMessageTemplate>('MessageTemplate', MessageTemplateSchema);
