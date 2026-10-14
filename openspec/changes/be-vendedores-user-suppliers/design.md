# Design

## Context

Ver `proposal.md` para a motivação completa.

**Prefixo correto: `/api/v1`**  
O roteador raiz em `backend/src/routes/index.ts` é instanciado como `new Router({ prefix: "/api/v1" })`. Portanto, todas as rotas da API possuem o prefixo canônico `/api/v1`. A menção na issue #27 a `/api/vendedores` refere-se ao recurso lógico; o caminho HTTP real exposto é `/api/v1/vendedores`.

**Status dos Requisitos no PRD (RF15, RF16, RF17)**  
Os requisitos já constam integralmente no [`docs/PRD.md`](../../docs/PRD.md) (linhas 70–72):
- **RF15**: Administrador vincula Vendedores a múltiplos fornecedores via `user_suppliers`.
- **RF16**: Vendedor atua exclusivamente nas empresas vinculadas (formulário bloqueado ou restrito).
- **RF17**: Vendedor realiza soft delete de produtos apenas das empresas vinculadas.
Portanto, não é necessária nenhuma alteração no PRD para esta tarefa de backend.

**Onde o sistema valida o vínculo do vendedor e comportamento de `deleted_at`**  
- Atualmente, a validação de vínculo vive exclusivamente em `backend/src/modules/user-suppliers/user-suppliers.repository.ts`.
- O método `listByUserId` aplica a cláusula SQL:
  ```sql
  INNER JOIN suppliers s ON s.id = us.supplier_id AND s.deleted_at IS NULL
  WHERE us.user_id = ${userId} AND us.deleted_at IS NULL
  ```
- O método `revokeLink` executa:
  ```sql
  UPDATE user_suppliers
  SET deleted_at = CURRENT_TIMESTAMP
  WHERE user_id = ${userId} AND supplier_id = ${supplierId} AND deleted_at IS NULL
  ```
- O módulo de produtos (`products.service.ts`) ainda não possui a barreira multi-empresa em tempo de execução; essa restrição faz parte da história subsequente US-BE-09 (RF16/RF17).
- O critério 3 da issue #27 estabelece: *"A desvinculação executa soft delete e reflete imediatamente nas validações de permissão do vendedor."* Como o repositório filtra estritamente `us.deleted_at IS NULL`, qualquer consulta subsequente à revogação já omite o fornecedor desvinculado. Isso será explicitamente garantido com tarefas e testes dedicados.

**Paginação Padrão (`src/lib/pagination.ts`)**  
Conforme diretriz do `backend/agents.md` e RNF11 do PRD:
- `parsePagination(query)` lê `page` e `limit`.
- `resolvePagination(filters)` calcula `offset`, aplicando defaults (`page = 1`, `limit = 20`, max `limit = 100`, max `page = 10000`).
- `paginate(data, total, params)` empacota o resultado no envelope padrão `{ data, pagination: { page, limit, total, totalPages } }`.
- Ambas as listagens (`GET /api/v1/vendedores` e `GET /api/v1/vendedores/:id/fornecedores`) adotam este padrão sem exceção.

## Goals / Non-Goals

**Goals:**
- Expor `GET /api/v1/vendedores` listando usuários `role = 2` ativos (`deleted_at IS NULL`), paginado via `src/lib/pagination.ts`, com RBAC restrito a `ADMIN` (403 para os demais).
- Expor sub-rotas `/api/v1/vendedores/:id/fornecedores`:
  - `GET` — listagem paginada de fornecedores vinculados com `deleted_at IS NULL`.
  - `POST` — associação do vendedor ao fornecedor `{ supplierId }`.
  - `DELETE /:supplierId` — revogação lógica do vínculo (`deleted_at = CURRENT_TIMESTAMP`).
- Aplicar RBAC de Administrador em todas as 4 rotas (403 Forbidden para Vendedor e Cliente, 401 para requisições não autenticadas).
- Validar `:id` nas rotas `/vendedores/:id/...`: retornar `404 Not Found` se o usuário não existir no banco, se estiver soft-deleted (`deleted_at IS NOT NULL`) ou se tiver papel diferente de Vendedor (`role !== 2`).
- Assegurar e comprovar por teste automatizado que vínculos com `deleted_at` preenchido são ignorados imediatamente nas consultas subsequentes.
- Documentar todas as 4 rotas na collection Bruno em `docs/backend/collections/bruno/Vendedores/`.
- Cobrir com testes automatizados as respostas 403 (RBAC) e 404 (validação de vendedor e vínculo inexistente).

**Non-Goals:**
- Alterar as rotas legadas em `/api/v1/users/:userId/suppliers`.
- Criar migrations novas de banco (tabela `user_suppliers` já está operacional).
- Implementar as regras de bloqueio de produtos por fornecedor no CRUD de produtos (escopo de US-BE-09).
- Desenvolver telas ou componentes de frontend (escopo de US-FE-06).

## Decisions

