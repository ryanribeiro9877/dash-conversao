# 🚀 Guia de Instalação e Início Rápido

## 📋 Pré-requisitos

Certifique-se de ter instalado:

```bash
✅ Node.js >= 18.0.0
✅ npm >= 9.0.0
✅ Docker >= 20.0.0
✅ Docker Compose >= 2.0.0
```

Verificar versões:
```bash
node --version
npm --version
docker --version
docker-compose --version
```

## 🔧 Passo 1: Clonar e Preparar o Projeto

```bash
# Navegar até o diretório do projeto
cd dashboard-conversao-legal-viver

# Verificar estrutura
ls -la
```

## 🐳 Passo 2: Iniciar Banco de Dados e Redis

```bash
# Iniciar PostgreSQL e Redis
docker-compose up -d postgres redis

# Verificar se estão rodando
docker-compose ps

# Ver logs (opcional)
docker-compose logs -f postgres redis
```

**Aguardar ~10 segundos para os serviços iniciarem completamente**

## 📦 Passo 3: Configurar Backend

```bash
# Entrar no diretório do backend
cd backend

# Copiar arquivo de exemplo de environment
cp .env.example .env

# IMPORTANTE: Editar .env com suas credenciais reais
# nano .env  ou  vim .env  ou use seu editor favorito

# Instalar dependências
npm install

# Aguardar instalação (pode levar 2-3 minutos)
```

## 🗄️ Passo 4: Configurar Banco de Dados

```bash
# Ainda no diretório backend/

# Gerar Prisma Client
npx prisma generate

# Executar migrations (criar tabelas)
npx prisma migrate dev --name init

# Verificar se tabelas foram criadas (opcional)
npx prisma studio
# Abrirá no navegador: http://localhost:5555
```

## 🎨 Passo 5: Configurar Frontend

```bash
# Voltar para raiz e entrar no frontend
cd ../frontend

# Copiar environment
cp .env.example .env

# Instalar dependências
npm install

# Aguardar instalação (pode levar 2-3 minutos)
```

## ▶️ Passo 6: Iniciar Aplicação

Você precisará de **3 terminais** abertos:

### Terminal 1 - Backend API
```bash
cd backend
npm run dev
```

**Aguardar ver**: 
```
🚀 Servidor rodando na porta 3000
📊 Dashboard: http://localhost:3000
🔌 WebSocket: ws://localhost:3000
💚 Health: http://localhost:3000/health
```

### Terminal 2 - Workers (Filas)
```bash
cd backend
npm run workers
```

**Aguardar ver**: 
```
Workers iniciados
✓ IA Ligação Worker
✓ RCS Worker
✓ SMS Worker
...
```

### Terminal 3 - Frontend
```bash
cd frontend
npm run dev
```

**Aguardar ver**: 
```
VITE ready in XXX ms
➜ Local: http://localhost:5173/
```

## ✅ Passo 7: Verificar Instalação

### 1. Health Check da API
```bash
curl http://localhost:3000/health
```

Resposta esperada:
```json
{
  "uptime": 123.45,
  "timestamp": "2026-02-07T...",
  "status": "OK",
  "services": {
    "api": "OK",
    "database": "OK",
    "redis": "OK"
  }
}
```

### 2. Testar Frontend
Abra no navegador: **http://localhost:5173**

Você deve ver o Dashboard de Conversão!

## 🧪 Passo 8: Criar Lead de Teste (Opcional)

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678901",
    "nomeCompleto": "João da Silva Teste",
    "origem": "META",
    "custoAquisicao": 50.00,
    "telefones": [
      {
        "numero": "11999999999",
        "prioridade": 1,
        "origem": "LP"
      }
    ],
    "emails": ["joao.teste@email.com"],
    "proposta": {
      "idProposta": "PROP-001",
      "dataCriacaoProposta": "2026-02-07T10:00:00Z",
      "valorLiberado": 10000.00,
      "prazoMeses": 12,
      "valorParcela": 900.00,
      "banco": "Banco Teste",
      "linkAssinaturaAtual": "https://assinatura.legalivv.com.br/test",
      "dataGeracaoLinkAssinatura": "2026-02-07T10:00:00Z",
      "statusProposta": "AGUARDANDO_ASSINATURA"
    }
  }'
