# Proposal

## Why

Atualmente, o sistema possui duas telas de login distintas (`/login` e `/equipe/login`), gerando redundância de código, fricção na experiência do usuário e inconsistências com o [PRD.md](file:///home/joao/projects/site-emporio-henz/docs/PRD.md#L53) (RF01), no qual todos os perfis (Cliente, Vendedor, Administrador) compartilham o mesmo mecanismo de autenticação por e-mail e senha. Além disso, não há uma rota `/admin` configurada para recepcionar a equipe de vendas e administração com controle de acesso por perfil (`roles 2 e 3`), nem um botão direto no cabeçalho para acessar a área administrativa.

Esta mudança unifica a autenticação em uma única tela (`/login`), redireciona todos os usuários autenticados para a Home (`/`), disponibiliza um botão de acesso rápido ao `/admin` ao lado de "Minha conta" no cabeçalho quando o usuário for Administrador ou Vendedor, e protege a rota `/admin` com guarda de navegação.

## What Changes

- **Unificação da Autenticação em `/login`**: centralizar o login de Clientes, Vendedores e Administradores na rota `/login`, sempre redirecionando para a Home (`/`) após o login bem-sucedido.
- **Atalhos de Mock Unificados**: atualizar os atalhos de teste na tela de login para disponibilizar preenchimento rápido de Cliente, Vendedor e Administrador em um só lugar.
- **Descontinuação de `/equipe/login`**: remover o componente duplicado `EquipeLoginView.vue` e configurar redirecionamento automático da rota `/equipe/login` para `/login`.
- **Criação da Rota Protegida `/admin`**: implementar a rota `/admin` com página base inicial de Painel Administrativo (`AdminDashboardView.vue`), protegida por guardas de navegação no Vue Router.
- **Controle de Acesso ao `/admin`**: permitir acesso exclusivamente a usuários autenticados com perfil de Vendedor (`role: 2`) ou Administrador (`role: 3`). Usuários anônimos são redirecionados para `/login?redirect=/admin`, e Clientes comuns (`role: 1`) são bloqueados com redirecionamento para a Home e notificação de acesso restrito.
- **Botão de Acesso ao `/admin` no Header**: adicionar botão de ação direta para `/admin` ao lado de "Minha conta" no cabeçalho desktop e no drawer mobile em `AppNavbar.vue`, visível apenas para Vendedores e Administradores autenticados.
- **Limpeza de Referências**: atualizar `AppFooter.vue` e `plugins/axios.ts`, removendo referências obsoletas a `/equipe/login`.

## Capabilities

### New Capabilities
- `admin-access-and-guard`: Rota protegida `/admin` acessível exclusivamente para Vendedores (`role: 2`) e Administradores (`role: 3`), com controle de navegação e botão no cabeçalho ao lado de "Minha conta".

### Modified Capabilities
- `auth-screens`: Unificação do login em `/login` para todos os perfis (Cliente, Vendedor e Admin) com redirecionamento pós-login para a Home (`/`), atalhos de teste unificados e descontinuação da tela `/equipe/login`.

## Impact

- **Frontend (`apps/web`)**:
  - `src/views/auth/LoginView.vue`: inclusão dos 3 atalhos de perfil e garantia de redirecionamento para `/` ou parâmetro `redirect`.
  - `src/views/auth/EquipeLoginView.vue`: exclusão do arquivo.
  - `src/views/admin/AdminDashboardView.vue`: nova tela base para a área administrativa.
  - `src/router/index.ts`: remoção da rota de equipe, adição do redirecionamento `/equipe/login -> /login`, configuração da rota `/admin` com `beforeEach` de autorização de papéis.
  - `src/components/layout/AppNavbar.vue`: inserção do botão `/admin` adjacente a "Minha conta" no desktop e drawer mobile, e correção do link interno no dropdown do usuário.
  - `src/components/layout/AppFooter.vue`: remoção ou ajuste do atalho antigo do rodapé.
  - `src/plugins/axios.ts`: simplificação do interceptor de 401 sem checagem de `/equipe/login`.
