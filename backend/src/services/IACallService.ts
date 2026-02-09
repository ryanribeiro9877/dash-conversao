import Lead, { ILead, CallResult, LeadStatus } from '../models/Lead';
import MessageTemplate, { TemplateContext } from '../models/MessageTemplate';
import LeadService from './LeadService';
import logger from '../utils/logger';
import axios from 'axios';

interface CallAttempt {
  telefone: string;
  prompt_id: string;
  resultado_chamada: CallResult;
  timestamp: Date;
  custo: number;
}

class IACallService {
  private readonly MAX_TENTATIVAS = 6;
  private readonly JANELAS_HORARIO = ['08:00', '12:00', '19:00'];
  private readonly CUSTO_CHAMADA = parseInt(process.env.COST_IA_CALL || '50');
  
  // Tempos de religação em minutos
  private readonly TEMPOS_RELIGACAO = [5, 10, 20];

  /**
   * Inicia ciclo de ligações para um lead
   */
  async iniciarCicloLigacoes(leadId: string): Promise<void> {
    try {
      const lead = await LeadService.buscarPorId(leadId);
      if (!lead) {
        throw new Error(`Lead ${leadId} não encontrado`);
      }

      // Verifica se pode iniciar automação
      if (!this.podeIniciarAutomacao(lead)) {
        logger.info(`Lead ${leadId} não elegível para automação de IA`, {
          motivo: 'Pausado ou sem telefone/proposta'
        });
        return;
      }

      // Separa telefones em Lista A (LP) e Lista B (enriquecidos)
      const listaA = lead.telefones.filter(t => t.prioridade === 1 && !t.inapto);
      const listaB = lead.telefones.filter(t => t.prioridade > 1 && !t.inapto);

      logger.info(`Ciclo de ligações iniciado para lead ${leadId}`, {
        listaA: listaA.length,
        listaB: listaB.length
      });

      // Tenta Lista A primeiro
      await this.tentarLigacoesLista(lead, listaA, 'A');
      
      // Se necessário, tenta Lista B
      if (this.precisaContinuarTentativas(lead)) {
        await this.tentarLigacoesLista(lead, listaB, 'B');
      }

    } catch (error) {
      logger.error(`Erro ao iniciar ciclo de ligações para lead ${leadId}`, error);
      throw error;
    }
  }

  /**
   * Tenta ligações em uma lista de telefones
   */
  private async tentarLigacoesLista(
    lead: ILead, 
    telefones: typeof lead.telefones,
    lista: 'A' | 'B'
  ): Promise<void> {
    for (const telefone of telefones) {
      if (this.atingiuLimiteTentativas(lead)) {
        logger.info(`Lead ${lead.lead_id} atingiu limite de ${this.MAX_TENTATIVAS} tentativas`);
        break;
      }

      const resultado = await this.executarLigacao(lead, telefone.numero, 0);
      
      // Se atendeu e digitou 1 ou pediu operador, encerra
      if (
        resultado === CallResult.ATENDEU_DIGITOU_1 || 
        resultado === CallResult.PEDIU_OPERADOR
      ) {
        break;
      }

      // Se número inválido/caixa postal, marca e pula
      if (this.deveMarcarTelefoneInapto(resultado)) {
        await this.marcarTelefoneInapto(lead, telefone.numero, resultado);
        continue;
      }

      // Se não atendeu/derrubou, aplica religações 5/10/20
      if (resultado === CallResult.NAO_ATENDEU || resultado === CallResult.DERRUBOU) {
        await this.aplicarReligacoes(lead, telefone.numero);
      }
    }
  }

  /**
   * Executa uma ligação individual
   */
  private async executarLigacao(
    lead: ILead, 
    telefone: string,
    tentativaIndex: number
  ): Promise<CallResult> {
    try {
      // Determina janela de horário e prompt
      const janelaIndex = Math.floor(tentativaIndex / this.telefones.length) % this.JANELAS_HORARIO.length;
      const janela = this.JANELAS_HORARIO[janelaIndex];
      const promptId = `JANELA_${janelaIndex + 1}`;

      // Busca template de mensagem
      const template = await MessageTemplate.obterTemplateAleatorio(
        `IA_CALL_${promptId}` as TemplateContext
      );

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
        banco: lead.proposta.banco
      });

      logger.info(`Executando ligação para lead ${lead.lead_id}`, {
        telefone,
        janela,
        promptId
      });

      // Chama API da IA de ligação
      const response = await axios.post(
        `${process.env.IA_CALL_API_URL}/call`,
        {
          telefone,
          mensagem,
          lead_id: lead.lead_id,
          cpf: lead.cpf
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.IA_CALL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const resultado = response.data.resultado as CallResult;

      // Registra interação
      lead.addInteraction('MOTOR_IA_CHAMADA', {
        telefone,
        prompt_id: promptId,
        janela,
        resultado_chamada: resultado,
        timestamp: new Date()
      }, this.CUSTO_CHAMADA);

      await lead.save();

      // Aplica regras baseadas no resultado
      await this.aplicarRegrasResultado(lead, resultado);

      return resultado;

    } catch (error) {
      logger.error(`Erro ao executar ligação para lead ${lead.lead_id}`, error);
      
      // Registra erro como tentativa
      lead.addInteraction('MOTOR_IA_CHAMADA', {
        telefone,
        resultado_chamada: 'ERRO',
        erro: error.message,
        timestamp: new Date()
      }, this.CUSTO_CHAMADA);
      
      await lead.save();
      
      return CallResult.NAO_ATENDEU;
    }
  }

