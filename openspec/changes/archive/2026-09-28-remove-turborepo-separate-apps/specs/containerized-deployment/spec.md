# Spec Delta

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Scripts Padronizados de Ciclo de Vida do Docker
**Reason**: O `package.json` raiz foi removido na separação total entre backend e frontend.
**Migration**: Executar comandos Docker diretamente via `docker compose --profile dev up`, `docker compose --profile prod up` ou através do script unificado `./deploy.sh`.
