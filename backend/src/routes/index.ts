import { Router } from 'express';
import LeadController from '../controllers/LeadController';
import WebhookController from '../controllers/WebhookController';

const router = Router();

// ===== LEADS =====
router.post('/leads/importar', LeadController.importarAssinatura);
router.get('/leads', LeadController.listar);
router.get('/leads/estatisticas', LeadController.estatisticas);
router.get('/leads/humano-obrigatorio', LeadController.humanoObrigatorio);
router.get('/leads/:leadId', LeadController.buscarPorId);
router.put('/leads/:leadId/status', LeadController.atualizarStatus);
router.post('/leads/:leadId/agendamento', LeadController.adicionarAgendamento);
router.post('/leads/:leadId/observacao', LeadController.adicionarObservacao);

// ===== WEBHOOKS =====
router.post('/webhooks/conversion-trigger', WebhookController.conversionTrigger);
router.post('/webhooks/rcs', WebhookController.rcsEvent);
router.post('/webhooks/sms', WebhookController.smsEvent);
router.post('/webhooks/email', WebhookController.emailEvent);
router.post('/webhooks/proposal-status', WebhookController.proposalStatus);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dashboard de Conversão API está rodando',
    timestamp: new Date().toISOString()
  });
});

export default router;
