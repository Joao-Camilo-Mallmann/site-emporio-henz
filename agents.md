# REGRAS DE USO E DIRETRIZES DO PROJETO

## Estrutura do Monorepo (Turborepo + Bun)

- **Gerenciador de Pacotes**: `bun` (versão 1.4+)
- **Apps**:
  - `apps/web`: Frontend Next.js (porta 3000)
  - `apps/backend`: Backend em Bun utilizando `Bun.serve` nativo (porta 3001)
- **Packages**:
  - `packages/typescript-config`: Configurações compartilhadas de TypeScript (`base.json`, `nextjs.json`, `react-library.json`)
  - `packages/eslint-config`: Configurações compartilhadas de ESLint (`base.js`, `next.js`, `react-internal.js`)
  - `packages/ui`: Componentes compartilhados

## Padrões e Práticas do Backend (`apps/backend`)

- Utilizar `Bun.serve` com tipagem nativa e sem dependências de frameworks pesados desnecessários.
- Endpoints de verificação de integridade: `GET /health` e `GET /api/health`.
- CORS habilitado com tratamento para requisições `OPTIONS` (preflight).
- Sempre registrar variáveis de ambiente no `turbo.json` (ex: `PORT` em `globalEnv` ou `inputs`) para cumprir a regra `turbo/no-undeclared-env-vars`.
- Scripts padronizados de desenvolvimento (`dev`), build (`build`), checagem de tipos (`check-types`) e lint (`lint`).
