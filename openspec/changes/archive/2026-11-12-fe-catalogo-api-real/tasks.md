## 1. Camada de dados

- [x] 1.1 `[FE]` Ajustar `src/types/catalogo.ts`:
  - criar `CatalogApiParams extends PaginationParams`;
  - remover `materiais`, `cores`, `marcas` e `ordem` de `CatalogFilterParams`;
  - remover `CatalogSortOption`, `CatalogPaginationMeta` e `CatalogResponse`.
- [x] 1.2 `[FE]` Reescrever `catalogoApi.buscarProdutos` em `src/api/catalogo.ts`: `GET /produtos` com o contrato da collection Bruno, retornando `Paginated<ProductListItemDto>`, sem fallback.
- [x] 1.3 `[FE]` Criar `src/composables/useCatalogoProdutos.ts`:
  - resolução de slug/nome para `categoryId` e `subtypeId` pelo store de categorias;
  - tradução da disponibilidade;
  - mapper `ProductListItemDto → CatalogProductItem` com `toApiAssetUrl`;
  - `loading` e `error`.
- [x] 1.4 `[FE]` Apagar `src/mocks/catalogo.ts` e as referências a ele.

## 2. Tela de catálogo

- [x] 2.1 `[FE]` Atualizar `CatalogoView.vue`:
  - usar o composable;
  - remover a ordenação e os filtros de material, cor e marca da URL;
  - preservar as chaves que não são filtro;
  - adicionar o estado de erro com "Tentar novamente";
  - remover o `router.push` duplicado.
- [x] 2.2 `[FE]` Atualizar `CatalogoFiltroLateral.vue`:
  - categorias e subcategorias vindas do store;
  - remover as seções Material, Cor e Marca;
  - deixar o arquivo com menos de 500 linhas.
- [x] 2.3 `[FE]` Apagar `CatalogoOrdenacaoDropdown.vue`.
- [x] 2.4 `[FE]` Card navega por `product.id`. Rota `/catalogo/:id`, com a view de detalhe lendo `route.params.id` e sem o default `"p-1"`.

## 3. Home

- [x] 3.1 `[FE]` `HomeView.vue`: Destaques e Recomendados vindos de `buscarProdutos({ page: 1, limit: 8 })` pelo mapper, com skeleton e com a seção escondida em caso de vazio ou erro.

## 4. Documentação

- [x] 4.1 `[FE]` Atualizar `docs/frontend/README.md` com o contrato da URL do catálogo, a navegação por id e a remoção do mock de fallback.
- [x] 4.2 `[FE]` Marcar na US-FE-09 (`docs/planning/user-stories-backlog.md`) o critério de disponibilidade nos cards.

## 5. Verificação

- [x] 5.1 `[FE]` Rodar `bun run lint`, `bun run check-types` e `bun run build` no `frontend`.
- [x] 5.2 `[FE]` Conferir no navegador contra o backend real com o seed de produtos:
  - 18 produtos em 2 páginas;
  - o filtro Quarto mostra 3 produtos, e Quarto + Pronta Entrega mostra 2;
  - a busca "Capri" mostra 2 produtos;
  - a faixa de preço filtra os produtos;
  - o link da navbar para a subcategoria funciona;
  - `?lista=` é preservado;
  - o card leva a `/catalogo/<uuid>`;
  - a Home mostra 8 produtos.
- [x] 5.3 `[FE]` Conferir o estado de erro com a API fora do ar.
