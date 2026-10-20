#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE RESTAURAÇÃO — EMPÓRIO HENZ (BANCO DE DADOS + UPLOADS)
# ==============================================================================
# Restaura o par gerado pelo scripts/backup.sh a partir do timestamp:
#   backups/backup_<banco>_<timestamp>.sql.gz  -> PostgreSQL (container postgres)
#   backups/uploads_<timestamp>.tar.gz         -> /app/uploads (container backend)
#
# Uso:
#   ./scripts/restore.sh <timestamp> [--force]
#       Ex.: ./scripts/restore.sh 2026-10-20_030000
#   ./scripts/restore.sh --db-only <arquivo.sql.gz> [--force]
#       Restaura só o banco. Serve para backups antigos, anteriores ao tar de uploads.
#
# --force pula a confirmação interativa.
# ==============================================================================

set -e
set -o pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

usage() {
    echo "Uso:"
    echo "  $0 <timestamp> [--force]                 # banco + uploads do mesmo timestamp"
    echo "  $0 --db-only <arquivo.sql.gz> [--force]  # só o banco (backups antigos)"
}

MODE="full"
FORCE="no"
TARGET=""
for arg in "$@"; do
    case "$arg" in
        --db-only) MODE="db-only" ;;
        --force) FORCE="yes" ;;
        -h|--help) usage; exit 0 ;;
        *) TARGET="$arg" ;;
    esac
done

if [ -z "$TARGET" ]; then
    usage
    exit 1
fi

# Carregar variáveis do .env
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-emporio_henz}"
BACKUP_DIR="${PROJECT_DIR}/backups"
COMPOSE="docker compose --profile prod"

UPLOADS_FILE=""
if [ "$MODE" = "db-only" ]; then
    BACKUP_FILE="$TARGET"
else
    TIMESTAMP="$TARGET"
    BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_${TIMESTAMP}.sql.gz"
    UPLOADS_FILE="${BACKUP_DIR}/uploads_${TIMESTAMP}.tar.gz"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Erro: Arquivo de banco '$BACKUP_FILE' não encontrado!"
    if [ "$MODE" = "full" ]; then
        echo "Timestamps disponíveis em $BACKUP_DIR:"
        ls -1 "$BACKUP_DIR"/backup_"${DB_NAME}"_*.sql.gz 2>/dev/null | sed -E "s|.*/backup_${DB_NAME}_(.*)\.sql\.gz|  \1|" || true
    fi
    exit 1
fi

if [ "$MODE" = "full" ] && [ ! -f "$UPLOADS_FILE" ]; then
    echo "Erro: Arquivo de uploads '$UPLOADS_FILE' não encontrado!"
    echo "Para restaurar só o banco (backup anterior ao tar de uploads), use:"
    echo "  $0 --db-only $BACKUP_FILE"
    exit 1
fi

echo "=========================================================="
echo " ATENÇÃO: RESTAURAÇÃO DE BANCO DE DADOS E UPLOADS"
echo " Banco alvo: $DB_NAME"
echo " Arquivo de banco: $BACKUP_FILE"
if [ -n "$UPLOADS_FILE" ]; then
    echo " Arquivo de uploads: $UPLOADS_FILE -> /app/uploads (container backend)"
else
    echo " Uploads: não restaurados (--db-only)"
fi
echo " Esta operação irá sobrescrever dados existentes!"
echo "=========================================================="

if [ "$FORCE" != "yes" ]; then
    read -p "Deseja continuar com a restauração? (digite 'sim' para confirmar): " CONFIRM
    if [ "$CONFIRM" != "sim" ]; then
        echo "Operação cancelada pelo operador."
        exit 0
    fi
fi

echo "Iniciando descompactação e aplicação do backup via psql..."

# 1. Descompacta e canaliza diretamente para o psql dentro do container postgres
gunzip -c "$BACKUP_FILE" | $COMPOSE exec -T postgres psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME"

echo "✓ Banco de dados '$DB_NAME' restaurado com sucesso!"

# 2. Extrai o tar de uploads em /app do container backend (o tar foi gerado com
#    -C /app uploads, então volta exatamente para /app/uploads). Arquivos já
#    existentes com o mesmo nome são sobrescritos; os demais são preservados.
if [ -n "$UPLOADS_FILE" ]; then
    echo "Restaurando fotos e amostras em /app/uploads..."
    $COMPOSE exec -T backend sh -c 'mkdir -p /app/uploads'
    cat "$UPLOADS_FILE" | $COMPOSE exec -T backend tar xzf - -C /app
    RESTORED_COUNT=$($COMPOSE exec -T backend sh -c 'find /app/uploads -type f -name "*.webp" | wc -l' | tr -d '[:space:]')
    echo "✓ Uploads restaurados com sucesso (${RESTORED_COUNT} imagens em /app/uploads)!"
fi

echo "Restauração concluída."
