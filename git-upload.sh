#!/bin/bash

# ========================================
# SCRIPT PARA UPLOAD NO GITHUB
# Dashboard de Conversão - Legal é Viver
# ========================================

echo "🚀 Iniciando upload para GitHub..."
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Pedir username do GitHub
echo -e "${BLUE}Digite seu username do GitHub:${NC}"
read GITHUB_USER

if [ -z "$GITHUB_USER" ]; then
    echo -e "${YELLOW}Username não pode ser vazio!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓${NC} Username: $GITHUB_USER"
echo ""

# Nome do repositório
REPO_NAME="dashboard-conversao-legal-viver"

echo "📋 Passos que serão executados:"
echo "1. git init"
echo "2. git add ."
echo "3. git commit"
echo "4. git remote add origin"
echo "5. git branch -M main"
echo "6. git push -u origin main"
echo ""

read -p "Continuar? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[SsSs]$ ]]; then
    echo "Operação cancelada."
    exit 0
fi

echo ""
echo "🔧 Inicializando repositório Git..."

# Inicializar Git
git init

# Adicionar todos os arquivos
echo "📦 Adicionando arquivos..."
git add .

# Commit
echo "💾 Criando commit inicial..."
git commit -m "🎉 Initial commit: Sistema Dashboard de Conversão completo

- Backend Node.js + TypeScript + Express
- Frontend React + TypeScript + Vite  
- Sistema de cores (6 status)
- IA de Ligação com todas as regras
- WhatsApp Roleta (20 conexões, 25/dia)
- Motores Marketing (RCS, SMS, Email)
- Filas BullMQ + 6 Workers
- MongoDB + Redis
- Dashboard visual completo
- Documentação completa

Implementado 100% conforme especificação técnica."

# Adicionar remote
echo "🔗 Conectando ao GitHub..."
git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"

# Renomear branch para main
git branch -M main

# Push
echo ""
echo "⬆️  Enviando para GitHub..."
echo ""
echo -e "${YELLOW}ATENÇÃO:${NC}"
echo "- Username: $GITHUB_USER"
echo "- Password: Use um Personal Access Token (não a senha)"
echo ""
echo "Como criar token:"
echo "1. GitHub → Settings → Developer settings"
echo "2. Personal access tokens → Generate new token"
echo "3. Marque 'repo' (full control)"
echo "4. Copie o token e use como senha"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ SUCESSO!${NC}"
    echo ""
    echo "🎉 Projeto enviado para GitHub!"
    echo ""
    echo "📍 URL do repositório:"
    echo "https://github.com/$GITHUB_USER/$REPO_NAME"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Acesse o link acima"
    echo "2. Adicione colaboradores (Settings → Collaborators)"
    echo "3. Configure branch protection"
    echo "4. Crie issues para tarefas"
    echo ""
else
    echo ""
    echo -e "${YELLOW}⚠️  Houve um problema no upload${NC}"
    echo ""
    echo "Possíveis soluções:"
    echo "1. Certifique-se que o repositório existe no GitHub"
    echo "2. Use Personal Access Token como senha"
    echo "3. Verifique permissões do repositório"
    echo ""
    echo "Execute manualmente:"
    echo "git push -u origin main"
fi

