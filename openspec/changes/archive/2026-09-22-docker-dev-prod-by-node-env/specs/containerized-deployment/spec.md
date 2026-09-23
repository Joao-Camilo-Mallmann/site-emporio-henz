## MODIFIED Requirements

### Requirement: Dockerfile Multi-stage Unificado

The repository MUST provide a unified multi-stage `Dockerfile` with stages for development runtimes (`backend-dev`, `web-dev`) and production runtimes (frontend static builder, backend compiled bundle, migration runner, and Nginx runtime).

#### Scenario: Build da imagem do frontend em produção

- **WHEN** o estágio de frontend de produção (`frontend-builder`) for compilado via Docker
- **THEN** os arquivos estáticos de produção do Vue 3/Vite DEVEM ser gerados e minificados sem requerer build local na máquina host

#### Scenario: Execução do estágio de frontend em desenvolvimento

- **WHEN** o target `web-dev` for acionado em ambiente de desenvolvimento
- **THEN** o container DEVE executar o servidor de desenvolvimento Vite com Hot Module Replacement (HMR) e Vue DevTools ativo, SEM realizar compilação estática ou bundle prévio

#### Scenario: Execução do estágio de backend em desenvolvimento

- **WHEN** o target `backend-dev` for acionado em ambiente de desenvolvimento
- **THEN** o container DEVE executar o processo com `bun --watch`, reiniciando automaticamente a cada alteração de código sem compilação prévia para `dist`

#### Scenario: Estágio one-shot de migração

- **WHEN** o target de migração do Dockerfile for executado
- **THEN** o container DEVE executar o script `migrate.ts` com Bun e finalizar o processo

### Requirement: Orquestração Segura via Docker Compose

The system MUST provide a `docker-compose.yml` orchestrating `postgres`, `migration`, `backend`, `nginx`, `backend-dev`, and `web-dev` services segmented by environment profiles without requiring `COMPOSE_PROFILES` in `.env`.

#### Scenario: Subida de serviços em desenvolvimento

- **WHEN** o ambiente for iniciado em modo de desenvolvimento (`NODE_ENV=development`)
- **THEN** o Docker DEVE iniciar apenas os serviços de desenvolvimento (`postgres`, `migration`, `backend-dev`, `web-dev`), mapeando volumes locais do código-fonte para hot-reload e NÃO iniciando o Nginx nem compilando artefatos de produção

#### Scenario: Subida de serviços em produção

- **WHEN** o ambiente for iniciado em modo de produção (`NODE_ENV=production`)
- **THEN** o Docker DEVE iniciar os serviços de produção (`postgres`, `migration`, `backend`, `nginx`), compilando imagens de produção e servindo os estáticos via Nginx

#### Scenario: Isolamento de rede do PostgreSQL

- **WHEN** a stack Docker Compose estiver em execução
- **THEN** a porta 5432 do serviço `postgres` NÃO DEVE ser exposta externamente na rede pública da VM, sendo acessível apenas pelos containers na rede interna

#### Scenario: Persistência de dados do PostgreSQL

- **WHEN** o container do PostgreSQL for reiniciado ou recriado
- **THEN** todos os dados DEVEM ser preservados através de volume nomeado persistente (`postgres_data`)

## ADDED Requirements

### Requirement: Scripts Padronizados de Ciclo de Vida do Docker

The root `package.json` MUST provide standardized scripts to execute Docker Compose operations driven by `NODE_ENV`.

#### Scenario: Execução de desenvolvimento via script Bun

- **WHEN** o desenvolvedor executar `bun run docker:dev`
- **THEN** o comando DEVE iniciar os serviços de desenvolvimento (`postgres`, `migration`, `backend-dev`, `web-dev`) com recarregamento em tempo real

#### Scenario: Execução de produção via script Bun

- **WHEN** o operador executar `bun run docker:prod`
- **THEN** o comando DEVE iniciar a stack de produção com build de imagens (`postgres`, `migration`, `backend`, `nginx`)

#### Scenario: Execução dinâmica baseada em NODE_ENV

- **WHEN** o desenvolvedor executar `bun run docker:up`
- **THEN** o script DEVE verificar o valor de `NODE_ENV` no `.env` e disparar o perfil correspondente (dev ou prod) sem necessitar da variável `COMPOSE_PROFILES`
