# REGRAS DE USO E DIRETRIZES DO PROJETO

## Estrutura do Monorepo (Turborepo + Bun)
- **Gerenciador de Pacotes**: `bun` (versão 1.4+)
- **Apps**:
  - `apps/web`: Frontend em **Vue 3 + Vite** com **Tailwind CSS v4**, **Vue Router** e **Pinia** (porta padrão: 3000)
  - `apps/backend`: Backend em **Bun nativo** utilizando `Bun.serve` (porta padrão: 3001)
- Não há diretório `packages/`; os apps `web` e `backend` são autocontidos e independentes.

## Padrões do Frontend (`apps/web`)
- **Framework**: Vue 3 (Composition API com `<script setup lang="ts">`).
- **Build tool**: Vite (`@vitejs/plugin-vue`, `@tailwindcss/vite`).
- **Estilização**: Tailwind CSS v4 via `@import "tailwindcss";` em `src/style.css`.
- **Roteamento**: Vue Router 4 em `src/router/`.
- **Estado**: Pinia em `src/stores/`.
- **Tipagem**: `vue-tsc` para type checking (`bun --filter web check-types`).
- **Proxy de Desenvolvimento**: `/api` é roteado via Vite para `http://localhost:3001`.

## Padrões do Backend (`apps/backend`)
- Utilizar `Bun.serve` com tipagem nativa e sem dependências pesadas externas.
- Endpoints de verificação de integridade: `GET /health` e `GET /api/health`.
- CORS habilitado com suporte a requisições `OPTIONS` (preflight).
- Sempre registrar variáveis de ambiente no `turbo.json` (`globalEnv`: `["PORT"]`).
- Scripts padronizados de desenvolvimento (`dev`), build (`build`), checagem de tipos (`check-types`) e lint (`lint`).
