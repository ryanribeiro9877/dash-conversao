# 🚀 GUIA COMPLETO: USANDO CLAUDE CODE PARA CRIAR O DASHBOARD

## 📋 PRÉ-REQUISITOS

Antes de começar, certifique-se de ter instalado:

```bash
# Verificar versões
node --version    # Deve ser >= 18.0.0
npm --version     # Deve ser >= 9.0.0
```

Se não tiver Node.js:
- Windows/Mac: https://nodejs.org/
- Linux: `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs`

---

## 🔧 PASSO 1: INSTALAR CLAUDE CODE

```bash
# Instalar globalmente
npm install -g @anthropic-ai/claude-code

# Verificar instalação
claude-code --version
```

**Alternativa (sem instalação global):**
```bash
# Usar npx diretamente
npx @anthropic-ai/claude-code --version
```

---

## 📂 PASSO 2: PREPARAR O AMBIENTE

```bash
# Criar diretório do projeto
mkdir ~/projetos/dashboard-conversao
cd ~/projetos/dashboard-conversao

# Criar arquivo de prompt
# (use o arquivo PROMPT_CLAUDE_CODE.txt que forneci)
```

---

## 🎯 PASSO 3: EXECUTAR CLAUDE CODE

### Opção A: Com arquivo de prompt (RECOMENDADO)

```bash
# Copie o PROMPT_CLAUDE_CODE.txt para o diretório atual
cp /caminho/para/PROMPT_CLAUDE_CODE.txt ./prompt.txt

# Execute Claude Code
claude-code -f prompt.txt

# Ou com npx:
npx @anthropic-ai/claude-code -f prompt.txt
```

### Opção B: Comando direto

```bash
# Cole o prompt diretamente (menos recomendado por ser muito longo)
claude-code "$(cat prompt.txt)"
```

### Opção C: Interativo (passo a passo)

```bash
# Inicie Claude Code em modo interativo
claude-code

# No prompt, cole o conteúdo do PROMPT_CLAUDE_CODE.txt
```

---

## ⏱️ PASSO 4: AGUARDAR CRIAÇÃO

Claude Code vai:
1. ✅ Analisar o prompt completo
2. ✅ Criar estrutura de diretórios
3. ✅ Gerar todos os arquivos TypeScript
4. ✅ Criar package.json com dependências
5. ✅ Configurar tsconfig, .env.example
6. ✅ Gerar documentação

**Tempo estimado:** 5-10 minutos

Você verá algo como:
```
[Claude Code] Analyzing requirements...
[Claude Code] Creating directory structure...
[Claude Code] Generating backend models...
[Claude Code] Implementing services...
[Claude Code] Creating controllers and routes...
[Claude Code] Setting up queues and workers...
[Claude Code] Generating frontend components...
[Claude Code] Creating configuration files...
[Claude Code] ✅ Project created successfully!
```

---

## 📦 PASSO 5: INSTALAR DEPENDÊNCIAS

### Backend:

```bash
cd backend

# Instalar todas as dependências
npm install

# Dependências principais que serão instaladas:
# - express
# - mongoose
# - redis
# - bullmq
# - typescript
# - e outras...

# Aguarde a instalação (pode levar 2-5 minutos)
```

### Frontend:

```bash
cd ../frontend

# Instalar todas as dependências
npm install

# Dependências principais:
# - react
# - typescript
# - vite
# - tailwindcss
# - react-query
# - recharts
# - e outras...
```

---

## ⚙️ PASSO 6: CONFIGURAR AMBIENTE

### Backend (.env):

```bash
cd backend

# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas configurações
nano .env
# ou
code .env
# ou
vim .env
```

**Configurações mínimas para testar:**

```env
# MongoDB (pode usar local ou MongoDB Atlas)
MONGODB_URI=mongodb://localhost:27017/dashboard_conversao

# Redis (local)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Server
PORT=3000
NODE_ENV=development

# Custos (centavos)
COST_IA_CALL=50
COST_RCS=15
COST_SMS=10
COST_EMAIL=5
COST_WHATSAPP_MESSAGE=5
```

