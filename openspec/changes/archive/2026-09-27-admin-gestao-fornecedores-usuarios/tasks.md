## 1. Sessão e Tipagens Base

- [x] 1.1 Corrigir persistência de sessão chamando `authStore.setAuth(response)` e eliminar erro TS6133 em `apps/web/src/views/auth/LoginView.vue`
- [x] 1.2 Criar interfaces TypeScript para fornecedores em `apps/web/src/types/suppliers.ts` e usuários em `apps/web/src/types/users.ts`, exportando-as em `apps/web/src/types/index.ts`

## 2. Camada de Comunicação com a API

- [x] 2.1 Implementar módulo `apps/web/src/api/fornecedores.ts` integrando com os endpoints REST de `/suppliers`
- [x] 2.2 Implementar módulo `apps/web/src/api/usuarios.ts` integrando com os endpoints REST de `/users` (com paginação e filtros)
- [x] 2.3 Registrar e exportar os novos módulos no arquivo agregador `apps/web/src/api/index.ts`

## 3. Dashboard Administrativo e Rotas Protegidas

- [x] 3.1 Reformular `apps/web/src/views/admin/AdminDashboardView.vue` substituindo métricas fictícias por dois botões/cards grandes de destaque para Fornecedores e Usuários
- [x] 3.2 Configurar as rotas de CRUD completo (`/admin/fornecedores`, `/admin/fornecedores/novo`, `/admin/fornecedores/:id/editar`, `/admin/usuarios`, `/admin/usuarios/novo`, `/admin/usuarios/:id/editar`) em `apps/web/src/router/index.ts` com proteção de papéis (`roles: [3]`)

## 4. Módulo de Gestão de Fornecedores (CRUD list/edit/new/form)

- [x] 4.1 Criar a listagem `apps/web/src/views/admin/fornecedores/FornecedorListView.vue` com links diretos para criação (`/novo`) e edição (`/:id/editar`)
- [x] 4.2 Criar componentes de formulário `apps/web/src/views/admin/fornecedores/FornecedorForm.vue`, view de novo `FornecedorNewView.vue` e view de edição `FornecedorEditView.vue` com validações
- [x] 4.3 Manter diálogo de confirmação de exclusão lógica (soft delete) com feedback visual

## 5. Módulo de Gestão de Usuários e Clientes (CRUD list/edit/new/form)

- [x] 5.1 Criar a listagem `apps/web/src/views/admin/usuarios/UsuarioListView.vue` com links diretos para criação (`/novo`) e edição (`/:id/editar`), paginação e filtros
- [x] 5.2 Criar componentes de formulário `apps/web/src/views/admin/usuarios/UsuarioForm.vue`, view de novo `UsuarioNewView.vue` e view de edição `UsuarioEditView.vue` com perfil, senha e máscara de telefone
- [x] 5.3 Manter diálogo de confirmação de exclusão lógica (soft delete) de usuário e proteção contra autoexclusão

## 6. Validação e Qualidade

- [x] 6.1 Executar compilação TypeScript e build do frontend (`bun run --cwd apps/web build`)
- [x] 6.2 Executar testes automatizados do backend (`bun test apps/backend`) para assegurar integridade dos contratos
