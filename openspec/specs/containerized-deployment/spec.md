# Containerized Deployment

## Purpose

Define a infraestrutura conteinerizada multi-stage com Docker, orquestração com Docker Compose, Nginx como proxy reverso e automação de deploy na VM.

## Requirements

### Requirement: Dockerfile Multi-stage Unificado

The repository MUST provide modularized Dockerfiles for each isolated application (`backend/Dockerfile` and `frontend/Dockerfile`) orchestrating development and production runtimes without cross-workspace dependencies.

#### Scenario: Build da imagem do frontend em produção

- **WHEN** a imagem de frontend de produção for compilada via Docker
- **THEN** os arquivos estáticos de produção do Vue 3/Vite DEVEM ser gerados no container e servidos através do Nginx sem requerer build local na máquina host

#### Scenario: Execução do estágio de frontend em desenvolvimento

- **WHEN** o container de desenvolvimento do frontend for acionado
- **THEN** o container DEVE executar o servidor de desenvolvimento Vite com Hot Module Replacement (HMR) ativo a partir do diretório `frontend/`

#### Scenario: Execução do estágio de backend em desenvolvimento com migração automática

- **WHEN** o container de desenvolvimento do backend for acionado
- **THEN** o container DEVE executar as migrações idempotentes via `bun run migrate` dentro de `backend/` e iniciar o processo com `bun --watch`

#### Scenario: Execução do estágio de backend em produção com migração automática

- **WHEN** o container de produção do backend for acionado
- **THEN** o container DEVE executar as migrações idempotentes via `bun run migrate` dentro de `backend/` e iniciar o bundle compilado em produção

### Requirement: Orquestração Segura via Docker Compose

The system MUST provide a `docker-compose.yml` orchestrating `postgres`, `backend`, `nginx`, `backend-dev`, and `web-dev` services segmented by environment profiles without requiring `COMPOSE_PROFILES` in `.env`, with backend services starting once postgres is healthy.

#### Scenario: Subida de serviços em desenvolvimento

- **WHEN** o ambiente for iniciado em modo de desenvolvimento (`NODE_ENV=development`)
- **THEN** o Docker DEVE iniciar apenas os serviços de desenvolvimento (`postgres`, `backend-dev`, `web-dev`), mapeando volumes locais do código-fonte para hot-reload e NÃO iniciando o Nginx nem compilando artefatos de produção

#### Scenario: Subida de serviços em produção

- **WHEN** o ambiente for iniciado em modo de produção (`NODE_ENV=production`)
- **THEN** o Docker DEVE iniciar os serviços de produção (`postgres`, `backend`, `nginx`), compilando imagens de produção e servindo os estáticos via Nginx

#### Scenario: Isolamento de rede do PostgreSQL

- **WHEN** a stack Docker Compose estiver em execução
- **THEN** a porta do serviço `postgres` DEVE ser mapeada de forma parametrizável (`${POSTGRES_PORT:-5432}:5432`) e os serviços se comunicam pela rede interna `emporio_net`, sem exposição externa desnecessária na VM

#### Scenario: Persistência de dados do PostgreSQL

- **WHEN** o container do PostgreSQL for reiniciado ou recriado
- **THEN** todos os dados DEVEM ser preservados através de volume nomeado persistente (`postgres_data`)

#### Scenario: Inicialização ordenada do backend após PostgreSQL saudável

- **WHEN** a stack for iniciada via Docker Compose
- **THEN** os serviços backend DEVEM aguardar a condição saudável (`condition: service_healthy`) do serviço `postgres` antes de iniciar a execução e o runner interno de migração

### Requirement: Otimização de Build com .dockerignore

The project root MUST maintain a `.dockerignore` file excluding dependency caches, version control data, and temporary build outputs from the Docker build context.

#### Scenario: Transferência de contexto reduzida

- **WHEN** o comando `docker compose build` for executado
- **THEN** diretórios como `node_modules`, `.git`, `.turbo` e `dist` NÃO DEVEM ser enviados para o daemon do Docker

### Requirement: Script de Automação de Deploy Local

The system MUST provide an executable `deploy.sh` script to automate update and deploy steps on the VM without spawning temporary migration containers.

#### Scenario: Execução do script de deploy

- **WHEN** o operador executar `./deploy.sh` na VM
- **THEN** o script DEVE atualizar o código via Git, construir imagens Docker, subir o PostgreSQL saudável e iniciar Backend e Nginx, com o backend executando automaticamente as migrações no startup