**Para produção, adicione as APIs externas:**
- IA_CALL_API_URL e IA_CALL_API_KEY
- RCS_API_URL e RCS_API_KEY
- SMS_API_URL e SMS_API_KEY
- EMAIL_API_URL e EMAIL_API_KEY
- WHATSAPP_API_URL e WHATSAPP_API_KEY

---

## 🗄️ PASSO 7: INICIAR BANCO DE DADOS

### Opção A: Docker (Recomendado)

```bash
# No diretório raiz do projeto
docker-compose up -d

# Isso iniciará MongoDB e Redis
```

Se não tiver docker-compose, crie um arquivo `docker-compose.yml`:

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: dashboard_conversao

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongodb_data:
  redis_data:
```

### Opção B: Instalação Local

**MongoDB:**
- Mac: `brew install mongodb-community@6.0`
- Ubuntu: `sudo apt-get install mongodb-org`
- Windows: Download do site oficial

**Redis:**
- Mac: `brew install redis`
- Ubuntu: `sudo apt-get install redis-server`
- Windows: Download do GitHub

**Iniciar serviços:**
```bash
# MongoDB
mongod --dbpath ~/data/db

# Redis
redis-server
```

---

## 🚀 PASSO 8: INICIAR APLICAÇÃO

### Terminal 1 - Backend API:

```bash
cd backend

# Modo desenvolvimento (com hot reload)
npm run dev

# Você verá:
# [Server] Conectando ao MongoDB...
# [Server] MongoDB conectado com sucesso
# [Server] Servidor rodando na porta 3000
# [Server] Health check: http://localhost:3000/api/health
```

### Terminal 2 - Workers (processamento assíncrono):

```bash
cd backend

# Iniciar workers
npm run worker

# Você verá:
# [Workers] Conectando ao Redis...
# [Workers] Workers inicializados:
#   - iaCallWorker
#   - whatsappWorker
#   - rcsWorker
#   - smsWorker
#   - emailWorker
#   - proposalCheckWorker
# [Workers] Aguardando jobs...
```

### Terminal 3 - Frontend:

```bash
cd frontend

# Iniciar dev server
npm run dev

# Você verá:
# VITE v5.0.11  ready in 450 ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

---

## ✅ PASSO 9: TESTAR

### 1. Health Check:

```bash
curl http://localhost:3000/api/health

# Resposta esperada:
# {
#   "success": true,
#   "message": "Dashboard de Conversão API está rodando",
#   "timestamp": "2026-02-07T..."
# }
```

### 2. Importar Lead (teste):

```bash
curl -X POST http://localhost:3000/api/leads/importar \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678900",
    "nome_completo": "João da Silva",
    "telefones": [
      {
        "numero": "11987654321",
        "prioridade": 1,
        "origem": "LP"
      }
    ],
    "emails": [
      {
        "email": "joao@email.com",
        "origem": "LP"
      }
    ],
    "proposta": {
      "id_proposta": "PROP-123",
      "data_criacao_proposta": "2026-02-07T10:00:00Z",
      "valor_liberado": 15000,
      "prazo_meses": 24,
      "valor_parcela": 750,
      "banco": "Itaú",
      "link_assinatura_atual": "https://assinatura.exemplo.com/123",
      "data_geracao_link_assinatura": "2026-02-07T10:00:00Z"
    },
    "origem": "META",
    "custo_aquisicao": 5000
  }'
```

### 3. Listar Leads:

```bash
curl http://localhost:3000/api/leads
```

### 4. Acessar Frontend:

Abra o navegador em: http://localhost:5173

---

## 🔍 PASSO 10: VERIFICAR ESTRUTURA

```bash
# Verificar arquivos criados
tree -L 3 dashboard-conversao-legal-viver/

# Deve mostrar:
# dashboard-conversao-legal-viver/
# ├── backend/
# │   ├── src/
# │   │   ├── models/
# │   │   ├── services/
# │   │   ├── controllers/
# │   │   ├── queues/
# │   │   ├── workers/
# │   │   ├── routes/
# │   │   ├── config/
# │   │   ├── utils/
# │   │   └── server.ts
# │   ├── package.json
# │   ├── tsconfig.json
# │   └── .env
# └── frontend/
#     ├── src/
#     │   ├── components/
#     │   ├── pages/
#     │   └── App.tsx
#     └── package.json
```

