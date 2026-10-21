#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE BACKUP AUTOMATIZADO — EMPÓRIO HENZ (BANCO DE DADOS + UPLOADS)
# ==============================================================================
# Gera, numa mesma execução e com o mesmo timestamp:
#   1. backups/backup_<banco>_<TS>.sql.gz  — dump completo do PostgreSQL
#   2. backups/uploads_<TS>.tar.gz        — fotos de produto e amostras de variação
#                                           (diretório /app/uploads do container
#                                           backend, volume Docker uploads_data)
#
# O dump é feito primeiro. Como o backend nunca apaga arquivos de imagem, todo
# caminho registrado no dump tem o arquivo correspondente no tar gerado depois.
#
# Uso manual:
#   ./scripts/backup.sh
# Uso agendado (crontab na VM):
#   0 3 * * * /caminho/para/site-emporio-henz/scripts/backup.sh >> /var/log/emporio-backup.log 2>&1
# Restauração:
#   ./scripts/restore.sh <TS>
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
UPLOADS_FILE="${BACKUP_DIR}/uploads_${TIMESTAMP}.tar.gz"

# O serviço backend pertence ao perfil "prod"; o perfil precisa estar ativo para
# o compose resolver o serviço no exec.
COMPOSE="docker compose --profile prod"

# Cria diretório de backups se não existir
mkdir -p "$BACKUP_DIR"

echo "[$(date +"%Y-%m-%d %H:%M:%S")] Iniciando backup do banco de dados '$DB_NAME'..."

# 1. Executa pg_dump dentro do container postgres e compacta com gzip.
#    --clean --if-exists faz o dump recriar as tabelas ao ser restaurado, para que o
#    restore funcione num stack limpo em que o backend já rodou as migrações.
$COMPOSE exec -T postgres pg_dump --clean --if-exists -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

FILESIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
echo "[$(date +"%Y-%m-%d %H:%M:%S")] ✓ Dump do banco concluído: $BACKUP_FILE ($FILESIZE)"

# 2. Empacota o diretório de uploads a partir do container backend (evita depender
#    do nome do volume, que leva o prefixo do projeto compose). O mkdir garante o
#    tar mesmo antes da primeira foto enviada.
# O tar vai para um .partial e só ganha o nome final se o exec der certo; assim
# um backend parado não deixa um uploads_<TS>.tar.gz vazio para o restore usar.
trap 'rm -f "${UPLOADS_FILE}.partial"' EXIT
echo "[$(date +"%Y-%m-%d %H:%M:%S")] Iniciando backup das fotos e amostras (/app/uploads)..."
$COMPOSE exec -T backend sh -c 'mkdir -p /app/uploads && tar czf - -C /app uploads' > "${UPLOADS_FILE}.partial"
mv "${UPLOADS_FILE}.partial" "$UPLOADS_FILE"

UPLOADS_SIZE=$(ls -lh "$UPLOADS_FILE" | awk '{print $5}')
UPLOADS_COUNT=$(tar tzf "$UPLOADS_FILE" | grep -c '\.webp$' || true)
echo "[$(date +"%Y-%m-%d %H:%M:%S")] ✓ Backup dos uploads concluído: $UPLOADS_FILE ($UPLOADS_SIZE, ${UPLOADS_COUNT} imagens)"

# Limpeza: remove backups (banco e uploads) com mais de 30 dias para evitar esgotamento de disco
echo "[$(date +"%Y-%m-%d %H:%M:%S")] Verificando backups antigos (retenção: 30 dias)..."
find "$BACKUP_DIR" -type f \( -name "backup_*.sql.gz" -o -name "uploads_*.tar.gz" \) -mtime +30 -exec rm -f {} \;
echo "[$(date +"%Y-%m-%d %H:%M:%S")] Rotina de backup finalizada (timestamp: $TIMESTAMP)."
