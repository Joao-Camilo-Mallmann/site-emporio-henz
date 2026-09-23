## ADDED Requirements

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
