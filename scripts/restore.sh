#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE RESTAURAÇÃO DO BANCO DE DADOS POSTGRESQL — EMPÓRIO HENZ
# ==============================================================================
# Restaura um dump compactado (.sql.gz) no container PostgreSQL.
#
# Uso:
#   ./scripts/restore.sh backups/backup_emporio_henz_2026-09-13_120000.sql.gz
# ==============================================================================

set -e
set -o pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

if [ -z "$1" ]; then
    echo "Uso: $0 <caminho_para_arquivo_de_backup.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Erro: Arquivo '$BACKUP_FILE' não encontrado!"
    exit 1
fi

# Carregar variáveis do .env
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-emporio_henz}"

echo "=========================================================="
echo " ATENÇÃO: RESTAURAÇÃO DE BANCO DE DADOS"
echo " Banco alvo: $DB_NAME"
echo " Arquivo de backup: $BACKUP_FILE"
echo " Esta operação irá sobrescrever dados existentes!"
echo "=========================================================="

if [ "$2" != "--force" ]; then
    read -p "Deseja continuar com a restauração? (digite 'sim' para confirmar): " CONFIRM
    if [ "$CONFIRM" != "sim" ]; then
        echo "Operação cancelada pelo operador."
        exit 0
    fi
fi

echo "Iniciando descompactação e aplicação do backup via psql..."

# Descompacta e canaliza diretamente para o psql dentro do container postgres
gunzip -c "$BACKUP_FILE" | docker compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME"

echo "✓ Restauração concluída com sucesso no banco de dados '$DB_NAME'!"
