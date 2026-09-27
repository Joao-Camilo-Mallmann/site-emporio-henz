## Why

O painel administrativo (`/admin`) da Empório Henz precisa operacionalizar a gestão de fornecedores e a gestão da base de usuários/clientes no frontend, conectando a interface aos endpoints REST já existentes no backend e às regras de negócio do PRD (RF01, RF04, RF07, RF18 e RNF09). Além disso, a tela principal do dashboard precisa ser despoluída, focando em duas ações primárias e proeminentes para esses módulos, e as rotas administrativas devem ser rigidamente blindadas por token JWT e controle de papéis (`roles`). Para oferecer uma experiência ergonômica e robusta de CRUD, a criação e edição operam em telas dedicadas no formato `list/edit/new/form` em vez de modais embutidos.

## What Changes

- **Reformulação do Dashboard Admin (`AdminDashboardView.vue`)**: Remoção de métricas fictícias e módulos placeholder; inclusão de dois botões/cards grandes de destaque para "Gestão de Fornecedores" e "Gestão de Usuários e Clientes".
- **Módulo de Fornecedores (CRUD list/edit/new/form)**:
  - `FornecedoresView.vue`: Listagem, busca em tempo real e desativação lógica (soft delete).
  - `FornecedorFormView.vue`: Tela dedicada para criação (`/admin/fornecedores/novo`) e edição (`/admin/fornecedores/:id/editar`) com validação de campos.
  - `src/api/fornecedores.ts`: Integração com os endpoints `/suppliers`.
- **Módulo de Usuários e Clientes (CRUD list/edit/new/form)**:
  - `UsuariosView.vue`: Listagem paginada, busca textual, filtro por perfil (`Cliente`, `Vendedor`, `Administrador`) e desativação lógica.
  - `UsuarioFormView.vue`: Tela dedicada para criação (`/admin/usuarios/novo`) e edição (`/admin/usuarios/:id/editar`) com controle de papel, senha e máscara de telefone.
  - `src/api/usuarios.ts`: Integração com os endpoints `/users`.
- **Proteção e Blindagem de Rotas (`router/index.ts`)**: Navegação guard (`beforeEach`) verificando presença e validade do token Bearer JWT e papel autorizado (`role = 3` para administração). Redirecionamento de não autenticados para `/login?redirect=...` e bloqueio de clientes (`role = 1`) com redirecionamento para a Home (`/`) e emissão de alerta.
- **Correção da Persistência de Login (`LoginView.vue`)**: Integração de `authStore.setAuth(response)` após o login bem-sucedido, corrigindo a gravação de sessão e eliminando erro de compilação TS6133.

## Capabilities

### New Capabilities
- `admin-gestao-fornecedores`: Interface de listagem, busca, criação, edição e desativação lógica (soft delete) de fornecedores e marcas parceiras no painel administrativo, integrada à API `/suppliers` no formato list/edit/new/form.
- `admin-gestao-usuarios`: Interface de listagem paginada, busca, filtragem por papel, criação, atualização e soft delete de usuários e clientes no painel administrativo, integrada à API `/users` no formato list/edit/new/form.

### Modified Capabilities
- `admin-access-and-guard`: Reforço da proteção de rotas no Vue Router para abranger o dashboard e todas as sub-telas administrativas (`/admin`, `/admin/fornecedores*`, `/admin/usuarios*`), exigindo autenticação ativa e bloqueando perfis não autorizados.

## Impact

- **Frontend (`apps/web`)**:
  - `src/views/admin/AdminDashboardView.vue`: Layout limpo e moderno com 2 botões de ação principais.
  - `src/views/admin/fornecedores/FornecedoresView.vue`: View de listagem de fornecedores.
  - `src/views/admin/fornecedores/FornecedorFormView.vue`: Nova view de formulário dedicado (novo/edição) de fornecedor.
  - `src/views/admin/usuarios/UsuariosView.vue`: View de listagem de usuários.
  - `src/views/admin/usuarios/UsuarioFormView.vue`: Nova view de formulário dedicado (novo/edição) de usuário.
  - `src/api/fornecedores.ts` e `src/api/usuarios.ts`: Novos clientes HTTP Axios.
  - `src/types/suppliers.ts` e `src/types/users.ts`: Novas interfaces TypeScript.
  - `src/router/index.ts`: Rotas administrativas de listagem e formulários com guard aprimorado.
  - `src/views/auth/LoginView.vue`: Persistência de autenticação corrigida.
- **APIs consumidas**:
  - `GET /api/v1/suppliers`, `POST /api/v1/suppliers`, `GET /api/v1/suppliers/:id`, `PUT /api/v1/suppliers/:id`, `DELETE /api/v1/suppliers/:id`
  - `GET /api/v1/users`, `POST /api/v1/users`, `GET /api/v1/users/:id`, `PUT /api/v1/users/:id`, `DELETE /api/v1/users/:id`
