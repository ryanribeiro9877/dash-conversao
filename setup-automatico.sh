#!/bin/bash

# ========================================
# SCRIPT DE SETUP AUTOMÁTICO
# Dashboard de Conversão - Legal é Viver
# ========================================

set -e  # Exit on error

echo "🚀 Iniciando setup do Dashboard de Conversão..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para printar com cor
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# ========================================
# 1. VERIFICAR PRÉ-REQUISITOS
# ========================================

print_step "Verificando pré-requisitos..."

# Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js não encontrado. Instale Node.js 18+ primeiro."
    echo "Visite: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js versão 18+ necessária. Versão atual: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) ✓"

# npm
if ! command -v npm &> /dev/null; then
    print_error "npm não encontrado"
    exit 1
fi
print_success "npm $(npm -v) ✓"

echo ""

# ========================================
# 2. INSTALAR CLAUDE CODE (se necessário)
# ========================================

print_step "Verificando Claude Code..."

if ! command -v claude-code &> /dev/null; then
    print_warning "Claude Code não encontrado. Instalando..."
    npm install -g @anthropic-ai/claude-code
    print_success "Claude Code instalado!"
else
    print_success "Claude Code já instalado ✓"
fi

echo ""

# ========================================
# 3. CRIAR ESTRUTURA DO PROJETO
# ========================================

print_step "Criando estrutura do projeto..."

PROJECT_NAME="dashboard-conversao-legal-viver"
CURRENT_DIR=$(pwd)

if [ -d "$PROJECT_NAME" ]; then
    print_warning "Diretório $PROJECT_NAME já existe!"
    read -p "Deseja sobrescrever? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        print_error "Operação cancelada."
        exit 1
    fi
    rm -rf "$PROJECT_NAME"
fi

mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"
print_success "Estrutura criada em: $(pwd)"

echo ""

# ========================================
# 4. EXECUTAR CLAUDE CODE
# ========================================

print_step "Executando Claude Code para criar o sistema..."
echo ""
print_warning "IMPORTANTE: Isso pode levar 5-10 minutos."
print_warning "O Claude Code irá criar TODO o código do sistema."
echo ""

# Verificar se existe arquivo de prompt
PROMPT_FILE="$CURRENT_DIR/PROMPT_CLAUDE_CODE.txt"

if [ ! -f "$PROMPT_FILE" ]; then
    print_error "Arquivo PROMPT_CLAUDE_CODE.txt não encontrado em $CURRENT_DIR"
    print_warning "Por favor, coloque o arquivo PROMPT_CLAUDE_CODE.txt no diretório atual."
    exit 1
fi

# Copiar prompt para diretório do projeto
cp "$PROMPT_FILE" ./prompt.txt

# Executar Claude Code
print_step "Iniciando Claude Code..."
claude-code -f prompt.txt

if [ $? -ne 0 ]; then
    print_error "Claude Code falhou. Verifique os logs acima."
    exit 1
fi

print_success "Claude Code executado com sucesso!"

echo ""

# ========================================
# 5. INSTALAR DEPENDÊNCIAS BACKEND
# ========================================

print_step "Instalando dependências do backend..."

if [ -d "backend" ]; then
    cd backend
    
    if [ -f "package.json" ]; then
        npm install
        print_success "Dependências do backend instaladas!"
    else
        print_error "package.json não encontrado no backend"
        exit 1
    fi
    
    cd ..
else
    print_error "Diretório backend não encontrado"
    exit 1
fi

echo ""

# ========================================
# 6. INSTALAR DEPENDÊNCIAS FRONTEND
# ========================================

print_step "Instalando dependências do frontend..."

if [ -d "frontend" ]; then
    cd frontend
    
    if [ -f "package.json" ]; then
        npm install
        print_success "Dependências do frontend instaladas!"
    else
        print_error "package.json não encontrado no frontend"
        exit 1
    fi
    
    cd ..
else
    print_error "Diretório frontend não encontrado"
    exit 1
fi

echo ""

# ========================================
# 7. CONFIGURAR AMBIENTE
# ========================================

print_step "Configurando ambiente..."

if [ -f "backend/.env.example" ]; then
    cp backend/.env.example backend/.env
    print_success "Arquivo .env criado!"
    print_warning "IMPORTANTE: Edite backend/.env com suas configurações!"
else
    print_error ".env.example não encontrado"
fi

echo ""

# ========================================
# 8. CRIAR DOCKER COMPOSE (opcional)
# ========================================

