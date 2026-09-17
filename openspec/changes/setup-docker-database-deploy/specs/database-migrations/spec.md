## ADDED Requirements

### Requirement: Gerenciamento de Migrações em Pacote Próprio

O sistema DEVE possuir o pacote `packages/database` isolado no monorepo para centralizar arquivos de migração SQL e lógica de execução via Bun.

#### Scenario: Execução em ambiente limpo

- **WHEN** o runner de migração for iniciado com banco de dados recém-criado
- **THEN** ele DEVE criar a tabela de controle `_migrations` e aplicar todos os arquivos SQL ordenados numericamente

#### Scenario: Execução idempotente

- **WHEN** o runner de migração for executado novamente sem novos arquivos SQL
- **THEN** nenhuma alteração DEVE ser reaplicada e o processo DEVE concluir com sucesso sem erros

### Requirement: Rastreamento de Migrações Aplicadas

O sistema DEVE persistir no PostgreSQL o nome do arquivo da migração e a data de execução para cada script executado com sucesso.

#### Scenario: Nova migração detectada

- **WHEN** um novo arquivo SQL for adicionado e o script de migração rodar
- **THEN** somente esse novo arquivo DEVE ser executado e registrado na tabela `_migrations`

#### Scenario: Falha na migração

- **WHEN** um comando SQL na migração falhar
- **THEN** a transação DEVE ser revertida (rollback), o script DEVE interromper a execução com código de saída diferente de zero e a migração NÃO DEVE ser registrada como concluída

### Requirement: Conexão Nativa PostgreSQL com Bun

O runner de migrações e o backend DEVEM utilizar conexão com PostgreSQL via Bun nativo e SQL puro, sem a utilização de ORMs (como Prisma, Drizzle ou TypeORM).

#### Scenario: Leitura de configuração de banco

- **WHEN** o runner de migração ou a aplicação inicializarem
- **THEN** a conexão DEVE ser estabelecida a partir da variável de ambiente `DATABASE_URL`
