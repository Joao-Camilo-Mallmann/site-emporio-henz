## ADDED Requirements

### Requirement: Rota Pública e Acesso Livre ao Catálogo
O sistema DEVE disponibilizar a rota `/catalogo` como rota pública no Vue Router, acessível por qualquer visitante sem necessidade de autenticação, cookie de sessão ou login prévio.

#### Scenario: Visitante anônimo acessa o catálogo diretamente
- **WHEN** um visitante sem login navega para `/catalogo`
- **THEN** o sistema exibe a página do catálogo sem redirecionar para a tela de login

#### Scenario: Usuário autenticado acessa o catálogo
- **WHEN** um cliente ou vendedor logado navega para `/catalogo`
- **THEN** o sistema exibe o catálogo preservando a sessão e a navbar do usuário

---

### Requirement: Integração com a Busca e Categorias da Navbar
A barra de navegação global (`AppNavbar.vue`) DEVE direcionar as pesquisas textuais e os cliques em categorias para a página de catálogo `/catalogo`, passando os parâmetros apropriados na URL.

#### Scenario: Usuário digita na busca da navbar e pressiona enter
- **WHEN** o usuário digita "Roupeiro" no campo de busca da navbar e submete o formulário
- **THEN** o sistema redireciona para `/catalogo?q=Roupeiro` e a página carrega exibindo o termo pesquisado

#### Scenario: Usuário clica em uma categoria na sub-navbar
- **WHEN** o usuário clica em "Quarto" na barra secundária de navegação
- **THEN** o sistema navega para `/catalogo?categoria=quarto` com o filtro de categoria selecionado

---

### Requirement: Barra Lateral de Filtros Reativa
A tela de catálogo DEVE exibir uma barra lateral de filtros estruturada e segmentada por: Categoria, Subcategoria, Material, Cor/Acabamento, Marca e Faixa de Preço, conforme especificado no Figma nó `96:6513`.

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
O catálogo DEVE renderizar os produtos em um grid responsivo (3 colunas em desktop), utilizando cards fiéis ao Figma (`#12:2374`) com foto 1:1, badge de acabamentos/cores sobreposta, nome do móvel, preço em destaque e condição de parcelamento.

#### Scenario: Exibição correta do card de produto
- **WHEN** o grid renderiza um produto com múltiplas variações de acabamento
- **THEN** o card exibe a imagem principal com cantos superiores arredondados, a pílula de acabamentos com círculos de cor no canto inferior direito da foto, o nome do móvel, o preço formatado em reais com centavos menores e a legenda "Até 10x no cartão"

---

### Requirement: Ordenação e Resumo dos Resultados
A tela de catálogo DEVE apresentar o resumo da consulta atual ("Exibindo resultados para ...") e um dropdown seletor de ordenação.

#### Scenario: Alteração da ordem de exibição
- **WHEN** o usuário altera a ordenação de "Relevância" para "Menor Preço"
- **THEN** o sistema atualiza o critério de ordenação no estado reativo do catálogo

---

### Requirement: Desacoplamento para Parâmetros GET e Paginação Futura
O componente e as estruturas de dados DEVEM ser desacoplados através de tipos e contratos TypeScript (`CatalogFilterParams`, `CatalogProductItem`, `CatalogPaginationMeta`), permitindo a injeção de parâmetros de consulta `GET` e paginação sem acoplamento a regras duras de backend no estado inicial.

#### Scenario: Estrutura preparada para parâmetros GET
- **WHEN** o componente inicializa ou atualiza seus filtros
- **THEN** o estado é estruturado em um formato serializável pronto para query string de requisição `GET` (`q`, `categoria`, `subcategoria`, `material`, `cor`, `marca`, `minPreco`, `maxPreco`, `ordem`, `page`, `limit`)

#### Scenario: Navegação de paginação modular
- **WHEN** o componente de paginação recebe a página atual e o total de páginas
- **THEN** ele emite eventos de troca de página permitindo atualizar a listagem

---

### Requirement: Conformidade com Design System e Componente UiButton
Todos os botões de ação na barra de filtros, paginação e cabeçalho do catálogo DEVEM utilizar o componente global `<UiButton>` nas variantes semânticas do tema Tailwind (`style.css`), sendo vedado o uso de tags `<button>` nativas soltas.

#### Scenario: Renderização de botões de ação com UiButton
- **WHEN** a barra lateral de filtros renderiza as ações "Filtrar" e "Limpar filtros"
- **THEN** os elementos utilizam `<UiButton variant="primary">` e `<UiButton variant="outline">` respectivamente
