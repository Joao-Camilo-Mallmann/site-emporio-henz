## Why

A arquitetura anterior dependia de um estágio dedicado de migração no `Dockerfile` e execução manual ou orquestrada de um container temporário (`docker compose run --rm migration`). O objetivo desta mudança é simplificar a operação e o ciclo de vida dos containers, unificando a responsabilidade de migração no próprio container do backend, de modo que ao iniciar (`docker compose --profile prod up -d`), as migrações sejam executadas automaticamente antes de iniciar o servidor HTTP (`Bun.serve`), garantindo uma única imagem e container para o backend.

## What Changes

- **Remoção do estágio `migration` no `Dockerfile`**: O Dockerfile não possui mais o target/estágio `migration`.
- **Execução automática de migrações no startup do Backend**: O comando padrão do container do backend (`backend` e `backend-dev`) executa `bun run migrate` e, somente após o sucesso das migrações, inicia a API (`apps/backend/dist/index.js` em produção ou `bun --filter backend dev` em desenvolvimento).
- **Ajuste no script de deploy (`deploy.sh`)**: Elimina a chamada avulsa `docker compose run --rm migration`, já que o backend cuida das migrações automaticamente no startup.
- **Atualização da documentação (`AGENTS.md`)**: Reflete a nova arquitetura de container único para o backend com auto-migration.

## Capabilities

### New Capabilities

### Modified Capabilities
- `containerized-deployment`: Atualiza os requisitos para eliminar o estágio/container separado de migração e garantir que o container do backend execute as migrações no startup antes de expor o servidor HTTP.

## Impact

- **Dockerfile**: Remoção do estágio `migration` e atualização do `CMD` dos estágios `backend` e `backend-dev`.
- **docker-compose.yml**: Confirmação da ausência de serviço de migração separado e garantia de dependência saudável com `postgres`.
- **deploy.sh**: Remoção do comando one-shot `$DOCKER_COMPOSE run --rm migration`.
- **AGENTS.md**: Atualização da documentação operacional e arquitetural da stack Docker.
