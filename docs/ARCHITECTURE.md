# 📐 Arquitetura Técnica - Dashboard de Conversão

## 🎯 Visão Geral

Sistema full-stack para orquestração de conversão de leads com múltiplos motores de marketing, construído com arquitetura moderna e escalável.

## 🏗️ Stack Tecnológico

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Linguagem**: TypeScript 5.x
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL 15+
- **Cache/Filas**: Redis 7+ com Bull
- **WebSocket**: Socket.io
- **Validação**: Zod
- **Logs**: Winston

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite 6+
- **Linguagem**: TypeScript 5.x
- **Estilização**: Tailwind CSS 3.x
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Charts**: Recharts
- **Icons**: React Icons
- **Notifications**: React Hot Toast

### Infraestrutura
- **Containerização**: Docker + Docker Compose
- **Proxy Reverso**: Nginx (produção)
- **Process Manager**: PM2 (produção)
- **CI/CD**: GitHub Actions (opcional)

## 📂 Estrutura de Diretórios

```
dashboard-conversao-legal-viver/
├── backend/                    # API Node.js
│   ├── src/
│   │   ├── routes/            # Rotas da API
│   │   ├── services/          # Lógica de negócio
│   │   ├── middlewares/       # Middlewares Express
│   │   ├── utils/             # Utilitários
│   │   ├── types/             # Tipos TypeScript
│   │   ├── queues/            # Sistema de filas
│   │   ├── workers/           # Workers para processamento
│   │   └── server.ts          # Servidor principal
│   ├── prisma/                # Schema e migrations
│   ├── logs/                  # Logs da aplicação
│   └── package.json
│
├── frontend/                   # Dashboard React
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   ├── pages/             # Páginas
│   │   ├── hooks/             # Hooks customizados
│   │   ├── services/          # API clients
│   │   ├── types/             # Tipos TypeScript
│   │   ├── utils/             # Utilitários
│   │   ├── store/             # Estado global
│   │   ├── App.tsx            # Componente principal
│   │   └── main.tsx           # Ponto de entrada
│   ├── public/                # Arquivos estáticos
│   └── package.json
│
├── prisma/                     # Schema compartilhado
│   └── schema.prisma
│
├── docs/                       # Documentação
│   ├── API.md
│   ├── MOTORS.md
│   ├── WEBHOOKS.md
│   └── ARCHITECTURE.md
│
├── docker-compose.yml          # Orquestração Docker
├── README.md                   # Documentação principal
└── INSTALACAO.md              # Guia de instalação

```

## 🔄 Fluxo de Dados

### 1. Entrada de Leads

```
Dashboard Atual (dash-clt.legalivv.com.br)
    ↓ [Lead entra em "Assinatura"]
    ↓
API Backend (/api/leads)
    ↓
Validação (Zod) → Criação no Banco (Prisma)
    ↓
Queue (Bull/Redis) → Iniciar motores
    ↓
WebSocket (Socket.io) → Atualização real-time no Frontend
```

### 2. Processamento de Motores

```
Worker inicia processamento
    ↓
Orquestrador verifica elegibilidade
    ↓
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ IA Ligação  │    RCS      │    SMS      │   Email     │
│ (6 tent.)   │ (rastreável)│ (fallback)  │ (rastreável)│
└─────────────┴─────────────┴─────────────┴─────────────┘
    ↓                ↓              ↓             ↓
Webhooks recebem eventos (entregue, aberto, clique)
    ↓
Registra interação + Atualiza custos
    ↓
Verifica regras de status → Muda cor se necessário
    ↓
WhatsApp disparado se "digitou 1" ou clique detectado
```

### 3. WhatsApp (Roleta e Retenção)

```
Lead precisa receber WhatsApp
    ↓
Verificar atribuição existente
    ↓
┌──────────────────┬────────────────────┬─────────────────┐
│ Tem atribuição?  │                    │                 │
├──────────────────┼────────────────────┼─────────────────┤
│ Sim + ATIVA      │ Sim + BANIDA/OFFLINE│ Não            │
│ → RETENÇÃO       │ → FAILOVER         │ → NOVO         │
│ (mantém conexão) │ (reassina conexão) │ (roleta)       │
└──────────────────┴────────────────────┴─────────────────┘
    ↓
Buscar próxima conexão disponível (< 25 novas/dia)
    ↓
Aplicar regra do link (< 3 dias: cutucada | ≥ 3 dias: novo link)
    ↓
Enviar mensagem aleatória da biblioteca
    ↓
Registrar interação + custo
```

## 🎨 Componentes Frontend

### Hierarquia de Componentes

```
App.tsx (Principal)
├── Header
│   └── Stats (Total de leads)
├── StatusCards (Grid de status)
│   └── StatusCard × 6
├── Filters
│   ├── SearchBar
│   └── ClearFiltersButton
└── LeadsList
    └── LeadCard × N
        ├── StatusBadge
        ├── LeadInfo
        ├── FinancialInfo
        └── Actions
```

### Estado Global (Zustand)

