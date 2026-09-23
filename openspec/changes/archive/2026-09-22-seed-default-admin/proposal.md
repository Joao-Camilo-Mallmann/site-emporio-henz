## Why

Para viabilizar testes de bancas avaliadoras, facilitar o desenvolvimento local e permitir o acesso imediato ao painel administrativo da Empório Henz em qualquer ambiente (inclusive na VM de produção), é necessário que o banco de dados inicialize automaticamente com um usuário Administrador padrão (`admin@gmail.com` / `admin123`) e perfil cadastral vinculado em `clients`.

## What Changes

- Adição da migração SQL `007_seed_default_admin.sql` em `packages/database/migrations` para inserção idempotente do usuário administrador padrão com papel `role = 3` e senha criptografada com Argon2id.
- Inserção correspondente do perfil cadastral em `clients` (`Administrador Geral` / `(51) 99999-9999`) associado ao usuário criado.
- Criação de um script seeder dinâmico em TypeScript `packages/database/src/seed.ts` e inclusão do atalho `"seed": "bun packages/database/src/seed.ts"` no `package.json` raiz para semear ou resetar a senha do admin a qualquer momento.
- Atualização do documento `docs/user-stories-backlog.md` formalizando a conclusão da história `US-DB-01` (Issue #11).

## Capabilities

### Modified Capabilities

- `database-migrations`: Adição do requisito de semeadura automática e idempotente do administrador padrão com hash Argon2id e vinculação de cliente.

## Impact

- Banco de dados PostgreSQL: Inicialização de novos ambientes já contará com o usuário `admin@gmail.com` cadastrado com credenciais ativas.
- Pacote `packages/database`: Novo arquivo de migração `007_seed_default_admin.sql` e script `seed.ts`.
- `package.json`: Novo script de execução `bun run seed`.
- APIs e telas de autenticação futuras: Poderão autenticar imediatamente com `admin@gmail.com` / `admin123`.
