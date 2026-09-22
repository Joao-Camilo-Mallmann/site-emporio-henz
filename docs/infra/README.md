# Documentação de Infraestrutura e DevOps — Empório Henz

Este diretório concentra as diretrizes operacionais de infraestrutura, conteinerização Docker, proxy reverso Nginx, rotinas de salvaguarda (backup/restauração) e automação de deploy na VM do Portal Empório Henz.

---

## 🏗️ Arquitetura dos Serviços (Docker Compose)

A infraestrutura completa roda de forma orquestrada em rede interna isolada (`emporio_net`), definida em [docker-compose.yml](../../docker-compose.yml) e [Dockerfile](../../Dockerfile):

```
       [ Usuário / Navegador ]
                 │
                 ▼ Porta 80
      ┌──────────────────────┐
      │   Nginx (Reverse     │
      │   Proxy & Estáticos) │
      └──────────┬───────────┘
                 │
        ┌────────┴────────┐
        │ /api/*          │ /*
        ▼                 ▼
 ┌─────────────┐   ┌─────────────┐
 │   Backend   │   │  Frontend   │
 │ (Bun.serve) │   │ (Vue3 Dist) │
 └──────┬──────┘   └─────────────┘
        │
        ▼ Porta 5432
 ┌─────────────┐   ┌─────────────┐
 │  PostgreSQL │◄──┤  Migration  │ (Runner Bun one-shot
 │     16      │   │   Runner    │  executa migrate.ts)
 └─────────────┘   └─────────────┘
```

1. **`postgres` (`postgres:16-alpine`)**:
   - Persistência garantida através do volume de dados nomeado `postgres_data`.
   - Healthcheck nativo (`pg_isready`) monitorando integridade para liberação dos serviços dependentes.

2. **`migration` (One-shot Bun container)**:
   - Aguarda o status `healthy` do PostgreSQL e executa as migrações SQL idempotentes antes do backend entrar em operação.

3. **`backend` (Bun API)**:
   - Container multi-stage rodando a API na porta interna `3001`.

4. **`nginx` (`nginx:alpine`)**:
   - Ponto único de entrada público (`PORT_HTTP`, padrão: `80`).
   - Serve os arquivos compilados do Vue 3 (`apps/web/dist`) e redireciona chamadas `/api/*` e `/health` para o container do backend com repasse de cabeçalhos (`X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`).

---

## 📁 Arquivos e Guias do Diretório

| Arquivo | Descrição |
| :--- | :--- |
| [backup-restore-guide.md](./backup-restore-guide.md) | Guia operacional completo para rotinas manuais e automáticas de backup com compressão `.sql.gz`, restauração com flag `--force` e agendamento via Cron na VM Linux. |

---

## 🛠️ Scripts Operacionais da Raiz

- [deploy.sh](../../deploy.sh): Script de deploy automatizado para ambiente Linux/VM com validação de `.env`, build com Docker Compose e remoção de imagens órfãs.
- [scripts/backup.sh](../../scripts/backup.sh): Script utilitário para geração de dump PostgreSQL compactado com rotação de retenção (30 dias).
- [scripts/restore.sh](../../scripts/restore.sh): Script utilitário para restauração segura de base a partir de dump compactado.

---

## 🚀 Comandos Rápidos de Infraestrutura

- **Subir toda a stack com rebuild**:
  ```bash
  docker compose up -d --build
  ```
- **Acompanhar logs unificados em tempo real**:
  ```bash
  docker compose logs -f
  ```
- **Parar containers mantendo o banco de dados**:
  ```bash
  docker compose down
  ```
- **Reset total (apagar volumes e recriar banco do zero)**:
  ```bash
  docker compose down -v
  ```
