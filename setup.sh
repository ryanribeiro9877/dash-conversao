#!/bin/bash

# ============================================================================
# Script de Inicialização Rápida - Dashboard de Conversão
# ============================================================================

set -e  # Parar em caso de erro

echo "🚀 Iniciando setup do Dashboard de Conversão..."
echo ""

# Verificar pré-requisitos
echo "📋 Verificando pré-requisitos..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js >= 18.0.0"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Instale npm >= 9.0.0"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale Docker >= 20.0.0"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Instale Docker Compose >= 2.0.0"
    exit 1
fi

echo "✅ Todos os pré-requisitos atendidos"
echo ""

# Iniciar banco de dados
echo "🐳 Iniciando PostgreSQL e Redis..."
docker-compose up -d postgres redis

echo "⏳ Aguardando banco de dados iniciar (15 segundos)..."
sleep 15

echo "✅ Banco de dados pronto"
echo ""

# Setup Backend
echo "📦 Configurando Backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env do backend..."
    cp .env.example .env
fi

echo "📥 Instalando dependências do backend..."
npm install --silent

echo "🗄️ Configurando banco de dados..."
npx prisma generate
npx prisma migrate dev --name init

echo "✅ Backend configurado"
echo ""

# Setup Frontend
echo "🎨 Configurando Frontend..."
cd ../frontend

if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env do frontend..."
    cp .env.example .env
fi

echo "📥 Instalando dependências do frontend..."
npm install --silent

echo "✅ Frontend configurado"
cd ..
echo ""

# Mensagem final
echo "============================================================================"
echo "✅ Setup concluído com sucesso!"
echo "============================================================================"
echo ""
echo "Para iniciar a aplicação, abra 3 terminais e execute:"
echo ""
echo "Terminal 1 (Backend API):"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 (Workers):"
echo "  cd backend && npm run workers"
echo ""
echo "Terminal 3 (Frontend):"
echo "  cd frontend && npm run dev"
echo ""
echo "Após iniciar, acesse:"
echo "  📊 Dashboard: http://localhost:5173"
echo "  🔌 API: http://localhost:3000"
echo "  💚 Health: http://localhost:3000/health"
echo ""
echo "============================================================================"
echo ""
echo "📚 Para mais informações, leia:"
echo "  - README.md (visão geral)"
echo "  - INSTALACAO.md (guia detalhado)"
echo "  - docs/ARCHITECTURE.md (arquitetura técnica)"
echo ""
echo "Bom trabalho! 🎉"
