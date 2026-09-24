## 1. Migração SQL Idempotente (Database First)

- [x] 1.1 Criar a migração `packages/database/migrations/007_seed_default_admin.sql` com hash Argon2id e bloco PL/pgSQL idempotente
- [x] 1.2 Inserir registro correspondente na tabela `clients` vinculado ao usuário administrador

## 2. Script Seeder em TypeScript e Atalhos CLI

- [x] 2.1 Criar o script `packages/database/src/seed.ts` utilizando `Bun.password.hash("admin123", "argon2id")` e conexão `sql`
- [x] 2.2 Adicionar o script `"seed": "bun packages/database/src/seed.ts"` ao `package.json` raiz

## 3. Validação e Documentação

- [x] 3.1 Executar a validação do hash Argon2id garantindo correspondência com `admin123`
- [x] 3.2 Executar checagem de tipos (`bun run check-types`) e lint (`bun run lint`)
- [x] 3.3 Atualizar a história `US-DB-01` no documento `docs/planning/user-stories-backlog.md`
