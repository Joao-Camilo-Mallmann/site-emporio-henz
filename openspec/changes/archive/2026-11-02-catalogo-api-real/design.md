## Context

`CatalogoView.vue` guarda os filtros em `CatalogFilterParams` (nomes em português, pensados para a URL legível: `?categoria=quarto&subcategoria=roupeiros&page=2`), sincroniza esse estado com `route.query` e chama `catalogoApi.buscarProdutos(filters)`. A camada de API repassa o objeto quase inteiro a `GET /produtos` e espera `{ items, meta }`. A API pública (`backend`, contrato em `Products/List Products.bru`) lê `search`, `categoryId`, `subtypeId`, `supplierId`, `availabilityType`, `minPrice`, `maxPrice`, `page`, `limit` e responde `{ data: ProductListItemDto[], pagination }`, com `thumbnailUrl` relativo (`/api/v1/uploads/...`) e sem `variations` nem `images`. `GET /categorias` (público) devolve as categorias ativas com `subtypes` ativos, cada um com `slug`.

O painel administrativo já consome esse contrato (`produtosApi.listarAdmin`, `ProductListItemDto`, `toApiAssetUrl`). A `AppNavbar.vue` manda `?categoria=<slug>` e `?subcategoria=<nome>` de uma lista fixa, e está sendo editada por outra tarefa: não entra nesta mudança.

## Goals / Non-Goals

**Goals:**

- Mostrar no `/catalogo` os produtos ativos cadastrados pela API, com paginação real e `?page=` na URL.
- Manter a URL do catálogo com slugs legíveis e traduzir para ids só na camada de API.
- Fallback mockado apenas quando a API não responde; erro da API vira estado de erro visível.
- Não oferecer na interface filtro que a API não aplica.

**Non-Goals:**

- Novos filtros na API (material, cor/acabamento, fornecedor por nome, ordenação): história `[BE]` separada.
- Acabamentos no card da listagem: a API não traz variações na listagem; o card continua sem a pílula até a API incluí-las.
- Página de detalhe (`produtosApi.buscarPorId`), Home e menu de categorias da navbar.

## Decisions

### 1. Tradução slug → id na camada de API, com cache de categorias

`catalogoApi` expõe `carregarCategorias()`, que chama `categoriasApi.listar({ limit: 100 })` uma vez e guarda a promessa em módulo (em caso de falha a promessa é descartada, para a próxima chamada tentar de novo). `buscarProdutos` usa essa lista para achar a categoria cujo `slug` é igual a `slugify(categoria)` e, dentro dela, o subtipo cujo `slug` é igual a `slugify(subcategoria)`. O `slugify` dos dois lados aceita tanto o slug (`roupeiros`) quanto o nome que a navbar envia hoje (`Roupeiros`).

- Slug de categoria ou subcategoria sem correspondência: a camada devolve uma página vazia (`total: 0`) sem chamar `GET /produtos`. Omitir o filtro mostraria o catálogo inteiro para uma categoria que não existe.
- Sem categoria selecionada, `subcategoria` é procurada em todos os subtipos ativos.
- A barra lateral e o resumo da view usam a mesma lista, então a interface e a tradução nunca divergem.

Alternativa descartada: trocar a URL para `?categoryId=<uuid>`. Quebraria os links da navbar e os links compartilhados, e a URL deixaria de ser legível.

### 2. Disponibilidade: uma opção filtra, duas não filtram

A API aceita um único `availabilityType`. A interface mantém os dois checkboxes ("Pronta Entrega", "Sob Encomenda"); com exatamente um marcado o valor vai em `availabilityType`; com nenhum ou os dois marcados o parâmetro é omitido, porque as duas opções juntas cobrem todos os produtos.

### 3. Envelope e item no padrão do frontend

`CatalogResponse = Paginated<CatalogProductItem>` e `CatalogFilterParams extends PaginationParams`, como as demais listagens. `CatalogPaginationMeta` sai. A view lê `response.data` e `response.pagination` e mantém `currentPage` e `totalPages` (com `totalPages || 1`).

Conversão `ProductListItemDto → CatalogProductItem` (`toCatalogProductItem`, em `api/catalogo.ts`):

| Campo do card | Origem |
| --- | --- |
| `price` | `referencePrice` |
| `installments` | `"Até Nx no cartão"` com `maxInstallments`; `"À vista"` quando `maxInstallments <= 1` |
| `image` | `toApiAssetUrl(thumbnailUrl)`; vazio sem foto (o card mostra o placeholder) |
| `category` / `subcategory` | slug da categoria e nome do subtipo, resolvidos pela lista de categorias (id truncado como reserva) |
| `material` | `mainMaterial` |
| `availability` / `estimatedDays` | `availabilityType`; `estimatedDays` só em `ON_DEMAND` |
| `finishes` | `[]` (a listagem não traz variações) |

### 4. Fallback mockado só com a API fora

`buscarProdutos` trata o erro do axios: sem `error.response` (rede, timeout, API parada) → filtra `MOCK_CATALOG_PRODUCTS` com `filtrarCatalogoMock(params)` (em `mocks/catalogo.ts`, mesmos filtros: categoria, subcategoria, disponibilidade, faixa de preço, `search` em slug, paginação). Com `error.response` (4xx/5xx) → rejeita, e a view mostra o estado de erro com "Tentar de novo". Antes, qualquer falha ou resposta fora do formato caía no mock, o que escondia a integração quebrada.

### 5. Filtros sem suporte saem da interface

Material, cor, marca e ordenação são removidos de `CatalogFilterParams`, da barra lateral, da URL e da view. Manter um checkbox que a API ignora faria o cliente marcar "MDF" e ver a lista não mudar. `CatalogoOrdenacaoDropdown.vue` e `CatalogSortOption` são apagados (sem código morto); a linha correspondente em `components.d.ts` sai junto. A história `[BE]` registrada no backlog devolve esses filtros quando a API os aplicar.

### 6. Barra lateral com categorias reais

`CatalogoFiltroLateral.vue` carrega `carregarCategorias()` no `onMounted`, mostra chips de categoria com `name`/`slug` reais e, com uma categoria selecionada, os subtipos dela (`name`/`slug`). Sem categoria selecionada a seção de subcategoria não aparece. Sem categorias (API fora) a seção some e o restante dos filtros continua funcionando. O arquivo cai para a faixa de 150–500 linhas.

## Risks / Trade-offs

- [Lista de categorias limitada a 100 por página] → o catálogo tem seis categorias; `limit: 100` cobre com folga e, se passar disso, a tradução ignora as demais até o limite ser revisto.
- [A navbar manda `subcategoria` como nome] → `slugify(nome)` coincide com o slug gerado pela API para os subtipos atuais; nomes com slug customizado ficam para a tarefa que troca a navbar para a API.
- [Fallback mockado some em erros 4xx/5xx] → o cliente vê a mensagem de erro em vez de móveis falsos, que é o comportamento desejado para produção.
- [Remoção visual de material, cor, marca e ordenação] → divergência temporária com o Figma até a história `[BE]`; registrada no backlog.

## Migration Plan

Só frontend: subir o build novo. Sem migração de dados nem mudança de API. Rollback é voltar o commit.

## Open Questions

Nenhuma.
