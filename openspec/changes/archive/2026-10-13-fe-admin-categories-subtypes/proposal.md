## Why

O backend já possui as rotas REST completas e paginadas para gerenciamento de categorias e subtipos (`/api/v1/categorias` e `/api/v1/subtipos`), devidamente documentadas no PRD (UC09, RF04, RF15) e na collection Bruno. No entanto, o frontend ainda não oferece interface administrativa para esse domínio, impedindo que o administrador cadastre novas categorias de móveis/ambientes, edite nomes e slugs, vincule subtipos e execute desativações lógicas diretamente pela aplicação web.

## What Changes

- **Tipos e Contratos no Frontend (`frontend/src/types/categories.ts`)**:
  - Declarar interfaces para Categorias (`ICategory`, `CategoryCreateInput`, `CategoryUpdateInput`, `CategoryFilterParams`, `PaginatedCategoriesResponse`).
  - Declarar interfaces para Subtipos (`ISubtype`, `SubtypeCreateInput`, `SubtypeUpdateInput`, `SubtypeFilterParams`, `PaginatedSubtypesResponse`).
  - Exportar os novos tipos em `frontend/src/types/index.ts`.
- **Cliente de API (`frontend/src/api/categorias.ts`)**:
  - Implementar métodos de CRUD paginado para `/categorias` (`listar`, `buscarPorId`, `criar`, `atualizar`, `deletar`).
  - Implementar métodos de CRUD para `/subtipos` (`listar`, `buscarPorId`, `criar`, `atualizar`, `deletar`).
  - Exportar em `frontend/src/api/index.ts`.
- **Dashboard Administrativo (`frontend/src/views/admin/AdminDashboardView.vue`)**:
  - Adicionar card de acesso rápido para o módulo "Categorias & Ambientes" apontando para `/admin/categorias`.
- **Roteador Vue (`frontend/src/router/index.ts`)**:
  - Registrar a rota administrativa `/admin/categorias` protegida para perfil Administrador (`requiresAuth` e `roles: [UserRole.Administrador]`).
- **Telas e Componentes Administrativos (`frontend/src/views/admin/categorias/`)**:
  - `CategoriaListView.vue`: Listagem paginada no servidor com busca, badge de status ativo/inativo, contagem de subtipos e botões de ação.
  - Modais ou telas dedicadas para criar/editar categoria e gerenciar subtipos vinculados com confirmação de soft delete.

## Capabilities

### New Capabilities

- `admin-gestao-categorias`: Interface web administrativa para listagem, pesquisa paginada, cadastro, atualização e desativação lógica de categorias e subtipos de produtos da Empório Henz.

### Modified Capabilities

*(Nenhuma modificação de requisito em especificações anteriores)*

## Impact

- Afeta `frontend/src/types/`, `frontend/src/api/`, `frontend/src/router/`, `frontend/src/views/admin/AdminDashboardView.vue` e cria novos SFCs em `frontend/src/views/admin/categorias/`.
- Não requer alterações no banco de dados ou no backend (rotas já implementadas e validadas).
