## Context

`CatalogoView.vue` chama `catalogoApi.buscarProdutos()`, que hoje envia os filtros da tela como estão (`categoria`, `subcategoria`, `name`, `materiais`, `cores`, `marcas`, `ordem`) e só aceita uma resposta com `items`. A API (`GET /produtos`, collection Bruno `Products/List Products`) aceita outros parâmetros:

- `page`, `limit` e `search`
- `categoryId`, `subtypeId` e `supplierId` (UUIDs)
- `availabilityType` (`IN_STOCK` | `ON_DEMAND`)
- `minPrice` e `maxPrice`

Ela devolve `{ data, pagination }`. Os itens trazem `referencePrice`, `maxInstallments`, `availabilityType`, `estimatedDays` e `thumbnailUrl`, um caminho relativo `/api/v1/uploads/...` ou `null`. A lista não traz variações.

A URL pública do catálogo já é um contrato usado pela navbar e pela Home:

- `?categoria=<slug>`
- `?subcategoria=<nome do subtipo>`
- `?name=<termo>`

A navbar e a Home leem as categorias de `useCategoriasStore` (`src/stores/categorias.ts`), que carrega `GET /categorias` com os subtipos aninhados uma vez por sessão.

## Goals / Non-Goals

**Goals:**

- O catálogo e as vitrines da Home mostram somente produtos vindos da API, com foto real.
- Os filtros de categoria, subcategoria, disponibilidade, faixa de preço e busca funcionam combinados (RF05). A paginação vem do servidor (RNF11).
- Os links já existentes (`?categoria=`, `?subcategoria=`, `?name=`) continuam funcionando.
- O mock do catálogo é apagado.

**Non-Goals:**

- A tela de detalhe do produto (`CatalogoProdutoDetalheView`). Ela recebe só o ajuste de ler `:id`; o resto fica para uma mudança `[FE]` própria.
- Ordenação, filtro por material, cor ou acabamento e filtro por marca/fornecedor na tela. Não existem na API pública e ficam como follow-up `[BE]`.
- Mudanças na API ou na collection Bruno.

## Decisions

### 1. Resolver slug/nome em id no frontend, pelo store de categorias

**Decisão:**
- O composable carrega `useCategoriasStore().carregar()` e acha a categoria com `encontrarCategoria(lista, slug)`.
- Acha o subtipo em `categoria.subtypes` comparando slug ou nome, sem diferenciar maiúsculas nem acentos, via `slugify`.
- Envia `categoryId` e `subtypeId` à API.
- Se a categoria da URL não existir, a lista vem vazia e a tela mostra o estado vazio. A requisição não é feita sem o filtro.

**Justificativa:**
- A API só filtra por UUID.
- O store já é a fonte das categorias da navbar, então não há requisição extra.
- Manter slug e nome na URL preserva os links da navbar e da Home e deixa a URL legível.

**Alternativa descartada:** colocar UUIDs na URL. Isso quebraria os links atuais e deixaria a URL ilegível.

### 2. Card continua com `CatalogProductItem`; o mapeamento fica no composable

**Decisão:** `ProductListItemDto → CatalogProductItem`, com:

| Campo do card | Origem |
|---|---|
| `price` | `referencePrice` |
| `installments` | `"Até {maxInstallments}x no cartão"` |
| `image` | `toApiAssetUrl(thumbnailUrl)` |
| `availability` e `estimatedDays` | direto |
| `category` e `subcategory` | nomes vindos do store |
| `finishes` | `[]` |

A camada `src/api/` devolve o envelope da API sem transformar, como manda o `frontend/agents.md` §4.

**Justificativa:**
- O card, a Home e o salvar em lista já usam esse tipo.
- Mapear em um só lugar evita duplicar a regra na Home.
- A pílula de acabamentos some sozinha com a lista vazia.

### 3. Disponibilidade com duas opções vira um parâmetro opcional

**Decisão:** os dois checkboxes continuam na tela.
- Com exatamente um marcado, envia `availabilityType`.
- Com nenhum ou os dois, não envia filtro.

**Justificativa:** a API aceita um valor só. Os dois marcados equivalem a "todos".

### 4. Remover filtros e ordenação sem suporte, em vez de simular no cliente

**Decisão:** saem da tela e da URL `materiais`, `cores`, `marcas` e `ordem`. O componente `CatalogoOrdenacaoDropdown.vue` é apagado.

**Justificativa:**
- Filtrar ou ordenar só a página atual no cliente daria resultados errados com paginação no servidor.
- O spec antigo já proibia filtragem em memória.

### 5. Rota de detalhe por id

**Decisão:**
- `/catalogo/:slug` vira `/catalogo/:id`, e o card navega com `product.id`.
- A view de detalhe lê `route.params.id` e perde o default `"p-1"`.
- O `router.push` duplicado no `@click` do grid é removido, porque o card já navega sozinho.

**Justificativa:**
- `GET /produtos/:id` aceita só UUID.
- O `ListaCompartilhadaModal` já monta links com o UUID.

### 6. Home usa uma única chamada

**Decisão:** `buscarProdutos({ page: 1, limit: 8 })` alimenta as duas vitrines: os itens 1–4 vão para Destaques e os 5–8 para Recomendados. Durante a carga, a Home mostra skeletons. Com lista vazia ou erro, a seção é escondida.

**Justificativa:**
- Não há endpoint de destaques.
- Uma chamada com 8 itens evita repetir produtos e duplicar requisições.

### 7. Preservar parâmetros que não são filtro

**Decisão:** `updateRouteQuery` parte da query atual e só substitui as chaves de filtro.

**Justificativa:** `?lista=` (lista compartilhada aberta pelo `App.vue`) era descartado ao filtrar.

## Risks / Trade-offs

- **[A Home mostra sempre os mesmos 8 produtos (ordem padrão da API)]** → aceitável até existir um critério de destaque no back.
- **[O filtro de categoria depende do store carregar antes da busca]** → o composable aguarda `carregar()`, que é compartilhado e cacheado. Se o store falhar e a URL tiver categoria ou subcategoria, a tela mostra o estado de erro com "Tentar novamente". Sem esses filtros, a busca segue normalmente.
- **[A tela de detalhe continua incompleta com produtos reais]** → já registrado como próxima mudança `[FE]`. O critério "clicar no card abre o detalhe" da US-FE-09 continua em aberto.
- **[Faixa de preço fixa de 0 a 10.000]** → cobre os produtos atuais. Um limite dinâmico depende de agregação na API (follow-up).
