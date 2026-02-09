import Lead, { ILead, LeadStatus } from '../models/Lead';
import MessageTemplate, { TemplateContext } from '../models/MessageTemplate';
import LeadService from './LeadService';
import WhatsAppService from './WhatsAppService';
import logger from '../utils/logger';
import axios from 'axios';

class MarketingEnginesService {
  private readonly CUSTO_RCS = parseInt(process.env.COST_RCS || '15');
  private readonly CUSTO_SMS = parseInt(process.env.COST_SMS || '10');
  private readonly CUSTO_EMAIL = parseInt(process.env.COST_EMAIL || '5');

  /**
   * Envia mensagem RCS
   */
  async enviarRCS(leadId: string): Promise<void> {
    try {
      const lead = await LeadService.buscarPorId(leadId);
      if (!lead || lead.pausar_automacoes) return;

      const template = await MessageTemplate.obterTemplateAleatorio(TemplateContext.RCS_INICIAL);
      const mensagem = MessageTemplate.substituirVariaveis(template, this.getDadosLead(lead));
      
      const linkRastreavel = `${lead.proposta.link_assinatura_atual}?utm_source=rcs&lead_id=${leadId}`;

      const response = await axios.post(
        `${process.env.RCS_API_URL}/send`,
        {
          telefone: lead.telefones[0].numero,
          mensagem,
          link: linkRastreavel,
          lead_id: leadId
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.RCS_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      lead.addInteraction('MOTOR_RCS_EVENTO', {
        tipo: 'ENVIADO',
        campanha_id: response.data.campanha_id,
        link: linkRastreavel,
        timestamp: new Date()
      }, this.CUSTO_RCS);

      await lead.save();
      logger.info(`RCS enviado para lead ${leadId}`);

    } catch (error) {
      logger.error(`Erro ao enviar RCS para lead ${leadId}`, error);
    }
  }

  /**
   * Envia SMS (fallback do RCS)
   */
  async enviarSMS(leadId: string): Promise<void> {
    try {
      const lead = await LeadService.buscarPorId(leadId);
      if (!lead || lead.pausar_automacoes) return;

      const template = await MessageTemplate.obterTemplateAleatorio(TemplateContext.SMS_INICIAL);
      const mensagem = MessageTemplate.substituirVariaveis(template, this.getDadosLead(lead));
      
      const linkRastreavel = `${lead.proposta.link_assinatura_atual}?utm_source=sms&lead_id=${leadId}`;

      const response = await axios.post(
        `${process.env.SMS_API_URL}/send`,
        {
          telefone: lead.telefones[0].numero,
          mensagem: `${mensagem} ${linkRastreavel}`,
          lead_id: leadId
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.SMS_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      lead.addInteraction('MOTOR_SMS_EVENTO', {
        tipo: 'ENVIADO',
        campanha_id: response.data.campanha_id,
        link: linkRastreavel,
        timestamp: new Date()
      }, this.CUSTO_SMS);

      await lead.save();
      logger.info(`SMS enviado para lead ${leadId}`);

    } catch (error) {
      logger.error(`Erro ao enviar SMS para lead ${leadId}`, error);
    }
  }

  /**
   * Envia Email Marketing
   */
  async enviarEmail(leadId: string, contexto: 'INICIAL' | 'PARABENS_PAGO' = 'INICIAL'): Promise<void> {
    try {
      const lead = await LeadService.buscarPorId(leadId);
      if (!lead) return;

      // Se contexto PARABENS, não verifica pausar_automacoes
      if (contexto === 'INICIAL' && lead.pausar_automacoes) return;

      const templateContext = contexto === 'PARABENS_PAGO' 
        ? TemplateContext.EMAIL_PARABENS_PAGO 
        : TemplateContext.EMAIL_INICIAL;

      const template = await MessageTemplate.obterTemplateAleatorio(templateContext);
      const assunto = template.titulo;
      const conteudo = MessageTemplate.substituirVariaveis(template, this.getDadosLead(lead));
      
      const linkRastreavel = contexto === 'INICIAL'
        ? `${lead.proposta.link_assinatura_atual}?utm_source=email&lead_id=${leadId}`
        : null;

      const response = await axios.post(
        `${process.env.EMAIL_API_URL}/send`,
        {
          email: lead.emails[0].email,
          assunto,
          conteudo,
          link: linkRastreavel,
          lead_id: leadId
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.EMAIL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      lead.addInteraction('MOTOR_EMAIL_EVENTO', {
        tipo: 'ENVIADO',
        contexto,
        campanha_id: response.data.campanha_id,
        assunto,
        link: linkRastreavel,
        timestamp: new Date()
      }, this.CUSTO_EMAIL);

      await lead.save();
      logger.info(`Email ${contexto} enviado para lead ${leadId}`);

    } catch (error) {
      logger.error(`Erro ao enviar Email para lead ${leadId}`, error);
    }
  }

  /**
   * Processa webhook de abertura/clique de RCS
   */
  async processarWebhookRCS(dados: {
    lead_id: string;
    campanha_id: string;
    event_type: 'ENTREGUE' | 'ABERTO' | 'CLICADO';
    timestamp: Date;
  }): Promise<void> {
    try {
      const lead = await LeadService.buscarPorId(dados.lead_id);
      if (!lead) return;

      lead.addInteraction('MOTOR_RCS_EVENTO', {
        tipo: dados.event_type,
        campanha_id: dados.campanha_id,
        timestamp: dados.timestamp
      });

      // Se clicou, dispara fluxo WhatsApp
      if (dados.event_type === 'CLICADO') {
        await LeadService.atualizarStatus(
          dados.lead_id,
          LeadStatus.VERDE,
          'Cliente clicou no link do RCS'
        );
        
        await WhatsAppService.processarGatilho(dados.lead_id, 'RCS_CLIQUE');
      }

      await lead.save();
      logger.info(`Webhook RCS processado para lead ${dados.lead_id}`, { event_type: dados.event_type });

    } catch (error) {
      logger.error(`Erro ao processar webhook RCS`, error);
    }
  }

  /**
   * Processa webhook de SMS
   */
  async processarWebhookSMS(dados: {
    lead_id: string;
    campanha_id: string;
    event_type: 'ENTREGUE' | 'CLICADO';
    timestamp: Date;
  }): Promise<void> {
    try {
      const lead = await LeadService.buscarPorId(dados.lead_id);
      if (!lead) return;

      lead.addInteraction('MOTOR_SMS_EVENTO', {
        tipo: dados.event_type,
        campanha_id: dados.campanha_id,
        timestamp: dados.timestamp
      });

      if (dados.event_type === 'CLICADO') {
        await LeadService.atualizarStatus(
          dados.lead_id,
          LeadStatus.VERDE,
          'Cliente clicou no link do SMS'
        );
        
        await WhatsAppService.processarGatilho(dados.lead_id, 'SMS_CLIQUE');
      }

      await lead.save();
      logger.info(`Webhook SMS processado para lead ${dados.lead_id}`, { event_type: dados.event_type });

    } catch (error) {
      logger.error(`Erro ao processar webhook SMS`, error);
    }
  }

  /**
   * Processa webhook de Email
   */
  async processarWebhookEmail(dados: {
    lead_id: string;
    campanha_id: string;
    event_type: 'ENTREGUE' | 'ABERTO' | 'CLICADO';
    timestamp: Date;
  }): Promise<void> {
    try {
      const lead = await LeadService.buscarPorId(dados.lead_id);
      if (!lead) return;

      lead.addInteraction('MOTOR_EMAIL_EVENTO', {
        tipo: dados.event_type,
        campanha_id: dados.campanha_id,
        timestamp: dados.timestamp
      });

      if (dados.event_type === 'CLICADO') {
        await LeadService.atualizarStatus(
          dados.lead_id,
          LeadStatus.VERDE,
          'Cliente clicou no link do Email'
        );
        
        await WhatsAppService.processarGatilho(dados.lead_id, 'EMAIL_CLIQUE');
      }

      await lead.save();
      logger.info(`Webhook Email processado para lead ${dados.lead_id}`, { event_type: dados.event_type });

    } catch (error) {
      logger.error(`Erro ao processar webhook Email`, error);
    }
  }

  /**
   * Extrai dados formatados do lead para templates
   */
  private getDadosLead(lead: ILead): Record<string, string> {
    return {
      nome_completo: lead.nome_completo,
      valor_liberado: lead.proposta.valor_liberado.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }),
      valor_parcela: lead.proposta.valor_parcela.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }),
      prazo_meses: lead.proposta.prazo_meses.toString(),
      banco: lead.proposta.banco,
      link_assinatura: lead.proposta.link_assinatura_atual
    };
  }
}

export default new MarketingEnginesService();
