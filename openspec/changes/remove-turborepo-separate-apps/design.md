# Design

## Context

Atualmente o projeto é configurado como um monorepo gerenciado por Turborepo e Bun workspaces (`apps/*`), contendo uma pasta `packages/database` sem `package.json`. A infraestrutura Docker já não utiliza Turborepo, e as duas aplicações (`backend` e `web`) não compartilham código em tempo de execução. Veja `proposal.md` para a motivação completa.

## Goals / Non-Goals

**Goals:**
- Separar completamente `backend/` e `frontend/` na raiz do repositório Git, eliminando o `package.json`, `bun.lock`, `turbo.json` e pastas `.turbo/` da raiz.
- Consolidar as migrações SQL, scripts de migração (`migrate.ts`) e seed (`seed.ts`) dentro de `backend/database/`.
- Modularizar os containers Docker em `backend/Dockerfile` e `frontend/Dockerfile`, ajustando o `docker-compose.yml` para orquestrar os serviços.
- Corrigir a dependência de TypeScript do backend (`^5.8.2`) e remover o alias `@database/*`.
- Atualizar integralmente a documentação do projeto (`docs/PRD.md`, `docs/README.md`, `docs/database/README.md`, `docs/backend/README.md`, `docs/frontend/README.md`, `docs/padrao-historias-tarefas.md`, `docs/planning/user-stories-backlog.md`, `agents.md`, `backend/agents.md` e `README.md`).

**Non-Goals:**
- Separar o repositório Git em dois repositórios remotos distintos (permanece um único Git).
- Alterar regras de negócio, tabelas de banco de dados ou endpoints da API.
- Reescrever componentes do frontend ou alterar a arquitetura Vue/Tailwind.

## Decisions

### 1. Estrutura de Diretórios Limpa na Raiz
- **Decisão**: Mover `apps/backend` para `backend/` e `apps/web` para `frontend/` diretamente na raiz do repositório. Eliminar os diretórios `apps/` e `packages/`.
- **Alternativas consideradas**:
  - *Manter `apps/` sem `package.json` na raiz*: descartado por manter um nível de aninhamento desnecessário sem propósito de workspace.
  - *Manter `packages/database` como workspace*: descartado porque não é um pacote npm e só é consumido pelo backend.

### 2. Localização das Migrações e Seeds
- **Decisão**: Alocar em `backend/database/` com os subdiretórios `migrations/`, `migrate.ts` e `seed.ts`. O backend passa a gerenciar suas próprias migrações através dos scripts `bun run migrate` e `bun run seed`.
- **Alternativas consideradas**:
  - *Colocar dentro de `backend/src/database`*: descartado para manter scripts operacionais e arquivos SQL de migração separados do bundle de código de aplicação em `src/`.

### 3. Dockerfiles Modulares e Docker Compose
- **Decisão**: Criar `backend/Dockerfile` e `frontend/Dockerfile` autocontidos.
  - `backend/Dockerfile`: Multi-stage com estágio de dev (`bun --watch`) e prod (executa `bun run migrate` e roda o bundle compilado).
  - `frontend/Dockerfile`: Multi-stage com estágio de dev (Vite HMR) e prod (build estático com Nginx).
  - `docker-compose.yml`: Atualizar os contextos de build para `./backend` e `./frontend`, removendo o volume obsoleto `./packages:/app/packages`.

### 4. Gestão de Dependências e TypeScript
- **Decisão**: Cada aplicação mantém seu próprio `package.json` e `bun.lock` gerado de forma estritamente isolada. No backend, corrigir `"typescript": "^7.0.2"` para `"^5.8.2"`, garantindo que `tsc --noEmit` funcione perfeitamente.

## Risks / Trade-offs

- **Execução local sem comando único na raiz** → Mitigação: Em desenvolvimento, os desenvolvedores podem rodar via `docker compose --profile dev up` para subir toda a stack conjuntamente, ou abrir dois terminais (`cd backend && bun dev` e `cd frontend && bun dev`). O `README.md` raiz fornecerá instruções claras.
- **Risco de links quebrados na documentação** → Mitigação: Varredura detalhada e substituição de todas as referências a `packages/database`, `apps/backend`, `apps/web` e `turbo` nos documentos e backlog.