print_step "Criando docker-compose.yml..."

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mongodb:
    image: mongo:6
    container_name: dashboard-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: dashboard_conversao
    networks:
      - dashboard-network

  redis:
    image: redis:7-alpine
    container_name: dashboard-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - dashboard-network

volumes:
  mongodb_data:
    driver: local
  redis_data:
    driver: local

networks:
  dashboard-network:
    driver: bridge
EOF

print_success "docker-compose.yml criado!"

echo ""

# ========================================
# 9. CRIAR SCRIPTS DE INICIALIZAÇÃO
# ========================================

print_step "Criando scripts de inicialização..."

# Script para iniciar tudo
cat > start-all.sh << 'EOF'
#!/bin/bash

echo "🚀 Iniciando Dashboard de Conversão..."
echo ""

# Verificar se Docker está instalado
if command -v docker &> /dev/null; then
    echo "📦 Iniciando MongoDB e Redis via Docker..."
    docker-compose up -d
    sleep 5
    echo "✓ MongoDB e Redis iniciados!"
else
    echo "⚠️  Docker não encontrado. Certifique-se que MongoDB e Redis estão rodando."
fi

echo ""

# Iniciar backend
echo "🔧 Iniciando Backend API..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

echo "✓ Backend iniciado (PID: $BACKEND_PID)"
echo ""

# Iniciar workers
echo "⚙️  Iniciando Workers..."
cd backend
npm run worker &
WORKER_PID=$!
cd ..

echo "✓ Workers iniciados (PID: $WORKER_PID)"
echo ""

# Iniciar frontend
echo "🎨 Iniciando Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✓ Frontend iniciado (PID: $FRONTEND_PID)"
echo ""

echo "✅ TUDO INICIADO COM SUCESSO!"
echo ""
echo "📍 URLs:"
echo "   Backend API:  http://localhost:3000/api"
echo "   Frontend:     http://localhost:5173"
echo "   Health Check: http://localhost:3000/api/health"
echo ""
echo "Para parar todos os serviços, pressione Ctrl+C"
echo ""

# Aguardar Ctrl+C
trap "echo ''; echo '🛑 Parando serviços...'; kill $BACKEND_PID $WORKER_PID $FRONTEND_PID 2>/dev/null; docker-compose down 2>/dev/null; echo '✓ Tudo parado!'; exit 0" SIGINT SIGTERM

wait
EOF

chmod +x start-all.sh
print_success "Script start-all.sh criado!"

# Script para parar tudo
cat > stop-all.sh << 'EOF'
#!/bin/bash

echo "🛑 Parando Dashboard de Conversão..."

# Parar processos Node.js
pkill -f "npm run dev" 2>/dev/null
pkill -f "npm run worker" 2>/dev/null

# Parar Docker
if command -v docker &> /dev/null; then
    docker-compose down 2>/dev/null
fi

echo "✓ Todos os serviços foram parados!"
EOF

chmod +x stop-all.sh
print_success "Script stop-all.sh criado!"

echo ""

# ========================================
# 10. RESUMO FINAL
# ========================================

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅  SETUP COMPLETO!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📂 Projeto criado em: $(pwd)"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. Configure as variáveis de ambiente:"
echo "   ${YELLOW}nano backend/.env${NC}"
echo ""
echo "2. Inicie o MongoDB e Redis:"
echo "   ${YELLOW}docker-compose up -d${NC}"
echo "   (ou inicie manualmente se não usar Docker)"
echo ""
echo "3. Inicie todos os serviços:"
echo "   ${YELLOW}./start-all.sh${NC}"
echo ""
echo "   OU manualmente em 3 terminais:"
echo "   Terminal 1: ${YELLOW}cd backend && npm run dev${NC}"
echo "   Terminal 2: ${YELLOW}cd backend && npm run worker${NC}"
echo "   Terminal 3: ${YELLOW}cd frontend && npm run dev${NC}"
echo ""
echo "4. Acesse:"
echo "   Backend:  ${GREEN}http://localhost:3000/api${NC}"
echo "   Frontend: ${GREEN}http://localhost:5173${NC}"
echo ""
echo "📚 DOCUMENTAÇÃO:"
echo "   - README.md (principal)"
echo "   - backend/README.md"
echo "   - DOCUMENTACAO_COMPLETA.md"
echo "   - GUIA_CLAUDE_CODE.md"
echo ""
echo "🆘 PROBLEMAS?"
echo "   Verifique: backend/logs/error.log"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""

print_success "🎉 Tudo pronto! Bom trabalho!"
