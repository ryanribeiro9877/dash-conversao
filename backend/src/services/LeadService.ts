import Lead, { ILead, LeadStatus, ProposalStatus } from '../models/Lead';
import { v4 as uuidv4 } from 'uuid';
import { addDays, differenceInDays } from 'date-fns';
import logger from '../utils/logger';

interface CreateLeadDTO {
  cpf: string;
  nome_completo: string;
  telefones: Array<{
    numero: string;
    prioridade: number;
    origem: string;
  }>;
  emails: Array<{
    email: string;
    origem: string;
  }>;
  proposta: {
    id_proposta: string;
    data_criacao_proposta: Date;
    valor_liberado: number;
    prazo_meses: number;
    valor_parcela: number;
    banco: string;
    link_assinatura_atual: string;
    data_geracao_link_assinatura: Date;
  };
  origem: string;
  custo_aquisicao: number;
}

class LeadService {
  /**
   * Importa ou atualiza lead que entrou na etapa Assinatura
   */
  async importarLeadAssinatura(dados: CreateLeadDTO): Promise<ILead> {
    try {
      // Busca lead existente pelo CPF
      let lead = await Lead.findOne({ cpf: dados.cpf });

      if (lead) {
        // Atualiza lead existente
        lead.nome_completo = dados.nome_completo;
        lead.telefones = dados.telefones;
        lead.emails = dados.emails;
        lead.proposta = {
          ...dados.proposta,
          status_proposta: ProposalStatus.PENDENTE
        };
        lead.origem = dados.origem;
        lead.data_entrada_assinatura = new Date();

        lead.addInteraction('LEAD_IMPORTADO_ASSINATURA', {
          resultado: 'ATUALIZADO',
          cpf: dados.cpf,
          timestamp: new Date()
        });

        await lead.save();
        logger.info(`Lead ${lead.lead_id} atualizado com sucesso`, { cpf: dados.cpf });
        
        return lead;
      } else {
        // Cria novo lead
        const novoLead = new Lead({
          lead_id: uuidv4(),
          cpf: dados.cpf,
          nome_completo: dados.nome_completo,
          telefones: dados.telefones,
          emails: dados.emails,
          proposta: {
            ...dados.proposta,
            status_proposta: ProposalStatus.PENDENTE
          },
          status_atual: LeadStatus.LARANJA, // Inicia em Laranja (sem interação)
          historico_status: [{
            status: LeadStatus.LARANJA,
            timestamp: new Date(),
            motivo: 'Lead importado da etapa Assinatura'
          }],
          custos: {
            custo_aquisicao: dados.custo_aquisicao,
            custo_motores: 0,
            custo_total: dados.custo_aquisicao,
            detalhamento: []
          },
          origem: dados.origem,
          data_entrada_assinatura: new Date(),
          humano_obrigatorio: false,
          pausar_automacoes: false
        });

        novoLead.addInteraction('LEAD_IMPORTADO_ASSINATURA', {
          resultado: 'CRIADO',
          cpf: dados.cpf,
          timestamp: new Date()
        });

        await novoLead.save();
        logger.info(`Lead ${novoLead.lead_id} criado com sucesso`, { cpf: dados.cpf });
        
        return novoLead;
      }
    } catch (error) {
      logger.error('Erro ao importar lead para assinatura', error);
      throw error;
    }
  }

  /**
   * Busca lead por ID
   */
  async buscarPorId(leadId: string): Promise<ILead | null> {
    return Lead.findOne({ lead_id: leadId });
  }

  /**
   * Busca lead por CPF
   */
  async buscarPorCPF(cpf: string): Promise<ILead | null> {
    return Lead.findOne({ cpf });
  }

  /**
   * Lista leads com filtros
   */
  async listarLeads(filtros: {
    status?: LeadStatus;
    origem?: string;
    humano_obrigatorio?: boolean;
    data_inicio?: Date;
    data_fim?: Date;
    pagina?: number;
    limite?: number;
  }) {
    const { 
      status, 
      origem, 
      humano_obrigatorio, 
      data_inicio, 
      data_fim,
      pagina = 1,
      limite = 50
    } = filtros;

    const query: any = {};

    if (status) query.status_atual = status;
    if (origem) query.origem = origem;
    if (humano_obrigatorio !== undefined) query.humano_obrigatorio = humano_obrigatorio;
    
    if (data_inicio || data_fim) {
      query.data_entrada_assinatura = {};
      if (data_inicio) query.data_entrada_assinatura.$gte = data_inicio;
      if (data_fim) query.data_entrada_assinatura.$lte = data_fim;
    }

    const skip = (pagina - 1) * limite;

    const [leads, total] = await Promise.all([
      Lead.find(query)
        .sort({ criado_em: -1 })
        .skip(skip)
        .limit(limite),
      Lead.countDocuments(query)
    ]);

    return {
      leads,
      total,
      pagina,
      total_paginas: Math.ceil(total / limite)
    };
  }

