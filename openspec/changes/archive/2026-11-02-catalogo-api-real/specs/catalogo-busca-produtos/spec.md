## MODIFIED Requirements

### Requirement: Barra Lateral de Filtros Reativa
The catalog page MUST display a structured reactive filter sidebar segmented by Category, Subcategory, Availability and Price Range. Category and subcategory chips MUST come from the public `GET /categorias` list (active categories with their active subtypes, by real `name` and `slug`). Filters the public API does not apply (material, color/finish, brand, sort order) MUST NOT be offered until the API supports them.

#### Scenario: Chips de categoria vindos da API
- **WHEN** a barra lateral é montada e `GET /categorias` responde com as categorias ativas
- **THEN** o sistema exibe um chip por categoria com o nome real e, ao selecionar um chip, exibe os subtipos dessa categoria como chips de subcategoria

#### Scenario: Seleção e remoção de chips de categoria e subcategoria
- **WHEN** o usuário clica no chip "Quarto" e depois no chip "Roupeiros"
- **THEN** o sistema marca ambos os chips como selecionados com estilo visual destacado e botão de fechar `✕`, e a URL passa a ter `?categoria=quarto&subcategoria=roupeiros`
- **WHEN** o usuário clica no botão `✕` do chip "Roupeiros"
- **THEN** o sistema desmarca a subcategoria mantendo os demais filtros ativos

#### Scenario: Sem categoria selecionada
- **WHEN** nenhuma categoria está selecionada
- **THEN** a seção de subcategoria não é exibida

#### Scenario: Filtro de disponibilidade
- **WHEN** o usuário marca apenas "Pronta Entrega" ou apenas "Sob Encomenda"
- **THEN** o estado reativo de filtros inclui o valor marcado e a requisição envia `availabilityType` correspondente
- **WHEN** o usuário marca as duas opções ou nenhuma
- **THEN** a requisição não envia `availabilityType`

#### Scenario: Faixa de preço
- **WHEN** o usuário move os controles de preço mínimo e máximo
- **THEN** o sistema atualiza `minPreco` e `maxPreco` no estado e a requisição envia `minPrice` e `maxPrice`

#### Scenario: Filtragem por material e marca via checkboxes
- **WHEN** a barra lateral é exibida enquanto a API pública não filtra por material nem por marca
- **THEN** o sistema não exibe os checkboxes de material e de marca, e a URL e a requisição não levam esses filtros

#### Scenario: Seleção de cores e faixa de preço
- **WHEN** a barra lateral é exibida enquanto a API pública não filtra por cor ou acabamento
- **THEN** o sistema não exibe os swatches de cor e mantém apenas a faixa de preço, enviada como `minPrice` e `maxPrice`

#### Scenario: Limpar todos os filtros
- **WHEN** o usuário clica no botão "Limpar filtros"
- **THEN** o sistema redefine todas as seleções para o estado inicial padrão e volta para `/catalogo` sem parâmetros

### Requirement: Ordenação e Resumo dos Resultados
The catalog page MUST present a results summary: the searched term ("Exibindo resultados para …"), or the selected subcategory/category name resolved from the `GET /categorias` list, or "Todos os móveis do catálogo". A sort order selector MUST NOT be offered while the public API has no sort parameter.

#### Scenario: Resumo por categoria selecionada
- **WHEN** a URL contém `?categoria=sala-de-estar`
- **THEN** o resumo exibe "Exibindo móveis para Sala de Estar", com o nome real da categoria

#### Scenario: Resumo por termo pesquisado
- **WHEN** a URL contém `?name=Roupeiro`
- **THEN** o resumo exibe "Exibindo resultados para “Roupeiro”"

#### Scenario: Alteração da ordem de exibição
- **WHEN** a página do catálogo é exibida enquanto a API pública não aceita parâmetro de ordenação
- **THEN** o sistema não exibe o seletor de ordenação e a URL e a requisição não levam critério de ordem

