## Context

O backend padronizou todas as rotas de listagem no RNF11 (`backend/src/lib/pagination.ts`), com o envelope `{ data: T[], pagination: { page, limit, total, totalPages } }`. No frontend, esse contrato é consumido de quatro formas diferentes:

- Bloco inline quase idêntico em `FornecedorListView.vue`, `CategoriaListView.vue` e `UsuarioListView.vue`: resumo "Página X de Y (N registros)" mais botões Anterior/Próxima.
- `components/catalogo/CatalogPagination.vue`, numerado, usado somente em `CatalogoView.vue`.
- Envelope copiado em `types/suppliers.ts`, `categories.ts`, `subtypes.ts` e `users.ts`, sem tipo genérico.

Os arquivos de instrução também misturam as camadas: o `agents.md` raiz carrega regras só de frontend (hex, design system) e só de backend (Bruno, soft delete, Database First, paginação RNF11), e quem trabalha no frontend é mandado ler a paginação em `backend/agents.md`. O `frontend/agents.md` não descreve como consumir uma listagem paginada.

## Goals / Non-Goals

**Goals:**
- Criar o tipo genérico `Paginated<T>` (e `PaginationParams`, `PaginationMeta`) em `frontend/src/types/pagination.ts` e reaproveitá-lo como alias nos tipos de fornecedores, categorias, subtipos e usuários.
- Criar `frontend/src/components/ui/UiPagination.vue`, usado em todas as listagens paginadas do frontend.
- Migrar as três views administrativas e o catálogo, removendo `CatalogPagination.vue`.
- Documentar a paginação no `frontend/agents.md` e separar os `agents.md` e READMEs em dois ambientes autossuficientes (frontend e backend, com o banco dentro do backend).

**Non-Goals (fora de escopo, apenas registrados aqui):**
- Composable de listagem que encapsule estado, carga e paginação das views.
- Seletor de tamanho de página (`limit`) na interface.
- Sincronização de `?page=` na URL das listagens administrativas (o catálogo já sincroniza e continua assim).
- `SubcategoriaTagManager.vue`, que usa `limit: 100` fixo e trunca a lista acima de 100 subtipos; a correção fica para outra mudança.
- Qualquer alteração em backend, banco, PRD ou collection Bruno.

## Decisions

### 1. Props e evento do `UiPagination`
- **Decisão:** O componente recebe `page` (obrigatória, `v-model:page`), `totalPages` (obrigatória), `total` (opcional), `itemLabel` (opcional, padrão `"registros"`) e `disabled` (opcional, padrão `false`), e emite `update:page`. As props são declaradas em `UiPaginationProps` em `frontend/src/types/components.ts`, como os demais componentes `Ui*`.
- **Justificativa:** `total` opcional permite o mesmo componente servir ao admin (com resumo) e ao catálogo (sem resumo). `itemLabel` evita fixar o substantivo "registros" nas telas que falam de "categorias" ou "fornecedores". `disabled` trava a navegação enquanto a listagem carrega, evitando requisições concorrentes.
- **Comportamento:** o componente ignora páginas fora do intervalo `1..totalPages` e páginas iguais à atual, de modo que as views não precisam validar.

### 2. Tipo genérico `Paginated<T>`
- **Decisão:** Criar `frontend/src/types/pagination.ts` com `PaginationParams`, `PaginationMeta` e `Paginated<T>`, espelhando `backend/src/lib/pagination.ts`, e exportá-lo no barrel `types/index.ts`. Os tipos `Paginated*Response` viram aliases (`type PaginatedSuppliersResponse = Paginated<ISupplier>`) e os `*FilterParams` passam a estender `PaginationParams`.
- **Justificativa:** Os nomes exportados não mudam, então `frontend/src/api/*` e as views continuam intactos, e novas listagens só declaram o alias.

### 3. Remoção de `CatalogPagination.vue`
- **Decisão:** O visual "resumo + números" passa a valer em todo o frontend. `components/catalogo/CatalogPagination.vue` é removido, e sua lógica de janela de páginas (`visiblePages`/`goToPage`) é reaproveitada dentro do `UiPagination`.
- **Justificativa:** Manter dois componentes de paginação reproduziria o problema atual. O catálogo usa `<UiPagination>` sem `total`, preservando o visual numerado que já tinha.

### 4. Regras de exibição
- **Decisão:** Os botões somem quando `totalPages <= 1`. O resumo aparece sempre que `total` é informado. Sem `total` e com página única, o componente não renderiza nada (comportamento atual do catálogo). O rótulo do botão seguinte é unificado como "Próxima".
- **Markup:** `<nav aria-label="Navegação da paginação">`, somente `UiButton` (`outline`/`primary`, `size="sm"`), `aria-current="page"` na página atual, ícones `mdi:chevron-left` e `mdi:chevron-right`, apenas classes Tailwind e tokens do design system, sem hex e sem `<button>` nativo.
- **Registro:** o componente fica em `src/components/ui/`, coberto pelo auto-import; não é adicionado a `plugins/index.ts`. `src/components.d.ts` é regenerado pelo plugin no build.

### 5. Reversão da alternativa descartada anteriormente
- **Decisão:** Esta mudança reverte a alternativa descartada em `openspec/changes/archive/2026-10-10-fe-admin-suppliers-pagination/design.md` ("criar um novo componente de paginação global neste momento"), que na época foi recusada para não desestabilizar outras telas.
- **Justificativa:** Com a quarta cópia do bloco (categorias) e o componente numerado do catálogo, o custo de duplicar passou a superar o risco. A migração é mecânica e cada view mantém seu estado e suas funções de carga; só o bloco de marcação é substituído.

### 6. Separação de contexto entre frontend e backend
- **Decisão:** O `agents.md` raiz vira apenas roteador, com a seção "Ambientes de trabalho" (Frontend: `frontend/`, `frontend/agents.md`, `docs/frontend/`; Backend com banco: `backend/`, `backend/database/`, `backend/agents.md`, `docs/backend/`, `docs/database/`). A tarefa define o ambiente e só o contexto dele é carregado; tarefa que exige as duas camadas vira duas tarefas.
- **Justificativa:** Regras de hex e design system saem do raiz para o `frontend/agents.md`; soft delete, Database First, paginação RNF11 e atualização da Bruno vão para o `backend/agents.md`. A única ponte entre as camadas é o PRD e a collection Bruno. A seção "Internal Evaluation Metadata" do `agents.md` raiz não é alterada.

## Risks / Trade-offs

- **[Regressão visual nas telas migradas]** → O resumo e os botões do admin mudam de aparência (agora com números). Mitigação: conferir manualmente `/admin/fornecedores`, `/admin/categorias`, `/admin/usuarios` e `/catalogo` no navegador, com a mesma marcação baseada em `UiButton`.
- **[Desvio da paginação do catálogo]** → O catálogo sincroniza `?page=` com a URL. Mitigação: a view mantém `handlePageChange`; o componente apenas emite `update:page`.
- **[Muitas páginas]** → Sem janela de páginas, listagens grandes quebrariam o layout. Mitigação: reaproveitar a janela com reticências do `CatalogPagination.vue`.
- **[Documentação desalinhada]** → Mover regras entre `agents.md` pode deixar links quebrados. Mitigação: conferir os links relativos de todos os `.md` alterados na verificação final.
