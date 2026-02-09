import { Worker, Job } from 'bullmq';
import { connection } from '../queues';
import IACallService from '../services/IACallService';
import WhatsAppService from '../services/WhatsAppService';
import MarketingEnginesService from '../services/MarketingEnginesService';
import LeadService from '../services/LeadService';
import Lead from '../models/Lead';
import logger from '../utils/logger';

// Worker: IA de Ligação
const iaCallWorker = new Worker(
  'ia-call',
  async (job: Job) => {
    const { leadId } = job.data;
    logger.info(`Processando IA Call para lead ${leadId}`);
    
    await IACallService.iniciarCicloLigacoes(leadId);
    
    return { success: true, leadId };
  },
  { connection }
);

iaCallWorker.on('completed', (job) => {
  logger.info(`Job IA Call ${job.id} completado`);
});

iaCallWorker.on('failed', (job, err) => {
  logger.error(`Job IA Call ${job?.id} falhou:`, err);
});

// Worker: WhatsApp
const whatsappWorker = new Worker(
  'whatsapp',
  async (job: Job) => {
    const { leadId, triggerSource } = job.data;
    
    // Se for reset diário
    if (job.name === 'reset-daily-counters') {
      logger.info('Executando reset diário de contadores WhatsApp');
      await WhatsAppService.resetarContadoresDiarios();
      return { success: true, action: 'reset' };
    }
    
    // Processamento normal
    logger.info(`Processando WhatsApp para lead ${leadId}`);
    await WhatsAppService.processarGatilho(leadId, triggerSource);
    
    return { success: true, leadId };
  },
  { connection }
);

whatsappWorker.on('completed', (job) => {
  logger.info(`Job WhatsApp ${job.id} completado`);
});

whatsappWorker.on('failed', (job, err) => {
  logger.error(`Job WhatsApp ${job?.id} falhou:`, err);
});

// Worker: RCS
const rcsWorker = new Worker(
  'rcs',
  async (job: Job) => {
    const { leadId } = job.data;
    logger.info(`Enviando RCS para lead ${leadId}`);
    
    await MarketingEnginesService.enviarRCS(leadId);
    
    return { success: true, leadId };
  },
  { connection }
);

rcsWorker.on('completed', (job) => {
  logger.info(`Job RCS ${job.id} completado`);
});

rcsWorker.on('failed', (job, err) => {
  logger.error(`Job RCS ${job?.id} falhou:`, err);
});

// Worker: SMS
const smsWorker = new Worker(
  'sms',
  async (job: Job) => {
    const { leadId } = job.data;
    logger.info(`Enviando SMS para lead ${leadId}`);
    
    await MarketingEnginesService.enviarSMS(leadId);
    
    return { success: true, leadId };
  },
  { connection }
);

smsWorker.on('completed', (job) => {
  logger.info(`Job SMS ${job.id} completado`);
});

smsWorker.on('failed', (job, err) => {
  logger.error(`Job SMS ${job?.id} falhou:`, err);
});

// Worker: Email
const emailWorker = new Worker(
  'email',
  async (job: Job) => {
    const { leadId, contexto } = job.data;
    logger.info(`Enviando Email para lead ${leadId}`, { contexto });
    
    await MarketingEnginesService.enviarEmail(leadId, contexto);
    
    return { success: true, leadId };
  },
  { connection }
);

emailWorker.on('completed', (job) => {
  logger.info(`Job Email ${job.id} completado`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`Job Email ${job?.id} falhou:`, err);
});

// Worker: Verificação de Propostas
const proposalCheckWorker = new Worker(
  'proposal-check',
  async (job: Job) => {
    logger.info('Verificando expiração de propostas');
    
    const leads = await Lead.find({
      status_atual: { $nin: ['ROXO', 'BRANCO', 'REPROVADO'] }
    });
    
    let expiradas = 0;
    
    for (const lead of leads) {
      const expired = await LeadService.verificarExpiracao(lead);
      if (expired) expiradas++;
    }
    
    logger.info(`Verificação de propostas concluída: ${expiradas} expiradas`);
    
    return { success: true, total: leads.length, expiradas };
  },
  { connection }
);

proposalCheckWorker.on('completed', (job) => {
  logger.info(`Job Proposal Check ${job.id} completado`);
});

proposalCheckWorker.on('failed', (job, err) => {
  logger.error(`Job Proposal Check ${job?.id} falhou:`, err);
});

logger.info('Workers inicializados e aguardando jobs');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM recebido, encerrando workers...');
  await Promise.all([
    iaCallWorker.close(),
    whatsappWorker.close(),
    rcsWorker.close(),
    smsWorker.close(),
    emailWorker.close(),
    proposalCheckWorker.close()
  ]);
  process.exit(0);
});
