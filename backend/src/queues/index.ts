import { Queue, QueueOptions } from 'bullmq';
import IORedis from 'ioredis';
import logger from '../utils/logger';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null
});

const queueOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: {
      count: 1000,
      age: 24 * 3600 // 24 horas
    },
    removeOnFail: {
      age: 7 * 24 * 3600 // 7 dias
    }
  }
};

// Definição das filas
export const leadImportQueue = new Queue('lead-import', queueOptions);
export const iaCallQueue = new Queue('ia-call', queueOptions);
export const whatsappQueue = new Queue('whatsapp', queueOptions);
export const rcsQueue = new Queue('rcs', queueOptions);
export const smsQueue = new Queue('sms', queueOptions);
export const emailQueue = new Queue('email', queueOptions);
export const proposalCheckQueue = new Queue('proposal-check', queueOptions);

logger.info('Filas BullMQ inicializadas');

// Adicionar job à fila de IA de ligação
export const adicionarJobIACall = async (leadId: string, delay = 0) => {
  await iaCallQueue.add(
    'process-ia-call',
    { leadId },
    { delay }
  );
  logger.info(`Job IA Call adicionado para lead ${leadId}`);
};

// Adicionar job WhatsApp
export const adicionarJobWhatsApp = async (leadId: string, triggerSource: string) => {
  await whatsappQueue.add(
    'process-whatsapp',
    { leadId, triggerSource }
  );
  logger.info(`Job WhatsApp adicionado para lead ${leadId}`);
};

// Adicionar job RCS
export const adicionarJobRCS = async (leadId: string) => {
  await rcsQueue.add(
    'send-rcs',
    { leadId }
  );
  logger.info(`Job RCS adicionado para lead ${leadId}`);
};

// Adicionar job SMS
export const adicionarJobSMS = async (leadId: string) => {
  await smsQueue.add(
    'send-sms',
    { leadId }
  );
  logger.info(`Job SMS adicionado para lead ${leadId}`);
};

// Adicionar job Email
export const adicionarJobEmail = async (leadId: string, contexto: 'INICIAL' | 'PARABENS_PAGO' = 'INICIAL') => {
  await emailQueue.add(
    'send-email',
    { leadId, contexto }
  );
  logger.info(`Job Email adicionado para lead ${leadId}`);
};

// Job recorrente: verificação de propostas
export const agendarVerificacaoPropostas = async () => {
  await proposalCheckQueue.add(
    'check-all-proposals',
    {},
    {
      repeat: {
        pattern: '0 */6 * * *' // A cada 6 horas
      }
    }
  );
  logger.info('Job recorrente de verificação de propostas agendado');
};

// Job recorrente: reset diário WhatsApp
export const agendarResetWhatsApp = async () => {
  await whatsappQueue.add(
    'reset-daily-counters',
    {},
    {
      repeat: {
        pattern: '0 0 * * *' // Todo dia às 00:00
      }
    }
  );
  logger.info('Job recorrente de reset WhatsApp agendado');
};

export { connection };