### Requirement: Desacoplamento para Parâmetros GET e Paginação Futura
The system MUST decouple component data structures using TypeScript contracts (`CatalogFilterParams`, `CatalogProductItem`, `CatalogResponse = Paginated<CatalogProductItem>`) and dispatch `GET /api/v1/produtos` with the query parameters of the Bruno collection, without client-side in-memory filtering. The API layer MUST translate the URL filters (`categoria`, `subcategoria` by slug; `disponibilidade`; `minPreco`/`maxPreco`; `name`) into `categoryId`, `subtypeId`, `availabilityType`, `minPrice`, `maxPrice` and `search`, convert the `{ data, pagination }` envelope and each `ProductListItemDto` into `CatalogProductItem`, and use the mocked fallback only when the API gives no HTTP response.

#### Scenario: Estrutura preparada para parâmetros GET
- **WHEN** o componente inicializa ou atualiza seus filtros
- **THEN** o estado é estruturado em um formato serializável pronto para query string (`name`, `categoria`, `subcategoria`, `disponibilidade`, `minPreco`, `maxPreco`, `page`, `limit`), sem `material`, `cor`, `marca` nem `ordem` enquanto a API não os aplicar

#### Scenario: Despacho de requisição GET sem filtragem em memória no cliente
- **WHEN** o usuário seleciona ou altera qualquer filtro no catálogo
- **THEN** a view despacha a busca pela camada de API, sem filtrar nem ordenar em memória via `computed`, e renderiza os produtos recebidos; o filtro em memória do mock só ocorre no fallback sem resposta da API

#### Scenario: Navegação de paginação modular
- **WHEN** o `UiPagination` recebe a página atual e o total de páginas de `pagination`
- **THEN** ele emite `update:page` e a view atualiza a listagem com a página escolhida

#### Scenario: Tradução dos filtros da URL para o contrato da API
- **WHEN** a view despacha a busca com `categoria=quarto`, `subcategoria=roupeiros`, `disponibilidade=[IN_STOCK]`, `minPreco=1000`, `maxPreco=5000`, `name=Roupeiro Roma` e `page=2`
- **THEN** a camada de API chama `GET /produtos` com `categoryId` e `subtypeId` resolvidos pelos slugs em `GET /categorias`, `availabilityType=IN_STOCK`, `minPrice=1000`, `maxPrice=5000`, `search=roupeiro-roma`, `page=2` e `limit=9`

#### Scenario: Slug de categoria desconhecido
- **WHEN** a URL contém `?categoria=inexistente`
- **THEN** a camada de API devolve uma página vazia sem chamar `GET /produtos` e a tela mostra "Nenhum móvel encontrado"

#### Scenario: Conversão do envelope e dos itens
- **WHEN** a API responde `{ data, pagination }` com itens `ProductListItemDto`
- **THEN** a camada de API devolve `Paginated<CatalogProductItem>` com `price` igual a `referencePrice`, `installments` derivado de `maxInstallments`, `image` igual a `thumbnailUrl` prefixado com a origem da API (vazio sem foto), `availability` igual a `availabilityType` e `estimatedDays` só em `ON_DEMAND`

#### Scenario: API fora do ar
- **WHEN** a requisição não recebe resposta HTTP (rede, timeout ou API parada)
- **THEN** a camada de API filtra e pagina `MOCK_CATALOG_PRODUCTS` com os mesmos filtros e devolve o mesmo envelope

#### Scenario: Erro respondido pela API
- **WHEN** a API responde com status de erro (4xx ou 5xx)
- **THEN** a camada de API rejeita a promessa e a tela mostra o estado de erro com o botão "Tentar de novo", sem produtos mockados

#### Scenario: Paginação sincronizada com a URL
- **WHEN** o usuário escolhe outra página no `UiPagination`
- **THEN** a URL recebe `?page=N` (omitido na página 1), a view busca a página escolhida e rola para o topo
