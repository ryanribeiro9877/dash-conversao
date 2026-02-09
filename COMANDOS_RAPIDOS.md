# ⚡ GUIA RÁPIDO - COMANDOS DIRETOS

## 🎯 OPÇÃO 1: SETUP AUTOMÁTICO (MAIS FÁCIL)

```bash
# 1. Baixe o script setup-automatico.sh e PROMPT_CLAUDE_CODE.txt
# 2. Execute:
chmod +x setup-automatico.sh
./setup-automatico.sh

# Pronto! O script faz tudo automaticamente.
```

---

## 🎯 OPÇÃO 2: PASSO A PASSO MANUAL

### 1️⃣ Instalar Claude Code
```bash
npm install -g @anthropic-ai/claude-code
```

### 2️⃣ Criar Projeto
```bash
mkdir dashboard-conversao && cd dashboard-conversao
```

### 3️⃣ Executar Claude Code
```bash
# Cole o arquivo PROMPT_CLAUDE_CODE.txt aqui como prompt.txt
# Depois execute:
claude-code -f prompt.txt
```

### 4️⃣ Instalar Dependências
```bash
# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 5️⃣ Configurar Ambiente
```bash
cd backend
cp .env.example .env
nano .env  # Edite as configurações
cd ..
```

### 6️⃣ Iniciar MongoDB e Redis
```bash
# Opção A: Docker
docker-compose up -d

# Opção B: Manual
mongod --dbpath ~/data/db &
redis-server &
```

### 7️⃣ Iniciar Aplicação

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Workers:**
```bash
cd backend
npm run worker
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

### 8️⃣ Acessar
- Backend: http://localhost:3000/api
- Frontend: http://localhost:5173
- Health: http://localhost:3000/api/health

---

## 🧪 TESTAR

### Teste 1: Health Check
```bash
curl http://localhost:3000/api/health
```

### Teste 2: Importar Lead
```bash
curl -X POST http://localhost:3000/api/leads/importar \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678900",
    "nome_completo": "João da Silva",
    "telefones": [{
      "numero": "11987654321",
      "prioridade": 1,
      "origem": "LP"
    }],
    "emails": [{
      "email": "joao@email.com",
      "origem": "LP"
    }],
    "proposta": {
      "id_proposta": "PROP-001",
      "data_criacao_proposta": "2026-02-07T10:00:00Z",
      "valor_liberado": 15000,
      "prazo_meses": 24,
      "valor_parcela": 750,
      "banco": "Itaú",
      "link_assinatura_atual": "https://exemplo.com/123",
      "data_geracao_link_assinatura": "2026-02-07T10:00:00Z"
    },
    "origem": "META",
    "custo_aquisicao": 5000
  }'
```

### Teste 3: Listar Leads
```bash
curl http://localhost:3000/api/leads
```

### Teste 4: Buscar Estatísticas
```bash
curl http://localhost:3000/api/leads/estatisticas
```

---

## 🐛 TROUBLESHOOTING RÁPIDO

### Erro: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro: MongoDB não conecta
```bash
# Verificar
mongosh

# Se falhar, iniciar:
mongod --dbpath ~/data/db
```

### Erro: Redis não conecta
```bash
# Verificar
redis-cli ping

# Se falhar, iniciar:
redis-server
```

### Erro: Porta em uso
```bash
# Descobrir processo
lsof -i :3000

# Matar processo
kill -9 <PID>
```

---

## 📋 CHECKLIST RÁPIDO

- [ ] Node.js 18+ instalado
- [ ] Claude Code instalado
- [ ] Projeto criado via Claude Code
- [ ] Dependências instaladas
- [ ] .env configurado
- [ ] MongoDB rodando
- [ ] Redis rodando
- [ ] Backend iniciado
- [ ] Workers iniciados
- [ ] Frontend iniciado
- [ ] Health check OK
- [ ] Dashboard abrindo

---

## 🎯 COMANDOS ÚTEIS

### Ver logs em tempo real:
```bash
tail -f backend/logs/combined.log
```

### Reiniciar tudo:
```bash
# Parar
pkill -f "npm run"
docker-compose down

# Iniciar
docker-compose up -d
cd backend && npm run dev &
cd backend && npm run worker &
cd frontend && npm run dev &
```

### Build para produção:
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Rodar em produção:
```bash
# Backend
cd backend
pm2 start dist/server.js --name api
pm2 start dist/workers/index.js --name workers

# Frontend (servir dist/)
npx serve -s frontend/dist -p 5173
```

---

## 📊 ENDPOINTS PRINCIPAIS

```bash
# Importar lead
POST /api/leads/importar

# Listar leads
GET /api/leads?status=VERDE&pagina=1&limite=50

# Buscar lead
GET /api/leads/:leadId

# Atualizar status
PUT /api/leads/:leadId/status

# Adicionar agendamento
POST /api/leads/:leadId/agendamento

# Adicionar observação
POST /api/leads/:leadId/observacao

# Estatísticas
GET /api/leads/estatisticas

# Humano obrigatório
GET /api/leads/humano-obrigatorio

# Webhooks
POST /api/webhooks/conversion-trigger
POST /api/webhooks/rcs
POST /api/webhooks/sms
POST /api/webhooks/email
POST /api/webhooks/proposal-status
```

---

## 🔥 DICAS PRO

1. **Use VS Code** com extensões:
   - ESLint
   - Prettier
   - MongoDB for VS Code

2. **Git desde o início**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. **Docker para tudo**:
   ```bash
   docker-compose up -d
   # MongoDB e Redis sempre disponíveis
   ```

4. **PM2 em produção**:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

5. **Logs são seus amigos**:
   ```bash
   tail -f backend/logs/error.log
   ```

---

## 🎉 PRONTO!

Se tudo está funcionando:
1. ✅ Backend responde em http://localhost:3000
2. ✅ Frontend abre em http://localhost:5173
3. ✅ Health check retorna sucesso
4. ✅ Você consegue importar um lead

**Você tem um sistema completo rodando!** 🚀

Próximo passo: Customizar e conectar APIs externas!
