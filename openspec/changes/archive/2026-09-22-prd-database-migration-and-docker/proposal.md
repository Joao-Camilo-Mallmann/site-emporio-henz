# Proposal: Esquema de Banco para PR 1 (Roles, Usuários, Clientes, Fornecedores e Vínculos) e Otimização Docker

## Why

Para a primeira fase (PR 1) da plataforma Empório Henz, o foco da persistência é estabelecer a base de autenticação, controle de perfis de acesso e governança multi-empresa de fornecedores (requisitos RF01, RF07, RF15, RF18, RF19 do PRD). As entidades de catálogo e produtos (produtos, variações, fotos, categorias, listas) pertencem às fases subsequentes do desenvolvimento e foram removidas do escopo deste PR 1 para manter a entrega coesa, incremental e testável. Além disso, a esteira de conteinerização foi otimizada para garantir sincronismo entre migração e inicialização da API.

## What Changes

- **Escopo do Banco de Dados para PR 1**:
  - Organizar as migrações em arquivos menores e atômicos dentro de `packages/database/migrations/`:
    - `001_setup_extensions.sql`: Extensão `pgcrypto` para geração de UUID e limpeza defensiva de resquícios de catálogo.
    - `002_create_roles.sql`: Tabela `roles` com PK SMALLINT e seed padrão (1=Cliente, 2=Vendedor, 3=Admin).
    - `003_create_users.sql`: Tabela `users` com credenciais, campo `city`, FK para `roles(id)` e índices.
    - `004_create_clients.sql`: Tabela `clients` com vínculo 1:1 para `users(id)`, dados de contato e índice único.
    - `005_create_suppliers.sql`: Tabela `suppliers` com dados cadastrais e índice de fornecedores ativos.
    - `006_create_user_suppliers.sql`: Tabela `user_suppliers` com vínculo N:N entre vendedores e fornecedores, com índice de unicidade ativo `(user_id, supplier_id)`.
  - **REMOÇÃO**: Excluir do PR 1 as tabelas de produto e catálogo (`categories`, `product_subtypes`, `products`, `product_images`, `product_variations`, `lists`, `list_items`), que serão introduzidas nos respectivos PRs de catálogo.
- **Docker & Compose**:
  - Adicionar `.dockerignore` para excluir `node_modules`, `.git`, `.turbo`, `dist` e artefatos de build, reduzindo expressivamente o contexto e acelerando o build das imagens Docker.
  - Ajustar `docker-compose.yml` para garantir que o container `backend` aguarde a conclusão com sucesso do runner de migração (`migration: condition: service_completed_successfully`).
  - Parametrizar a porta do host do PostgreSQL (`${POSTGRES_PORT:-5432}:5432`).

## Capabilities

### Modified Capabilities

- `database-migrations`: Define que as migrações iniciais criam unicamente `roles`, `users`, `clients`, `suppliers` e `user_suppliers` para suportar autenticação e governança no PR 1.
- `containerized-deployment`: Atualização da orquestração Docker Compose com sincronização de migração e inclusão de `.dockerignore`.

## Impact

- Pacote `packages/database`: Esquema limpo e restrito ao escopo do PR 1.
- Banco de dados PostgreSQL: Tabelas criadas: `roles`, `users`, `clients`, `suppliers`, `user_suppliers`.
- Docker: Contexto de build enxuto e startup seguro e ordenado dos containers.
