# Proposal

## Why

O uso de Turborepo e a presença de uma pasta `packages/database` sem `package.json` criam uma camada artificial de complexidade neste projeto. O Docker já não utiliza o Turborepo (usando comandos nativos do Bun), e os agentes de desenvolvimento sofrem fricção desnecessária com restrições de cache e variáveis globais do `turbo.json`. Além disso, o backend e o frontend não compartilham código em tempo de execução.

Separar o backend e o frontend em dois projetos totalmente independentes (sem `package.json` na raiz e sem Turborepo) simplifica o ecossistema, elimina riscos de contaminação de dependências entre front e back, melhora a experiência com IDEs/LSPs e alinha o projeto com a arquitetura real da aplicação.

## What Changes

- **Remoção do Turborepo**: Eliminação de `turbo.json`, dependência `turbo` e diretórios `.turbo/`.
- **Eliminação do `package.json` e `bun.lock` na raiz**: O repositório deixa de ser um monorepo gerenciado por workspace raiz; o backend e o frontend tornam-se aplicações autônomas.
- **Isolamento de Diretórios de Aplicação**:
  - `apps/backend/` passa a ser `backend/` na raiz.
  - `apps/web/` passa a ser `frontend/` na raiz.
  - Remoção do diretório `apps/`.
- **Consolidação do Banco de Dados no Backend**:
  - `packages/database/` é eliminado.
  - Migrações (`migrations/`), runner (`migrate.ts`) e seeder (`seed.ts`) passam a residir em `backend/database/`.
  - Remoção de código duplicado de conexão (`packages/database/src/db.ts`).
  - Remoção do alias morto `@database/*` no `backend/tsconfig.json`.
- **Modularização de Containers Docker**:
  - Criação de `backend/Dockerfile` e `frontend/Dockerfile` autônomos.
  - Atualização de `docker-compose.yml` e remoção do bind mount obsoleto de `./packages`.
  - Atualização do `deploy.sh`.
- **Ajustes de Dependências no Backend**:
  - Correção de `"typescript": "^7.0.2"` para versão estável suportada (`^5.8.2`) no `backend/package.json`.
- **Atualização Integral da Documentação**:
  - Atualização de `docs/PRD.md`, `docs/README.md`, `docs/database/README.md`, `docs/backend/README.md`, `docs/frontend/README.md`, `docs/padrao-historias-tarefas.md`, `docs/planning/user-stories-backlog.md`, `agents.md`, `backend/agents.md` e `README.md`.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `database-migrations`: Altera a localização canônica dos arquivos de migração e runners de `packages/database` para `backend/database/`.
- `backend-foundation-infra`: Altera a referência de conexão do banco para a configuração interna do backend (`backend/src/config/db.ts`), eliminando a dependência do pacote compartilhado `packages/database`.
- `containerized-deployment`: Altera a estratégia conteinerizada para utilizar Dockerfiles específicos por aplicação (`backend/Dockerfile` e `frontend/Dockerfile`) e remove referências a scripts de monorepo na raiz.

## Impact

- **Código & Estrutura**: As pastas `apps/` e `packages/` deixam de existir, substituídas diretamente por `backend/` e `frontend/`.
- **Dependências & Lockfiles**: Cada aplicação mantém seu próprio `package.json` e `bun.lock` isolado.
- **Docker & Compose**: `docker-compose.yml` agora referencia contextos `./backend` e `./frontend`.
- **Desenvolvimento Local**: Desenvolvedores e agentes executam `cd backend && bun dev` e `cd frontend && bun dev`, ou utilizam `docker compose up`.
