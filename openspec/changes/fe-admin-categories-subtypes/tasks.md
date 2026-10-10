## 1. Tipos e Cliente de API

- [x] 1.1 `[FE]` Criar interfaces de tipos para Categorias e Subtipos em `frontend/src/types/categories.ts` e exportar em `frontend/src/types/index.ts`
- [x] 1.2 `[FE]` Criar cliente de API `frontend/src/api/categorias.ts` com métodos paginados para categorias e subtipos e exportar em `frontend/src/api/index.ts`

## 2. Roteamento e Painel Administrativo

- [x] 2.1 `[FE]` Adicionar card do módulo "Categorias & Subtipos" em `frontend/src/views/admin/AdminDashboardView.vue`
- [x] 2.2 `[FE]` Registrar a rota administrativa `/admin/categorias` protegida por autenticação e perfil Administrador em `frontend/src/router/index.ts`

## 3. Telas e Componentes de Interface

- [x] 3.1 `[FE]` Criar a view principal `frontend/src/views/admin/categorias/CategoriaListView.vue` com listagem paginada, busca textual e controles de navegação
- [x] 3.2 `[FE]` Adicionar modal de cadastro e edição de categorias com validação e feedback visual
- [x] 3.3 `[FE]` Adicionar modal/seção de gerenciamento de subtipos vinculados à categoria selecionada
- [x] 3.4 `[FE]` Integrar modal de confirmação de exclusão lógica (soft delete) para categorias e subtipos com toast notifications

## 4. Verificação e Build

- [x] 4.1 `[FE]` Executar checagem estrita de tipos com `vue-tsc` no diretório frontend
- [x] 4.2 `[FE]` Validar build de produção do frontend com `bun run build`
