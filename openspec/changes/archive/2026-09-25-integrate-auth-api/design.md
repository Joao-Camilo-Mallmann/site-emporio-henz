## Context

O backend em Bun (`apps/backend`) está estruturado com roteador nativo prefixado em `/api/v1`, autenticação JWT Bearer, CORS habilitado e persistência no PostgreSQL através da migração `007_seed_default_admin.sql` (`admin@gmail.com` / `admin123`). As rotas e contratos estão formalizados e validados na collection Bruno em `docs/backend/collections/bruno/`.

O frontend Vue 3 (`apps/web`) possui as views (`LoginView.vue`, `RegisterView.vue`), a store Pinia (`auth.ts`) e o layout (`AppNavbar.vue`) prontos, porém isolados da rede real devido ao uso de simulação (`USE_MOCK = true` em `src/api/auth.ts`) e a falhas de parametrização na `baseURL` do Axios e divergências nos nomes de campos (`name` vs `fullName`).

## Goals / Non-Goals

**Goals:**
- Configurar o cliente Axios global em `apps/web/src/plugins/axios.ts` com `baseURL` apontando para `http://localhost:3001/api/v1` (ou `VITE_API_URL` se fornecida).
- Conectar `src/api/auth.ts` aos endpoints reais da API (`/auth/login`, `/auth/register`, `/auth/me`), desativando o mock local.
- Conectar `src/api/sistema.ts` ao endpoint `/health` da API, adaptando a resposta para `{ online: boolean }`.
- Garantir interoperabilidade de campos entre backend (`fullName`) e frontend (`name`), prevenindo exceções de runtime em componentes como `AppNavbar.vue`.
- Adequar `RegisterView.vue` para submeter `fullName` conforme a validação estrita em `auth.schema.ts`.
- Atualizar os botões de atalho de teste em `LoginView.vue` para refletir as credenciais reais do seed (`admin@gmail.com` / `admin123`).

**Non-Goals:**
- Alterar o backend (`apps/backend`) ou o banco de dados (`packages/database`), uma vez que já estão estabilizados e em conformidade com o PRD e a collection Bruno.
- Implementar fluxo de recuperação de senha por e-mail (fora do escopo da Parcial 1).
- Modificar estilos visuais ou tokens de cores do design system.

## Decisions

### 1. Centralização da Base URL via Vite Environment
- **Decisão:** Configurar `baseURL` como `import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'` em `apps/web/src/plugins/axios.ts`.
- **Alternativa considerada:** Usar proxy reverso no `vite.config.ts` (`server.proxy`).
- **Justificativa:** O backend já possui suporte nativo a CORS e preflight `OPTIONS` com `Access-Control-Allow-Origin: *`. O uso direto de `baseURL` simplifica testes, builds e alinhamento com a collection Bruno (`Local.bru`).

### 2. Normalização Transparente do Perfil de Usuário
- **Decisão:** Na camada `src/api/auth.ts` (ou store), mapear o perfil retornado garantindo tanto `name` quanto `fullName`:
  ```ts
  const user = {
    ...rawUser,
    name: rawUser.fullName || rawUser.name,
    fullName: rawUser.fullName || rawUser.name,
  };
  ```
- **Alternativa considerada:** Refatorar todos os componentes Vue para usar exclusivamente `user.fullName`.
- **Justificativa:** A refatoração em larga escala em múltiplos componentes e templates criaria riscos de regressão visual. A normalização na borda da API preserva retrocompatibilidade e atende aos dois contratos.

### 3. Envio de `fullName` no Autocadastro
- **Decisão:** Atualizar `RegisterInput` e o formulário `RegisterView.vue` para enviar `fullName: form.name.trim()`.
- **Alternativa considerada:** Mudar o backend para aceitar `name` ou `fullName`.
- **Justificativa:** A collection Bruno (`Register.bru`) e os schemas do backend definem `fullName` como canônico. Seguir o contrato já existente respeita a hierarquia do projeto.

## Risks / Trade-offs

- **[Risco] Backend ou PostgreSQL desligado durante o desenvolvimento**:
  - *Mitigação*: O interceptor do Axios trata erros de rede de forma graciosa e a tela exibe mensagem amigável no banner de erro; o healthcheck em `sistemaApi.status()` reporta `online: false` sem travar a interface.
- **[Risco] Sessão inválida ou token expirado ao carregar a página**:
  - *Mitigação*: A action `fetchCurrentUser()` do Pinia já captura erros 401/404 chamando `logout()`, e o interceptor do Axios remove o token e redireciona para `/login`.

## Migration Plan

1. Criar variáveis de ambiente opcionais `VITE_API_URL` em `apps/web/.env` se necessário (padrão automático já é localhost:3001/api/v1).
2. Não há migração de banco de dados necessária (o seed `007_seed_default_admin.sql` já existe).
3. Testar a autenticação de ponta a ponta: login com Admin, autocadastro de novo cliente e navegação autenticada.
