## 1. Infraestrutura Base e Conexão PostgreSQL

- [x] 1.1 Criar utilitários de configuração de ambiente e banco (`src/config/env.ts` e `src/config/database.ts` consumindo `packages/database/src/db.ts`).
- [x] 1.2 Implementar formatadores de resposta e helpers padronizados (`src/lib/response.ts`).
- [x] 1.3 Implementar roteador nativo modular e dispatch de rotas `/api/v1/` (`src/routes/index.ts`).
- [x] 1.4 Criar a aplicação e pipeline de middlewares de tratamento de erros (`src/app.ts`, `src/middlewares/error.ts`).
- [x] 1.5 Configurar o bootstrap do servidor Bun com suporte a CORS e healthcheck (`src/server.ts`, `src/index.ts`).

## 2. Utilitários Criptográficos e Assinatura JWT (US-BE-01)

- [x] 2.1 Implementar módulo de hash e verificação de senha com Argon2id nativo do Bun (`src/lib/password.ts`).
- [x] 2.2 Implementar emissão e verificação de tokens JWT com HMAC-SHA256 via Web Crypto API nativa (`src/lib/jwt.ts`).

## 3. Módulo de Autenticação (US-BE-03)

- [x] 3.1 Definir tipos e schemas de validação para login e cadastro (`src/modules/auth/auth.types.ts`, `src/modules/auth/auth.schema.ts`).
- [x] 3.2 Implementar repositório com queries SQL seguras para consulta e criação de usuários (`src/modules/auth/auth.repository.ts`).
- [x] 3.3 Implementar regras de negócio de autenticação, autocadastro transacional e sessão (`src/modules/auth/auth.service.ts`).
- [x] 3.4 Implementar controller e registrar rotas em `auth.routes.ts` (`POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `GET /api/v1/auth/me`).

## 4. Middlewares de Segurança: Bearer JWT e RBAC (US-BE-02 & US-BE-06)

- [x] 4.1 Implementar middleware de autenticação Bearer JWT com validação e injeção de usuário no contexto (`src/middlewares/auth.ts`).
- [x] 4.2 Implementar middleware de controle de acesso baseado em papéis com bloqueio estrito `403 Forbidden` (`src/middlewares/role.ts`).

## 5. Módulo de Gestão de Usuários (US-BE-04)

- [x] 5.1 Definir tipos e schemas de validação para o CRUD de usuários (`src/modules/users/users.types.ts`, `src/modules/users/users.schema.ts`).
- [x] 5.2 Implementar repositório unificado com JOIN entre tabelas `users` e `clients` e soft delete (`src/modules/users/users.repository.ts`).
- [x] 5.3 Implementar regras de negócio e controllers para listagem, busca, criação, edição e desativação lógica (`src/modules/users/users.service.ts`, `src/modules/users/users.controller.ts`).
- [x] 5.4 Registrar rotas administrativas protegidas com `requireRole(3)` em `src/modules/users/users.routes.ts`.

## 6. Módulo de Gestão de Fornecedores (US-BE-05)

- [x] 6.1 Definir tipos e schemas de validação para fornecedores (`src/modules/suppliers/suppliers.types.ts`, `src/modules/suppliers/suppliers.schema.ts`).
- [x] 6.2 Implementar repositório de persistência com soft delete para fornecedores (`src/modules/suppliers/suppliers.repository.ts`).
- [x] 6.3 Implementar regras de negócio e controllers para o CRUD de fornecedores (`src/modules/suppliers/suppliers.service.ts`, `src/modules/suppliers/suppliers.controller.ts`).
- [x] 6.4 Registrar rotas em `suppliers.routes.ts` com permissões diferenciadas (`ADMIN` para escrita, `ADMIN`/`SELLER` para leitura).

## 7. Módulo de Vínculos Vendedor ↔ Fornecedor (US-BE-07)

- [x] 7.1 Definir tipos e schemas para associação N:N em `user_suppliers` (`src/modules/user-suppliers/user-suppliers.types.ts`).
- [x] 7.2 Implementar repositório de persistência para consulta, vinculação e revogação lógica (`src/modules/user-suppliers/user-suppliers.repository.ts`).
- [x] 7.3 Implementar regras de negócio e controllers em `user-suppliers.service.ts` e `user-suppliers.controller.ts`.
- [x] 7.4 Registrar rotas administrativas de vínculo (`GET`, `POST`, `DELETE` em `/api/v1/users/:userId/suppliers`).

## 8. Testes Automatizados e Validação Final

- [x] 8.1 Criar testes automatizados de integração para o fluxo de autenticação e middlewares com `bun:test`.
- [x] 8.2 Criar testes automatizados para os CRUDs de usuários, fornecedores e vínculos com `bun:test`.
- [x] 8.3 Executar `bun run check-types` e `bun run lint` garantindo conformidade com os padrões estritos de qualidade.
