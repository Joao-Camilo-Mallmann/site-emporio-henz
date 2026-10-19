## 1. Tipo Genérico de Paginação

- [x] 1.1 `[FE]` Criar `frontend/src/types/pagination.ts` com `PaginationParams`, `PaginationMeta` e `Paginated<T>` e exportar em `frontend/src/types/index.ts`
- [x] 1.2 `[FE]` Converter `Paginated*Response` em aliases de `Paginated<T>` e fazer os `*FilterParams` estenderem `PaginationParams` em `suppliers.ts`, `categories.ts`, `subtypes.ts` e `users.ts`, sem alterar os nomes exportados

## 2. Componente UiPagination

- [x] 2.1 `[FE]` Declarar `UiPaginationProps` (`page`, `totalPages`, `total`, `itemLabel`, `disabled`) em `frontend/src/types/components.ts`
- [x] 2.2 `[FE]` Criar `frontend/src/components/ui/UiPagination.vue` com resumo opcional, janela de páginas com reticências, evento `update:page`, `UiButton`, `aria-current` e tokens do design system
- [x] 2.3 `[FE]` Implementar as regras de exibição (botões ocultos com `totalPages <= 1`, resumo quando `total` informado, nada renderizado sem resumo e com página única) e ignorar páginas fora do intervalo ou iguais à atual

## 3. Migração das Telas Administrativas

- [x] 3.1 `[FE]` Trocar o bloco inline de paginação por `<UiPagination>` em `frontend/src/views/admin/fornecedores/FornecedorListView.vue`
- [x] 3.2 `[FE]` Trocar o bloco inline de paginação por `<UiPagination item-label="categorias">` em `frontend/src/views/admin/categorias/CategoriaListView.vue`
- [x] 3.3 `[FE]` Trocar o bloco inline de paginação por `<UiPagination>` em `frontend/src/views/admin/usuarios/UsuarioListView.vue`

## 4. Migração do Catálogo

- [x] 4.1 `[FE]` Usar `<UiPagination>` sem resumo em `frontend/src/views/CatalogoView.vue` e remover o import manual de `CatalogPagination`
- [x] 4.2 `[FE]` Remover `frontend/src/components/catalogo/CatalogPagination.vue`

## 5. Instruções de Contexto e Documentação

- [x] 5.1 `[DOCS]` Reorganizar o `agents.md` raiz como roteador com a seção "Ambientes de trabalho" e a matriz de manutenção reduzida à linha do PRD
- [x] 5.2 `[DOCS]` Reorganizar `frontend/agents.md` com Escopo, matriz de manutenção do frontend, regras de hex/tokens e a seção "Paginação de listagens"
- [x] 5.3 `[DOCS]` Reorganizar `backend/agents.md` com Escopo, matriz de manutenção do backend/banco e as regras de soft delete, Database First e atualização da Bruno
- [x] 5.4 `[DOCS]` Reescrever `backend/README.md` no formato de `frontend/README.md`, com scripts conforme `backend/package.json` e links para `docs/backend/` e `docs/database/`
- [x] 5.5 `[DOCS]` Atualizar `README.md` raiz (comandos de qualidade apontando para os READMEs de cada ambiente) e `docs/README.md` (agrupar por Comum, Frontend e Backend)
- [x] 5.6 `[DOCS]` Atualizar `docs/frontend/README.md` com `UiPagination` e `types/pagination.ts` na estrutura e na lista de componentes

## 6. Verificação e Build

- [x] 6.1 `[FE]` Executar `bun run check-types` no diretório frontend
- [x] 6.2 `[FE]` Executar `bun run lint` no diretório frontend
- [x] 6.3 `[FE]` Validar build de produção do frontend com `bun run build`
- [ ] 6.4 `[FE]` Verificar no navegador as páginas `/admin/fornecedores`, `/admin/categorias`, `/admin/usuarios` e `/catalogo`, e confirmar via busca que `CatalogPagination` não é mais referenciado em `frontend/src`
- [x] 6.5 `[DOCS]` Conferir os links relativos dos arquivos `.md` alterados
