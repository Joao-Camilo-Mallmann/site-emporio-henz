# Design

## Context

No `ProductsRepository`, o método `findDetailById(id)` obtém o registro base do produto chamando `await this.findById(id)` (que é compartilhado com listagens, recomendações e validações) e, em seguida, executa duas consultas paralelas no `Promise.all` para buscar variações e imagens do carrossel. Atualmente, o `ProductDetailDto` devolve apenas os identificadores escalares `categoryId`, `subtypeId` e `supplierId`.

Veja [proposal.md](proposal.md) para a motivação da mudança.

## Goals / Non-Goals

**Goals:**
- Manter o método `findById` e a interface `ProductDto` intactos e sem modificações.
- Adicionar uma terceira consulta SQL no mesmo `Promise.all` de `findDetailById` que busque simultaneamente `category` (`{ id, name, slug }`) e `supplier` (`{ id, name }`) a partir de `product.categoryId` e `product.supplierId`.
- Realizar a busca via `INNER JOIN` entre `categories` e `suppliers`, sem filtros de `deleted_at` nessas tabelas (a visibilidade é determinada unicamente pelo `deleted_at` e `active` do próprio produto).
- Compor o retorno via spread `(...product, category, supplier, variations, images)` com tipos estritos e sem campos nulos (`ProductCategorySummaryDto` e `ProductSupplierSummaryDto`).
- Tratar explicitamente no código a checagem da linha retornada (evitando qualquer acesso cego a `rows[0]`), lançando erro defensivo caso a integridade referencial do banco seja violada.
- Declarar todos os tipos exclusivamente em `products.types.ts` sem criar `ProductDetailDbRow`.
- Cobrir via testes automatizados no `products-service.test.ts` os 3 critérios de aceitação da US-BE-12 e os novos objetos.
- Atualizar a collection Bruno e o backlog da US-BE-12.

**Non-Goals:**
- Não alterar `findById` nem o tipo `ProductDto` base.
- Não alterar migrações ou tabelas físicas do banco.
- Não usar Base64 nem alterar a estratégia de imagens (RNF02).
- Não criar `ProductDetailDbRow`.

## Decisions

### Decisão 1: Manutenção estrita de `findById` e 3ª consulta em `Promise.all`
Como `findById` é utilizado por diversos fluxos (como validações de mutação e recomendações), ele não é alterado. A agregação de categoria e fornecedor ocorre no mesmo `Promise.all` que já busca as variações e imagens:
```typescript
const [variationRows, imageRows, metaRows] = await Promise.all([
  sql<ProductVariationDbRow[]>`...`,
  sql<ProductImageDbRow[]>`...`,
  sql<ProductMetaDbRow[]>`
    SELECT
      c.id AS category_id,
      c.name AS category_name,
      c.slug AS category_slug,
      s.id AS supplier_id,
      s.name AS supplier_name
    FROM categories c
    INNER JOIN suppliers s ON s.id = ${product.supplierId}
    WHERE c.id = ${product.categoryId}
    LIMIT 1
  `,
]);
```
*Justificativa*: Mantém concorrência eficiente com 3 consultas paralelas no PostgreSQL sem introduzir N+1 e sem poluir o `findById` base.

### Decisão 2: Ausência proposital de filtro `deleted_at` no JOIN de Categoria e Fornecedor
A consulta não aplica `AND c.deleted_at IS NULL` nem `AND s.deleted_at IS NULL`.
*Justificativa*: A regra de negócio do catálogo define que a visibilidade do produto é regida exclusivamente por `products.deleted_at IS NULL` e `products.active`. Mesmo que um fornecedor ou categoria parceira venha a sofrer soft delete no futuro, os produtos históricos ativos vinculados a eles continuam acessíveis com seus dados de contexto íntegros.

### Decisão 3: Tipagem estrita sem nulos e checagem defensiva de linha
Em `products.types.ts`:
```typescript
export interface ProductCategorySummaryDto {
  id: string;
  name: string;
  slug: string;
}

export interface ProductSupplierSummaryDto {
  id: string;
  name: string;
}

export interface ProductMetaDbRow {
  category_id: string;
  category_name: string;
  category_slug: string;
  supplier_id: string;
  supplier_name: string;
}

export interface ProductDetailDto extends ProductDto {
  category: ProductCategorySummaryDto;
  supplier: ProductSupplierSummaryDto;
  variations: ProductVariationDto[];
  images: ProductImageDto[];
}
```
Na implementação do repositório:
```typescript
const meta = metaRows[0];
if (!meta) {
  throw new Error(
    `Inconsistência referencial: categoria '${product.categoryId}' ou fornecedor '${product.supplierId}' não encontrados para o produto ${id}.`,
  );
}
const category: ProductCategorySummaryDto = {
  id: meta.category_id,
  name: meta.category_name,
  slug: meta.category_slug,
};
const supplier: ProductSupplierSummaryDto = {
  id: meta.supplier_id,
  name: meta.supplier_name,
};
```
*Justificativa*: O esquema relacional define `category_id` e `supplier_id` como `NOT NULL` com chaves estrangeiras `ON DELETE RESTRICT`. Portanto, a ausência de linha é um estado corrompido impossível sob integridade referencial normal, mas que deve ser checado explicitamente em vez de acessar `metaRows[0]!` diretamente.

## Open Questions / Pontos de Atenção

1. **Visibilidade de produto com categoria ou fornecedor com soft delete**: Fica registrado como decisão de arquitetura que um produto ativo continua visível no detalhe mesmo se sua categoria ou fornecedor estiver com `deleted_at` preenchido. A integridade histórica é preservada e os joins de detalhe não restringem por `deleted_at`.
2. **INNER JOIN da linha 274 do repositório**: A consulta `findActiveSupplierIdsByUserId` (linha 274 de `products.repository.ts`) utiliza `INNER JOIN suppliers s ON s.id = us.supplier_id AND s.deleted_at IS NULL`. Fica registrado que esse filtro aplica-se estritamente à checagem de vínculo ativo de permissão do vendedor (`user_suppliers`), e não se confunde com a consulta de dados do produto.

## Risks / Trade-offs

- **[Risco] Testes em MockProductsRepository desatualizados**: Como `ProductDetailDto` agora exige `category` e `supplier` obrigatórios, testes unitários que invocam `getById` poderiam falhar se o mock não retornar tais objetos.
  → *Mitigação*: Atualizar o `MockProductsRepository.findDetailById` em `backend/tests/products-service.test.ts` para sempre prover `category` e `supplier` correspondentes.
