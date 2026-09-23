## Why

Atualmente, o comando `docker compose up -d` tenta compilar o frontend estático para o Nginx e o backend para produção, impedindo o fluxo de desenvolvimento interativo com Hot-Reload (Vite HMR e Bun watch) e Vue DevTools. Além disso, a alternância entre desenvolvimento e produção não deve exigir que o desenvolvedor mantenha e sincronize variáveis redundantes como `COMPOSE_PROFILES` no `.env`, devendo ser orquestrada nativamente pelo `NODE_ENV` e scripts padronizados de conveniência.

## What Changes

- **Remoção de COMPOSE_PROFILES do `.env`**: O controle de ambiente passa a ser orientado estritamente por `NODE_ENV` (`development` ou `production`).
- **Suporte a Desenvolvimento sem Compilação no Docker**:
  - Em modo `development`, o Docker executa apenas os serviços essenciais de desenvolvimento: `postgres`, `migration`, `backend-dev` (com `bun --watch` e volumes mapeados) e `web-dev` (com Vite HMR e Vue DevTools). Não compila frontend nem backend estáticos.
  - Em modo `production`, o Docker executa o fluxo completo de compilação multi-stage (`backend` compilado com `bun build`, `frontend-builder` e `nginx`).
- **Scripts Padronizados no `package.json`**:
  - `bun run docker:dev`: sobe a stack de desenvolvimento com hot-reload sem build de produção.
  - `bun run docker:prod`: sobe a stack de produção compilada para a VPS.
  - `bun run docker:down`: encerra a stack preservando dados.
  - `bun run docker:up`: script inteligente que lê `NODE_ENV` do `.env` e sobe o perfil apropriado.

## Capabilities

### New Capabilities

<!-- Nenhuma nova capability de domínio, apenas extensão da existente -->

### Modified Capabilities

- `containerized-deployment`: Adiciona suporte a ambientes diferenciados (desenvolvimento com Hot-Reload via volumes vs produção compilada com Nginx), orquestrados por `NODE_ENV` e scripts padronizados sem exigir `COMPOSE_PROFILES`.

## Impact

- `docker-compose.yml`: Atualização da orquestração com perfis dev/prod sincronizados.
- `Dockerfile`: Garantia de estágios leves de desenvolvimento (`backend-dev`, `web-dev`) que não executam builds estáticos de produção.
- `package.json`: Adição de scripts de ciclo de vida do Docker (`docker:dev`, `docker:prod`, `docker:up`, `docker:down`).
- `.env` e `.env.example`: Limpeza da variável `COMPOSE_PROFILES`, mantendo apenas `NODE_ENV`.
