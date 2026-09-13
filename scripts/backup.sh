#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE BACKUP AUTOMATIZADO DO POSTGRESQL — EMPÓRIO HENZ
# ==============================================================================
# Gera um dump completo compactado (.sql.gz) a partir do container PostgreSQL.
# Uso manual:
#   ./scripts/backup.sh
# Uso agendado (crontab na VM):
#   0 3 * * * /caminho/para/site-emporio-henz/scripts/backup.sh >> /var/log/emporio-backup.log 2>&1
# ==============================================================================

set -e
set -o pipefail

# Diretório raiz do projeto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# Carregar variáveis do .env
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-emporio_henz}"
BACKUP_DIR="${PROJECT_DIR}/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_${TIMESTAMP}.sql.gz"

# Cria diretório de backups se não existir
mkdir -p "$BACKUP_DIR"

echo "[$(date +"%Y-%m-%d %H:%M:%S")] Iniciando backup do banco de dados '$DB_NAME'..."

# Executa pg_dump dentro do container postgres e compacta com gzip
docker compose exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

FILESIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
echo "[$(date +"%Y-%m-%d %H:%M:%S")] ✓ Backup concluído com sucesso: $BACKUP_FILE ($FILESIZE)"

# Limpeza: remove backups com mais de 30 dias para evitar esgotamento de disco
echo "[$(date +"%Y-%m-%d %H:%M:%S")] Verificando backups antigos (retenção: 30 dias)..."
find "$BACKUP_DIR" -type f -name "backup_*.sql.gz" -mtime +30 -exec rm -f {} \;
echo "[$(date +"%Y-%m-%d %H:%M:%S")] Rotina de backup finalizada."
