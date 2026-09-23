# Tasks

## 1. Migração do Banco de Dados PostgreSQL (Escopo PR 1)

- [x] 1.1 Modularizar as migrações em arquivos menores e atômicos (`001_setup_extensions.sql`, `002_create_roles.sql`, `003_create_users.sql`, `004_create_clients.sql`, `005_create_suppliers.sql`, `006_create_user_suppliers.sql`)
- [x] 1.2 Remover arquivos de migração monolíticos anteriores mantendo estritamente o escopo do PR 1
- [x] 1.3 Executar o runner de migração em banco limpo e verificar a criação exclusiva das 5 tabelas de domínio (`roles`, `users`, `clients`, `suppliers`, `user_suppliers`)
- [x] 1.4 Validar idempotência do runner de migração

## 2. Otimização e Ajuste do Docker e Compose

- [x] 2.1 Criar arquivo `.dockerignore` na raiz excluindo `node_modules`, `.git`, `.turbo`, `**/dist`, `.env` e logs
- [x] 2.2 Atualizar `docker-compose.yml` para sincronizar a inicialização do `backend` com `migration: condition: service_completed_successfully` e parametrizar `${POSTGRES_PORT:-5432}:5432`
- [x] 2.3 Construir imagens com `docker compose build` e validar redução do contexto transferido

## 3. Validação do Sistema

- [x] 3.1 Validar integridade estática e tipagem do repositório executando `bun run check-types` e `bun run lint`
- [x] 3.2 Validar consulta ao banco PostgreSQL inspecionando ausência de tabelas de produto e presença correta das 5 tabelas de domínio
