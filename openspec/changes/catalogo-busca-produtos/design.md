# Design Técnico · Catálogo e Busca de Produtos

## Context

O portal da Empório Henz precisa disponibilizar para clientes e visitantes uma experiência fluida de descoberta e filtragem de móveis, conforme projetado no Figma oficial (nó `96:6513`). No momento, a barra de navegação global (`AppNavbar.vue`) possui campo de busca e menus de categorias, porém não há uma tela de catálogo funcional para onde direcionar esses disparadores.

O usuário solicitou que a tela seja pública (livre de tokens ou requisitos de login), altamente componentizada e com contratos de dados em TypeScript bem definidos, preparando o terreno para que, futuramente, os parâmetros de filtro e paginação sejam enviados via requisição `GET` para a API de catálogo quando esta estiver implementada no backend.

## Goals / Non-Goals

**Goals:**

- Implementar a tela pública do catálogo na rota `/catalogo` com design idêntico ao Figma (`node-id=96-6513`).
- Componentizar a interface de forma modular:
  - `CatalogFilterSidebar.vue`: Sidebar de filtros com chips de categoria/subcategoria, checkboxes de materiais/marcas, swatches circulares de acabamentos e campos de faixa de preço.
  - `CatalogProductCard.vue`: Card de produto responsivo com imagem 1:1, badge de acabamentos (`colors_hex`), título, preço formatado e parcelamento.
  - `CatalogSortDropdown.vue`: Dropdown seletor de ordenação (Relevância, Menor Preço, Maior Preço, Mais Recentes).
  - `CatalogPagination.vue`: Componente reutilizável de paginação.
- Integrar a busca global e os links de categoria da `AppNavbar.vue` para navegar para `/catalogo` passando os parâmetros de consulta.
- Garantir 100% de conformidade com o Design System oficial (`style.css`), usando os tokens Tailwind semânticos e o componente global obrigatório `<UiButton>`.
- Estruturar contratos TypeScript (`CatalogFilterParams`, `CatalogProductItem`, `CatalogPaginationMeta`) desacoplados em `src/types/catalogo.ts`.

**Non-Goals:**

- Não inclui neste momento a criação de rotas ou tabelas no backend (`[BE]` e `[DB]`). A tela inicial funcionará com dados de demonstração tipados e reatividade local no frontend, pronta para receber a chamada de API quando os endpoints do backend forem desenvolvidos.
- Não inclui regras de carrinho ou checkout (as compras no portal são finalizadas via WhatsApp contextualizado conforme o PRD).

## Decisions

### 1. Rota Aberta no Vue Router (`/catalogo`)

- **Decisão**: A rota `/catalogo` é registrada sem o meta `requiresAuth` em `src/router/index.ts`.
- **Alternativas consideradas**:
  - Exigir login para ver preços: Descartado, pois viola o modelo de descoberta do catálogo público do PRD (RF05).
  - Embutir o catálogo na própria HomeView: Descartado, a HomeView possui hero banners, seções editoriais e cards de categorias em carrossel; o catálogo necessita de uma visualização dedicada em 2 colunas com sidebar fixa.

### 2. Componentização Modular e Desacoplada

- **Decisão**: Dividir a funcionalidade em componentes especializados dentro de `src/components/catalogo/`:
  - `CatalogFilterSidebar`: Responsável apenas por capturar e emitir alterações nos filtros.
  - `CatalogProductCard`: Responsável apenas pela renderização do card e preview de acabamentos.
  - `CatalogPagination`: Responsável pela lógica e emissão de eventos de troca de página.
- **Alternativas consideradas**:
  - Manter todo o HTML e lógica em um único arquivo `CatalogoView.vue`: Descartado, pois geraria um componente monolítico com mais de 800 linhas, dificultando testes, manutenção e a futura conexão com a API.

### 3. Modelo de Contrato Tipado (`CatalogFilterParams`)

- **Decisão**: Definir uma interface TypeScript `CatalogFilterParams` que mapeia exatamente os parâmetros convencionais de uma query string `GET` (`q`, `category`, `subcategory`, `materials`, `colors`, `brands`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`).
- **Alternativas consideradas**:
  - Usar objetos genéricos não tipados (`Record<string, any>`): Descartado, pois perde segurança em tempo de compilação com `vue-tsc` e dificulta o alinhamento com a futura collection Bruno do backend.

### 4. Uso Estrito do `<UiButton>`

- **Decisão**: Usar `<UiButton>` para todos os botões da sidebar (_"Filtrar"_ com `variant="primary"` e _"Limpar filtros"_ com `variant="outline"`) e botões de paginação, conforme diretriz mandatória de `frontend/agents.md`.

### 5. Filtragem Delegada ao Backend via Parâmetros GET (Sem Filtragem Local no Cliente)

- **Decisão**: A filtragem e ordenação dos produtos é responsabilidade da camada REST. O frontend (`CatalogoView.vue`) não realiza processamento em memória com `computed(() => allProducts.filter(...))`; ele apenas despacha a chamada `GET` através do cliente `catalogoApi.buscarProdutos(filters)` com os parâmetros serializados (`name`/`q`, `categoria`, `subcategoria`, `materiais`, `cores`, `marcas`, `minPreco`, `maxPreco`, `ordem`, `page`, `limit`). Para manter a aplicação plenamente visualizável e desacoplada de persistência real nesta etapa, o serviço implementa fallback estático mockado em `src/mocks/catalogo.ts`.
- **Alternativas consideradas**:
  - Filtragem local em memória no frontend com `allProducts.filter(...)`: Descartado, pois viola o padrão de consumo REST, ignora os parâmetros no backend e impede paginação real do servidor.


## Risks / Trade-offs

- **[Risco] Incompatibilidade com contratos futuros da API do backend** → **Mitigação**: O contrato `CatalogFilterParams` foi desenhado seguindo exatamente as especificações do PRD (RF05, RNF01) e do DER (nomes das tabelas `categories`, `product_subtypes`, `suppliers`, etc.).
- **[Risco] Responsividade em dispositivos móveis (< 768px)** → **Mitigação**: No desktop, a sidebar é fixa à esquerda (266px); no mobile, a sidebar será recolhível em um botão/drawer de filtros interativo para não quebrar a usabilidade em telas pequenas.

## Migration Plan

Nenhum dado ou banco de dados existente é alterado nesta etapa. Apenas novos componentes, rota e tipos são adicionados ao frontend, além de um ajuste de navegação pontual no `handleSearch` e links de categoria do `AppNavbar.vue`.

## Open Questions

Nenhuma questão crítica em aberto; os requisitos visuais do Figma nó `96:6513` foram mapeados integralmente e os contratos foram desacoplados.
