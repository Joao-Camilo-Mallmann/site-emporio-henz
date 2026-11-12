## Why

O catálogo público (`/catalogo`) e as vitrines da Home ainda mostram produtos de mock, embora a API já entregue a listagem paginada com filtros (`GET /produtos`) e o banco de desenvolvimento tenha produtos reais com foto. O cliente do catálogo envia parâmetros que a API não conhece (`categoria`, `subcategoria`, `name`) e espera `{ items, meta }`. Como a API responde `{ data, pagination }`, a validação falha sempre, e a tela cai no fallback em memória `MOCK_CATALOG_PRODUCTS`. O usuário vê dados falsos, e os filtros não refletem o que existe no banco.

## What Changes

- **`src/api/catalogo.ts`**: `buscarProdutos` passa a chamar `GET /produtos` com o contrato da collection Bruno (`page`, `limit`, `search`, `categoryId`, `subtypeId`, `availabilityType`, `minPrice`, `maxPrice`) e devolve o envelope `Paginated<ProductListItemDto>`. O fallback de mock é removido.
- **Novo composable `useCatalogoProdutos`**:
  - Resolve o slug da categoria e o nome ou slug do subtipo da URL em `categoryId`/`subtypeId`, pelo store de categorias.
  - Traduz os filtros da tela para o contrato da API.
  - Converte `ProductListItemDto` no `CatalogProductItem` usado pelo card. A foto vem de `toApiAssetUrl(thumbnailUrl)`.
  - Expõe `loading` e `error`.
- **Barra lateral de filtros**:
  - Categorias e subcategorias vêm de `GET /categorias`.
  - **BREAKING (UI)**: saem os filtros de Material, Cor e Marca, que a API não suporta.
  - Ficam Categoria, Subcategoria, Disponibilidade e Faixa de preço.
- **BREAKING (UI)**: sai o dropdown de ordenação (`?ordem=`), porque a API não tem parâmetro de ordenação.
- **BREAKING (rota)**: `/catalogo/:slug` passa a ser `/catalogo/:id`. O card navega pelo UUID, que é a única chave aceita por `GET /produtos/:id`.
- **Tela do catálogo**: estado de erro com "Tentar novamente". Ao atualizar filtros na URL, os parâmetros que não são filtro (ex.: `?lista=`) são preservados.
- **Home**: "Destaques" e "Recomendados" passam a usar `GET /produtos` no lugar de arrays fixos.
- **Remoção**: o arquivo `src/mocks/catalogo.ts` e o componente `CatalogoOrdenacaoDropdown.vue` são apagados.

## Capabilities

### New Capabilities

_Nenhuma._

### Modified Capabilities

- `catalogo-busca-produtos`:
  - O catálogo passa a consumir a API real, sem fallback mockado.
  - Os filtros ficam restritos aos que a API suporta.
  - A ordenação é removida.
  - O card navega por id.
  - A busca da navbar usa `?name=`.
- `home-main-layout`: as vitrines de produtos da Home passam a ser alimentadas pela API de produtos.

## Impact

- **Frontend**:
  - `src/api/catalogo.ts`, `src/types/catalogo.ts`, `src/composables/useCatalogoProdutos.ts` (novo).
  - `src/views/catalogo/CatalogoView.vue`, `src/components/catalogo/CatalogoFiltroLateral.vue`, `src/components/catalogo/CatalogoProdutoCard.vue`.
  - `src/router/index.ts` e um ajuste mínimo em `src/views/catalogo/CatalogoProdutoDetalheView.vue` (lê `:id`).
  - `src/views/HomeView.vue`.
  - Remoções: `src/mocks/catalogo.ts` e `src/components/catalogo/CatalogoOrdenacaoDropdown.vue`.
- **API**: nenhuma mudança. Usa rotas existentes da collection Bruno (`Products/List Products`, `Categories/List Categories`, `Uploads`).
- **Fora do escopo**:
  - A tela de detalhe do produto continua lendo campos que a API não devolve e terá mudança própria.
  - Ordenação e filtro por cor/acabamento na API ficam como follow-up `[BE]`.
- **Docs**: `docs/frontend/README.md` e o critério de disponibilidade nos cards da US-FE-09 em `docs/planning/user-stories-backlog.md`.
