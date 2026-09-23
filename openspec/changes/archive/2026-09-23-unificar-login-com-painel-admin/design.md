# Design

## Context

Atualmente, o frontend da aplicação (`apps/web`) possui duas telas de login: `LoginView.vue` (`/login`) voltada a clientes e `EquipeLoginView.vue` (`/equipe/login`) para colaboradores. Ambas utilizam a mesma store Pinia (`useAuthStore`) e os mesmos serviços de autenticação (`authApi` e `authMock.ts`), onde o perfil (`role`) do usuário é retornado na resposta da API (`1 = Cliente`, `2 = Vendedor`, `3 = Administrador`). 

No cabeçalho (`AppNavbar.vue`), o menu do usuário exibe um link para `/equipe/login` quando `authStore.isEquipe` é verdadeiro, gerando um loop estranho para usuários já logados. Além disso, ainda não existe a rota `/admin` registrada no Vue Router nem guardas de navegação que protejam rotas internas.

Para a motivação e justificativa completa, consulte [proposal.md](proposal.md).

## Goals / Non-Goals

**Goals:**
- Centralizar o fluxo de autenticação em uma tela única (`/login`), com redirecionamento padrão para `/` (Home) ou para a rota requisitada no parâmetro `?redirect=`.
- Exibir na tela de login os 3 atalhos de contas de teste (Cliente, Vendedor, Administrador).
- Redirecionar acessos a `/equipe/login` automaticamente para `/login` e remover `EquipeLoginView.vue`.
- Criar a rota protegida `/admin` com uma página inicial de Painel Administrativo (`AdminDashboardView.vue`).
- Implementar guarda de navegação (`router.beforeEach`) validando autenticação e papéis autorizados (`isEquipe`: Vendedor e Administrador).
- Adicionar o botão "Painel Admin" adjacente a "Minha conta" no cabeçalho desktop e no drawer mobile para usuários autorizados.

**Non-Goals:**
- Implementação dos formulários completos de CRUD de catálogo ou gestão de empresas (escopo das partes 7 e 9 do PRD).
- Alteração no esquema do banco de dados relacional ou no contrato da API backend.

## Decisions

### 1. Guarda Global de Rotas (`router.beforeEach`)
- **Escolha**: Definir metadados nas rotas (`meta: { requiresAuth: true, roles: [2, 3] }`) e interceptar a navegação via `router.beforeEach`.
- **Comportamento**:
  - Se o usuário não estiver autenticado (`!authStore.isAuthenticated` e sem token), redireciona para `/login?redirect=${to.fullPath}`.
  - Se estiver autenticado com token mas o perfil ainda não estiver carregado, dispara `fetchCurrentUser()` antes de avaliar o acesso.
  - Se o usuário for Cliente (`role === 1`) tentando acessar rota restrita (`roles: [2, 3]`), redireciona para `/` impedindo o acesso indevido.
- **Alternativa descartada**: Checagem manual via `onMounted` nos componentes individuais. Descartada por causar "flicker" de renderização e ser propensa a falhas de segurança no lado do cliente.

### 2. Posicionamento e Estilo do Botão no Header
- **Escolha**: Inserir o botão "Painel Admin" imediatamente ao lado do container de "Minha conta" em `AppNavbar.vue`.
  - Estilização com destaque em tom âmbar/dourado refinado (`bg-amber-500/15 text-amber-300 border border-amber-400/30 hover:bg-amber-500/25 px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5`), harmonizando com a identidade visual nobre do Empório Henz.
  - Visível condicionalmente via `v-if="authStore.isEquipe"`.
  - No mobile drawer, incluir item destacado antes ou junto à seção de conta.
- **Alternativa descartada**: Manter o link escondido apenas dentro do dropdown do usuário. Descartada para atender à exigência de acesso ágil em tablets na loja física pelo vendedor.

### 3. Redirecionamento da Rota `/equipe/login`
- **Escolha**: No `router/index.ts`, configurar:
  ```ts
  {
    path: "/equipe/login",
    redirect: "/login",
  }
  ```
- **Alternativa descartada**: Apenas apagar a rota sem redirecionar (gerando 404). O redirecionamento preserva compatibilidade com links salvos em favoritos ou histórico de navegação.

### 4. Estrutura da View Base `/admin` (`AdminDashboardView.vue`)
- **Escolha**: Criar uma view com cabeçalho institucional escuro (`bg-primary-dark`), saudação ao colaborador/administrador, badge de perfil (`Vendedor` ou `Administrador`), atalhos para as futuras áreas de catálogo/listas e botão de retorno para a vitrine pública (`/`).

## Risks / Trade-offs

- **[Risco]** Sessão perdida ou token presente no `localStorage` antes de reidratar `user` no Pinia.
  - *Mitigação*: No `router.beforeEach`, caso exista `token` salvo mas `authStore.user` seja nulo, aguardar a resolução de `authStore.fetchCurrentUser()` antes de decidir o roteamento.
- **[Risco]** Usuário cliente acessar manualmente `/admin` e ficar confuso com o redirecionamento.
  - *Mitigação*: Redirecionar para `/` e emitir aviso ou toast na interface explicando que a área é restrita a colaboradores.
