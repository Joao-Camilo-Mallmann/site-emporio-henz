# Proposal

## Why

A issue US-BE-07 exige endpoints dedicados para listar vendedores ativos e
gerenciar seus vínculos com fornecedores via `/api/v1/vendedores`, mas esse
recurso não existe: o módulo `user-suppliers` atual só expõe os vínculos via
`/api/v1/users/:userId/suppliers` (nenhuma rota lista os vendedores em si).
A ausência impede o frontend administrativo de consumir a API de gestão
multi-empresa exigida pelo RF15, RF16 e RF17.

## What Changes

- **Nova rota** `GET /api/v1/vendedores`: lista paginada de usuários com
  `role = 2` (Vendedor) ativos (`deleted_at IS NULL`); restrita ao Administrador (RBAC, 403 para os demais).
  Utiliza o utilitário padrão do projeto `src/lib/pagination.ts` (`{ data, pagination }`).
- **Novas rotas** aninhadas sob `/api/v1/vendedores/:id/fornecedores`:
  - `GET` — fornecedores ativamente vinculados ao vendedor (paginado via `src/lib/pagination.ts`, ignorando vínculos com `deleted_at` preenchido).
  - `POST` — cria/reativa vínculo `user_suppliers` (body: `{ supplierId }`).
  - `DELETE /:supplierId` — soft delete do vínculo (`deleted_at = CURRENT_TIMESTAMP`).
- **RBAC estrito de Administrador (403)**: todas as quatro rotas de `/vendedores` exigem perfil Administrador (`role = 3`). Vendedores e Clientes recebem `403 Forbidden`, e requisições sem sessão recebem `401 Unauthorized`.
- **Validação de Vendedor Ativo (404)**: nas rotas `/api/v1/vendedores/:id/...`, caso o usuário não exista, esteja soft-deleted ou não possua `role = 2`, o sistema responde `404 Not Found`.
- **Garantia de Soft Delete em Vínculos (critério 3 da issue)**: consultas de fornecedores vinculados ignoram registros com `deleted_at` preenchido (`WHERE us.deleted_at IS NULL`), refletindo a revogação imediatamente. Coberto por tarefa e teste dedicados.
- **Paginação Padronizada**: ambas as rotas de listagem usam `src/lib/pagination.ts` (`parsePagination`, `resolvePagination`, `paginate`).
- **Nenhuma migration** é necessária (tabela `user_suppliers` já existe, migração 006).
- **Reutilização** da lógica de `user-suppliers`: service, repository,
  schema e types existentes são aproveitados.
- **Nova entrada** no `src/routes/index.ts` montando o sub-roteador de vendedores
  em `/api/v1/vendedores`.
- **Documentação Bruno**: novos arquivos `.bru` na pasta `docs/backend/collections/bruno/Vendedores/` cobrindo as 4 rotas.
- **Testes automatizados**: suítes de teste cobrindo 403 (não-admin em todas as 4 rotas), 404 (usuário inexistente, soft-deleted ou `role != 2`), paginação e exclusão imediata de vínculos soft-deleted.
- **Backlog** US-BE-07 marcado como concluído com todos os critérios atendidos.

## Capabilities

### New Capabilities

- `backend-sellers`: Listagem paginada de usuários com `role = 2` (Vendedor)
  ativos, restrita ao Administrador, via `GET /api/v1/vendedores`.

### Modified Capabilities

- `backend-user-suppliers`: Adição das rotas `/api/v1/vendedores/:id/fornecedores`
  (GET, POST, DELETE) como superfície de gestão de vínculos orientada ao vendedor,
  exigindo Administrador e validando que `:id` é um vendedor ativo (`role = 2`, 404 caso contrário),
  e garantindo que vínculos desativados (`deleted_at IS NOT NULL`) sejam excluídos das consultas.

## Impact

- `backend/src/routes/index.ts` — novo mount do sub-roteador `vendedoresRoutes` sob `/api/v1/vendedores`.
- `backend/src/modules/users/` — novo método `listSellers` no repository e
  service (filtrando `role = 2` e `deleted_at IS NULL`).
- `backend/src/modules/user-suppliers/` — novo sub-roteador `vendedoresRoutes` com validação de `role = 2` (404) e RBAC de Admin (403).
- `backend/tests/` — novos arquivos `sellers-service.test.ts` e `sellers-routes.test.ts` cobrindo regras de negócio, paginação, 403, 404 e soft delete.
- `docs/backend/collections/bruno/Vendedores/` — novos arquivos `.bru` para as quatro rotas.
- `docs/planning/user-stories-backlog.md` — critérios de US-BE-07 marcados como `[x]`.
