# Catálogo e Busca de Produtos

## Purpose

Fornecer a experiência de catálogo de produtos, navegação por categorias e busca avançada no frontend da Empório Henz, com suporte a filtros facetados (categorias, materiais, cores/acabamentos, marcas e faixa de preço), ordenação, grid responsivo de produtos com indicadores visuais de acabamentos e paginação desacoplada com parâmetros GET.
## Requirements
### Requirement: Rota Pública e Acesso Livre ao Catálogo
The system MUST provide the public route `/catalogo` in Vue Router, accessible by any visitor without requiring authentication, session cookies, or prior login.

#### Scenario: Visitante anônimo acessa o catálogo diretamente
- **WHEN** um visitante sem login navega para `/catalogo`
- **THEN** o sistema exibe a página do catálogo sem redirecionar para a tela de login

#### Scenario: Usuário autenticado acessa o catálogo
- **WHEN** um cliente ou vendedor logado navega para `/catalogo`
- **THEN** o sistema exibe o catálogo preservando a sessão e a navbar do usuário

---

### Requirement: Integração com a Busca e Categorias da Navbar
The global navigation bar (`AppNavbar.vue`) MUST redirect textual searches and category navigation to the catalog page `/catalogo`, passing the corresponding query parameters in the URL. The search term MUST be sent in the URL as typed, only trimmed and with repeated whitespace collapsed, and the catalog API layer MUST send it to the backend normalized as a slug (no accents, lowercase, every run of non-alphanumeric characters reduced to a single hyphen, no leading or trailing hyphen) in the `search` parameter. The mocked fallback MUST filter products with the same normalization on both sides.

#### Scenario: Usuário digita na busca da navbar e pressiona enter
- **WHEN** o usuário digita "Roupeiro" no campo de busca da navbar e submete o formulário
- **THEN** o sistema redireciona para `/catalogo?name=Roupeiro` e a página carrega exibindo o termo pesquisado

#### Scenario: Termo com acento, caixa alta e underline
- **WHEN** o usuário digita "ROUPEIRO_ROMÃ" na busca da navbar e submete o formulário
- **THEN** o resumo da página mostra “ROUPEIRO_ROMÃ”, a API recebe `search=roupeiro-roma` e o produto "Roupeiro Roma" aparece nos resultados

#### Scenario: Usuário clica em uma categoria na sub-navbar
- **WHEN** o usuário clica em "Quarto" na barra secundária de navegação
- **THEN** o sistema navega para `/catalogo?categoria=quarto` com o filtro de categoria selecionado

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

### Requirement: Grid de Produtos e Card com Indicador de Acabamentos
The catalog MUST render products in a responsive grid using cards conforming to Figma `#12:2374` com 1:1 image, finishes badge, furniture name, price in highlight, installment condition, and clicking the card MUST navigate to the product detail view `/produtos/:id`.

#### Scenario: Exibição correta do card de produto
- **WHEN** o grid renderiza um produto com múltiplas variações de acabamento
- **THEN** o card exibe a imagem principal com cantos superiores arredondados, a pílula de acabamentos com círculos de cor no canto inferior direito da foto, o nome do móvel, o preço formatado em reais com centavos menores e a legenda "Até 10x no cartão"

#### Scenario: Clique no card redireciona para a página de detalhes
- **WHEN** o usuário clica sobre qualquer área interativa do card de produto no catálogo
- **THEN** a aplicação navega para a rota `/produtos/:id` correspondente ao produto selecionado

---

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

### Requirement: Conformidade com Design System e Componente UiButton
All interactive action buttons in the filter sidebar, pagination, and catalog header MUST use the global `<UiButton>` component in semantic theme variants without raw `<button>` tags.

#### Scenario: Renderização de botões de ação com UiButton
- **WHEN** a barra lateral de filtros renderiza as ações "Filtrar" e "Limpar filtros"
- **THEN** os elementos utilizam `<UiButton variant="primary">` e `<UiButton variant="outline">` respectivamente

