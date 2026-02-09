# 🎯 DASHBOARD DE CONVERSÃO - LEGAL É VIVER
## DOCUMENTAÇÃO TÉCNICA COMPLETA - v1.0

---

## 📋 ÍNDICE

1. [Visão Geral do Sistema](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Instalação e Setup](#instalação)
4. [Modelos de Dados](#modelos-de-dados)
5. [API Endpoints](#api-endpoints)
6. [Regras de Negócio](#regras-de-negócio)
7. [Fluxos Principais](#fluxos-principais)
8. [Frontend Dashboard](#frontend)
9. [Workers e Filas](#workers)
10. [Monitoramento e Logs](#monitoramento)

---

## 🎯 VISÃO GERAL DO SISTEMA

### Objetivo
Orquestrar com rastreabilidade total e regras rígidas a recuperação de leads que chegaram à etapa "Assinatura" e não concluíram a conversão imediatamente.

### Escopo Completo
✅ Importar leads da etapa "Assinatura"
✅ Sistema de cores (ROXO, AZUL, VERDE, VERMELHO, LARANJA, BRANCO)
✅ IA de Ligação com regras complexas
✅ Motores de marketing (RCS, SMS, Email)
✅ WhatsApp com roleta de 20 conexões
✅ Gestão de custos por ação
✅ Intervenção humana controlada
✅ Dashboard visual completo

---

## 🏗️ ARQUITETURA

### Stack Tecnológico

**Backend:**
- Node.js 18+ com TypeScript
- Express.js (API REST)
- MongoDB (Base de dados)
- Redis (Cache e filas)
- BullMQ (Processamento assíncrono)
- Winston (Logs)

**Frontend:**
- React 18+ com TypeScript
- Vite (Build tool)
- TailwindCSS (Estilização)
- React Query (State management)
- Recharts (Gráficos)

**Infraestrutura:**
- Docker (Containerização)
- Nginx (Proxy reverso)
- PM2 (Process manager)

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     DASHBOARD FRONTEND                       │
│  (React + TypeScript + TailwindCSS + React Query)           │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST
┌─────────────────────▼───────────────────────────────────────┐
│                      API BACKEND                             │
│              (Express + TypeScript)                          │
├──────────────────────────────────────────────────────────────┤
│  Controllers │ Services │ Models │ Queues │ Workers         │
└───┬──────────┴──────┬───┴────┬───┴────┬───┴─────┬───────────┘
    │                 │        │        │         │
    │                 │        │        │         │
┌───▼────┐     ┌──────▼──┐  ┌─▼──┐  ┌──▼──┐  ┌──▼──────┐
│MongoDB │     │ Redis   │  │APIs│  │Logs │  │ Webhooks│
│ Leads  │     │ Filas   │  │Ext │  │File │  │ Externos│
└────────┘     └─────────┘  └────┘  └─────┘  └─────────┘
```

---

## 🚀 INSTALAÇÃO E SETUP

### Pré-requisitos

```bash
node --version  # >= 18.0.0
npm --version   # >= 9.0.0
mongo --version # >= 6.0
redis-server --version # >= 7.0
```

### Instalação Backend

```bash
cd backend
npm install
cp .env.example .env
# Edite o .env com suas configurações
npm run dev # Modo desenvolvimento
npm run worker # Workers (terminal separado)
```

### Instalação Frontend

```bash
cd frontend
npm install
npm run dev # Porta 5173
```

### Docker Compose (Opcional)

```bash
docker-compose up -d
```

---

## 💾 MODELOS DE DADOS

### 1. Lead (Entidade Principal)

```typescript
interface Lead {
  lead_id: string;              // UUID
  cpf: string;
  nome_completo: string;
  
  // Contatos
  telefones: [{
    numero: string;
    prioridade: number;         // 1=LP, 2+=enriquecido
    origem: string;
    inapto: boolean;
    motivo_inapto: string;
  }];
  
  emails: [{
    email: string;
    origem: string;
  }];
  
  // Proposta
  proposta: {
    id_proposta: string;
    data_criacao_proposta: Date;
    valor_liberado: number;
    prazo_meses: number;
    valor_parcela: number;
    banco: string;
    link_assinatura_atual: string;
    data_geracao_link_assinatura: Date;
    status_proposta: 'PENDENTE' | 'PAGO' | 'PENDENCIA' | 'EXPIRADA';
  };
  
  // Status e Histórico
  status_atual: 'ROXO' | 'AZUL' | 'VERDE' | 'VERMELHO' | 'LARANJA' | 'BRANCO';
  historico_status: Array<{
    status: string;
    timestamp: Date;
    motivo: string;
  }>;
  
  // Interações
  historico_interacoes: Array<{
    tipo: string;
    dados: any;
    timestamp: Date;
    custo: number;
  }>;
  
  // Custos
  custos: {
    custo_aquisicao: number;
    custo_motores: number;
    custo_total: number;
  };
  
  // WhatsApp
  atribuicao_whatsapp: {
    conexao_id: string;
    numero_wa: string;
    status_conexao: 'ATIVA' | 'BANIDA' | 'OFFLINE';
    novas_conversas_hoje: number;
    data_atribuicao: Date;
  };
  
  // Operação Humana
  agendamentos: Array<{
    data_hora: Date;
    motivo: string;
    operador: string;
    concluido: boolean;
  }>;
  
  observacoes: Array<{
    texto: string;
    operador: string;
    timestamp: Date;
  }>;
  
  humano_obrigatorio: boolean;
  pausar_automacoes: boolean;
  origem: string;
  data_entrada_assinatura: Date;
}
```

### 2. WhatsAppConnection

```typescript
interface WhatsAppConnection {
  conexao_id: string;
  numero_wa: string;
  nome_conexao: string;
  status: 'ATIVA' | 'BANIDA' | 'OFFLINE' | 'MANUTENCAO';
  novas_conversas_hoje: number;
  limite_diario: number;  // 25
  ultima_mensagem: Date;
}
```

### 3. MessageTemplate

```typescript
interface MessageTemplate {
  contexto: 'WHATSAPP_INICIAL' | 'WHATSAPP_CUTUCADA_MENOS_3_DIAS' | etc;
  titulo: string;
  conteudo: string;
  variaveis: string[];  // ['nome_completo', 'valor_liberado', ...]
  ativo: boolean;
  prioridade: number;   // Peso para seleção randômica
}
```

---

## 🔌 API ENDPOINTS

### Leads

**POST /api/leads/importar**
- Importa lead da etapa Assinatura
- Body: `{ cpf, nome_completo, telefones, emails, proposta, origem, custo_aquisicao }`

**GET /api/leads**
- Lista leads com filtros
- Query: `?status=VERDE&origem=META&pagina=1&limite=50`

**GET /api/leads/:leadId**
- Busca lead específico

**PUT /api/leads/:leadId/status**
- Atualiza status manualmente
- Body: `{ status: 'VERDE', motivo: 'Interagiu via WhatsApp' }`

**POST /api/leads/:leadId/agendamento**
- Adiciona agendamento
- Body: `{ data_hora, motivo, operador }`

**POST /api/leads/:leadId/observacao**
- Adiciona observação
- Body: `{ texto, operador }`

**GET /api/leads/estatisticas**
- Retorna estatísticas por status/cor

**GET /api/leads/humano-obrigatorio**
- Lista leads que requerem atenção humana

### Webhooks

**POST /api/webhooks/conversion-trigger**
- Gatilho: cliente digitou 1 ou clicou em link
- Body: `{ lead_id, cpf, trigger_source: 'IA_LIGACAO_DIGITOU_1' | 'RCS_CLIQUE' | etc }`

**POST /api/webhooks/rcs**
- Eventos: ENVIADO, ENTREGUE, ABERTO, CLICADO
- Body: `{ lead_id, campanha_id, event_type, timestamp }`

**POST /api/webhooks/sms**
- Eventos de SMS

**POST /api/webhooks/email**
- Eventos de Email

**POST /api/webhooks/proposal-status**
- Status da proposta
- Body: `{ lead_id, cpf, id_proposta, status: 'PAGO' | 'PENDENCIA' | 'EXPIRADA', motivo }`

---

## ⚙️ REGRAS DE NEGÓCIO

### Sistema de Cores (Status)

| Cor | Status | Gatilho | Regras |
|-----|--------|---------|--------|
| 🟣 ROXO | Pago | Consulta retornou PAGO | Encerra ciclo, envia parabéns |
| 🔵 AZUL | Pendência | Assinou + retornou pendência | Requer correção humana |
| 🟢 VERDE | Interagiu | Digitou 1, clicou, dúvida | Demonstrou interesse |
| 🔴 VERMELHO | Reclamação | Reclamou, sentimento negativo | Pausa automações, humano prioritário |
| 🟠 LARANJA | Sem interação | Completou ciclo sem resposta | Bloqueia WhatsApp manual |
| ⚪ BRANCO | Expirada | Proposta/link expirou | Encerra ciclo |

### IA de Ligação - Regras Detalhadas

**Priorização:**
1. Lista A (prioridade 1 - informado na LP)
2. Lista B (prioridade 2+ - enriquecidos)

**Tentativas:**
- Máximo: 6 tentativas por lead
- Janelas: 08:00, 12:00, 19:00

**Resultados e Ações:**

| Resultado | Ação |
|-----------|------|
| Não atendeu / Derrubou | Religar em 5min → 10min → 20min |
| Caixa postal / Inválido | Marcar inapto, pular |
| Atendeu e digitou 1 | Disparar WhatsApp, status VERDE |
| Atendeu sem ação | Registrar, continuar tentativas |
| Pediu operador | Marcar humano_obrigatorio |

**Anti-Spam:**
- Randomização de templates
- Respeita janelas de horário
- Pausa se status VERMELHO

### WhatsApp - Roleta e Retenção

**Pool de Conexões:**
- 20 conexões ativas
- Limite: 25 novas conversas/dia por conexão
- Reset automático às 00:00

**Atribuição:**
1. **NOVO**: Lead sem conversa → Roleta (próxima disponível)
2. **RETENÇÃO**: Conexão ativa → Mantém mesma conexão
3. **FAILOVER**: Conexão banida/offline → Reatribui via roleta

**Regra do Link:**
- **< 3 dias**: Cutucada sem link ("sua proposta está acima...")
- **> 3 dias**: Gera e envia link novo

### Motores RCS, SMS, Email

**Rastreamento:**
- Links únicos por lead e campanha
- Eventos: ENVIADO → ENTREGUE → ABERTO → CLICADO

**Clique = Gatilho:**
- Clique em link dispara fluxo WhatsApp
- Atualiza status para VERDE
- Registra custo e interação

### Operação Humana - Bloqueios

| Status | Permissões | Bloqueios |
|--------|-----------|-----------|
| 🟢 VERDE | Ligação manual | Preferir ligação, não WhatsApp manual |
| 🔴 VERMELHO | Prioridade máxima | Pausar automações |
| 🟠 LARANJA | Ver histórico | **BLOQUEIO TOTAL** WhatsApp manual |

---

## 🔄 FLUXOS PRINCIPAIS

### 1. Fluxo de Entrada

```
Lead entra em "Assinatura"
    ↓
Capturar dados (CPF, contatos, proposta)
    ↓
Verificar se existe no sistema
    ↓
Criar/Atualizar registro
    ↓
Status inicial: LARANJA
    ↓
Adicionar na fila de IA de Ligação
```

### 2. Fluxo IA de Ligação

```
Recebe lead da fila
    ↓
Valida elegibilidade
    ↓
Separa Lista A e Lista B
    ↓
PARA CADA telefone:
    ↓
    Busca template randômico
    ↓
    Executa ligação via API
    ↓
    Registra resultado + custo
    ↓
    RESULTADO = NÃO_ATENDEU/DERRUBOU?
        ↓ SIM
        Religar 5min → 10min → 20min
    ↓
    RESULTADO = CAIXA_POSTAL/INVALIDO?
        ↓ SIM
        Marcar inapto, próximo telefone
    ↓
    RESULTADO = DIGITOU_1?
        ↓ SIM
        Status VERDE
        Disparar WhatsApp
        ENCERRAR
    ↓
    RESULTADO = PEDIU_OPERADOR?
        ↓ SIM
        humano_obrigatorio = true
        ENCERRAR
    ↓
Atingiu 6 tentativas ou sucesso?
    ↓
FINALIZAR ciclo
```

### 3. Fluxo WhatsApp

```
Recebe gatilho (digitou 1 / clique)
    ↓
Busca lead
    ↓
Tem atribuição WhatsApp?
    ↓ SIM
    Verifica status da conexão
        ↓
        ATIVA? → RETENÇÃO (mantém)
        BANIDA/OFFLINE? → FAILOVER (reatribui)
    ↓ NÃO
    Busca próxima conexão disponível (roleta)
    Atribui e incrementa contador
    ↓
Link foi gerado há quanto tempo?
    ↓
    > 3 dias? → Gera link novo + envia
    < 3 dias? → Cutucada (sem link)
    ↓
Busca template randômico
Substitui variáveis
Envia via API WhatsApp
Registra interação + custo
```

### 4. Fluxo de Encerramento

```
Recebe webhook de status
    ↓
STATUS = PAGO?
    ↓ SIM
    Atualiza para ROXO
    Envia parabéns (RCS + Email + IA)
    Pausa automações
    Move para histórico
    
STATUS = PENDENCIA?
    ↓ SIM
    Atualiza para AZUL
    Cria alerta de correção
    Operador resolve
    
STATUS = EXPIRADA?
    ↓ SIM
    Atualiza para BRANCO
    Encerra ciclo
    Registra motivo
```

---

## 🎨 FRONTEND DASHBOARD

### Componentes Principais

**1. Kanban de Leads (por cor)**
```
┌─────────────────────────────────────────────────┐
│  ROXO  │  AZUL  │ VERDE │ VERMELHO │ LARANJA    │
│  (12)  │  (5)   │ (34)  │   (3)    │  (18)      │
├────────┴────────┴───────┴──────────┴────────────┤
│  [Card Lead 1]  [Card Lead 2]  [Card Lead 3]    │
│  • Nome completo                                 │
│  • Valor liberado: R$ 15.000                     │
│  • Última interação: Há 2 horas                  │
│  • Custos: R$ 4,50                               │
│  └─ Ver detalhes                                 │
└──────────────────────────────────────────────────┘
```

**2. Card Detalhado do Lead**
```
┌─────────────────────────────────────────────────┐
│  João Silva        CPF: 123.456.789-00    🟢     │
├──────────────────────────────────────────────────┤
│  PROPOSTA                                         │
│  • Banco: Itaú                                    │
│  • Valor: R$ 15.000 em 24x de R$ 750            │
│  • Link gerado: Há 1 dia                         │
│  • Status: PENDENTE                              │
├──────────────────────────────────────────────────┤
│  CONTATOS                                         │
│  📞 (11) 98765-4321 [LP] ✅                       │
│  📞 (11) 91234-5678 [Enriquecido]                │
│  ✉️ joao@email.com                               │
├──────────────────────────────────────────────────┤
│  LINHA DO TEMPO                                   │
│  🕐 Há 2h - IA ligou - Atendeu sem ação          │
│  🕐 Há 4h - RCS enviado - Entregue               │
│  🕐 Há 6h - Email enviado - Aberto               │
│  🕐 Há 1d - Lead importado da etapa Assinatura   │
├──────────────────────────────────────────────────┤
│  CUSTOS                                           │
│  • Aquisição: R$ 50,00                           │
│  • Motores: R$ 4,50                              │
│  • Total: R$ 54,50                               │
├──────────────────────────────────────────────────┤
│  AÇÕES                                            │
│  [📞 Ligar]  [📅 Agendar]  [📝 Observação]       │
└──────────────────────────────────────────────────┘
```

**3. Dashboard Analítico**
```
┌──────────────────────────────────────────────────┐
│  ESTATÍSTICAS POR COR                            │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┐         │
│  │ROXO │AZUL │VERDE│VERM │LARAN│BRANC│         │
│  │ 12  │  5  │ 34  │  3  │ 18  │ 8   │         │
│  └─────┴─────┴─────┴─────┴─────┴─────┘         │
├──────────────────────────────────────────────────┤
│  CUSTOS                                          │
│  • Custo por conversão: R$ 127,50                │
│  • ROI Meta: 350%                                │
│  • ROI TikTok: 280%                              │
├──────────────────────────────────────────────────┤
│  MOTORES                                          │
│  • IA Ligação: 78% sucesso                       │
│  • RCS: 92% entrega, 45% abertura               │
│  • SMS: 98% entrega                              │
│  • Email: 65% abertura, 23% clique              │
└──────────────────────────────────────────────────┘
```

### Tecnologias Frontend

```tsx
// Exemplo: Card de Lead
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LeadCard = ({ lead }) => {
  const corClasses = {
    ROXO: 'bg-purple-100 border-purple-500',
    AZUL: 'bg-blue-100 border-blue-500',
    VERDE: 'bg-green-100 border-green-500',
    VERMELHO: 'bg-red-100 border-red-500',
    LARANJA: 'bg-orange-100 border-orange-500',
    BRANCO: 'bg-gray-100 border-gray-500'
  };

  return (
    <div className={`border-l-4 p-4 rounded shadow ${corClasses[lead.status_atual]}`}>
      <h3 className="font-bold text-lg">{lead.nome_completo}</h3>
      <p className="text-sm text-gray-600">CPF: {lead.cpf}</p>
      
      <div className="mt-3">
        <p className="font-semibold">
          {lead.proposta.valor_liberado.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          })}
        </p>
        <p className="text-xs text-gray-500">
          {lead.proposta.prazo_meses}x de R$ {lead.proposta.valor_parcela}
        </p>
      </div>

      <div className="mt-3 text-xs">
        <p>Última interação: {formatDistanceToNow(new Date(lead.atualizado_em), {
          locale: ptBR,
          addSuffix: true
        })}</p>
        <p>Custos: R$ {lead.custos.custo_total.toFixed(2)}</p>
      </div>

      <button className="mt-3 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
        Ver Detalhes
      </button>
    </div>
  );
};
```

---

## 🔧 WORKERS E FILAS

### Arquitetura de Filas

```
┌─────────────────────────────────────────┐
│            REDIS QUEUES                 │
├─────────────────────────────────────────┤
│  • lead-import       (importação)       │
│  • ia-call           (ligações)         │
│  • whatsapp          (mensagens)        │
│  • rcs               (RCS)              │
│  • sms               (SMS)              │
│  • email             (emails)           │
│  • proposal-check    (verificação)      │
└─────────────────────────────────────────┘
```

### Workers

**1. IA Call Worker**
- Processa fila `ia-call`
- Executa ciclo de ligações
- Retry: 3 tentativas com backoff exponencial

**2. WhatsApp Worker**
- Processa fila `whatsapp`
- Gerencia roleta
- Reset diário (CRON 00:00)

**3. Marketing Workers (RCS, SMS, Email)**
- Enviam mensagens via APIs
- Registram eventos e custos

**4. Proposal Check Worker**
- CRON: A cada 6 horas
- Verifica expirações
- Atualiza status para BRANCO

### Exemplo de Job

```typescript
// Adicionar job à fila
await iaCallQueue.add('process-ia-call', {
  leadId: 'uuid-123'
}, {
  delay: 0,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
});

// Worker processa
iaCallWorker.process(async (job) => {
  const { leadId } = job.data;
  await IACallService.iniciarCicloLigacoes(leadId);
});
```

---

## 📊 MONITORAMENTO E LOGS

### Logs

**Winston Logger:**
```
logs/
├── error.log      # Apenas erros
└── combined.log   # Todos os logs
```

**Níveis:**
- `error` - Erros críticos
- `warn` - Avisos
- `info` - Informações gerais
- `debug` - Debug detalhado

**Exemplo:**
```typescript
logger.info('Lead importado com sucesso', {
  leadId: 'uuid-123',
  cpf: '123.456.789-00',
  origem: 'META'
});

logger.error('Erro ao processar webhook', {
  error: error.message,
  stack: error.stack
});
```

### Métricas Importantes

**Conversão:**
- Taxa de conversão por status
- Tempo médio até conversão
- Custo por conversão

**Motores:**
- Taxa de entrega (RCS/SMS/Email)
- Taxa de abertura
- Taxa de clique
- Taxa de sucesso IA

**Qualidade:**
- Taxa de reclamação (VERMELHO)
- Taxa de expiração (BRANCO)
- Taxa de pendência (AZUL)

---

## 🔐 SEGURANÇA

### Variáveis de Ambiente
- Nunca commitar `.env`
- Usar secrets manager em produção
- Rotacionar API keys periodicamente

### Rate Limiting
- 100 requisições por 15 minutos por IP
- Proteção contra DDoS

### Validação
- Joi para validação de entrada
- Sanitização de dados
- Helmet para headers HTTP seguros

---

## 📦 DEPLOY

### Produção

**Backend:**
```bash
npm run build
pm2 start dist/server.js --name dashboard-api
pm2 start dist/workers/index.js --name dashboard-workers
```

**Frontend:**
```bash
npm run build
# Deploy pasta dist/ para CDN ou servidor
```

**Nginx:**
```nginx
server {
    listen 80;
    server_name dashboard.legalivv.com.br;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /var/www/dashboard/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 📞 SUPORTE E CONTATO

**Desenvolvedor:** Dashboard Team
**Email:** dev@legalivv.com.br
**Versão:** 1.0.0
**Data:** 07/02/2026

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Modelos de dados MongoDB
- [x] API REST completa
- [x] Serviço de Leads
- [x] Serviço IA de Ligação (regras completas)
- [x] Serviço WhatsApp (roleta + retenção + failover)
- [x] Serviços Marketing (RCS, SMS, Email)
- [x] Sistema de filas BullMQ
- [x] Workers assíncronos
- [x] Sistema de cores e transições
- [x] Gestão de custos
- [x] Webhooks completos
- [x] Logging e monitoramento
- [x] Frontend React (estrutura)
- [x] Dashboard visual
- [x] Documentação completa

**Sistema 100% COMPLETO conforme especificação! 🎉**

---

**FIM DA DOCUMENTAÇÃO**
