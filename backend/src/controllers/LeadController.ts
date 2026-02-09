import { Request, Response } from 'express';
import LeadService from '../services/LeadService';
import { LeadStatus } from '../models/Lead';
import logger from '../utils/logger';

class LeadController {
  /**
   * Importa lead da etapa Assinatura
   */
  async importarAssinatura(req: Request, res: Response) {
    try {
      const dados = req.body;
      
      const lead = await LeadService.importarLeadAssinatura(dados);
      
      return res.status(201).json({
        success: true,
        data: lead
      });
    } catch (error) {
      logger.error('Erro ao importar lead', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao importar lead'
      });
    }
  }

  /**
   * Busca lead por ID
   */
  async buscarPorId(req: Request, res: Response) {
    try {
      const { leadId } = req.params;
      
      const lead = await LeadService.buscarPorId(leadId);
      
      if (!lead) {
        return res.status(404).json({
          success: false,
          error: 'Lead não encontrado'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: lead
      });
    } catch (error) {
      logger.error('Erro ao buscar lead', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar lead'
      });
    }
  }

  /**
   * Lista leads com filtros
   */
  async listar(req: Request, res: Response) {
    try {
      const { status, origem, humano_obrigatorio, data_inicio, data_fim, pagina, limite } = req.query;
      
      const resultado = await LeadService.listarLeads({
        status: status as LeadStatus,
        origem: origem as string,
        humano_obrigatorio: humano_obrigatorio === 'true',
        data_inicio: data_inicio ? new Date(data_inicio as string) : undefined,
        data_fim: data_fim ? new Date(data_fim as string) : undefined,
        pagina: pagina ? parseInt(pagina as string) : 1,
        limite: limite ? parseInt(limite as string) : 50
      });
      
      return res.status(200).json({
        success: true,
        data: resultado
      });
    } catch (error) {
      logger.error('Erro ao listar leads', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao listar leads'
      });
    }
  }

  /**
   * Atualiza status do lead
   */
  async atualizarStatus(req: Request, res: Response) {
    try {
      const { leadId } = req.params;
      const { status, motivo } = req.body;
      
      const lead = await LeadService.atualizarStatus(leadId, status, motivo);
      
      return res.status(200).json({
        success: true,
        data: lead
      });
    } catch (error) {
      logger.error('Erro ao atualizar status', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar status'
      });
    }
  }

  /**
   * Adiciona agendamento
   */
  async adicionarAgendamento(req: Request, res: Response) {
    try {
      const { leadId } = req.params;
      const agendamento = req.body;
      
      const lead = await LeadService.adicionarAgendamento(leadId, agendamento);
      
      return res.status(200).json({
        success: true,
        data: lead
      });
    } catch (error) {
      logger.error('Erro ao adicionar agendamento', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao adicionar agendamento'
      });
    }
  }

  /**
   * Adiciona observação
   */
  async adicionarObservacao(req: Request, res: Response) {
    try {
      const { leadId } = req.params;
      const observacao = req.body;
      
      const lead = await LeadService.adicionarObservacao(leadId, observacao);
      
      return res.status(200).json({
        success: true,
        data: lead
      });
    } catch (error) {
      logger.error('Erro ao adicionar observação', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao adicionar observação'
      });
    }
  }

  /**
   * Estatísticas por status
   */
  async estatisticas(req: Request, res: Response) {
    try {
      const stats = await LeadService.estatisticasPorStatus();
      
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Erro ao buscar estatísticas', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar estatísticas'
      });
    }
  }

  /**
   * Leads que requerem atenção humana
   */
  async humanoObrigatorio(req: Request, res: Response) {
    try {
      const leads = await LeadService.leadsHumanoObrigatorio();
      
      return res.status(200).json({
        success: true,
        data: leads
      });
    } catch (error) {
      logger.error('Erro ao buscar leads humano obrigatório', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar leads'
      });
    }
  }
}

export default new LeadController();
