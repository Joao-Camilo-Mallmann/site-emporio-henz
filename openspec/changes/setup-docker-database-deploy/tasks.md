## 1. Configuração do Monorepo e Pacote Database

- [x] 1.1 Atualizar `package.json` raiz para incluir `"packages/*"` no array `workspaces`
- [x] 1.2 Atualizar `turbo.json` com variáveis globais (`DATABASE_URL`, `POSTGRES_DB`, etc.)
- [x] 1.3 Criar diretório `packages/database` com `package.json` e `tsconfig.json`
- [x] 1.4 Implementar cliente e pool de conexão PostgreSQL em `packages/database/src/db.ts` utilizando driver nativo do Bun
- [x] 1.5 Implementar runner de migrações idempotente em `packages/database/src/migrate.ts` com criação automática de `_migrations` e controle transacional
- [x] 1.6 Criar primeira migração SQL `packages/database/migrations/001_initial_schema.sql` (tabelas base e soft delete alinhadas ao backend e PRD)
- [x] 1.7 Adicionar scripts de execução no `packages/database/package.json` e validar compilação/tipagem

## 2. Conteinerização Docker e Orquestração

- [x] 2.1 Criar `Dockerfile` multi-stage na raiz com estágios para base, frontend (build estático Vite), backend (runtime Bun) e migration (runner Bun)
- [x] 2.2 Criar configuração de proxy reverso e arquivos estáticos em `nginx.conf` (servindo estáticos em `/` e roteando `/api/` e `/health` para o backend)
- [x] 2.3 Criar `docker-compose.yml` definindo os serviços `postgres` (volume `postgres_data`, sem porta pública), `migration` (one-shot), `backend` e `nginx` (porta 80)
- [x] 2.4 Criar arquivo `.env.example` na raiz documentando todas as variáveis de ambiente necessárias
- [x] 2.5 Atualizar `.gitignore` da raiz para garantir que arquivos de ambiente local (`.env`, `.env.local`) não sejam versionados

## 3. Scripts Operacionais e Validação

- [x] 3.1 Criar script executável `deploy.sh` para deploy local na VM (pull, build, postgres up, run migration, restart containers)
- [x] 3.2 Criar script e guia de rotina de backup (`pg_dump`) e restore do banco de dados PostgreSQL
- [x] 3.3 Validar build e integridade de tipos do monorepo com `bun run check-types` e `bun run build`

## 4. Environment Variables

- [x] Na raiz mover a .env para lá para centarl do projeto e ajustar a .ENV.example para documentar todas as variáveis de ambiente necessárias para o deploy local e produção
