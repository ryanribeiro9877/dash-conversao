import Lead, { ILead, LeadStatus, ConnectionStatus } from '../models/Lead';
import WhatsAppConnection, { WhatsAppConnectionStatus } from '../models/WhatsAppConnection';
import MessageTemplate, { TemplateContext } from '../models/MessageTemplate';
import LeadService from './LeadService';
import logger from '../utils/logger';
import axios from 'axios';
import { differenceInDays } from 'date-fns';

class WhatsAppService {
  private readonly CUSTO_MENSAGEM = parseInt(process.env.COST_WHATSAPP_MESSAGE || '5');
  private readonly LIMITE_CONVERSAS_DIA = 25;

  /**
   * Processa gatilho (digitou 1 / clique) e gerencia roleta
   */
  async processarGatilho(leadId: string, triggerSource: string): Promise<void> {
    try {
      const lead = await LeadService.buscarPorId(leadId);
      if (!lead) {
        throw new Error(`Lead ${leadId} não encontrado`);
      }

      logger.info(`Processando gatilho WhatsApp para lead ${leadId}`, { triggerSource });

      // Verifica ou atribui conexão WhatsApp
      const conexao = await this.gerenciarAtribuicaoConexao(lead);

      // Determina tipo de mensagem baseado na data do link
      const precisaNovoLink = LeadService.precisaRenovarLink(lead);

      // Envia mensagem apropriada
      await this.enviarMensagem(lead, conexao, precisaNovoLink, triggerSource);

      logger.info(`Mensagem WhatsApp enviada para lead ${leadId}`, {
        conexao: conexao.conexao_id,
        precisaNovoLink
      });

    } catch (error) {
      logger.error(`Erro ao processar gatilho WhatsApp para lead ${leadId}`, error);
      throw error;
    }
  }

  /**
   * Gerencia atribuição de conexão (roleta, retenção, failover)
   */
  private async gerenciarAtribuicaoConexao(lead: ILead): Promise<any> {
    // Verifica se já tem conversa iniciada
    if (lead.atribuicao_whatsapp?.conexao_id) {
      const statusConexao = await this.verificarStatusConexao(
        lead.atribuicao_whatsapp.conexao_id
      );

      // RETENÇÃO: se conexão está ATIVA, mantém
      if (statusConexao === WhatsAppConnectionStatus.ATIVA) {
        logger.info(`Mantendo lead ${lead.lead_id} na conexão ${lead.atribuicao_whatsapp.conexao_id} (RETENÇÃO)`);
        
        lead.addInteraction('WHATSAPP_ATRIBUICAO', {
          conexao_id: lead.atribuicao_whatsapp.conexao_id,
          numero_wa: lead.atribuicao_whatsapp.numero_wa,
          tipo: 'RETENCAO',
          timestamp: new Date()
        });
        
        await lead.save();
        
        return {
          conexao_id: lead.atribuicao_whatsapp.conexao_id,
          numero_wa: lead.atribuicao_whatsapp.numero_wa
        };
      }

      // FAILOVER: se conexão está BANIDA/OFFLINE, reatribui
      logger.info(`Conexão ${lead.atribuicao_whatsapp.conexao_id} está ${statusConexao}, reatribuindo (FAILOVER)`);
    }

    // NOVO ou FAILOVER: busca próxima conexão disponível na roleta
    const novaConexao = await this.obterProximaConexaoRoleta();

    if (!novaConexao) {
      throw new Error('Nenhuma conexão WhatsApp disponível na roleta');
    }

    // Atribui e incrementa contador
    lead.atribuicao_whatsapp = {
      conexao_id: novaConexao.conexao_id,
      numero_wa: novaConexao.numero_wa,
      status_conexao: ConnectionStatus.ATIVA,
      novas_conversas_hoje: novaConexao.novas_conversas_hoje + 1,
      data_atribuicao: new Date(),
      ultimo_envio: new Date()
    };

    lead.addInteraction('WHATSAPP_ATRIBUICAO', {
      conexao_id: novaConexao.conexao_id,
      numero_wa: novaConexao.numero_wa,
      tipo: lead.atribuicao_whatsapp?.conexao_id ? 'FAILOVER' : 'NOVO',
      timestamp: new Date()
    });

    await lead.save();

    // Incrementa contador da conexão
    novaConexao.incrementarContador();
    await novaConexao.save();

    logger.info(`Lead ${lead.lead_id} atribuído à conexão ${novaConexao.conexao_id}`, {
      tipo: lead.atribuicao_whatsapp?.conexao_id ? 'FAILOVER' : 'NOVO',
      contador: novaConexao.novas_conversas_hoje
    });

    return {
      conexao_id: novaConexao.conexao_id,
      numero_wa: novaConexao.numero_wa
    };
  }

  /**
   * Obtém próxima conexão disponível na roleta
   */
  private async obterProximaConexaoRoleta(): Promise<any> {
    const conexao = await WhatsAppConnection.obterProximaConexaoDisponivel();
    
    if (!conexao) {
      logger.error('Nenhuma conexão WhatsApp disponível no pool');
      return null;
    }

    return conexao;
  }

  /**
   * Verifica status de uma conexão
   */
  private async verificarStatusConexao(conexaoId: string): Promise<WhatsAppConnectionStatus> {
    const conexao = await WhatsAppConnection.findOne({ conexao_id: conexaoId });
    return conexao?.status || WhatsAppConnectionStatus.OFFLINE;
  }

