## Context

A plataforma Empório Henz requer um usuário Administrador padrão inicializado automaticamente no banco de dados relacional (PostgreSQL) para viabilizar testes, validações de banca acadêmica e o acesso inicial irrestrito ao painel administrativo. As tabelas `roles`, `users` e `clients` já foram criadas nas migrações `002`, `003` e `004`.

## Goals / Non-Goals

**Goals:**

- Criar a migração `007_seed_default_admin.sql` estritamente idempotente.
- Utilizar hash seguro com algoritmo Argon2id (`Bun.password.hash("admin123", "argon2id")`).
- Associar o usuário ao papel `role = 3` (Administrador).
- Criar o perfil cadastral em `clients` (`full_name = 'Administrador Geral'`, `phone = '(51) 99999-9999'`).
- Disponibilizar um script em TypeScript `packages/database/src/seed.ts` acessível via `bun run seed` para semear ou resetar a senha do admin a qualquer momento.

**Non-Goals:**

- Endpoints de autenticação HTTP ou lógica de sessão/JWT no backend (pertencem a US-BE-01/02/03 em escopos posteriores).
- Alteração da estrutura de tabelas existentes.

## Decisions

1. **Numeração `007_seed_default_admin.sql`**:
   - _Decisão_: Fixar a numeração da migração em 007 em vez de 003.
   - _Motivo_: As migrações anteriores modularizaram a criação de `roles` (002), `users` (003), `clients` (004), `suppliers` (005) e `user_suppliers` (006). A migração de seed depende das tabelas `users` e `clients` já existentes.

2. **Idempotência com bloco PL/pgSQL `DO $$ ... BEGIN ... END $$;`**:
   - _Decisão_: Utilizar verificação procedural de existência por e-mail e vínculo antes de executar inserts.
   - _Motivo_: Como a coluna `email` em `users` possui índice único parcial (`WHERE deleted_at IS NULL`), um bloco condicional garante 100% de segurança contra falhas de integridade referencial tanto no runner automático de migrações quanto em execuções manuais.

3. **Hash estático pré-computado na migração SQL e dinâmico no script TypeScript**:
   - _Decisão_: A migração SQL embute o hash Argon2id correspondente a `admin123`, enquanto o script TypeScript `seed.ts` recalcula via `Bun.password.hash(..., "argon2id")`.
   - _Motivo_: Permite que o container de migração do Docker suba sem overhead de compilação adicional, enquanto o script CLI permite reset dinâmico rápido.

## Risks / Trade-offs

- [Risco] Senha padrão conhecida em ambiente de produção → _Mitigação_: Documentar que a senha deve ser alterada logo após o deploy e utilizar variáveis de ambiente se configuradas.
- [Risco] Índice parcial em `users.email` causar conflito se já houver registro excluído com mesmo e-mail → _Mitigação_: A consulta filtra explicitamente por `deleted_at IS NULL`.
