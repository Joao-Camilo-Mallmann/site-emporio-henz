# Tasks

## 1. Tipagem de Domínio [BE]

- [x] 1.1 Declarar `ProductCategorySummaryDto`, `ProductSupplierSummaryDto` e `ProductMetaDbRow` e estender `ProductDetailDto` (com `category` e `supplier` obrigatórios) em `backend/src/modules/products/products.types.ts`, sem alterar `ProductDto` base

## 2. Repositório e Consulta SQL de Detalhes [BE]

- [x] 2.1 Adicionar a terceira consulta no `Promise.all` de `ProductsRepository.findDetailById` em `backend/src/modules/products/products.repository.ts` buscando `category` e `supplier` via `INNER JOIN` entre `categories` e `suppliers` a partir de `product.categoryId` e `product.supplierId` sem filtro de `deleted_at`, sem alterar `findById`
- [x] 2.2 Tratar explicitamente a verificação de retorno da linha da consulta em `findDetailById` com validação defensiva contra nulo antes do mapeamento, e compor o retorno `(...product, category, supplier, variations, images)`
- [x] 2.3 Executar validação manual da consulta SQL contra o banco de dados PostgreSQL (tarefa do usuário) para confirmar os dados retornados

## 3. Testes Automatizados [BE]

- [x] 3.1 Atualizar `MockProductsRepository.findDetailById` em `backend/tests/products-service.test.ts` para prover `category` e `supplier`
- [x] 3.2 Adicionar testes em `backend/tests/products-service.test.ts` cobrindo o retorno de `category` e `supplier`, o carrossel de fotos ordenado por `sort_order`, variações com cores e amostras, e `specifications JSONB`, validando com `bun test`

## 4. Documentação e Backlog [BE]

- [x] 4.1 Atualizar `docs/backend/collections/bruno/Products/Get Product by ID.bru` documentando `category` e `supplier` no payload de retorno
- [x] 4.2 Atualizar `docs/planning/user-stories-backlog.md` marcando com `[x]` os critérios de aceitação da `[US-BE-12]` cobertos pelos testes (tarefa do usuário após validação manual do SQL)
