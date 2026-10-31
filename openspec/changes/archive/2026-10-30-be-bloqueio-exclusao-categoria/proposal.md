## Why

O `DELETE /api/v1/categorias/:id` aplica soft delete na categoria e nos subtipos sem olhar os produtos. Como a exclusão é lógica, o `ON DELETE RESTRICT` de `products.category_id` nunca dispara, e um produto pode ficar apontando para uma categoria excluída: some dos filtros do catálogo e quebra o formulário de edição. O RF04 e a exceção E2 do UC09 no [PRD](../../../docs/PRD.md) agora exigem que a categoria só seja excluída sem produtos vinculados.

## What Changes

- `DELETE /api/v1/categorias/:id` passa a recusar a exclusão com `409 Conflict` quando existe ao menos um produto com `deleted_at IS NULL` (ativo ou inativo) vinculado à categoria. A mensagem informa a quantidade de produtos.
- Na recusa, nem a categoria nem os subtipos são alterados.
- A checagem e o soft delete rodam na mesma transação, com bloqueio da linha da categoria, para que um produto criado ao mesmo tempo não escape da checagem.
- Produtos já excluídos logicamente não bloqueiam a exclusão.
- A collection Bruno documenta o novo `409`.

Sem mudança de schema: as chaves estrangeiras e o índice `idx_products_category_active` já existem (migração `010`).

## Capabilities

### New Capabilities

- `backend-categories-subtypes`: a spec do change arquivado `2026-10-10-be-categories-subtypes` nunca foi sincronizada para `openspec/specs/`. Este change cria a capability com o requisito de bloqueio da exclusão de categoria com produtos vinculados.

### Modified Capabilities

Nenhuma.

## Impact

- Backend: `backend/src/modules/categories/` (repository, service e types).
- Testes: `backend/tests/modules/categories/categories.service.test.ts` e o mock `backend/tests/mocks/categories.mock.ts`.
- API: novo status `409` em `DELETE /api/v1/categorias/:id`. O contrato de sucesso não muda.
- Documentação: `docs/backend/collections/bruno/Categories/Delete Category.bru`.
- Frontend: nenhuma mudança obrigatória. A tela de categorias deve exibir a mensagem do `409`; isso fica para uma tarefa `[FE]` própria, se for preciso.