  /**
   * Atualiza status do lead com regras automáticas
   */
  async atualizarStatus(
    leadId: string, 
    novoStatus: LeadStatus, 
    motivo: string
  ): Promise<ILead> {
    const lead = await this.buscarPorId(leadId);
    if (!lead) {
      throw new Error(`Lead ${leadId} não encontrado`);
    }

    lead.updateStatus(novoStatus, motivo);
    await lead.save();

    logger.info(`Status do lead ${leadId} atualizado para ${novoStatus}`, { motivo });
    
    return lead;
  }

  /**
   * Detecta se link precisa ser renovado (mais de 3 dias)
   */
  precisaRenovarLink(lead: ILead): boolean {
    const diasDesdeGeracao = differenceInDays(
      new Date(),
      lead.proposta.data_geracao_link_assinatura
    );
    return diasDesdeGeracao > 3;
  }

  /**
   * Verifica se proposta está expirada
   */
  async verificarExpiracao(lead: ILead): Promise<boolean> {
    // Lógica de expiração (pode ser configurável)
    const diasDesdeGeracao = differenceInDays(
      new Date(),
      lead.proposta.data_geracao_link_assinatura
    );
    
    const DIAS_EXPIRACAO = 30; // Configurável
    
    if (diasDesdeGeracao > DIAS_EXPIRACAO) {
      await this.atualizarStatus(lead.lead_id, LeadStatus.BRANCO, 'Link/proposta expirada');
      return true;
    }
    
    return false;
  }

  /**
   * Adiciona agendamento
   */
  async adicionarAgendamento(
    leadId: string,
    agendamento: {
      data_hora: Date;
      motivo: string;
      operador: string;
    }
  ): Promise<ILead> {
    const lead = await this.buscarPorId(leadId);
    if (!lead) {
      throw new Error(`Lead ${leadId} não encontrado`);
    }

    lead.agendamentos.push({
      ...agendamento,
      criado_em: new Date(),
      concluido: false
    });

    await lead.save();
    logger.info(`Agendamento adicionado ao lead ${leadId}`);
    
    return lead;
  }

  /**
   * Adiciona observação
   */
  async adicionarObservacao(
    leadId: string,
    observacao: {
      texto: string;
      operador: string;
    }
  ): Promise<ILead> {
    const lead = await this.buscarPorId(leadId);
    if (!lead) {
      throw new Error(`Lead ${leadId} não encontrado`);
    }

    lead.observacoes.push({
      ...observacao,
      timestamp: new Date()
    });

    await lead.save();
    logger.info(`Observação adicionada ao lead ${leadId}`);
    
    return lead;
  }

  /**
   * Marca lead como requerendo humano
   */
  async marcarHumanoObrigatorio(leadId: string, motivo: string): Promise<ILead> {
    const lead = await this.buscarPorId(leadId);
    if (!lead) {
      throw new Error(`Lead ${leadId} não encontrado`);
    }

    lead.humano_obrigatorio = true;
    lead.addInteraction('MARCADO_HUMANO_OBRIGATORIO', { motivo, timestamp: new Date() });
    
    await lead.save();
    logger.info(`Lead ${leadId} marcado como humano obrigatório`, { motivo });
    
    return lead;
  }

  /**
   * Dashboard: estatísticas por cor/status
   */
  async estatisticasPorStatus() {
    const stats = await Lead.aggregate([
      {
        $group: {
          _id: '$status_atual',
          total: { $sum: 1 },
          custo_total: { $sum: '$custos.custo_total' }
        }
      }
    ]);

    return stats.reduce((acc: any, stat: any) => {
      acc[stat._id] = {
        total: stat.total,
        custo_total: stat.custo_total
      };
      return acc;
    }, {});
  }

  /**
   * Dashboard: leads que precisam de atenção humana
   */
  async leadsHumanoObrigatorio() {
    return Lead.find({ humano_obrigatorio: true, pausar_automacoes: false })
      .sort({ criado_em: -1 })
      .limit(100);
  }
}

export default new LeadService();
