## ADDED Requirements

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
The global navigation bar (`AppNavbar.vue`) MUST redirect textual searches and category navigation to the catalog page `/catalogo`, passing the corresponding query parameters in the URL.

#### Scenario: Usuário digita na busca da navbar e pressiona enter
- **WHEN** o usuário digita "Roupeiro" no campo de busca da navbar e submete o formulário
- **THEN** o sistema redireciona para `/catalogo?q=Roupeiro` e a página carrega exibindo o termo pesquisado

#### Scenario: Usuário clica em uma categoria na sub-navbar
- **WHEN** o usuário clica em "Quarto" na barra secundária de navegação
- **THEN** o sistema navega para `/catalogo?categoria=quarto` com o filtro de categoria selecionado

---

### Requirement: Barra Lateral de Filtros Reativa
The catalog page MUST display a structured reactive filter sidebar segmented by Category, Subcategory, Material, Color/Finish, Brand, and Price Range, conforming to Figma node `96:6513`.

#### Scenario: Seleção e remoção de chips de categoria e subcategoria
- **WHEN** o usuário clica no chip "Quarto" e depois no chip "Roupeiros"
- **THEN** o sistema marca ambos os chips como selecionados com estilo visual destacado e botão de fechar `✕`
- **WHEN** o usuário clica no botão `✕` do chip "Roupeiros"
- **THEN** o sistema desmarca a subcategoria mantendo os demais filtros ativos

#### Scenario: Filtragem por material e marca via checkboxes
- **WHEN** o usuário marca os checkboxes "MDF" e "DJ Móveis"
- **THEN** o estado reativo de filtros inclui os valores selecionados

#### Scenario: Seleção de cores e faixa de preço
- **WHEN** o usuário clica em um swatch circular de cor ou informa valores numéricos nos campos "De" e "Até"
- **THEN** o sistema atualiza o estado de acabamento e limites de preço

#### Scenario: Limpar todos os filtros
- **WHEN** o usuário clica no botão "Limpar filtros"
- **THEN** o sistema redefine todas as seleções para o estado inicial padrão

---

### Requirement: Grid de Produtos e Card com Indicador de Acabamentos
The catalog MUST render products in a responsive grid using cards conforming to Figma `#12:2374` with 1:1 image, finishes badge, furniture name, price in highlight, and installment condition.

#### Scenario: Exibição correta do card de produto
- **WHEN** o grid renderiza um produto com múltiplas variações de acabamento
- **THEN** o card exibe a imagem principal com cantos superiores arredondados, a pílula de acabamentos com círculos de cor no canto inferior direito da foto, o nome do móvel, o preço formatado em reais com centavos menores e a legenda "Até 10x no cartão"

---

### Requirement: Ordenação e Resumo dos Resultados
The catalog page MUST present a search results summary ("Exibindo resultados para ...") and a sort order dropdown selector.

#### Scenario: Alteração da ordem de exibição
- **WHEN** o usuário altera a ordenação de "Relevância" para "Menor Preço"
- **THEN** o sistema atualiza o critério de ordenação no estado reativo do catálogo

---

### Requirement: Desacoplamento para Parâmetros GET e Paginação Futura
The system MUST decouple component data structures using TypeScript contracts (`CatalogFilterParams`, `CatalogProductItem`, `CatalogPaginationMeta`, `CatalogResponse`) and dispatch GET requests with query parameters without client-side in-memory filtering.

#### Scenario: Estrutura preparada para parâmetros GET
- **WHEN** o componente inicializa ou atualiza seus filtros
- **THEN** o estado é estruturado em um formato serializável pronto para query string de requisição `GET` (`q`, `categoria`, `subcategoria`, `material`, `cor`, `marca`, `minPreco`, `maxPreco`, `ordem`, `page`, `limit`)

#### Scenario: Despacho de requisição GET sem filtragem em memória no cliente
- **WHEN** o usuário seleciona ou altera qualquer filtro no catálogo
- **THEN** a view despacha a requisição `GET` com os parâmetros serializados via cliente de API, sem executar filtragem ou ordenação em memória via `computed`, renderizando os produtos recebidos e utilizando fallback estático mockado para desenvolvimento

#### Scenario: Navegação de paginação modular
- **WHEN** o componente de paginação recebe a página atual e o total de páginas
- **THEN** ele emite eventos de troca de página permitindo atualizar a listagem

---

### Requirement: Conformidade com Design System e Componente UiButton
All interactive action buttons in the filter sidebar, pagination, and catalog header MUST use the global `<UiButton>` component in semantic theme variants without raw `<button>` tags.

#### Scenario: Renderização de botões de ação com UiButton
- **WHEN** a barra lateral de filtros renderiza as ações "Filtrar" e "Limpar filtros"
- **THEN** os elementos utilizam `<UiButton variant="primary">` e `<UiButton variant="outline">` respectivamente

