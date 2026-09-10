## Context

O projeto `site-emporio-henz` é um monorepo gerenciado por Turborepo e Bun. O frontend é uma aplicação Vue 3 + Vite que compila para arquivos estáticos, e o backend é um servidor HTTP nativo em Bun. Atualmente a execução requer ambiente Bun configurado diretamente na máquina host. Para facilitar a inicialização de novos ambientes e padronizar o deploy, adicionamos contêineres Docker e orquestração Docker Compose, além de integrar o processo de Pull Request ao GitHub Projects.

## Goals / Non-Goals

**Goals:**
- Prover imagens Docker otimizadas (multi-stage) para o frontend e backend.
- Servir o frontend com Nginx Alpine com suporte a History Mode da SPA e proxy reverso para a API.
- Subir a stack inteira (`web`, `backend`, `postgres`) com um comando `docker compose up --build`.
- Configurar template de Pull Request (`.github/pull_request_template.md`) padronizado com referência ao GitHub Projects.

**Non-Goals:**
- Não inclui setup de orquestração Kubernetes ou Helm charts neste momento.
- Não substitui o desenvolvimento nativo local (`bun run dev`) para quem prefere rodar direto na máquina.

## Decisions

- **Decisão 1: Multi-stage build com contexto na raiz do monorepo**:
  - *Racional*: Por se tratar de um monorepo com workspaces Bun, o contexto de build do Docker na raiz permite copiar `package.json`, `bun.lock` e resolver dependências com `--frozen-lockfile` sem quebrar referências entre pacotes.
- **Decisão 2: Nginx para o Frontend Vue**:
  - *Racional*: Imagem ultraleve (`nginx:alpine`), alta performance para servir assets estáticos com gzip e capacidade de atuar como proxy reverso para `/api/`, eliminando preocupações com CORS em produção de contêineres.
- **Decisão 3: PostgreSQL 16 provisionado no Compose**:
  - *Racional*: Antecipa a persistência relacional especificada em `apps/backend/agents.md`, deixando a infraestrutura pronta para a futura integração com banco de dados.

## Risks / Trade-offs

- **[Risco] Tempo de build inicial do Docker**:
  - *Mitigação*: Cache de camadas do Docker através da cópia separada de manifestos (`package.json`, `bun.lock`) antes da cópia do código-fonte.
- **[Risco] Conflito de portas locais**:
  - *Mitigação*: Uso das portas padronizadas no monorepo (`3000` para web, `3001` para backend, `5432` para Postgres).
