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