  /**
   * Aplica sequência de religações 5/10/20 minutos
   */
  private async aplicarReligacoes(lead: ILead, telefone: string): Promise<void> {
    for (const tempoMinutos of this.TEMPOS_RELIGACAO) {
      if (this.atingiuLimiteTentativas(lead)) {
        break;
      }

      // Aguarda tempo de religação (em produção, usar fila com delay)
      logger.info(`Agendando religação em ${tempoMinutos} minutos para lead ${lead.lead_id}`);
      
      // Em produção, adicionar à fila com delay
      // await this.agendarReligacao(lead.lead_id, telefone, tempoMinutos);
      
      // Para demonstração, executa imediatamente
      const resultado = await this.executarLigacao(lead, telefone, 0);
      
      // Se atendeu ou número inválido, para religações
      if (
        resultado === CallResult.ATENDEU_DIGITOU_1 ||
        resultado === CallResult.PEDIU_OPERADOR ||
        this.deveMarcarTelefoneInapto(resultado)
      ) {
        break;
      }
    }
  }

  /**
   * Aplica regras baseadas no resultado da chamada
   */
  private async aplicarRegrasResultado(lead: ILead, resultado: CallResult): Promise<void> {
    switch (resultado) {
      case CallResult.ATENDEU_DIGITOU_1:
        // Encerra tentativas de IA
        lead.pausar_automacoes = true;
        
        // Atualiza status para Verde
        if (lead.status_atual !== LeadStatus.ROXO && lead.status_atual !== LeadStatus.AZUL) {
          await LeadService.atualizarStatus(
            lead.lead_id,
            LeadStatus.VERDE,
            'Cliente digitou 1 na IA de ligação'
          );
        }
        
        // Dispara webhook para WhatsApp
        await this.dispararWebhookWhatsApp(lead, 'IA_LIGACAO_DIGITOU_1');
        break;

      case CallResult.PEDIU_OPERADOR:
        await LeadService.marcarHumanoObrigatorio(
          lead.lead_id,
          'Cliente pediu operador na IA de ligação'
        );
        lead.pausar_automacoes = true;
        await lead.save();
        break;

      case CallResult.ATENDEU_SEM_ACAO:
        // Registra, mas continua tentativas
        logger.info(`Lead ${lead.lead_id} atendeu mas não fez ação`);
        break;

      default:
        // Outros resultados continuam ciclo normal
        break;
    }
  }

  /**
   * Verifica se deve marcar telefone como inapto
   */
  private deveMarcarTelefoneInapto(resultado: CallResult): boolean {
    return [
      CallResult.CAIXA_POSTAL,
      CallResult.INVALIDO,
      CallResult.INEXISTENTE
    ].includes(resultado);
  }

  /**
   * Marca telefone como inapto
   */
  private async marcarTelefoneInapto(
    lead: ILead, 
    telefone: string, 
    motivo: CallResult
  ): Promise<void> {
    const tel = lead.telefones.find(t => t.numero === telefone);
    if (tel) {
      tel.inapto = true;
      tel.motivo_inapto = motivo;
      
      lead.addInteraction('TELEFONE_MARCADO_INAPTO', {
        telefone,
        motivo,
        timestamp: new Date()
      });
      
      await lead.save();
      
      logger.info(`Telefone ${telefone} marcado como inapto para lead ${lead.lead_id}`, { motivo });
    }
  }

  /**
   * Verifica se atingiu limite de tentativas
   */
  private atingiuLimiteTentativas(lead: ILead): boolean {
    const tentativasIA = lead.historico_interacoes.filter(
      i => i.tipo === 'MOTOR_IA_CHAMADA'
    ).length;
    
    return tentativasIA >= this.MAX_TENTATIVAS;
  }

  /**
   * Verifica se precisa continuar tentativas
   */
  private precisaContinuarTentativas(lead: ILead): boolean {
    const ultimaInteracao = lead.historico_interacoes
      .filter(i => i.tipo === 'MOTOR_IA_CHAMADA')
      .pop();

    if (!ultimaInteracao) return true;

    const ultimoResultado = ultimaInteracao.dados.resultado_chamada;
    
    return ![
      CallResult.ATENDEU_DIGITOU_1,
      CallResult.PEDIU_OPERADOR
    ].includes(ultimoResultado);
  }

  /**
   * Verifica se pode iniciar automação
   */
  private podeIniciarAutomacao(lead: ILead): boolean {
    return (
      !lead.pausar_automacoes &&
      lead.telefones.length > 0 &&
      lead.proposta?.link_assinatura_atual
    );
  }

  /**
   * Dispara webhook para WhatsApp
   */
  private async dispararWebhookWhatsApp(lead: ILead, trigger_source: string): Promise<void> {
    try {
      logger.info(`Disparando webhook WhatsApp para lead ${lead.lead_id}`, { trigger_source });
      
      // Aqui deve chamar o serviço de WhatsApp
      // await WhatsAppService.processarGatilho(lead.lead_id, trigger_source);
      
    } catch (error) {
      logger.error(`Erro ao disparar webhook WhatsApp para lead ${lead.lead_id}`, error);
    }
  }
}

export default new IACallService();
