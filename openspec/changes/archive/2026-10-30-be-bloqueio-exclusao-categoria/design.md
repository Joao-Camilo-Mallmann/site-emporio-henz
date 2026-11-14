## Context

`CategoriesRepository.softDeleteCategoryWithCascade` abre uma transação, faz `UPDATE categories SET deleted_at` e, em seguida, o mesmo nos subtipos. Não há consulta a `products`. O schema já impede `DELETE` físico de categoria com produto (`products.category_id ... ON DELETE RESTRICT`), mas o projeto só faz soft delete (RNF08), então essa restrição não protege nada aqui.

Na criação de produto, `ProductsService.validateCatalogReferences` confere se a categoria existe com `deleted_at IS NULL` e depois insere o produto. O `INSERT` em `products` toma `FOR KEY SHARE` na linha referenciada de `categories`, por causa da chave estrangeira.

## Goals / Non-Goals

**Goals:**

- Recusar com `409` a exclusão de categoria com produto não excluído vinculado, ativo ou inativo.
- Manter a checagem e a exclusão atômicas.
- Não mudar o contrato de sucesso do endpoint.

**Non-Goals:**

- Bloquear a exclusão de subtipo com produtos vinculados. É o mesmo problema em `product_subtypes`, mas o pedido cobre só categoria. Fica registrado como questão em aberto.
- Bloquear a desativação (`PUT` com `active = false`). Desativar não quebra o vínculo do produto.
- Mudanças no frontend.
- Sincronizar a spec completa do change arquivado `2026-10-10-be-categories-subtypes`.

## Decisions

### 1. Validar primeiro, deletar depois

O controller chama `assertCanDeleteCategory` (em `categories.schema.ts`) antes de qualquer SQL de escrita e só chama o service se a exclusão for possível:

1. `findCategoryById`: sem categoria, `404`.
2. `countLinkedProducts`: `SELECT COUNT(*) FROM products WHERE category_id = $1 AND deleted_at IS NULL`, que usa o índice parcial `idx_products_category_active`. Com contagem maior que zero, `409` com a quantidade, sem chamar o delete.
3. `softDeleteCategoryWithCascade`: transação com `SELECT ... FOR UPDATE` na categoria e `UPDATE categories ... WHERE NOT EXISTS (produto não excluído)`, seguido do soft delete dos subtipos.

O `NOT EXISTS` do passo 3 é só a trava para um produto vinculado entre a validação e o delete. Se ele barrar, o repository devolve `false` sem alterar nada e o service responde `409`.

Alternativa descartada: contar os produtos só dentro da transação do delete. Fecha a janela do mesmo jeito, mas esconde a regra no repository; a validação explícita no schema, chamada pelo controller, deixa o fluxo legível (ver `backend/agents.md`, seção 6).

### 2. `FOR UPDATE` em vez de `UPDATE` direto

Hoje o bloqueio vem do `UPDATE`, que toma `FOR NO KEY UPDATE`. Esse modo não conflita com o `FOR KEY SHARE` do `INSERT` de produto, então a exclusão não esperaria um produto criado ao mesmo tempo e ainda não confirmado. O `FOR UPDATE` conflita com `FOR KEY SHARE`: se o `INSERT` do produto vier antes, a exclusão espera o commit e a contagem, feita depois em `READ COMMITTED`, já enxerga o produto. O `FOR UPDATE` também conflita com o `FOR SHARE` que a criação de subtipo já usa, então o comportamento atual com subtipos se mantém.

### 3. Erro no service, repository sem erro de domínio

O repository devolve número (`countLinkedProducts`) e booleano (`softDeleteCategoryWithCascade`); o schema lança `NotFoundError` e `ConflictError` das regras, e o service só lança o `409` da trava do SQL. Segue o padrão do módulo de subtipos, cujo repository devolve `null` e deixa a mensagem para o service.

### 4. Produto inativo bloqueia; produto excluído não

Produto com `active = false` continua no painel e pode ser reativado, então ainda depende da categoria. Produto com `deleted_at` preenchido saiu do catálogo e não conta.

## Risks / Trade-offs

- [Criação de produto que valida a categoria antes de a exclusão bloquear a linha e só insere depois do commit da exclusão] → a validação de `ProductsService` não segura bloqueio, e o `INSERT` passa pela chave estrangeira porque a linha continua existindo. A janela é de milissegundos entre a validação e o `INSERT`. Mitigação futura: inserir o produto com `INSERT ... SELECT ... FROM categories WHERE deleted_at IS NULL FOR SHARE`, como `SubtypesRepository.create` já faz. Fica fora deste change para não mexer no módulo de produtos.
- [Contagem a cada exclusão] → custo baixo: a exclusão é rara e a contagem usa índice parcial.

## Migration Plan

Sem migração. Rollback: reverter o commit do backend; o endpoint volta a excluir sem checar produtos.

## Open Questions

- A exclusão de subtipo deve seguir a mesma regra quando houver produtos com aquele `subtype_id`?