```

Depois vá ao frontend e veja o lead aparecer!

## 🔍 Ferramentas de Debug

### PgAdmin (Gerenciar Banco)
```bash
docker-compose --profile tools up -d pgadmin
```
Acesse: **http://localhost:5050**
- Email: admin@legalivv.com.br
- Senha: admin123

### Redis Commander (Visualizar Redis)
```bash
docker-compose --profile tools up -d redis-commander
```
Acesse: **http://localhost:8081**

### Bull Board (Visualizar Filas)
Acesse: **http://localhost:3000/admin/queues**

### Prisma Studio (Gerenciar Dados)
```bash
cd backend
npx prisma studio
```
Acesse: **http://localhost:5555**

## 🛑 Parar Aplicação

```bash
# Parar frontend/backend
# Pressione Ctrl+C em cada terminal

# Parar Docker
docker-compose down

# Parar Docker e REMOVER dados (cuidado!)
docker-compose down -v
```

## 🔄 Resetar Tudo do Zero

```bash
# Parar tudo
docker-compose down -v

# Limpar node_modules
rm -rf backend/node_modules frontend/node_modules

# Limpar prisma
rm -rf backend/node_modules/.prisma

# Recomeçar do Passo 2
```

## ⚡ Scripts Úteis

```bash
# Backend
cd backend
npm run dev          # Desenvolvimento
npm run build        # Build para produção
npm run start        # Produção
npm run workers      # Workers
npm test             # Testes
npm run lint         # Linter

# Frontend
cd frontend
npm run dev          # Desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
```

## 📊 Acessos Rápidos

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:5173 | Dashboard principal |
| **API** | http://localhost:3000 | Backend API |
| **Health Check** | http://localhost:3000/health | Status dos serviços |
| **Bull Board** | http://localhost:3000/admin/queues | Monitorar filas |
| **Prisma Studio** | http://localhost:5555 | Gerenciar dados |
| **PgAdmin** | http://localhost:5050 | PostgreSQL GUI |
| **Redis Commander** | http://localhost:8081 | Redis GUI |

## 🐛 Troubleshooting

### Erro: "Port 3000 already in use"
```bash
# Encontrar processo usando a porta
lsof -ti:3000

# Matar processo
kill -9 $(lsof -ti:3000)
```

### Erro: "Cannot connect to database"
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Ver logs
docker-compose logs postgres

# Reiniciar
docker-compose restart postgres
```

### Erro: "Prisma Client não encontrado"
```bash
cd backend
npx prisma generate
```

### Frontend não conecta na API
Verifique o arquivo `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

## 📚 Próximos Passos

1. ✅ Sistema instalado e rodando
2. 📖 Ler a documentação completa no README.md
3. 🔧 Configurar suas credenciais reais de APIs (IA Ligação, RCS, SMS, etc.)
4. 🎨 Customizar o frontend conforme necessário
5. 🚀 Fazer deploy em produção

## 💡 Dicas de Produção

Antes de ir para produção:

1. ⚠️ **Trocar todas as senhas e secrets**
2. ⚠️ **Configurar CORS adequadamente**
3. ⚠️ **Configurar SSL/TLS**
4. ⚠️ **Configurar backups automáticos do PostgreSQL**
5. ⚠️ **Configurar monitoramento (logs, métricas)**
6. ⚠️ **Configurar rate limiting adequado**
7. ⚠️ **Testar todos os webhooks**

## 📞 Suporte

Problemas? Entre em contato:
- Email: suporte@legalivv.com.br
- Documentação: docs/
- Issues: GitHub Issues

---

**Última atualização**: 07/02/2026  
**Versão**: 1.0.0
