# Proposta · Tela de Catálogo e Busca de Produtos Pública

## Why

Atualmente, o portal da Empório Henz não possui uma tela pública dedicada para consulta, busca e filtragem do mostruário de móveis. Os visitantes que pesquisam por termos ou clicam em categorias na barra de navegação superior não encontram uma listagem de resultados com filtros facetados. 

Esta mudança implementa a página de catálogo e busca pública conforme o Figma oficial (`node-id=96-6513`), fornecendo uma interface rica, responsiva e componentizada com barra lateral de filtros (categorias, subcategorias, materiais, cores, marcas e faixa de preço) e grid de produtos com indicador de acabamentos, aberta e acessível publicamente sem autenticação, e arquitetada de forma desacoplada para receber parâmetros de consulta `GET` e paginação futura.

## What Changes

- **Rota Pública do Catálogo (`/catalogo`)**: Criação da rota e da view `CatalogoView.vue` aberta a qualquer visitante sem necessidade de login ou token de autenticação.
- **Integração com a Barra de Navegação (`AppNavbar.vue`)**: Redirecionamento da busca principal desktop/mobile e dos links de categoria para a rota `/catalogo` com passagem do parâmetro de busca `q` ou `categoria`.
- **Componentização da Sidebar de Filtros**:
  - `CatalogFilterSidebar.vue`: Contêiner lateral dos filtros com botões de ação estilizados via `<UiButton>`.
  - Filtro de Categorias e Subcategorias com chips clicáveis e botão de desmarcar (`✕`) no chip ativo.
  - Filtro de Materiais com checkboxes (MDF, MDP, Madeira maciça).
  - Filtro de Cores/Acabamentos com swatches circulares e botão "Ver mais".
  - Filtro de Marcas com checkboxes e toggle "Ver mais".
  - Filtro de Faixa de Preço com campos numéricos "De" e "Até".
- **Grid de Produtos e Cards Ricos**:
  - `CatalogProductCard.vue`: Card fiel ao Figma (`#12:2374`) exibindo imagem 1:1, badge de acabamentos/cores sobre a imagem, nome do móvel, preço em destaque (`text-secondary`), parcelamento em até 10x e botão de ação.
- **Barra de Ordenação e Resumo da Busca**:
  - Indicador do termo pesquisado (`Exibindo resultados para "..."`).
  - Dropdown de ordenação com opções: Relevância, Menor Preço, Maior Preço, Mais Recentes.
- **Preparação de Contratos de Dados e Paginação**:
  - Criação de tipos TypeScript estruturados (`CatalogFilterParams`, `CatalogProductItem`, `CatalogPaginationMeta`) desacoplados, prontos para plugar a requisição `GET` da API no futuro.
  - Componente de paginação modular (`CatalogPagination.vue`) preparado para receber página atual e contagem total.

## Capabilities

### New Capabilities
- `catalogo-busca-produtos`: Tela pública de catálogo e busca de produtos, contendo filtros combinados, ordenação, grid de produtos e estrutura preparada para paginação e parâmetros de consulta via requisição GET.

### Modified Capabilities
<!-- Nenhuma especificação anterior de requisito está sendo alterada; trata-se de nova capacidade de catálogo público -->

## Impact

- **Frontend**: Nova rota `/catalogo` registrada em `src/router/index.ts`, novos componentes em `src/components/catalogo/`, tipos em `src/types/catalogo.ts`, atualização do fluxo de busca em `src/components/layout/AppNavbar.vue`.
- **APIs**: Contratos de frontend estruturados em conformidade com o que será exposto na futura API `GET /api/v1/catalogo` (ou `/api/v1/produtos`).
- **Segurança**: Rota pública sem `requiresAuth`, garantindo que clientes e visitantes naveguem sem obrigatoriedade de login.
