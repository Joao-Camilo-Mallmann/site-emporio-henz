## Context

Atualmente, o projeto utiliza Turborepo + Bun em um monorepo com Docker Compose para orquestração. O fluxo original foi configurado com foco primário em produção (Nginx servindo frontend estático compilado via `frontend-builder` e Backend Bun empacotado em `dist/index.js`).

Ao rodar `docker compose up -d`, o desenvolvedor se deparava com o frontend compilado, sem suporte ao Vue DevTools e sem Hot Module Replacement (HMR). Para resolver isso sem sobrecarregar o desenvolvedor com variáveis redundantes (como exigir `COMPOSE_PROFILES=dev` além de `NODE_ENV=development`), foi desenhada uma solução orientada a `NODE_ENV` com comandos padronizados no `package.json`.

## Goals / Non-Goals

**Goals:**

- Permitir desenvolvimento conteinerizado com Hot-Reload (Vite HMR no front e `bun --watch` no back) sem compilação estática (`bun build` ou `vue-tsc`).
- Garantir que a compilação e o Nginx sejam acionados estritamente quando for para produção/VPS.
- Eliminar a necessidade de configurar `COMPOSE_PROFILES` manualmente no `.env`.
- Padronizar scripts de conveniência no `package.json` (`docker:dev`, `docker:prod`, `docker:up`, `docker:down`) para execução consistente tanto em Windows/PowerShell quanto em Linux/WSL.

**Non-Goals:**

- Substituir o Nginx em produção (ele continua sendo o proxy reverso e servidor estático na porta pública 80).
- Alterar as regras de banco de dados ou migrações (PostgreSQL e migrações continuam rodando de forma idêntica em ambos os ambientes).

## Decisions

### Decisão 1: Multi-stage Dockerfile com alvos dev dedicados

- **Escolha**: Criar os estágios `backend-dev` e `web-dev` no `Dockerfile` baseados em `base`, executando diretamente `bun --filter <app> dev` com volume mapeado.
- **Alternativa descartada**: Criar Dockerfiles separados (`Dockerfile.dev` e `Dockerfile.prod`). Descartada para evitar duplicação do processo de instalação de dependências e garantir cache único de camadas.

### Decisão 2: Uso de Perfis do Compose orquestrados por scripts do package.json

- **Escolha**: Definir os perfis `profiles: ["dev", "development"]` e `profiles: ["prod", "production"]` no `docker-compose.yml`, e fornecer comandos no `package.json`:
  - `docker:dev`: executa `docker compose --profile dev up -d`
  - `docker:prod`: executa `docker compose --profile prod up -d --build`
  - `docker:up`: script em Bun (`scripts/docker-up.ts` ou inline) que inspeciona `process.env.NODE_ENV` do `.env` e dispara o perfil adequado.
- **Alternativa descartada**: Exigir que o desenvolvedor lembre de manter `COMPOSE_PROFILES=dev` no `.env`. Descartada por ser propensa a erros e redundante com `NODE_ENV`.

### Decisão 3: Preservação de node_modules no container durante montagem de volumes

- **Escolha**: Configurar volume anônimo `/app/apps/web/node_modules` no serviço `web-dev` para evitar que a pasta local do host Windows sobrescreva as dependências compiladas/instaladas na imagem Linux.

## Risks / Trade-offs

- **[Hot-Reload através de volumes em Windows/WSL2]** → O Vite no `apps/web/vite.config.ts` foi configurado com `host: "0.0.0.0"`. Caso o sistema de arquivos do Windows não emita eventos de inotify confiáveis, pode-se ativar `server.watch.usePolling`.
- **[Conflito de portas se rodar local e docker simultaneamente]** → Documentar que para rodar via Docker deve-se usar as portas mapeadas, ou parar os containers antes de rodar `bun run dev` nativamente.
