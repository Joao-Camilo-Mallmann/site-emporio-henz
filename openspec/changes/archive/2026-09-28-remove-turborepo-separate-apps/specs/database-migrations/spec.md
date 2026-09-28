# Spec Delta

## MODIFIED Requirements

### Requirement: Gerenciamento de Migrações em Pacote Próprio
The backend MUST maintain a dedicated `backend/database` directory to centralize SQL migration files and the Bun execution runner, eliminating external packages.

#### Scenario: Execução em ambiente limpo
- **WHEN** o runner de migração for iniciado com banco de dados recém-criado
- **THEN** ele DEVE criar a tabela de controle `_migrations` e aplicar todos os arquivos SQL ordenados numericamente

#### Scenario: Execução idempotente
- **WHEN** o runner de migração for executado novamente sem novos arquivos SQL
- **THEN** nenhuma alteração DEVE ser reaplicada e o processo DEVE concluir com sucesso sem erros

### Requirement: Esquema de Banco Focado no PR 1 (Roles, Usuários, Clientes, Fornecedores e Vínculos)
The database migration files MUST create exclusively the domain tables required for Phase 1 (Auth and Supplier Governance): `roles`, `users`, `clients`, `suppliers`, and `user_suppliers`. Product and catalog tables MUST NOT be included in this phase.

#### Scenario: Execução de migração em banco limpo para o PR 1
- **WHEN** o runner de migração for iniciado em um banco de dados recém-criado
- **THEN** ele DEVE criar apenas as tabelas `roles` (com seed Cliente, Vendedor, Admin), `users` (com city e FK para roles), `clients`, `suppliers` e `user_suppliers`, e NÃO DEVE criar tabelas de produtos, categorias ou listas

#### Scenario: Modularidade das migrações
- **WHEN** os arquivos do diretório `backend/database/migrations` forem listados
- **THEN** cada entidade de domínio DEVE possuir seu próprio arquivo SQL atômico (`001_setup_extensions.sql`, `002_create_roles.sql`, `003_create_users.sql`, `004_create_clients.sql`, `005_create_suppliers.sql`, `006_create_user_suppliers.sql`), executados em ordem de dependência estrita

#### Scenario: Idempotência das migrações do PR 1
- **WHEN** o runner de migração for reexecutado
- **THEN** nenhuma alteração DEVE ser reaplicada e a execução DEVE concluir com sucesso informando zero migrações pendentes
