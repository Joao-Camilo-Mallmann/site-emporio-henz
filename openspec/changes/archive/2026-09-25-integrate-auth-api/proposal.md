# Proposal · Integração da Autenticação Frontend com a API Backend Bun

## Why

Atualmente, o frontend Vue 3 (`apps/web`) opera com autenticação simulada em memória (`USE_MOCK = true` em `src/api/auth.ts`) e configurações de rede incompatíveis com o backend Bun (`apps/backend`):
1. A `baseURL` do Axios referencia `import.meta.env.PORT`, indisponível no cliente Vite (resolvendo como `undefined`).
2. As rotas chamam caminhos duplicados (`/api/auth/login` em vez de `/auth/login` sobre o prefixo `/api/v1`).
3. O formulário de autocadastro envia `name` em vez de `fullName`, violando o schema do backend.
4. O backend já possui persistência no PostgreSQL, migrações com seed do administrador padrão (`admin@gmail.com` / `admin123`) e collection Bruno validada.

Esta mudança conecta o frontend diretamente à API real em Bun e à persistência PostgreSQL, garantindo que login, autocadastro, restauração de sessão e verificação de saúde do sistema funcionem de ponta a ponta.

## What Changes

- **Axios Base URL**: Configurar `baseURL` no cliente Axios em `src/plugins/axios.ts` utilizando `import.meta.env.VITE_API_URL` com fallback para `http://localhost:3001/api/v1`.
- **Desativação de Mock e Correção de Endpoints**: Em `src/api/auth.ts`, desativar `USE_MOCK` e corrigir os caminhos de chamada para `/auth/login`, `/auth/register` e `/auth/me` (sem duplicação de prefixo).
- **Adequação de Contratos de Dados**:
  - Alinhar payload de cadastro em `RegisterView.vue` e `src/types/auth.ts` para enviar `fullName` exigido pelo backend em `auth.schema.ts`.
  - Normalizar o objeto de perfil retornado na API garantindo compatibilidade entre `fullName` do backend e `name` consumido pela interface e pelo `AppNavbar.vue`.
  - Em `src/api/sistema.ts`, mapear a resposta de `/health` para a interface `BackendStatus` (`online: status === 'ok'`).
- **Atualização de Credenciais de Teste**: Em `LoginView.vue`, atualizar os atalhos de teste para utilizar a conta do administrador padrão gerada pelo banco (`admin@gmail.com` / `admin123`).

## Capabilities

### New Capabilities
*(Nenhuma nova capacidade necessária; as capacidades de autenticação já foram concebidas e agora recebem a integração de rede real).*

### Modified Capabilities
- `auth-store-and-interceptor`: Conectar o cliente Axios diretamente aos endpoints REST `/auth/login`, `/auth/register`, `/auth/me` e `/health` do backend Bun, desativando o mock em memória e assegurando a persistência e renovação do JWT.
- `auth-screens`: Adaptar os formulários de login e autocadastro aos contratos reais da API (campo `fullName`, credenciais de teste do seed PostgreSQL `admin@gmail.com`).

## Impact

- **Frontend (`apps/web`)**:
  - `src/plugins/axios.ts`: Ajuste da URL base para `http://localhost:3001/api/v1`.
  - `src/api/auth.ts`: Remoção do desvio para mock e correção dos endpoints.
  - `src/api/sistema.ts`: Mapeamento correto do healthcheck da API.
  - `src/types/auth.ts`: Ajustes e compatibilização de tipos `RegisterInput` e `UserProfile`.
  - `src/views/auth/LoginView.vue`: Atalhos de teste apontando para credenciais de seed.
  - `src/views/auth/RegisterView.vue`: Envio de `fullName` no payload de registro.
- **Backend (`apps/backend`)**: Nenhuma alteração necessária; endpoints e schemas já atendem à collection Bruno canônica.
- **Database (`packages/database`)**: Nenhuma alteração necessária; seed `007_seed_default_admin.sql` já ativo.