```typescript
interface DashboardStore {
  leads: Lead[];
  selectedStatus: StatusCor | 'TODOS';
  searchTerm: string;
  loading: boolean;
  
  actions: {
    setLeads: (leads: Lead[]) => void;
    setSelectedStatus: (status: StatusCor | 'TODOS') => void;
    setSearchTerm: (term: string) => void;
    setLoading: (loading: boolean) => void;
  };
}
```

## 📡 Comunicação API

### HTTP REST

```typescript
// Cliente Axios configurado
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptors para token JWT (quando implementado)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### WebSocket (Atualizações Real-Time)

```typescript
// Conexão Socket.io
const socket = io(import.meta.env.VITE_WS_URL);

// Eventos escutados pelo frontend
socket.on('lead:created', (lead) => { /* atualizar lista */ });
socket.on('lead:updated', (lead) => { /* atualizar card */ });
socket.on('lead:deleted', (leadId) => { /* remover da lista */ });
socket.on('lead:interaction', (interaction) => { /* atualizar timeline */ });

// Inscrição em leads específicos
socket.emit('subscribe:lead', leadId);
```

## 🔐 Segurança

### Backend

1. **Validação de Entrada**
   - Zod para validação de schemas
   - Sanitização de dados
   - Proteção contra SQL Injection (Prisma)

2. **Autenticação & Autorização**
   - JWT para sessões
   - Refresh tokens
   - Rate limiting (Express)

3. **Proteção de APIs**
   - CORS configurável
   - Helmet para headers de segurança
   - HTTPS obrigatório em produção

4. **Logs e Auditoria**
   - Winston para logs estruturados
   - Rastreamento de ações do operador
   - Logs de webhooks

### Frontend

1. **Validação de Entrada**
   - Validação client-side
   - Sanitização de HTML
   - Proteção XSS

2. **Armazenamento Seguro**
   - Tokens em memória ou httpOnly cookies
   - Não armazenar dados sensíveis em localStorage

## ⚡ Performance

### Backend

1. **Cache Redis**
   - Cache de queries frequentes
   - TTL configurável
   - Invalidação inteligente

2. **Otimização de Queries**
   - Indexes no Prisma
   - Lazy loading
   - Paginação

3. **Filas Assíncronas**
   - Bull para tarefas pesadas
   - Workers dedicados
   - Retry automático

### Frontend

1. **Code Splitting**
   - Lazy loading de rotas
   - Dynamic imports
   - Chunks otimizados (Vite)

2. **Otimização de Renders**
   - React.memo
   - useMemo e useCallback
   - Virtualização de listas longas

3. **Caching**
   - React Query cache
   - Service Workers (PWA)
   - Assets com hash no nome

## 📊 Monitoramento

### Métricas Coletadas

1. **Aplicação**
   - Tempo de resposta das APIs
   - Taxa de erro
   - Requisições por minuto

2. **Infraestrutura**
   - Uso de CPU/RAM
   - Conexões de banco
   - Tamanho das filas

3. **Negócio**
   - Taxa de conversão
   - Custo por conversão
   - ROI por canal

### Ferramentas

- **Bull Board**: Monitor de filas
- **Prisma Studio**: Visualizar dados
- **Winston Logs**: Logs estruturados
- **Prometheus** (opcional): Métricas
- **Grafana** (opcional): Dashboards

## 🚀 Deploy

### Desenvolvimento

```bash
# Backend
cd backend && npm run dev

# Workers
cd backend && npm run workers

# Frontend
cd frontend && npm run dev
```

### Produção (Docker)

```bash
# Build e iniciar tudo
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose logs -f

# Escalar workers
docker-compose up -d --scale worker=3
```

### Produção (Manual)

```bash
# Backend
cd backend
npm run build
pm2 start ecosystem.config.js

# Frontend
cd frontend
npm run build
# Servir com Nginx
```

## 🔄 CI/CD Pipeline

```yaml
# Exemplo .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout
      - Install dependencies
      - Run tests
      - Run linter
      
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - Build backend
      - Build frontend
      - Push Docker images
      
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - Deploy to production
      - Run migrations
      - Health check
```

## 📈 Escalabilidade

### Horizontal Scaling

1. **Backend API**
   - Load balancer (Nginx/Traefik)
   - Múltiplas instâncias
   - Session store compartilhado (Redis)

2. **Workers**
   - Múltiplos processos
   - Distribuição de carga
   - Auto-scaling por tamanho de fila

3. **Banco de Dados**
   - Read replicas
   - Connection pooling
   - Sharding (se necessário)

### Vertical Scaling

- CPU/RAM adequados
- Otimização de queries
- Índices apropriados

## 🛠️ Manutenção

### Backups

```bash
# PostgreSQL
pg_dump -U postgres conversao_db > backup.sql

# Automatizado (cron)
0 2 * * * /usr/local/bin/backup-db.sh
```

### Migrations

```bash
# Criar migration
npx prisma migrate dev --name nome_da_migration

# Aplicar em produção
npx prisma migrate deploy
```

### Monitoramento de Saúde

```bash
# Health check endpoint
curl http://api.legalivv.com.br/health

# Verificar filas
curl http://api.legalivv.com.br/admin/queues
```

---

**Versão da Arquitetura**: 1.0.0  
**Última Atualização**: 07/02/2026  
**Autor**: Equipe Legal é Viver
