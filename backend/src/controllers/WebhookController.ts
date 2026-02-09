import { Request, Response } from 'express';
import MarketingEnginesService from '../services/MarketingEnginesService';
import WhatsAppService from '../services/WhatsAppService';
import LeadService from '../services/LeadService';
import { ProposalStatus, LeadStatus } from '../models/Lead';
import logger from '../utils/logger';

class WebhookController {
  /**
   * Webhook: Gatilho de conversão (digitou 1 / clique)
   */
  async conversionTrigger(req: Request, res: Response) {
    try {
      const { lead_id, cpf, trigger_source } = req.body;
      
      const leadId = lead_id || (await LeadService.buscarPorCPF(cpf))?.lead_id;
      
      if (!leadId) {
        return res.status(404).json({
          success: false,
          error: 'Lead não encontrado'
        });
      }
      
      // Processa gatilho WhatsApp
      await WhatsAppService.processarGatilho(leadId, trigger_source);
      
      return res.status(200).json({
        success: true,
        message: 'Gatilho processado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao processar gatilho de conversão', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar gatilho'
      });
    }
  }

  /**
   * Webhook: Eventos de RCS
   */
  async rcsEvent(req: Request, res: Response) {
    try {
      const { lead_id, campanha_id, event_type, timestamp } = req.body;
      
      await MarketingEnginesService.processarWebhookRCS({
        lead_id,
        campanha_id,
        event_type,
        timestamp: new Date(timestamp)
      });
      
      return res.status(200).json({
        success: true,
        message: 'Evento RCS processado'
      });
    } catch (error) {
      logger.error('Erro ao processar webhook RCS', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar evento'
      });
    }
  }

  /**
   * Webhook: Eventos de SMS
   */
  async smsEvent(req: Request, res: Response) {
    try {
      const { lead_id, campanha_id, event_type, timestamp } = req.body;
      
      await MarketingEnginesService.processarWebhookSMS({
        lead_id,
        campanha_id,
        event_type,
        timestamp: new Date(timestamp)
      });
      
      return res.status(200).json({
        success: true,
        message: 'Evento SMS processado'
      });
    } catch (error) {
      logger.error('Erro ao processar webhook SMS', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar evento'
      });
    }
  }

  /**
   * Webhook: Eventos de Email
   */
  async emailEvent(req: Request, res: Response) {
    try {
      const { lead_id, campanha_id, event_type, timestamp } = req.body;
      
      await MarketingEnginesService.processarWebhookEmail({
        lead_id,
        campanha_id,
        event_type,
        timestamp: new Date(timestamp)
      });
      
      return res.status(200).json({
        success: true,
        message: 'Evento Email processado'
      });
    } catch (error) {
      logger.error('Erro ao processar webhook Email', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar evento'
      });
    }
  }

  /**
   * Webhook: Status de proposta (PAGO/PENDENCIA/EXPIRADA)
   */
  async proposalStatus(req: Request, res: Response) {
    try {
      const { lead_id, cpf, id_proposta, status, motivo } = req.body;
      
      const leadId = lead_id || (await LeadService.buscarPorCPF(cpf))?.lead_id;
      
      if (!leadId) {
        return res.status(404).json({
          success: false,
          error: 'Lead não encontrado'
        });
      }
      
      const lead = await LeadService.buscarPorId(leadId);
      if (!lead) {
        return res.status(404).json({
          success: false,
          error: 'Lead não encontrado'
        });
      }
      
      // Atualiza status da proposta
      lead.proposta.status_proposta = status as ProposalStatus;
      
      // Atualiza status do lead baseado na proposta
      if (status === 'PAGO') {
        await LeadService.atualizarStatus(leadId, LeadStatus.ROXO, 'Proposta paga');
        
        // Envia comunicações de parabéns
        await MarketingEnginesService.enviarEmail(leadId, 'PARABENS_PAGO');
        
      } else if (status === 'PENDENCIA') {
        await LeadService.atualizarStatus(leadId, LeadStatus.AZUL, `Pendência: ${motivo}`);
        
      } else if (status === 'EXPIRADA') {
        await LeadService.atualizarStatus(leadId, LeadStatus.BRANCO, 'Proposta expirada');
      }
      
      lead.addInteraction('PROPOSTA_STATUS_ATUALIZADO', {
        id_proposta,
        status,
        motivo,
        timestamp: new Date()
      });
      
      await lead.save();
      
      logger.info(`Status de proposta atualizado para lead ${leadId}`, { status });
      
      return res.status(200).json({
        success: true,
        message: 'Status de proposta atualizado'
      });
    } catch (error) {
      logger.error('Erro ao processar status de proposta', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar status'
      });
    }
  }
}

export default new WebhookController();
