# Documentação de Infraestrutura e DevOps — Empório Henz

Este diretório concentra as diretrizes operacionais de infraestrutura, conteinerização Docker, proxy reverso Nginx, rotinas de salvaguarda (backup/restauração) e automação de deploy na VM do Portal Empório Henz.

---

## 🏗️ Arquitetura dos Serviços (Docker Compose)

A infraestrutura completa roda de forma orquestrada em rede interna isolada (`emporio_net`), definida em [docker-compose.yml](../../docker-compose.yml) e nos Dockerfiles autônomos [backend/Dockerfile](../../backend/Dockerfile) e [frontend/Dockerfile](../../frontend/Dockerfile):

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
        │ (Auto-migrações
        │  no startup)
        ▼ Porta 5432
 ┌─────────────┐
 │  PostgreSQL │
 │     16      │
 └─────────────┘
```

1. **`postgres` (`postgres:16-alpine`)**:
   - Persistência garantida através do volume de dados nomeado `postgres_data`.
   - Healthcheck nativo (`pg_isready`) monitorando integridade para liberação dos serviços dependentes.

2. **`backend` / `backend-dev` (Bun API — `backend/Dockerfile`)**:
   - Executa migrações SQL idempotentes automaticamente na inicialização (`bun run migrate`) antes de subir a API.
   - Em produção (`backend`): executa o bundle compilado com Bun na porta interna `3001`.
   - Em desenvolvimento (`backend-dev`): sincroniza dependências, roda migrações e sobe com live-reload (`bun --watch`).

3. **`nginx` / `frontend-dev` (Frontend Vue 3 — `frontend/Dockerfile`)**:
   - Em produção (`nginx`): container Nginx servindo os arquivos estáticos compilados do Vue 3 (`frontend/dist`) e atuando como proxy reverso para `/api/*` e `/health` na porta `80` com repasse de cabeçalhos (`X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`).
   - Em desenvolvimento (`frontend-dev`): servidor Vite com Hot Module Replacement (HMR) rodando na porta `3000`.

---

## 📁 Arquivos e Guias do Diretório

| Arquivo                                              | Descrição                                                                                                                                                           |
| :--------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [backup-restore-guide.md](./backup-restore-guide.md) | Guia operacional completo para rotinas manuais e automáticas de backup com compressão `.sql.gz`, restauração com flag `--force` e agendamento via Cron na VM Linux. |

---

## 🛠️ Scripts Operacionais da Raiz

- [deploy.sh](../../deploy.sh): Script de deploy automatizado para ambiente Linux/VM com validação de `.env`, build com Docker Compose e remoção de imagens órfãs.
- [scripts/backup.sh](../../scripts/backup.sh): Script utilitário para geração de dump PostgreSQL compactado com rotação de retenção (30 dias).
- [scripts/restore.sh](../../scripts/restore.sh): Script utilitário para restauração segura de base a partir de dump compactado.

---

## 🚀 Comandos Rápidos de Infraestrutura

- **Subir ambiente de desenvolvimento (PostgreSQL, backend-dev e frontend-dev)**:
  ```bash
  docker compose --profile dev up -d
  ```
- **Subir ambiente de produção compilado (PostgreSQL, backend e nginx)**:
  ```bash
  docker compose --profile prod up -d --build
  ```
- **Acompanhar logs unificados em tempo real**:
  ```bash
  docker compose --profile dev logs -f
  # ou para produção:
  docker compose --profile prod logs -f
  ```
- **Parar containers mantendo o banco de dados**:
  ```bash
  docker compose --profile dev --profile prod down
  ```
- **Reset total (apagar volumes e recriar banco do zero)**:
  ```bash
  docker compose --profile dev --profile prod down -v
  ```
