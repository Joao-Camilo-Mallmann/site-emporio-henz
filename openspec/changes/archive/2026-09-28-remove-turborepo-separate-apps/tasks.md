# Tasks

## 1. Reestruturação do Backend e Banco de Dados

- [x] 1.1 Mover `apps/backend` para a raiz `backend/` e consolidar arquivos de migração e runners de `packages/database` em `backend/database/` (verificar existência de `backend/database/migrations/`, `backend/database/migrate.ts` e `backend/database/seed.ts`)
- [x] 1.2 Atualizar `backend/package.json` adicionando scripts autônomos (`migrate`, `seed`), corrigindo a dependência `"typescript"` para `"^5.8.2"` e verificando a instalação com `bun install`
- [x] 1.3 Atualizar `backend/tsconfig.json` removendo o alias morto `@database/*` e ajustar imports internos em `backend/database/migrate.ts` e `seed.ts` para usar a conexão canônica de `backend/src/config/database.ts`
- [x] 1.4 Validar testes unitários e de integração do backend executando `bun test` no diretório `backend/`

## 2. Reestruturação do Frontend

- [x] 2.1 Mover `apps/web` para a raiz `frontend/` e remover o diretório obsoleto `apps/`
- [x] 2.2 Gerar lockfile isolado no frontend executando `bun install` dentro de `frontend/`
- [x] 2.3 Validar compilação e checagem de tipos do frontend executando `bun run build` e `bun run check-types` dentro de `frontend/`

## 3. Modularização de Docker e Infraestrutura

- [x] 3.1 Criar `backend/Dockerfile` multi-stage para desenvolvimento (`backend-dev`) e produção (`backend`) e verificar sintaxe
- [x] 3.2 Criar `frontend/Dockerfile` multi-stage para desenvolvimento com HMR (`web-dev`) e produção com Nginx (`nginx`) e verificar sintaxe
- [x] 3.3 Atualizar `docker-compose.yml` apontando os serviços para os novos contextos `./backend` e `./frontend`, removendo o volume mount obsoleto de `./packages`
- [x] 3.4 Atualizar `deploy.sh` para a nova estrutura de containers e remover o `Dockerfile` monolítico da raiz

## 4. Limpeza de Monorepo e Turborepo

- [x] 4.1 Remover `turbo.json`, diretórios `.turbo/`, `package.json` da raiz, `bun.lock` da raiz e o diretório `packages/`
- [x] 4.2 Atualizar `.gitignore` e `.dockerignore` removendo resíduos e referências ao Turborepo e packages

## 5. Atualização da Documentação e Governança

- [x] 5.1 Atualizar `docs/PRD.md` alinhando a descrição da stack técnica e arquitetura sem monorepo
- [x] 5.2 Atualizar `docs/README.md` e `docs/database/README.md` refletindo a nova localização `backend/database/` e comandos de migração
- [x] 5.3 Atualizar `docs/backend/README.md` e `docs/frontend/README.md` com a estrutura modular e comandos independentes
- [x] 5.4 Atualizar `docs/padrao-historias-tarefas.md` e `docs/planning/user-stories-backlog.md` substituindo referências a `packages/database` e `apps/*`
- [x] 5.5 Atualizar `agents.md` (raiz), `backend/agents.md` (removendo regra do `turbo.json`), `frontend/agents.md` e o `README.md` raiz com o novo guia de execução

## 6. Verificação e Validação Final

- [x] 6.1 Executar a suíte de testes do backend (`cd backend && bun test`) e confirmar que todos os 57 testes continuam passando
- [x] 6.2 Executar o build estático e typecheck do frontend (`cd frontend && bun run build && bun run check-types`) e confirmar ausência de erros
- [x] 6.3 Executar `openspec validate remove-turborepo-separate-apps` e confirmar que a especificação e tarefas estão íntegras
