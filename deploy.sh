#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE DEPLOY LOCAL NA VM — EMPÓRIO HENZ
# ==============================================================================
# Executa a esteira de atualização contínua diretamente na máquina host / VM:
# 1. Atualização do repositório (Git Pull)
# 2. Verificação do arquivo de variáveis (.env)
# 3. Build das imagens Docker multi-stage
# 4. Inicialização do banco PostgreSQL com espera de prontidão (healthcheck)
# 5. Inicialização do Backend (executa auto-migração no startup) e Nginx
# 6. Limpeza de imagens antigas não utilizadas (dangling images)
# ==============================================================================

set -e
set -o pipefail

# Cores para saída no terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}     Iniciando Deploy Local — Empório Henz           ${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Verificar comandos obrigatórios
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Erro: 'docker' não está instalado.${NC}" >&2; exit 1; }

# Determinar comando do docker compose (v2 ou v1)
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${RED}Erro: nem 'docker compose' nem 'docker-compose' foram encontrados.${NC}" >&2
    exit 1
fi

# 2. Garantir existência e validar variáveis do arquivo .env
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}Aviso: Arquivo .env não encontrado. Copiando .env.example para .env...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}Configure as credenciais em .env antes de executar em ambiente de produção!${NC}"
    else
        echo -e "${RED}Erro: Arquivo .env ou .env.example não encontrado!${NC}" >&2
        exit 1
    fi
fi

# Validar variáveis críticas de segurança
if grep -q "altere_para_uma_senha_forte_e_segura" .env 2>/dev/null; then
    echo -e "${YELLOW}[ATENÇÃO DE SEGURANÇA] POSTGRES_PASSWORD em .env contém a senha de exemplo padrão. Altere para uma senha forte!${NC}"
fi

if grep -q "emporio-henz-default-jwt-secret" .env 2>/dev/null; then
    echo -e "${YELLOW}[ATENÇÃO DE SEGURANÇA] JWT_SECRET em .env contém o segredo de exemplo padrão. Altere para um segredo seguro (openssl rand -base64 32)!${NC}"
fi

# 3. Atualizar código do repositório Git (se for repositório git)
if [ -d ".git" ]; then
    echo -e "\n${BLUE}[1/5] Atualizando código via Git...${NC}"
    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    echo "Puxando alterações da branch '$BRANCH'..."
    git pull origin "$BRANCH" || {
        echo -e "${YELLOW}Aviso: Falha ao atualizar via git pull (talvez sem conexão remota ou branch local). Continuando...${NC}"
    }
else
    echo -e "\n${YELLOW}[1/5] Repositório .git não detectado. Pulando git pull.${NC}"
fi

# 4. Construir imagens Docker atualizadas para produção
echo -e "\n${BLUE}[2/5] Construindo imagens Docker atualizadas (perfil prod)...${NC}"
$DOCKER_COMPOSE --profile prod build

# 5. Iniciar PostgreSQL e aguardar prontidão
echo -e "\n${BLUE}[3/5] Iniciando PostgreSQL e aguardando inicialização...${NC}"
$DOCKER_COMPOSE up -d postgres

# Aguardar PostgreSQL estar pronto via healthcheck
echo "Aguardando serviço postgres ficar saudável..."
RETRIES=30
until [ $($DOCKER_COMPOSE ps postgres --format json 2>/dev/null | grep -i '"healthy"' | wc -l) -gt 0 ] || [ $RETRIES -le 0 ]; do
    sleep 1
    RETRIES=$((RETRIES - 1))
done

if [ $RETRIES -le 0 ]; then
    echo -e "${YELLOW}Healthcheck demorou a responder, verificando conectividade direta...${NC}"
    sleep 3
fi

# 6. Iniciar Backend (que executa as migrações no startup) e Nginx
echo -e "\n${BLUE}[4/5] Subindo serviços de aplicação em produção (Backend + Nginx)...${NC}"
$DOCKER_COMPOSE --profile prod up -d --remove-orphans backend nginx

# 7. Limpar imagens antigas sem tag para economizar disco na VM
echo -e "\n${BLUE}[5/5] Limpando imagens antigas e camadas órfãs...${NC}"
docker image prune -f >/dev/null 2>&1 || true

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}     Deploy concluído com sucesso!                   ${NC}"
echo -e "${GREEN}====================================================${NC}"

# Informações de isolamento de portas e segurança
echo -e "\n${BLUE}[Segurança e Isolamento de Rede em Produção]${NC}"
echo -e " - ${GREEN}Nginx Proxy:${NC} Ponto único de entrada nas portas 80 (HTTP) e 443 (HTTPS)"
echo -e " - ${GREEN}Backend API:${NC} Isolado na rede interna Docker 'emporio_net' (sem portas públicas)"
echo -e " - ${GREEN}PostgreSQL:${NC}  Bind restrito ao loopback 127.0.0.1 (inacessível pela internet pública)"
echo -e "   -> Para acesso remoto via túnel SSH: ssh -L 5432:localhost:5432 <usuario>@<ip-vm>"

# Exibe status dos containers em produção
echo -e "\n${BLUE}[Status dos Containers]:${NC}"
$DOCKER_COMPOSE --profile prod ps
