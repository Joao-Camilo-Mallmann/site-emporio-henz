## Why

A paginação das listagens está escrita quatro vezes no frontend: um bloco inline quase idêntico ("Página X de Y (N registros)" + Anterior/Próxima) em `FornecedorListView.vue`, `CategoriaListView.vue` e `UsuarioListView.vue`, mais `components/catalogo/CatalogPagination.vue`, numerado e exclusivo do catálogo. Além disso, o envelope `{ data, pagination }` do RNF11 está copiado em `types/suppliers.ts`, `categories.ts`, `subtypes.ts` e `users.ts`, sem um tipo genérico. Cada nova listagem exige copiar o bloco e o envelope, e qualquer ajuste visual ou de acessibilidade precisa ser repetido em quatro lugares.

## What Changes

- **Tipo genérico de paginação (`frontend/src/types/pagination.ts`)**:
  - Declarar `PaginationParams`, `PaginationMeta` e `Paginated<T>`, espelhando `backend/src/lib/pagination.ts`.
  - Exportar no barrel `frontend/src/types/index.ts`.
  - Em `suppliers.ts`, `categories.ts`, `subtypes.ts` e `users.ts`, transformar os `Paginated*Response` em aliases de `Paginated<T>` e fazer os `*FilterParams` estenderem `PaginationParams`, sem mudar os nomes exportados.
- **Componente global (`frontend/src/components/ui/UiPagination.vue`)**:
  - Props em `UiPaginationProps` (`frontend/src/types/components.ts`): `page`, `totalPages`, `total`, `itemLabel` e `disabled`; evento `update:page`.
  - Visual "resumo + números" com janela de páginas e reticências, construído apenas com `UiButton` e tokens do design system.
- **Migração dos consumidores**:
  - `FornecedorListView.vue`, `CategoriaListView.vue` e `UsuarioListView.vue` trocam o bloco inline por `<UiPagination>`.
  - `CatalogoView.vue` passa a usar `<UiPagination>` sem resumo; `components/catalogo/CatalogPagination.vue` é removido.
- **Documentação e instruções de contexto**:
  - `frontend/agents.md` ganha a seção "Paginação de listagens" e a matriz de manutenção do frontend.
  - O `agents.md` raiz vira roteador por ambiente de trabalho (Frontend e Backend); `backend/agents.md` recebe as regras exclusivas do backend e do banco.
  - `backend/README.md`, `README.md`, `docs/README.md` e `docs/frontend/README.md` são alinhados à nova divisão.

## Capabilities

### New Capabilities

- `ui-pagination`: Componente global de paginação do frontend e contrato de tipos genéricos para consumo do envelope paginado do RNF11 em todas as listagens.

### Modified Capabilities

*(Nenhuma modificação de requisito em especificações anteriores; o RNF11 do PRD permanece inalterado e o componente é apenas a implementação de interface)*

## Impact

- Afeta `frontend/src/types/`, `frontend/src/components/ui/`, `frontend/src/components/catalogo/` (remoção de `CatalogPagination.vue`), as três `*ListView.vue` do painel administrativo e `frontend/src/views/CatalogoView.vue`.
- Afeta apenas documentação em `agents.md`, `frontend/agents.md`, `backend/agents.md`, `README.md`, `backend/README.md`, `docs/README.md` e `docs/frontend/README.md`.
- Não requer alterações no banco de dados, no backend, no PRD nem na collection Bruno (nenhum endpoint, payload ou resposta muda).
