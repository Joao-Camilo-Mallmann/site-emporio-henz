# Database Migrations

## Purpose

Centralizar migrações de banco de dados PostgreSQL com script runner idempotente em Bun nativo no pacote `packages/database`.

## Requirements

### Requirement: Gerenciamento de Migrações em Pacote Próprio

The monorepo MUST maintain an isolated `packages/database` package to centralize SQL migration files and Bun execution runner.

#### Scenario: Execução em ambiente limpo

- **WHEN** o runner de migração for iniciado com banco de dados recém-criado
- **THEN** ele DEVE criar a tabela de controle `_migrations` e aplicar todos os arquivos SQL ordenados numericamente

#### Scenario: Execução idempotente

- **WHEN** o runner de migração for executado novamente sem novos arquivos SQL
- **THEN** nenhuma alteração DEVE ser reaplicada e o processo DEVE concluir com sucesso sem erros

### Requirement: Rastreamento de Migrações Aplicadas

The database system MUST track executed migrations in PostgreSQL with file name and execution timestamp.

#### Scenario: Nova migração detectada

- **WHEN** um novo arquivo SQL for adicionado e o script de migração rodar
- **THEN** somente esse novo arquivo DEVE ser executado e registrado na tabela `_migrations`

#### Scenario: Falha na migração

- **WHEN** um comando SQL na migração falhar
- **THEN** a transação DEVE ser revertida (rollback), o script DEVE interromper a execução com código de saída diferente de zero e a migração NÃO DEVE ser registrada como concluída

### Requirement: Conexão Nativa PostgreSQL com Bun

The migration runner and backend MUST use native Bun PostgreSQL connection and raw SQL without third-party ORMs.

#### Scenario: Leitura de configuração de banco

- **WHEN** o runner de migração ou a aplicação inicializarem
- **THEN** a conexão DEVE ser estabelecida a partir da variável de ambiente `DATABASE_URL`

### Requirement: Esquema de Banco Focado no PR 1 (Roles, Usuários, Clientes, Fornecedores e Vínculos)

The database migration files MUST create exclusively the domain tables required for Phase 1 (Auth and Supplier Governance): `roles`, `users`, `clients`, `suppliers`, and `user_suppliers`. Product and catalog tables MUST NOT be included in this phase.

#### Scenario: Execução de migração em banco limpo para o PR 1

- **WHEN** o runner de migração for iniciado em um banco de dados recém-criado
- **THEN** ele DEVE criar apenas as tabelas `roles` (com seed Cliente, Vendedor, Admin), `users` (com city e FK para roles), `clients`, `suppliers` e `user_suppliers`, e NÃO DEVE criar tabelas de produtos, categorias ou listas

#### Scenario: Modularidade das migrações

- **WHEN** os arquivos do diretório `packages/database/migrations` forem listados
- **THEN** cada entidade de domínio DEVE possuir seu próprio arquivo SQL atômico (`001_setup_extensions.sql`, `002_create_roles.sql`, `003_create_users.sql`, `004_create_clients.sql`, `005_create_suppliers.sql`, `006_create_user_suppliers.sql`), executados em ordem de dependência estrita

#### Scenario: Idempotência das migrações do PR 1

- **WHEN** o runner de migração for reexecutado
- **THEN** nenhuma alteração DEVE ser reaplicada e a execução DEVE concluir com sucesso informando zero migrações pendentes

### Requirement: Seed do Administrador Padrão da Plataforma

O sistema de banco de dados MUST inicializar automaticamente com um usuário com papel de Administrador (`role = 3`), credenciais pré-configuradas e perfil cadastral completo vinculado na tabela `clients`.

#### Scenario: Execução da migração em banco novo

- **WHEN** o runner de migração for executado pela primeira vez
- **THEN** ele DEVE criar o usuário com e-mail `admin@gmail.com`, senha criptografada com Argon2id correspondente a `admin123`, papel `role = 3` e o registro correspondente em `clients` com nome `Administrador Geral` e telefone `(51) 99999-9999`

#### Scenario: Execução repetida ou idempotente

- **WHEN** a migração ou o script de seed for executado novamente
- **THEN** nenhuma duplicidade DEVE ser gerada e nenhum erro de violação de chave única DEVE ocorrer

#### Scenario: Verificação do hash com runtime Bun

- **WHEN** a função `Bun.password.verify("admin123", password_hash)` for executada contra o hash salvo
- **THEN** o resultado DEVE ser verdadeiro (`true`)
