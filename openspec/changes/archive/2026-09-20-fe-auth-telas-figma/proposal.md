## Why

A aplicação frontend em Vue 3 da Empório Henz necessita de uma identidade visual sofisticada e funcional em linha com o protótipo do Figma, além de infraestrutura de gerenciamento de sessão reativa. Para permitir que consumidores naveguem por um mostruário refinado, criem contas e realizem login, enquanto a equipe interna (vendedores e administradores) acessa um portal reservado, é necessário estruturar a camada de autenticação no Pinia, interceptores Axios, telas de autenticação e o layout base da Home com desacoplamento para mocks assíncronos.

## What Changes

- **Store Pinia de Autenticação (`src/stores/auth.ts`)**: Implementação de estado reativo de usuário, token JWT persistido em `localStorage`, status de carregamento e getters de papéis (`isAuthenticated`, `isAdmin`, `isVendedor`, `isCliente`).
- **Configuração de Interceptors no Axios (`src/plugins/axios.ts`)**: Injeção automática do cabeçalho `Authorization: Bearer <token>` e captura global de respostas `401 Unauthorized` com logout imediato e redirecionamento para `/login`.
- **Camada de Serviços & Mocks Desacoplados (`src/api/auth.ts` e `src/utils/mocks/authMock.ts`)**: Contratos formais das rotas de autenticação (`/api/auth/login`, `/api/auth/register`, `/api/auth/me`) com implementação de mock transparente e dados de teste para transição imediata ao backend Bun real.
- **Telas de Autenticação Fidedignas ao Figma (`src/views/auth/`)**:
  - `LoginView.vue` (`/login`): Login público para clientes com campos estilizados, alternância de senha e link para cadastro.
  - `RegisterView.vue` (`/cadastro`): Autocadastro com máscara de telefone/WhatsApp `(99) 99999-9999`, validações de senha e feedback visual.
  - `EquipeLoginView.vue` (`/equipe/login`): Acesso restrito para colaboradores (Vendedores e Administrador).
- **Layout Base & Home Principal do Figma (`src/components/layout/` e `src/views/HomeView.vue`)**:
  - `AppNavbar.vue`: Cabeçalho institucional azul-marinho (`#0C2340`), top-bar de atendimento/WhatsApp, barra de busca, links de categorias e menu dropdown do usuário autenticado.
  - `AppFooter.vue`: Rodapé azul-marinho com endereço da loja física em Cruzeiro do Sul - RS, horários, canais de atendimento e link discreto para equipe.
  - `HomeView.vue`: Hero banner de móveis em madeira nobre (50 anos de tradição pós-reconstrução), vitrine de ambientes e produtos com tags de pronta entrega / encomenda.

## Capabilities

### New Capabilities

- `auth-store-and-interceptor`: Gerenciamento centralizado de sessão no Pinia e interceptores de requisição e resposta Bearer Token no Axios.
- `auth-screens`: Telas dedicadas de login de clientes, autocadastro com validações e portal de acesso da equipe interna.
- `home-main-layout`: Layout base com cabeçalho institucional, rodapé e página inicial fiéis ao padrão visual do Figma.

### Modified Capabilities

<!-- None -->

## Impact

- **Frontend (`apps/web`)**:
  - `src/router/index.ts`: Novas rotas `/login`, `/cadastro`, `/equipe/login`.
  - `src/stores/auth.ts`: Nova store Pinia.
  - `src/plugins/axios.ts`: Atualização dos interceptors.
  - `src/api/auth.ts`: Novo módulo de serviços de autenticação.
  - `src/utils/mocks/authMock.ts`: Mocks desacoplados de autenticação.
  - `src/views/auth/`: Novas views de login e cadastro.
  - `src/components/layout/`: Novos componentes `AppNavbar.vue` e `AppFooter.vue`.
  - `src/views/HomeView.vue`: Reformulação visual da Home conforme Figma.
- **Dependências**: Nenhuma dependência externa nova é necessária (Tailwind CSS v4, Vue Router e Pinia já instalados).
