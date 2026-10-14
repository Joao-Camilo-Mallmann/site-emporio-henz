# Tasks

## 1. Listagem de Vendedores (`GET /api/v1/vendedores`)

- [x] 1.1 Adicionar método `listSellers(filters: UserQueryFilters)` ao `UsersService`:
  chamar `usersRepository.list({ ...filters, role: 2 })`, garantindo que apenas usuários com `role = 2` e `deleted_at IS NULL` sejam retornados.
  Verificar: `bun run check-types` sem erros.
- [x] 1.2 Adicionar handler `listSellers(_req, ctx)` ao `UsersController`:
  ler query com `parsePagination` / `validateUserQuery`, aplicar `src/lib/pagination.ts` para retornar `{ data, pagination }`, chamando `usersService.listSellers(filters)`.
  Verificar: assinatura e retorno compatíveis com o padrão do projeto.
- [x] 1.3 Criar `backend/tests/sellers-service.test.ts` com testes unitários (mock de `UsersRepository`):
  - (a) `listSellers` retorna exclusivamente usuários ativos com `role = 2`.
  - (b) Usuários com `deleted_at IS NOT NULL` são omitidos.
  - (c) Lista vazia quando não há vendedores cadastrados.
  - (d) Paginação de `src/lib/pagination.ts`: valida cálculo correto de `page`, `limit`, `offset` e envelope `{ data, pagination }`.
  Verificar: `bun test tests/sellers-service.test.ts` passa com sucesso.

## 2. Validação de Vendedor Ativo (404) e Rotas Aninhadas (`/api/v1/vendedores/:id/fornecedores`)

- [x] 2.1 Implementar helper `requireSellerById(userId: string): Promise<UserDto>`:
  consultar `usersRepository.findById(userId)`. Lançar `NotFoundError("Vendedor não encontrado.")` se:
  - O usuário não for encontrado no banco (`null`).
  - O usuário estiver marcado como soft-deleted (`deleted_at !== null`).
  - O usuário tiver papel diferente de Vendedor (`user.role !== ROLES.SELLER`).
  Verificar: função lança `NotFoundError` nos 3 casos acima e retorna o usuário quando válido.
- [x] 2.2 Criar sub-roteador `vendedoresRoutes` em `backend/src/modules/user-suppliers/user-suppliers.routes.ts`:
  definir as 4 rotas protegidas com `authMiddleware` e `requireRole(ROLES.ADMIN)`:
  - `GET /` → `usersController.listSellers`
  - `GET /:id/fornecedores` → `requireSellerById(id)`, seguido de `userSuppliersController.list` (paginado via `src/lib/pagination.ts`)
  - `POST /:id/fornecedores` → `requireSellerById(id)`, seguido de `userSuppliersController.assign`
  - `DELETE /:id/fornecedores/:supplierId` → `requireSellerById(id)`, seguido de `userSuppliersController.revoke`
  Verificar: `bun run check-types` passa sem erros.

## 3. Registro do Roteador Principal

- [x] 3.1 Registrar `vendedoresRoutes` em `backend/src/routes/index.ts`:
  montar com `apiRouter.use("/vendedores", vendedoresRoutes)`.
  Confirmar que o prefixo raiz é `/api/v1`, gerando as rotas `/api/v1/vendedores` e `/api/v1/vendedores/:id/fornecedores`.
  Verificar: servidor inicializa sem erros em `bun run dev`.

## 4. Testes de Rota (HTTP — via `handleRequest` com Mock)

- [x] 4.1 Criar `backend/tests/sellers-routes.test.ts` cobrindo RBAC de Administrador (403 Forbidden) em **todas as 4 rotas**:
  - `GET /api/v1/vendedores` com token de Vendedor (role=2) e Cliente (role=1) → `403 Forbidden`.
  - `GET /api/v1/vendedores/:id/fornecedores` com token de Vendedor e Cliente → `403 Forbidden`.
  - `POST /api/v1/vendedores/:id/fornecedores` com token de Vendedor e Cliente → `403 Forbidden`.
  - `DELETE /api/v1/vendedores/:id/fornecedores/:supplierId` com token de Vendedor e Cliente → `403 Forbidden`.
  - Chamadas sem autenticação em qualquer das 4 rotas → `401 Unauthorized`.
  Verificar: cenários de 401 e 403 passam para todas as 4 rotas.
