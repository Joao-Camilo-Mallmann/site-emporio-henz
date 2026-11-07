## 1. Carga e regras de navegação

- [x] 1.1 `[FE]` Adicionar `categorias`, `categoriasLoading`, `categoriasError`, `categoriasCarregadas` e `carregarCategorias()` em `frontend/src/stores/app.ts` (todas as páginas, `limit` 100, filtro de ativos, promise compartilhada)
- [x] 1.2 `[FE]` Adicionar na mesma store `CARDS_HOME`, `MAX_ITENS_BARRA`, `encontrarCategoria`, `linkCategoria`, `linkSubcategoria` e os recortes `cardsHome`, `categoriasBarra` e `categoriasMais`

## 2. Home

- [x] 2.1 `[FE]` Trocar o array fixo de `frontend/src/views/HomeView.vue` por `cardsHome`, mantendo o visual

## 3. Navbar

- [x] 3.1 `[FE]` Criar `frontend/src/components/layout/AppNavbarCategorias.vue` com dropdown de subcategorias e botão "Mais"
- [x] 3.2 `[FE]` Mover o drawer mobile para `frontend/src/components/layout/AppNavbarDrawer.vue`, listando as categorias da API
- [x] 3.3 `[FE]` Mover o menu do usuário desktop para `frontend/src/components/layout/AppNavbarUserMenu.vue`
- [x] 3.4 `[FE]` Remover a lista fixa de `frontend/src/components/layout/AppNavbar.vue` e montar os três componentes (400 linhas)

## 4. Documentação

- [x] 4.1 `[FE]` Registrar em `docs/frontend/README.md` a carga de categorias pela store `app` e as regras da barra e da vitrine

## 5. Verificação

- [x] 5.1 `[FE]` Rodar `bun run lint`, `bun run check-types` e `bun run build` no `frontend`
- [x] 5.2 `[FE]` Conferir no navegador contra um mock de `GET /categorias`:
  - Home com 6 cards.
  - Barra com até 6 categorias e com "Mais" a partir da 7ª.
  - Categoria inativa some da home e da barra.
  - API fora do ar mantém os 6 cards.
  - Drawer mobile com todas as categorias.
  - Larguras de 768, 1024 e 1280 px.
- [ ] 5.3 `[FE]` Conferir com o backend real e categorias cadastradas pelo admin