---

## 🐛 TROUBLESHOOTING

### Problema 1: "Cannot find module"

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Problema 2: MongoDB não conecta

```bash
# Verificar se MongoDB está rodando
mongosh

# Ou
mongo

# Se não funcionar, iniciar MongoDB:
mongod --dbpath ~/data/db
```

### Problema 3: Redis não conecta

```bash
# Verificar se Redis está rodando
redis-cli ping

# Deve retornar: PONG

# Se não funcionar, iniciar Redis:
redis-server
```

### Problema 4: Porta 3000 em uso

```bash
# Verificar processo na porta
lsof -i :3000

# Matar processo
kill -9 <PID>

# Ou mudar a porta no .env:
PORT=3001
```

### Problema 5: TypeScript errors

```bash
# Backend
cd backend
npm run build

# Se houver erros, verificar tsconfig.json
# e instalar @types faltando
```

---

## 📝 PRÓXIMOS PASSOS

### 1. Popular Templates de Mensagens

```bash
# Criar script seed para templates
cd backend
node scripts/seed-templates.js
```

### 2. Configurar APIs Externas

Edite `.env` com suas credenciais reais:
- IA de Ligação
- RCS
- SMS
- Email
- WhatsApp

### 3. Testar Fluxos Completos

- Importar lead real
- Verificar acionamento de IA
- Testar roleta WhatsApp
- Verificar webhooks

### 4. Customizar Frontend

- Ajustar cores do tema
- Adicionar logo da empresa
- Customizar textos

### 5. Deploy

- Configurar ambiente de produção
- Usar PM2 para gerenciar processos
- Configurar Nginx como proxy reverso

---

## 🎓 RECURSOS ADICIONAIS

### Documentação:
- MongoDB: https://docs.mongodb.com/
- Redis: https://redis.io/docs/
- BullMQ: https://docs.bullmq.io/
- Express: https://expressjs.com/
- React: https://react.dev/

### Ferramentas úteis:
- MongoDB Compass (GUI para MongoDB)
- Redis Commander (GUI para Redis)
- Postman (testar APIs)
- VS Code (editor recomendado)

---

## 💡 DICAS PRO

1. **Use o VS Code**: Melhor suporte para TypeScript
2. **Instale extensões**:
   - ESLint
   - Prettier
   - MongoDB for VS Code
   - Docker
3. **Configure Git**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit from Claude Code"
   ```
4. **Use Docker**: Mais fácil para gerenciar MongoDB e Redis
5. **Leia os logs**: Ajudam muito no debug

---

## ✅ CHECKLIST DE SUCESSO

- [ ] Claude Code instalado
- [ ] Projeto criado com sucesso
- [ ] Dependências instaladas (backend e frontend)
- [ ] .env configurado
- [ ] MongoDB rodando
- [ ] Redis rodando
- [ ] Backend API iniciado (porta 3000)
- [ ] Workers iniciados
- [ ] Frontend iniciado (porta 5173)
- [ ] Health check funcionando
- [ ] Lead de teste importado
- [ ] Dashboard abrindo no navegador

---

## 🎉 PARABÉNS!

Se todos os itens do checklist estão marcados, você tem um sistema completo e funcional de Dashboard de Conversão rodando!

**Próximo passo:** Começar a usar em ambiente de desenvolvimento e customizar conforme necessidade.

---

## 🆘 PRECISA DE AJUDA?

1. Verifique os logs em `backend/logs/`
2. Revise a documentação em `DOCUMENTACAO_COMPLETA.md`
3. Consulte os READMEs em `backend/README.md` e `frontend/README.md`
4. Todos os arquivos TypeScript têm comentários explicativos

**Boa sorte com seu Dashboard de Conversão!** 🚀
