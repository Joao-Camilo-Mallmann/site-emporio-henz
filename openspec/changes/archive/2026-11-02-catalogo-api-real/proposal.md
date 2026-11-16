## Why

O catálogo público (`/catalogo`) ainda mostra os produtos de `MOCK_CATALOG_PRODUCTS`: `catalogoApi.buscarProdutos` chama `GET /produtos` com parâmetros que a API não entende (`categoria`, `subcategoria`, `materiais`, `cores`, `marcas`, `disponibilidade`, `minPreco`, `maxPreco`, `ordem`) e espera `{ items, meta }`, enquanto a API responde `{ data, pagination }` e só lê `search`, `categoryId`, `subtypeId`, `supplierId`, `availabilityType`, `minPrice`, `maxPrice`, `page` e `limit`. A resposta nunca passa pela checagem e a tela sempre cai no mock. Os produtos cadastrados pelo painel (`/admin/produtos`) não aparecem no site, e o RF05 do [PRD](../../../docs/PRD.md) continua sem a ponta pública.

## What Changes

- **[FE]** `catalogoApi.buscarProdutos` passa a montar os parâmetros no contrato da collection Bruno (`Products/List Products.bru`): `categoria` e `subcategoria` (slugs da URL) são traduzidos em `categoryId` e `subtypeId` com a lista de `GET /categorias`; `disponibilidade` vira `availabilityType` quando há exatamente uma opção marcada; `minPreco`/`maxPreco` viram `minPrice`/`maxPrice`; `name` segue como `search` normalizado; `page` e `limit` passam direto.
- **[FE]** O envelope `{ data, pagination }` e cada `ProductListItemDto` são convertidos para `CatalogProductItem` (miniatura com `toApiAssetUrl`, preço de referência, parcelas a partir de `maxInstallments`, disponibilidade e prazo). `CatalogResponse` vira um alias de `Paginated<CatalogProductItem>`, como manda a seção 4 de `frontend/agents.md`.
- **[FE]** O fallback mockado passa a valer só quando a API está fora (requisição sem resposta HTTP). Uma resposta de erro da API vira estado de erro na tela, com "Tentar de novo", em vez de produtos falsos.
- **[FE]** `CatalogoFiltroLateral.vue` monta os chips de categoria e subcategoria a partir de `GET /categorias` (nome e slug reais), e `CatalogoView.vue` mostra o nome da categoria/subcategoria no resumo, mantém `?page=` sincronizado com `UiPagination` e carrega 9 produtos por página.
- **[FE]** Os filtros sem suporte na API saem da interface até a tarefa `[BE]` correspondente existir: material, cor/acabamento, marca e a ordenação (`CatalogoOrdenacaoDropdown.vue` e `CatalogSortOption` são removidos). Eles ficam registrados no backlog como história `[BE]` própria, não improvisados no cliente.
- Regras novas do catálogo registradas no PRD (seção 9): tradução de slug em id no cliente, slug desconhecido resulta em página vazia, disponibilidade com as duas opções marcadas não filtra, fallback mockado só sem resposta da API.
- Fora do escopo: `produtosApi.listar` e `buscarPorId` (página de detalhe e Home), o menu de categorias fixo da `AppNavbar.vue`, acabamentos no card (a listagem da API não traz variações) e qualquer mudança na API.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `catalogo-busca-produtos`: a barra lateral passa a oferecer só categoria, subcategoria, disponibilidade e faixa de preço, com categorias vindas da API; o despacho `GET` segue o contrato real (`categoryId`, `subtypeId`, `availabilityType`, `minPrice`, `maxPrice`, `search`, `page`, `limit`) e consome o envelope `{ data, pagination }`; a ordenação deixa de existir até a API suportá-la; o fallback mockado vale só com a API fora.

## Impact

- Frontend: `frontend/src/api/catalogo.ts`, `frontend/src/types/catalogo.ts`, `frontend/src/mocks/catalogo.ts`, `frontend/src/views/catalogo/CatalogoView.vue`, `frontend/src/components/catalogo/CatalogoFiltroLateral.vue`; remoção de `frontend/src/components/catalogo/CatalogoOrdenacaoDropdown.vue` (e da sua linha em `components.d.ts`). Reaproveita `toApiAssetUrl` (`utils/uploads.ts`), `slugify` (`utils/slug.ts`), `categoriasApi.listar` e os tipos `Paginated<T>`, `ICategory`, `ISubtype` e `ProductListItemDto`.
- API: nenhuma mudança. O contrato consumido é o de `docs/backend/collections/bruno/Products/List Products.bru` e `Categories/List Categories.bru`.
- Documentação: `docs/PRD.md` (seção 9), `docs/frontend/README.md` (fluxo do catálogo público), `docs/planning/user-stories-backlog.md` (história `[US-FE-17]` e a história `[BE]` dos filtros pendentes; critérios de `[US-FE-09]` e `[US-FE-15]` atendidos).
