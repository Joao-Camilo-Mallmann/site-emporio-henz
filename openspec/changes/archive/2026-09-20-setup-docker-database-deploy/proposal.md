## Why

O projeto necessita de infraestrutura de persistência de dados e ambiente conteinerizado para deploy em VM simples, sem a sobrecarga de ferramentas pesadas como ORMs ou pipelines de CI/CD complexos. Esta proposta estabelece a arquitetura de banco de dados relacional com PostgreSQL nativo e migrações SQL puras executadas pelo Bun, junto com uma infraestrutura Docker multi-stage orquestrada por Docker Compose e script de automação local para deploy.

## What Changes

- **Novo pacote `packages/database`**: Estrutura monorepo atualizada para gerenciar migrações SQL versionadas e executor de migrations em TypeScript/Bun nativo (sem ORMs como Prisma/Drizzle).
- **Controle de Migrations via `_migrations`**: Tabela interna para rastrear migrações aplicadas, executando apenas novos scripts SQL de forma idempotente.
- **Dockerfile Multi-stage Centralizado**: Um único Dockerfile contendo estágios para build do frontend (Vite/Vue 3), backend (Bun), executor de migrações e servidor Nginx.
- **Orquestração Docker Compose**: Definição dos serviços `postgres` (com volume persistente e rede interna isolada), `migration` (serviço one-shot sob demanda), `backend` e `nginx` (única porta pública 80 exposta para a internet).
- **Roteamento Reverso com Nginx**: Configuração do Nginx servindo o frontend estático na raiz (`/`) e atuando como proxy reverso para as rotas da API (`/api/`).
- **Configuração de Ambiente e Deploy Local**: Criação de `.env.example`, ajuste de variáveis e script `deploy.sh` para automação de pull, build, migração e subida de containers diretamente na VM.

## Capabilities

### New Capabilities

- `database-migrations`: Criação e execução de migrações SQL nativas com Bun em `packages/database`, garantindo versionamento idempotente e reconstrução do banco a partir do Git.
- `containerized-deployment`: Conteinerização completa com Dockerfile multi-stage, Docker Compose, Nginx como proxy reverso e automação de deploy local via `deploy.sh`.

### Modified Capabilities

## Impact

- **Monorepo**: Atualização de `package.json` (adicionando `packages/*` aos workspaces) e `turbo.json` para suportar novas tarefas e variáveis de ambiente (`DATABASE_URL`, `POSTGRES_DB`, etc.).
- **Backend (`apps/backend`)**: Preparação para integração com PostgreSQL através de `DATABASE_URL` (host interno `postgres` na rede Docker) e Bun nativo.
- **Infraestrutura**: Adição de `Dockerfile`, `docker-compose.yml`, `nginx.conf`, `deploy.sh` e `.env.example` na raiz do repositório.
