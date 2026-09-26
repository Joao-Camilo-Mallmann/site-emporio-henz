## Context

O backend Bun nativo já disponibiliza todos os endpoints e regras de negócio para `/suppliers` e `/users`, com autenticação Bearer JWT, validações semânticas, soft delete (`deleted_at TIMESTAMP`) e controle de acesso restrito a administradores. No frontend (`apps/web`), o usuário precisa de interfaces visuais no painel administrativo para operar essas duas entidades. Além disso, a tela inicial do painel admin (`AdminDashboardView.vue`) possui métricas estáticas e atalhos fictícios que devem ser substituídos por dois botões de ação primários de grande destaque ("Gestão de Fornecedores" e "Gestão de Usuários e Clientes"). O guard de navegação (`router/index.ts`) e o formulário de login (`LoginView.vue`) também exigem ajustes para que a autenticação por token seja rigorosamente conferida e mantida. Em vez de modais flutuantes para cadastro/edição, adota-se o padrão clássico de CRUD com rotas dedicadas de formulário (`list/edit/new/form`).

## Goals / Non-Goals

**Goals:**
- Simplificar `AdminDashboardView.vue` para apresentar apenas os dois botões/cards grandes de destaque para os módulos ativos.
- Criar a arquitetura completa de CRUD para Fornecedores no formato list/edit/new/form:
  - `fornecedores/FornecedorListView.vue`: Listagem, busca em tempo real e soft delete.
  - `fornecedores/FornecedorNewView.vue`: Tela dedicada para criação (`/admin/fornecedores/novo`).
  - `fornecedores/FornecedorEditView.vue`: Tela dedicada para edição (`/admin/fornecedores/:id/editar`).
  - `fornecedores/FornecedorForm.vue`: Componente reutilizável de formulário com validação de dados.
- Criar a arquitetura completa de CRUD para Usuários e Clientes no formato list/edit/new/form:
  - `usuarios/UsuarioListView.vue`: Listagem paginada, filtros por papel, busca e soft delete.
  - `usuarios/UsuarioNewView.vue`: Tela dedicada para criação (`/admin/usuarios/novo`).
  - `usuarios/UsuarioEditView.vue`: Tela dedicada para edição (`/admin/usuarios/:id/editar`).
  - `usuarios/UsuarioForm.vue`: Componente reutilizável de formulário com regras de perfil, senha e máscara de telefone.
- Implementar os clientes de API HTTP Axios em `src/api/fornecedores.ts` e `src/api/usuarios.ts`.
- Blindar todas as rotas no `router/index.ts`, garantindo que visitantes sem token sejam redirecionados para o login e clientes com `role = 1` sejam barrados de acessar qualquer área administrativa.
- Corrigir a gravação de sessão no `LoginView.vue` (`authStore.setAuth(response)`).

**Non-Goals:**
- Alterações no backend ou esquema de banco de dados (as camadas `[DB]` e `[BE]` já estão implementadas e validadas).
- Módulos administrativos de catálogo de produtos, orçamentos ou categorias (serão desenvolvidos em etapas subsequentes).

## Decisions

### 1. Separação de Módulos e Rotas de CRUD (List / Edit / New / Form)
- **Decisão**: Em vez de modais para inclusão e edição de dados, criar telas dedicadas conectadas como `children` de `/admin` no Vue Router, organizadas nas subpastas `src/views/admin/fornecedores/` e `src/views/admin/usuarios/`:
  - `/admin`: `AdminDashboardView.vue` (visão geral simplificada com 2 botões grandes).
  - `/admin/fornecedores`: `fornecedores/FornecedorListView.vue` (listagem e ações).
  - `/admin/fornecedores/novo`: `fornecedores/FornecedorNewView.vue` (tela de cadastro limpa que consome `FornecedorForm.vue`).
  - `/admin/fornecedores/:id/editar`: `fornecedores/FornecedorEditView.vue` (tela de edição com dados carregados via API que consome `FornecedorForm.vue`).
  - `/admin/usuarios`: `usuarios/UsuarioListView.vue` (listagem paginada e ações).
  - `/admin/usuarios/novo`: `usuarios/UsuarioNewView.vue` (tela de cadastro de usuário que consome `UsuarioForm.vue`).
  - `/admin/usuarios/:id/editar`: `usuarios/UsuarioEditView.vue` (tela de edição de usuário que consome `UsuarioForm.vue`).
- **Justificativa**: A abordagem com telas e rotas dedicadas melhora a usabilidade em telas menores/tablets, permite compartilhamento de links de edição, previne perda acidental de dados ao clicar fora de um modal e atende à preferência explícita da arquitetura CRUD.

### 2. Guard Centralizado de Rotas com Validação Estrita de Token e Papéis
- **Decisão**: No `beforeEach` do Vue Router, inspecionar `record.meta.requiresAuth` e `record.meta.roles`.
  - Se a rota requer autenticação e não há token salvo nem usuário autenticado, redirecionar imediatamente para `/login?redirect=...`.
  - Se a rota requer cargos (`roles`) e o usuário autenticado não possui o papel correspondente (como `role = 1` de Cliente tentando acessar `/admin`), bloquear o acesso, emitir alerta de acesso negado via `appStore.showAlert` e redirecionar para a vitrine Home (`/`).
  - Vendedor (`role = 2`) tentando acessar rotas restritas de fornecedores/usuários é redirecionado para `/admin` com alerta.

### 3. Comunicação HTTP via Axios Padronizado
- **Decisão**: Módulos dedicados `src/api/fornecedores.ts` e `src/api/usuarios.ts` utilizando a instância configurada em `src/plugins/axios.ts`, que já injeta o cabeçalho `Authorization: Bearer <token>` automaticamente.

### 4. Estilização Estrita com Tokens do Design System
- **Decisão**: Utilizar unicamente os tokens `@theme` do Tailwind CSS v4 (`bg-primary`, `bg-primary-dark`, `bg-secondary`, `bg-secondary-hover`, `text-neutral-dark`, `bg-surface-light`, etc.).

## Risks / Trade-offs

- **[Trade-off] Navegação adicional entre páginas vs. Modal**: A navegação para telas dedicadas exige retorno explícito via botão "Voltar" ou cancelamento; compensado por botões proeminentes de navegação e breadcrumb no topo de cada formulário.
