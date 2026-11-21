# Tasks: Fornecedor no Catálogo e na Tela de Produto

## Documentação e Especificação

- [x] 1.1 Atualizar `docs/PRD.md` (RF06 e Seção 9) com a exibição de fornecedor no detalhe, `supplierName` nos produtos e a listagem pública `GET /api/v1/suppliers` sem exposição de `contact`.
- [x] 1.2 Formalizar mudança OpenSpec (`proposal.md`, `design.md`, delta specs e `tasks.md`).

## Backend (`[BE]`)

- [x] 2.1 Adicionar `supplier_name` em `ProductDbRow` e `supplierName` em `ProductDto`, incluindo `LEFT JOIN suppliers` nas consultas de `products.repository.ts` e leitura pós-inserção em `createProduct`.
- [x] 2.2 Tornar `GET /api/v1/suppliers` pública com `attachUserIfAuthenticated` (removendo `authMiddleware` e `requireRole`), restringindo visitantes anônimos e Clientes a fornecedores ativos com `contact: null` e busca apenas em `name`, preservando escopo de Vendedor (RF16) e acesso total de Administrador.
- [x] 2.3 Atualizar mocks e testes unitários de `products` e `suppliers`, cobrindo visibilidade por papel (público/cliente/vendedor/admin), ocultação de `contact` no acesso público e retorno de `supplierName`.
- [x] 2.4 Atualizar a collection Bruno (`Suppliers/List Suppliers.bru`, `Suppliers/List Suppliers Admin.bru` e docs em `Products/*.bru`) e validar com `check-routes.ts`.
- [x] 2.5 Executar `bun test`, `bun run check-types` e `eslint src tests --max-warnings 0` no `backend/`.

## Frontend (`[FE]`)

- [x] 3.1 Atualizar tipos (`types/products.ts`, `types/catalogo.ts`) para `supplierName`/`supplierId` e reutilizar `fornecedoresApi.listar` (`GET /suppliers`).
- [x] 3.2 Atualizar `composables/useCatalogoProdutos.ts` com carga/cache de fornecedores ativos (`useFornecedoresCatalogo`), sincronização de `?fornecedor=` na URL, tradução para `supplierId`, tratamento de `403` e inclusão de `Fornecedor` em `mapearDetalheProduto`.
- [x] 3.3 Adicionar filtro **Fornecedor** em `CatalogoFiltroLateral.vue` e atualizar contador de filtros e título dinâmico em `CatalogoView.vue`.
- [x] 3.4 Exibir fornecedor clicável próximo ao título e na tabela técnica em `CatalogoProdutoDetalheView.vue`, extraindo `CatalogoProdutoInfo.vue` para manter ambos entre 150 e 500 linhas.
- [x] 3.5 Adicionar testes unitários em `frontend/tests/catalogo-fornecedor.test.ts` e validar `bun test`, `bun run check-types`, `bun run build` e contagem de linhas.
