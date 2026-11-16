# Catálogo e Busca de Produtos

## Purpose

Fornecer a experiência de catálogo de produtos, navegação por categorias e busca no frontend da Empório Henz, alimentada pela API (`GET /produtos` e `GET /categorias`), com filtros de categoria, subcategoria, disponibilidade e faixa de preço, grid responsivo de produtos e paginação no servidor sincronizada com os parâmetros da URL.

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
The global navigation bar (`AppNavbar.vue`) MUST redirect textual searches and category navigation to the catalog page `/catalogo`, passing the corresponding query parameters in the URL. The catalog MUST accept `name` (and the legacy `q`) as the search term, `categoria` as the category slug and `subcategoria` as the subtype name or slug.

#### Scenario: Usuário digita na busca da navbar e pressiona enter
- **WHEN** o usuário digita "Roupeiro" no campo de busca da navbar e submete o formulário
- **THEN** o sistema redireciona para `/catalogo?name=Roupeiro` e a página carrega exibindo o termo pesquisado e os produtos retornados pela API para `search=Roupeiro`

#### Scenario: Usuário clica em uma categoria na sub-navbar
- **WHEN** o usuário clica em "Quarto" na barra secundária de navegação
- **THEN** o sistema navega para `/catalogo?categoria=quarto` com o filtro de categoria selecionado

#### Scenario: Usuário clica em uma subcategoria na sub-navbar
- **WHEN** o usuário clica em "Sofás" dentro de "Sala de Estar"
- **THEN** o sistema navega para `/catalogo?categoria=sala-de-estar&subcategoria=Sofás` e exibe apenas os produtos daquele subtipo

---

### Requirement: Grid de Produtos e Card com Indicador de Acabamentos
The catalog MUST render products in a responsive grid using cards conforming to Figma `#12:2374` with 1:1 image, availability badge, furniture name, price in highlight and installment condition. The image MUST be the product `thumbnailUrl` resolved against the API base, with a placeholder when it is `null`. Clicking the card MUST navigate to `/catalogo/:id` using the product UUID.

#### Scenario: Exibição correta do card de produto
- **WHEN** o grid renderiza um produto retornado pela API
- **THEN** o card exibe a foto do produto, o selo "Pronta Entrega" ou "Sob Encomenda · N dias", o nome do móvel, o `referencePrice` formatado em reais com centavos menores e a legenda "Até {maxInstallments}x no cartão"

#### Scenario: Produto sem foto
- **WHEN** o produto retornado pela API tem `thumbnailUrl` nulo
- **THEN** o card exibe um placeholder de imagem no lugar da foto

#### Scenario: Clique no card redireciona para a página de detalhes
- **WHEN** o usuário clica sobre qualquer área interativa do card de produto no catálogo
- **THEN** a aplicação navega para a rota `/catalogo/:id` com o UUID do produto selecionado

---

### Requirement: Desacoplamento para Parâmetros GET e Paginação Futura
The catalog MUST load products exclusively from `GET /produtos` with server-side pagination and filters, translating the URL state into the API contract (`page`, `limit`, `search`, `categoryId`, `subtypeId`, `availabilityType`, `minPrice`, `maxPrice`). It MUST NOT filter, sort or paginate in memory and MUST NOT use mocked fallback data.

#### Scenario: Estrutura preparada para parâmetros GET
- **WHEN** a URL é `/catalogo?categoria=quarto&disponibilidade=IN_STOCK&minPreco=1000&page=2`
- **THEN** o sistema resolve o slug `quarto` para o `categoryId` correspondente e requisita `GET /produtos?categoryId=<uuid>&availabilityType=IN_STOCK&minPrice=1000&page=2&limit=9`

#### Scenario: Despacho de requisição GET sem filtragem em memória no cliente
- **WHEN** o usuário seleciona ou altera qualquer filtro no catálogo
- **THEN** a URL é atualizada, a página volta para 1 e a view despacha a requisição `GET /produtos`, renderizando exatamente os itens e a paginação retornados pela API

#### Scenario: Parâmetros que não são filtro são preservados
- **WHEN** a URL contém `?lista=<id>` e o usuário altera um filtro
- **THEN** o parâmetro `lista` permanece na URL

#### Scenario: Categoria inexistente na URL
- **WHEN** a URL traz `categoria` com um slug que não corresponde a nenhuma categoria ativa
- **THEN** o catálogo exibe o estado vazio sem requisitar produtos de outras categorias

#### Scenario: Falha ao carregar produtos
- **WHEN** a requisição `GET /produtos` falha
- **THEN** o catálogo exibe uma mensagem de erro com o botão "Tentar novamente", que repete a requisição

#### Scenario: Navegação de paginação modular
- **WHEN** o componente de paginação recebe a página atual e o total de páginas da API
- **THEN** ele emite eventos de troca de página que atualizam `?page=` e recarregam a listagem

### Requirement: Conformidade com Design System e Componente UiButton
All interactive action buttons in the filter sidebar, pagination, and catalog header MUST use the global `<UiButton>` component in semantic theme variants without raw `<button>` tags.

#### Scenario: Renderização de botões de ação com UiButton
- **WHEN** a barra lateral de filtros renderiza as ações "Filtrar" e "Limpar filtros"
- **THEN** os elementos utilizam `<UiButton variant="primary">` e `<UiButton variant="outline">` respectivamente

### Requirement: Barra Lateral de Filtros Alimentada pela API
The catalog page MUST display a reactive filter sidebar segmented by Category, Subcategory, Availability and Price Range. Categories and subcategories MUST come from the categories API (`GET /categorias`, active records only) and MUST NOT be hardcoded. Filters not supported by the products API (material, color/finish, brand) MUST NOT be shown.

#### Scenario: Seleção e remoção de chips de categoria e subcategoria
- **WHEN** o usuário clica no chip "Quarto" e depois no chip "Roupeiros"
- **THEN** o sistema marca ambos os chips como selecionados com estilo visual destacado e botão de fechar `✕`
- **WHEN** o usuário clica no botão `✕` do chip "Roupeiros"
- **THEN** o sistema desmarca a subcategoria mantendo os demais filtros ativos

#### Scenario: Categorias vindas da API
- **WHEN** o administrador cadastra ou desativa uma categoria ou subtipo
- **THEN** a barra lateral passa a refletir apenas as categorias e subtipos ativos retornados por `GET /categorias`

#### Scenario: Filtro de disponibilidade
- **WHEN** o usuário marca apenas "Pronta Entrega"
- **THEN** a requisição envia `availabilityType=IN_STOCK`
- **WHEN** o usuário marca "Pronta Entrega" e "Sob Encomenda"
- **THEN** a requisição não envia `availabilityType`

#### Scenario: Faixa de preço
- **WHEN** o usuário informa valores nos campos "De" e "Até" ou move o slider
- **THEN** a requisição envia `minPrice` e `maxPrice` correspondentes

#### Scenario: Limpar todos os filtros
- **WHEN** o usuário clica no botão "Limpar filtros"
- **THEN** o sistema redefine todas as seleções para o estado inicial padrão

