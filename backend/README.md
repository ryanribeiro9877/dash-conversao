# Dashboard de Conversão - Backend

Backend do sistema de Dashboard de Conversão para Legal é Viver.

## 🚀 Tecnologias

- **Node.js** + **TypeScript**
- **Express** - Framework web
- **MongoDB** - Banco de dados
- **Redis** - Cache e filas
- **BullMQ** - Gerenciamento de filas
- **Winston** - Logging

## 📋 Requisitos

- Node.js 18+
- MongoDB 6+
- Redis 7+
- npm ou yarn

## 🔧 Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar variáveis de ambiente
nano .env
```

## ⚙️ Configuração

Edite o arquivo `.env` com suas configurações:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/dashboard_conversao

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3000
NODE_ENV=development

# APIs Externas
IA_CALL_API_URL=...
IA_CALL_API_KEY=...
RCS_API_URL=...
RCS_API_KEY=...
# ... (outros)
```

## 🏃 Executar

```bash
# Modo desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start

# Workers (em terminal separado)
npm run worker
```

## 📁 Estrutura

```
src/
├── config/         # Configurações (DB, etc)
├── controllers/    # Controllers
├── models/         # Models Mongoose
├── services/       # Lógica de negócio
├── queues/         # Filas BullMQ
├── workers/        # Processadores de filas
├── routes/         # Rotas Express
├── utils/          # Utilitários
└── server.ts       # Servidor principal
```

## 🔌 API Endpoints

### Leads

- `POST /api/leads/importar` - Importa lead da etapa Assinatura
- `GET /api/leads` - Lista leads com filtros
- `GET /api/leads/:leadId` - Busca lead por ID
- `PUT /api/leads/:leadId/status` - Atualiza status
- `POST /api/leads/:leadId/agendamento` - Adiciona agendamento
- `POST /api/leads/:leadId/observacao` - Adiciona observação
- `GET /api/leads/estatisticas` - Estatísticas por status
- `GET /api/leads/humano-obrigatorio` - Leads que requerem atenção humana

### Webhooks

- `POST /api/webhooks/conversion-trigger` - Gatilho de conversão (digitou 1/clique)
- `POST /api/webhooks/rcs` - Eventos de RCS
- `POST /api/webhooks/sms` - Eventos de SMS
- `POST /api/webhooks/email` - Eventos de Email
- `POST /api/webhooks/proposal-status` - Status de proposta

### Health Check

- `GET /api/health` - Status da API

## 📊 Modelos de Dados

### Lead
- Informações completas do lead
- Status por cores (ROXO, AZUL, VERDE, VERMELHO, LARANJA, BRANCO)
- Histórico de interações
- Custos por ação
- Proposta e link de assinatura

### WhatsAppConnection
- Pool de 20 conexões
- Roleta de distribuição
- Limite de 25 novas conversas/dia por conexão

### MessageTemplate
- Biblioteca de mensagens randômicas
- Templates por contexto
- Substituição de variáveis

## 🔄 Filas e Workers

- **ia-call** - Processamento de ligações IA
- **whatsapp** - Envio de mensagens WhatsApp
- **rcs** - Envio de RCS
- **sms** - Envio de SMS
- **email** - Envio de emails
- **proposal-check** - Verificação de expiração

## 🎯 Regras de Negócio

### Status por Cores

- **ROXO** 🟣 - Pago
- **AZUL** 🔵 - Pendência
- **VERDE** 🟢 - Interagiu
- **VERMELHO** 🔴 - Reclamação
- **LARANJA** 🟠 - Sem interação
- **BRANCO** ⚪ - Expirada

### IA de Ligação

- Máximo 6 tentativas
- Janelas: 08:00, 12:00, 19:00
- Lista A (LP) tem prioridade
- Religações 5/10/20 min para não atendeu
- Marca inapto: caixa postal, inválido, inexistente

### WhatsApp

- Roleta de 20 conexões
- 25 novas conversas/dia por conexão
- Retenção de conexão se ativa
- Failover se banida/offline
- Link novo se >3 dias
- Cutucada se <3 dias

## 📝 Logs

Logs salvos em:
- `logs/error.log` - Erros
- `logs/combined.log` - Todos os logs

## 🧪 Testes

```bash
npm test
```

## 📄 Licença

Proprietário - Legal é Viver