  /**
   * Envia mensagem pelo WhatsApp
   */
  private async enviarMensagem(
    lead: ILead,
    conexao: any,
    precisaNovoLink: boolean,
    triggerSource: string
  ): Promise<void> {
    try {
      let contexto: TemplateContext;
      let incluirLink = false;

      // Determina contexto e se deve incluir link
      if (precisaNovoLink) {
        // Mais de 3 dias: envia novo link
        contexto = TemplateContext.WHATSAPP_CUTUCADA_MAIS_3_DIAS;
        incluirLink = true;
        
        // Aqui deveria gerar novo link via API do dashboard original
        // lead.proposta.link_assinatura_atual = await this.gerarNovoLink(lead);
        // lead.proposta.data_geracao_link_assinatura = new Date();
        
      } else {
        // Menos de 3 dias: cutucada sem link
        contexto = TemplateContext.WHATSAPP_CUTUCADA_MENOS_3_DIAS;
        incluirLink = false;
      }

      // Busca template randômico
      const template = await MessageTemplate.obterTemplateAleatorio(contexto);

      // Substitui variáveis
      const mensagem = MessageTemplate.substituirVariaveis(template, {
        nome_completo: lead.nome_completo,
        valor_liberado: lead.proposta.valor_liberado.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        valor_parcela: lead.proposta.valor_parcela.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        link_assinatura: incluirLink ? lead.proposta.link_assinatura_atual : '',
        banco: lead.proposta.banco
      });

      // Envia via API do WhatsApp
      const response = await axios.post(
        `${process.env.WHATSAPP_API_URL}/send`,
        {
          conexao_id: conexao.conexao_id,
          numero_destino: lead.telefones[0].numero,
          mensagem,
          lead_id: lead.lead_id,
          incluir_link: incluirLink,
          link: incluirLink ? lead.proposta.link_assinatura_atual : null
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Registra interação
      lead.addInteraction('WHATSAPP_MENSAGEM_ENVIADA', {
        conexao_id: conexao.conexao_id,
        numero_wa: conexao.numero_wa,
        trigger_source: triggerSource,
        contexto,
        incluiu_link: incluirLink,
        timestamp: new Date(),
        response_id: response.data.message_id
      }, this.CUSTO_MENSAGEM);

      // Atualiza último envio
      if (lead.atribuicao_whatsapp) {
        lead.atribuicao_whatsapp.ultimo_envio = new Date();
      }

      await lead.save();

      logger.info(`Mensagem WhatsApp enviada com sucesso`, {
        lead_id: lead.lead_id,
        conexao_id: conexao.conexao_id,
        incluiu_link: incluirLink
      });

    } catch (error) {
      logger.error(`Erro ao enviar mensagem WhatsApp`, error);
      throw error;
    }
  }

  /**
   * Reset diário dos contadores (executar via CRON)
   */
  async resetarContadoresDiarios(): Promise<void> {
    try {
      await WhatsAppConnection.resetarContadoresDiarios();
      logger.info('Contadores diários de WhatsApp resetados com sucesso');
    } catch (error) {
      logger.error('Erro ao resetar contadores diários', error);
      throw error;
    }
  }

  /**
   * Inicializa pool de conexões WhatsApp (executar no startup)
   */
  async inicializarPoolConexoes(): Promise<void> {
    try {
      const total = await WhatsAppConnection.countDocuments();
      
      if (total === 0) {
        logger.info('Pool de conexões WhatsApp vazio, criando 20 conexões...');
        
        const conexoes = [];
        for (let i = 1; i <= 20; i++) {
          conexoes.push({
            conexao_id: `WA_CONN_${i.toString().padStart(2, '0')}`,
            numero_wa: `5511${90000000 + i}`, // Números fictícios
            nome_conexao: `Conexão WhatsApp ${i}`,
            status: WhatsAppConnectionStatus.ATIVA,
            novas_conversas_hoje: 0,
            limite_diario: 25,
            metadata: {
              ultimas_mensagens: []
            }
          });
        }
        
        await WhatsAppConnection.insertMany(conexoes);
        logger.info('20 conexões WhatsApp criadas com sucesso');
      } else {
        logger.info(`Pool de conexões WhatsApp já possui ${total} conexões`);
      }
    } catch (error) {
      logger.error('Erro ao inicializar pool de conexões', error);
      throw error;
    }
  }

  /**
   * Atualiza status de uma conexão (para quando for banida/offline)
   */
  async atualizarStatusConexao(
    conexaoId: string, 
    novoStatus: WhatsAppConnectionStatus
  ): Promise<void> {
    try {
      const conexao = await WhatsAppConnection.findOne({ conexao_id: conexaoId });
      
      if (!conexao) {
        throw new Error(`Conexão ${conexaoId} não encontrada`);
      }

      conexao.status = novoStatus;
      await conexao.save();

      logger.info(`Status da conexão ${conexaoId} atualizado para ${novoStatus}`);

      // Se banida/offline, realocar leads ativos
      if (novoStatus !== WhatsAppConnectionStatus.ATIVA) {
        await this.realocarLeadsConexao(conexaoId);
      }
    } catch (error) {
      logger.error(`Erro ao atualizar status da conexão ${conexaoId}`, error);
      throw error;
    }
  }

  /**
   * Realoca leads de uma conexão banida/offline
   */
  private async realocarLeadsConexao(conexaoId: string): Promise<void> {
    try {
      const leads = await Lead.find({
        'atribuicao_whatsapp.conexao_id': conexaoId
      });

      logger.info(`Realocando ${leads.length} leads da conexão ${conexaoId}`);

      for (const lead of leads) {
        await this.gerenciarAtribuicaoConexao(lead);
      }
    } catch (error) {
      logger.error(`Erro ao realocar leads da conexão ${conexaoId}`, error);
    }
  }
}

export default new WhatsAppService();
