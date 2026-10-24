# Proposal

## Why

A tela de detalhes do produto no frontend e os fluxos de atendimento/catálogo necessitam exibir o nome e o slug da categoria para navegação/breadcrumbs, bem como o nome do fornecedor (marca parceira), sem que o cliente HTTP precise disparar requisições adicionais às rotas de `/categorias` ou `/suppliers`. Estender a rota existente `GET /api/v1/produtos/:id` agregando esses dados em paralelo no repositório atende a essa necessidade mantendo retrocompatibilidade e sem alterar o método base `findById`, o `ProductDto` ou as migrações do banco.

## What Changes

- Estende o método `ProductsRepository.findDetailById` acrescentando uma terceira consulta no `Promise.all` existente (junto a variações e imagens) para obter `category` (`{ id, name, slug }`) e `supplier` (`{ id, name }`) via `INNER JOIN` a partir de `product.categoryId` e `product.supplierId`, sem filtro de `deleted_at` nesses joins.
- Trata de forma explícita o caso excepcional de ausência de retorno dessa consulta (protegido por `RESTRICT` e `NOT NULL` no banco) sem acesso inseguro direto a `rows[0]`.
- Não altera `findById` nem o `ProductDto` base, preservando o comportamento das outras rotas (listagens, recomendações e mutações).
- Adiciona os tipos `ProductCategorySummaryDto` e `ProductSupplierSummaryDto` e estende `ProductDetailDto` (com `category` e `supplier` não-nulos) exclusivamente em `backend/src/modules/products/products.types.ts`. Não cria `ProductDetailDbRow`.
- Preserva todas as regras de controle de acesso e respostas de erro da rota: `400 Bad Request` para `:id` inválido (não UUID), `404 Not Found` para inexistente, desativado por soft delete ou inativo para não-Admin, e `403 Forbidden` para Vendedor sem vínculo.
- Mantém a conformidade com o RNF02 (fotos servidas por `fullImageUrl` e `thumbnailUrl` relativas ao volume de uploads, sem tráfego ou persistência de Base64).
- Atualiza a documentação da collection Bruno (`Get Product by ID.bru`).
- Adiciona testes automatizados unitários no backend cobrindo `category`, `supplier`, fotos ordenadas por `sort_order`, variações com cores/amostras e `specifications JSONB`, atualizando o backlog da `[US-BE-12]`.
- Mantém tarefa de validação manual da consulta SQL contra o banco de dados.

## Capabilities

### New Capabilities
<!-- Nenhuma nova capability criada -->

### Modified Capabilities
- `backend-products-crud`: Estende o requisito de consulta detalhada de produtos (`GET /api/v1/produtos/:id`) para retornar os objetos aninhados `category` (`{ id, name, slug }`) e `supplier` (`{ id, name }`) sem tipos nulos, obtidos em paralelo via consulta dedicada no repositório.

## Impact

- **Código Backend**:
  - `backend/src/modules/products/products.types.ts`: Adição de `ProductCategorySummaryDto`, `ProductSupplierSummaryDto` e extensão de `ProductDetailDto`.
  - `backend/src/modules/products/products.repository.ts`: Atualização de `findDetailById` com a 3ª consulta em `Promise.all`. `findById` permanece inalterado.
  - `backend/tests/products-service.test.ts`: Atualização do `MockProductsRepository` e adição de testes cobrindo os objetos aninhados e os 3 critérios de aceitação da US-BE-12.
- **APIs**:
  - `GET /api/v1/produtos/:id`: Resposta de sucesso (200) ganha `category` e `supplier` aninhados e preserva `categoryId`, `subtypeId` e `supplierId`.
- **Collection Bruno**:
  - `docs/backend/collections/bruno/Products/Get Product by ID.bru`: Documentação e payload atualizados.
- **Banco de Dados**:
  - Nenhuma alteração de migration ou schema físico.