- [x] 4.2 Cobrir cenários de Validação de Vendedor (404 Not Found) nas rotas `/api/v1/vendedores/:id/...`:
  - `GET|POST|DELETE` com `:id` inexistente no banco → `404 Not Found`.
  - `GET|POST|DELETE` com `:id` de usuário com `role = 3` (Administrador) → `404 Not Found`.
  - `GET|POST|DELETE` com `:id` de usuário com `role = 1` (Cliente) → `404 Not Found`.
  - `GET|POST|DELETE` com `:id` de usuário vendedor soft-deleted → `404 Not Found`.
  - `DELETE /api/v1/vendedores/:id/fornecedores/:supplierId` para vínculo que não existe ou já revogado → `404 Not Found`.
  Verificar: cenários de 404 passam.
- [x] 4.3 Cobrir Paginação e Sucesso (200 OK) nas duas listagens:
  - `GET /api/v1/vendedores` com token de Admin retorna estrutura paginada `{ data, pagination: { page, limit, total, totalPages } }`.
  - `GET /api/v1/vendedores/:id/fornecedores` com token de Admin retorna estrutura paginada `{ data, pagination }`.
  - Parâmetros `page` e `limit` respeitam os limites de `src/lib/pagination.ts`.
  Verificar: estrutura do envelope JSON conforme diretriz.
- [x] 4.4 Cobrir Garantia de Soft Delete de Vínculos (Critério 3 da issue):
  - Chamar `DELETE /api/v1/vendedores/:id/fornecedores/:supplierId` como Admin.
  - Em seguida, chamar `GET /api/v1/vendedores/:id/fornecedores` e comprovar que o fornecedor revogado não está presente em `data` (ignora registros com `deleted_at IS NOT NULL`).
  Verificar: teste reflete a exclusão lógica imediata.

## 5. Documentação na Collection Bruno

- [x] 5.1 Criar pasta `docs/backend/collections/bruno/Vendedores/` com `folder.bru`.
- [x] 5.2 Criar `docs/backend/collections/bruno/Vendedores/List Sellers.bru`:
  `GET {{baseUrl}}/vendedores?page=1&limit=20` (autenticado com cookie Admin, documentando RBAC 403 e paginação).
- [x] 5.3 Criar `docs/backend/collections/bruno/Vendedores/List Seller Suppliers.bru`:
  `GET {{baseUrl}}/vendedores/:id/fornecedores?page=1&limit=20` (documentando 403, 404 para role != 2 e filtro `deleted_at IS NULL`).
- [x] 5.4 Criar `docs/backend/collections/bruno/Vendedores/Assign Supplier to Seller.bru`:
  `POST {{baseUrl}}/vendedores/:id/fornecedores` (body `{ "supplierId": "..." }`, documentando 201 Created, 409 Conflict, 403 e 404).
- [x] 5.5 Criar `docs/backend/collections/bruno/Vendedores/Revoke Supplier from Seller.bru`:
  `DELETE {{baseUrl}}/vendedores/:id/fornecedores/:supplierId` (documentando 200 OK, 404 Not Found e 403).
  Verificar: arquivos `.bru` sintaticamente válidos e compatíveis com a collection.

## 6. Validação e Conclusão de Backlog

- [x] 6.1 Executar `bun run lint` no diretório `backend/` e garantir zero warnings (a ser executado no Docker).
- [x] 6.2 Executar `bun run check-types` no diretório `backend/` e garantir zero erros de tipagem (a ser executado no Docker).
- [x] 6.3 Executar `bun test` no diretório `backend/` e confirmar que todas as suítes passam sem falhas (a ser executado no Docker).
- [x] 6.4 Atualizar `docs/planning/user-stories-backlog.md`, marcando como `[x]` os três critérios de aceitação de `[US-BE-07]`:
  - `[x]` Apenas o Administrador consegue invocar as rotas de vínculo (outros recebem 403).
  - `[x]` O vínculo N:N persiste corretamente na tabela `user_suppliers`.
  - `[x]` A desvinculação executa soft delete e reflete imediatamente nas validações de permissão do vendedor.
