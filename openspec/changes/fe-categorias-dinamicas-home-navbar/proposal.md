## Why

O CRUD de categorias e subtipos já está no painel administrativo e a rota pública `GET /api/v1/categorias` devolve as categorias ativas com seus subtipos ativos (PRD, linha 570: "para montar o menu e os filtros do catálogo"). Mesmo assim, a home e a navbar ainda usam listas fixas no código:

- A vitrine de 6 cards da home (`HomeView.vue`) aponta para slugs que podem não existir no cadastro.
- A barra de categorias da navbar e o drawer mobile (`AppNavbar.vue`) mostram subcategorias inventadas e não acompanham categorias novas.

Quando o administrador cria, renomeia ou desativa uma categoria, a navegação pública não muda.

## What Changes

- **Carga única das categorias e regras de navegação (`frontend/src/stores/categorias.ts`)**:
  - Store `useCategoriasStore` com `lista` e `carregar()`. Busca todas as páginas de `GET /categorias` (`limit` 100), filtra `active` no cliente (o token de Admin traz inativos) e reaproveita a mesma promise entre navbar e home.
  - Os 6 cards fixos da home (`CARDS_HOME`), com as imagens do Figma.
  - O casamento card ↔ categoria por slug, com fallback no nome normalizado (`encontrarCategoria`).
  - A divisão da barra (`barra`, `mais`): até 6 itens; com 7 ou mais, 5 categorias + "Mais".
  - Os links para o catálogo ficam direto em cada componente (`/catalogo?categoria=<slug>` e `&subcategoria=<nome>`), sem helper na store.
- **Home (`HomeView.vue`)**: os cards continuam fixos, mas só aparecem os que têm categoria correspondente na listagem, com o slug real da API.
- **Navbar**:
  - A barra desktop (`AppNavbarCategorias.vue`) e o drawer mobile (`AppNavbarDrawer.vue`) passam a usar as categorias e subcategorias reais.
  - Na barra desktop, quando passa de 6 categorias, o botão "Mais" abre um dropdown com as demais e suas subcategorias.
  - O menu do usuário vai para `AppNavbarUserMenu.vue`, para o `AppNavbar.vue` respeitar o limite de 500 linhas do `frontend/AGENTS.md`.

## Capabilities

### New Capabilities

*(Nenhuma)*

### Modified Capabilities

- `home-main-layout`: a barra de categorias, o drawer mobile e a vitrine da home passam a refletir as categorias cadastradas.

## Impact

- Afeta `frontend/src/stores/categorias.ts`, `frontend/src/views/HomeView.vue` e `frontend/src/components/layout/AppNavbar.vue`.
- Cria três componentes em `frontend/src/components/layout/`.
- Atualiza `docs/frontend/README.md`.
- Sem mudança no backend, no banco ou na collection Bruno: a rota pública já existe.
- O contrato de URL do catálogo não muda: `/catalogo?categoria=<slug>&subcategoria=<nome>`.
