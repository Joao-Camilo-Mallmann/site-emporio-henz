## Context

Atualmente no frontend (`AppNavbar.vue`), o link de "Editar Usuário" redireciona apenas administradores para `/admin/usuarios/:id/editar`, enviando clientes e vendedores de volta à home (`/`). Além disso, as rotas administrativas `/admin/usuarios/*` estão protegidas para permitir apenas o perfil Administrador (`UserRole.Administrador`).

No backend, todas as rotas de mutação de usuários (`PUT /api/v1/users/:id`) exigem `requireRole(ROLES.ADMIN)`. Não existe um endpoint que permita aos usuários autenticados comuns atualizarem seus próprios dados e senhas.

Para sanar este problema sem quebrar a matriz de segurança e RBAC do projeto (RNF09 do PRD), o sistema adotará um endpoint próprio desacoplado `PUT /api/v1/auth/me` e uma interface web dedicada em `/perfil`.

## Goals / Non-Goals

**Goals:**
- Disponibilizar o endpoint `PUT /api/v1/auth/me` para atualização dos próprios dados cadastrais (`fullName`, `phone`, `city`) e redefinição opcional de senha por qualquer usuário autenticado.
- Bloquear estritamente qualquer alteração de `role` (cargo) ou `email` via `PUT /api/v1/auth/me`.
- Manter `PUT /api/v1/users/:id` restrito a Administradores com `requireRole(ROLES.ADMIN)`.
- Criar a rota web `/perfil` e a view `PerfilView.vue` acessível por clientes e vendedores autenticados.
- Reaproveitar o formulário `UsuarioForm.vue` adicionando a prop `hideRole: boolean` para ocultar o seletor de "Perfil de Acesso" na tela do perfil próprio.
- Ajustar os links de perfil no `AppNavbar.vue` para apontar para `/admin/usuarios/${user.id}/editar` quando Admin e `/perfil` quando Cliente ou Vendedor.
- Documentar a requisição `UpdateMe.bru` na collection Bruno em `docs/backend/collections/bruno/Auth/`.

**Non-Goals:**
- Permitir alteração de e-mail do usuário (o e-mail é a chave única/identificador de login no sistema).
- Permitir que clientes ou vendedores alterem seus próprios cargos ou acessem dados de outros usuários.
- Modificar o fluxo de gerenciamento administrativo de usuários existente em `/admin/usuarios`.

## Decisions

### 1. `PUT /api/v1/auth/me` vs `PUT /api/v1/users/:id`
- **Decisão**: Utilizar `PUT /api/v1/auth/me` para atualização de perfil próprio em vez de flexibilizar `PUT /api/v1/users/:id`.
- **Justificativa**:
  - Elimina riscos de vulnerabilidade IDOR (Insecure Direct Object Reference), pois o ID do usuário é extraído exclusivamente do token criptográfico (`ctx.user.id`).
  - O grupo `/api/v1/auth` já possui `GET /api/v1/auth/me` para leitura; adicionar o método `PUT` mantém a consistência da API REST.
  - A rota `PUT /api/v1/users/:id` continua limpa, contendo apenas regras administrativas.
- **Alternativa descartada**: Permitir que não-admins chamassem `PUT /api/v1/users/:id` quando `params.id === ctx.user.id`. Essa abordagem aumenta a complexidade de validação e o risco de vazamento de privilégios.

### 2. Validação e Higienização de Payload no Backend
- **Decisão**: Criar o validador `validateUpdateProfile` em `apps/backend/src/modules/auth/auth.schema.ts`.
- **Campos aceitos**:
  - `fullName`: string obrigatória, mínimo de 2 caracteres.
  - `phone`: string opcional (higienizada).
  - `city`: string opcional.
  - `password`: string opcional, validada contra os 5 critérios de complexidade já existentes no sistema (comprimento >= 8, maiúscula, minúscula, número e caractere especial).
- **Campos bloqueados**: `role` e `email` são descartados ou rejeitados para evitar elevação de privilégios.

### 3. Reaproveitamento de `UsuarioForm.vue` com prop `hideRole`
- **Decisão**: Parametrizar o componente `UsuarioForm.vue` existente recebendo `hideRole?: boolean` (padrão `false`).
- **Justificativa**: O formulário existente já possui regras avançadas de UX: máscara de telefone, validação reativa de complexidade de senha com medidor de força, alternância de visualização de senha e acessibilidade via `UiButton`. Ocultar o bloco de cargo permite total reuso de código sem duplicidade.

### 4. Rota `/perfil` no Frontend
- **Decisão**: Registrar a rota `/perfil` vinculada à `PerfilView.vue` com `meta: { requiresAuth: true }`.
- **Justificativa**: `/perfil` é conciso, padronizado e intuitivo para o usuário final, mantendo o layout e navegação da loja pública.

## Risks / Trade-offs

- **[Risco] Usuário tentar enviar `role` ou `email` via chamada direta de API**
  → **Mitigação**: O schema `validateUpdateProfile` não lê nem processa esses campos. Apenas os campos permitidos são repassados para a camada de persistência.
- **[Risco] Usuário não autenticado tentar acessar `/perfil`**
  → **Mitigação**: O guard global `router.beforeEach` detecta `requiresAuth: true` e redireciona para `/login?redirect=/perfil`.
- **[Risco] Cliente tentar acessar a URL `/admin/usuarios/.../editar` diretamente**
  → **Mitigação**: O guard global barra usuários sem o perfil `UserRole.Administrador` e exibe mensagem de advertência via toast.
