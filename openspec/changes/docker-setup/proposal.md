## Why

Atualmente, o monorepo `site-emporio-henz` requer que o desenvolvedor execute comandos manuais locais para cada serviço (`bun run dev`), dependendo da instalação local do Bun e das ferramentas do sistema. A adição do Docker e Docker Compose padroniza o ambiente de desenvolvimento e produção, permitindo que qualquer desenvolvedor suba a aplicação completa (frontend Vue 3 + backend Bun + PostgreSQL) com um único comando, além de estruturar o fluxo de Pull Request com rastreamento no GitHub Projects.

## What Changes

- **Dockerfiles Multi-stage**: Criação de `apps/backend/Dockerfile` (Bun) e `apps/web/Dockerfile` (Bun build + Nginx Alpine runner).
- **Configuração Nginx SPA**: Criação de `apps/web/nginx.conf` com suporte a roteamento SPA (fallback `index.html`) e proxy reverso transparente em `/api/`.
- **Orquestração Docker Compose**: Criação de `docker-compose.yml` integrando os serviços `web`, `backend` e `postgres:16-alpine`.
- **Ignore files e atalhos**: Criação de `.dockerignore` na raiz e inclusão de scripts auxiliares no `package.json` (`docker:up`, `docker:down`, `docker:logs`).
- **Template de Pull Request**: Criação de `.github/pull_request_template.md` com checklist de verificação e vinculação ao GitHub Projects (`site-emporio-henz/projects`).

## Capabilities

### New Capabilities
- `docker-containerization`: Criação e orquestração dos contêineres Docker para os apps `web` e `backend`, suporte a banco de dados PostgreSQL e integração com o ciclo de PRs e GitHub Projects.

### Modified Capabilities
<!-- Nenhuma especificação anterior existente para modificar -->

## Impact

- **Código e Configuração**: Novos arquivos na raiz (`.dockerignore`, `docker-compose.yml`), em `apps/backend/Dockerfile`, `apps/web/Dockerfile`, `apps/web/nginx.conf`, `package.json` e `.github/pull_request_template.md`.
- **APIs e Portas**: O frontend escutará na porta `3000`, o backend na porta `3001` e o PostgreSQL na porta `5432`.
- **Dependências de Sistema**: Requer apenas Docker e Docker Compose na máquina hospedeira.