### D1 — Roteador de Vendedores e Integração em `index.ts`
**Decisão**: Criar o sub-roteador `vendedoresRoutes` em `user-suppliers.routes.ts` (ou arquivo dedicado no módulo `user-suppliers`) e registrá-lo em `backend/src/routes/index.ts` sob o prefixo canônico:
```typescript
apiRouter.use("/vendedores", vendedoresRoutes);
```
Isso mantém o prefixo global `/api/v1`, resultando nas URLs `/api/v1/vendedores` e `/api/v1/vendedores/:id/fornecedores`.

### D2 — Listagem de Vendedores via Módulo `users`
**Decisão**: `GET /api/v1/vendedores` delega para `usersController.listSellers`, que chama `usersService.listSellers(filters)`. O service invoca `usersRepository.list({ ...filters, role: 2 })`, garantindo o reaproveitamento das queries de contagem e paginação do módulo `users`.

### D3 — Validação de Vendedor Ativo (`requireSeller`) nas Sub-rotas (404)
**Decisão**: Para as rotas `/api/v1/vendedores/:id/...`, implementar um helper/middleware de validação `requireSeller(userId)`.  
Ele consulta `usersRepository.findById(userId)`:
- Se retornar `null` (usuário não encontrado ou soft-deleted) → lança `NotFoundError("Vendedor não encontrado.")`.
- Se o usuário existir, mas `user.role !== ROLES.SELLER` (ex.: role 1 Cliente ou role 3 Admin) → lança `NotFoundError("Vendedor não encontrado.")`.  
Isso satisfaz diretamente o requisito de que IDs de não-vendedores retornam 404 para quem consome o endpoint de vendedores, sem vazar informações de papéis internos.

### D4 — RBAC de Administrador (403) em Todas as 4 Rotas
**Decisão**: Aplicar `authMiddleware` seguido de `requireRole(ROLES.ADMIN)` em:
1. `GET /api/v1/vendedores`
2. `GET /api/v1/vendedores/:id/fornecedores`
3. `POST /api/v1/vendedores/:id/fornecedores`
4. `DELETE /api/v1/vendedores/:id/fornecedores/:supplierId`
Qualquer usuário autenticado com perfil `Vendedor` (2) ou `Cliente` (1) receberá status `403 Forbidden` com payload padronizado `{ "error": "Forbidden", "message": "..." }`.

### D5 — Garantia de Soft Delete e Exclusão Imediata (Critério 3 da Issue)
**Decisão**: O repositório `user-suppliers.repository.ts` já conta com o filtro `WHERE us.deleted_at IS NULL`. Criaremos um teste de integração/rota específico no qual um vínculo existente é desvinculado via `DELETE /api/v1/vendedores/:id/fornecedores/:supplierId`, e imediatamente uma chamada `GET /api/v1/vendedores/:id/fornecedores` é realizada, validando que o item não consta mais na lista retornada.

### D6 — Cobertura de Testes Automatizados (403 e 404)
**Decisão**: Criar suítes de testes claras:
- `backend/tests/sellers-service.test.ts`: testes unitários focados na listagem de vendedores, ordenação, paginação padrão e filtros de exclusão (`role = 2`, `deleted_at IS NULL`).
- `backend/tests/sellers-routes.test.ts`: testes de rotas cobrindo:
  - 401 Unauthorized para chamadas sem token.
  - 403 Forbidden para chamadas feitas por `Vendedor` (role=2) e `Cliente` (role=1) em cada uma das 4 rotas.
  - 404 Not Found para sub-rotas quando o `:id` não existe no banco.
  - 404 Not Found para sub-rotas quando o `:id` pertence a um usuário com `role != 2` (ex.: Admin ou Cliente).
  - 404 Not Found ao tentar revogar vínculo que não existe ou que já está inativo.
  - 200 OK com formato paginado `{ data, pagination }` para listagens com token de Admin.

## Risks / Trade-offs

- **Consistência de Erro 404 vs 400**: Retornar 404 quando o usuário existe mas tem `role != 2` é a escolha correta, pois a rota `/vendedores/:id/...` define o escopo do recurso como vendedor; um não-vendedor simplesmente não existe nesse catálogo.
- **Isolamento em Relação a `products`**: A validação em produtos será testada e implementada na US-BE-09. Aqui, asseguramos que o contrato de `user_suppliers` e `/vendedores` está íntegro e à prova de regressões.

## Migration Plan

1. Adicionar `listSellers` no service e controller de `users`.
2. Adicionar `vendedoresRoutes` em `user-suppliers.routes.ts` com as 4 rotas protegidas por RBAC Admin e validação de vendedor ativo (404).
3. Registrar `/vendedores` no roteador principal (`backend/src/routes/index.ts`).
4. Criar os testes unitários e de integração (`sellers-service.test.ts` e `sellers-routes.test.ts`).
5. Gerar os arquivos de documentação Bruno na pasta `docs/backend/collections/bruno/Vendedores/`.
6. Validar com `bun run lint`, `bun run check-types` e `bun test`.
7. Atualizar os critérios no backlog `docs/planning/user-stories-backlog.md`.
