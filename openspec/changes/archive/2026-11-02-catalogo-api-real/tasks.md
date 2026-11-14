## 1. Documentação de produto

- [x] 1.1 Registrar na seção 9 do `docs/PRD.md` as regras do catálogo público sobre a API: tradução de slug em id no cliente, slug desconhecido resulta em página vazia, disponibilidade com as duas opções marcadas não filtra, fallback mockado só sem resposta da API, filtros sem suporte fora da interface

## 2. Tipos e camada de API `[FE]`

- [x] 2.1 Em `frontend/src/types/catalogo.ts`, `CatalogFilterParams` passa a ter só `name`, `categoria`, `subcategoria`, `disponibilidade`, `minPreco`, `maxPreco` e estende `PaginationParams`; `CatalogResponse` vira `Paginated<CatalogProductItem>`; `CatalogPaginationMeta` e `CatalogSortOption` saem
- [x] 2.2 Em `frontend/src/api/catalogo.ts`, criar `carregarCategorias()` com cache em módulo sobre `categoriasApi.listar({ limit: 100 })`
- [x] 2.3 Em `frontend/src/api/catalogo.ts`, `buscarProdutos` traduz os filtros para `categoryId`, `subtypeId`, `availabilityType`, `minPrice`, `maxPrice`, `search`, `page`, `limit`; devolve página vazia para slug desconhecido; converte `{ data, pagination }` e cada `ProductListItemDto` em `CatalogProductItem` com `toApiAssetUrl`
- [x] 2.4 Em `frontend/src/mocks/catalogo.ts`, criar `filtrarCatalogoMock(params)` com os mesmos filtros e paginação; `buscarProdutos` só o usa quando o erro do axios não tem `response`

## 3. Telas `[FE]`

- [x] 3.1 Em `CatalogoFiltroLateral.vue`, carregar as categorias da API, montar chips de categoria e subcategoria por `slug`/`name`, remover material, cor e marca, e manter disponibilidade e faixa de preço
- [x] 3.2 Em `CatalogoView.vue`, remover ordenação, material, cor e marca; ler `response.data`/`response.pagination`; resumo com o nome real da categoria/subcategoria; estado de erro com "Tentar de novo"; `UiPagination` sincronizada com `?page=`
- [x] 3.3 Apagar `CatalogoOrdenacaoDropdown.vue` e a linha correspondente em `frontend/src/components.d.ts`

## 4. Validação

- [x] 4.1 Rodar `bun run check-types` e `bun run lint` em `frontend/`
- [ ] 4.2 No navegador (localhost:3000 contra a API em localhost:3001), conferir: produtos reais no grid com miniatura e selo de disponibilidade, filtro por categoria/subcategoria da API, disponibilidade, faixa de preço, busca da navbar, `?page=` com `UiPagination`, clique no card abre o detalhe, e estado de erro/fallback com a API parada

## 5. Documentação técnica e backlog

- [x] 5.1 Documentar o fluxo do catálogo público em `docs/frontend/README.md`
- [x] 5.2 Registrar `[US-FE-17]` em `docs/planning/user-stories-backlog.md`, marcar os critérios atendidos, marcar os critérios de `[US-FE-09]` e `[US-FE-15]` validados, e registrar a história `[BE]` dos filtros pendentes (material, cor/acabamento, fornecedor por nome, ordenação)
