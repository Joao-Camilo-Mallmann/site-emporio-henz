## Why

Atualmente, quando um usuário com perfil Cliente ou Vendedor clica na opção "Editar Usuário" no menu de usuário (`AppNavbar.vue`), ele é redirecionado para a página inicial (`/`), pois a rota de edição existente (`/admin/usuarios/:id/editar`) é restrita aos administradores. Além disso, o backend não possui um endpoint que permita aos usuários comuns atualizarem seus próprios dados cadastrais e senha com segurança, já que `PUT /api/v1/users/:id` exige privilégios de Administrador.

Essa mudança resolve essa lacuna ao criar o endpoint `PUT /api/v1/auth/me` para edição dos próprios dados e a tela `/perfil` na interface web, permitindo que clientes e vendedores mantenham seus cadastros atualizados sem violar o isolamento de privilégios.

## What Changes

- **Novo endpoint `PUT /api/v1/auth/me`**: Permite que usuários autenticados (Cliente, Vendedor ou Admin) atualizem seus próprios dados cadastrais (`fullName`, `phone`, `city`) e redefinam sua senha de acesso, sem permitir a alteração de seu cargo (`role`) ou e-mail.
- **Isolamento de rotas administrativas**: Mantém a rota `PUT /api/v1/users/:id` e a tela `/admin/usuarios/:id/editar` estritamente restritas a Administradores (rejeitando com HTTP `403 Forbidden` qualquer tentativa de acesso por outros perfis).
- **Nova rota frontend `/perfil`**: Interface de visualização e edição de perfil integrada ao layout da loja para usuários comuns (Clientes e Vendedores).
- **Adaptação de `UsuarioForm.vue`**: Adiciona suporte à prop `hideRole` (ou `isSelfEdit`) para ocultar o seletor de "Perfil de Acesso" na edição de perfil próprio.
- **Ajuste de navegação no `AppNavbar.vue`**: Redireciona para `/admin/usuarios/:id/editar` se o usuário for Administrador, ou para `/perfil` se for Cliente/Vendedor.
- **Collection Bruno**: Adiciona a requisição `UpdateMe.bru` no diretório `docs/backend/collections/bruno/Auth/`.

## Capabilities

### New Capabilities

- `client-profile-screen`: Interface web dedicada na rota `/perfil` para clientes e vendedores atualizarem dados cadastrais e senha, integrada ao formulário existente e com feedback via toast.

### Modified Capabilities

- `backend-auth`: Adiciona a capacidade de atualização do perfil próprio do usuário logado via `PUT /api/v1/auth/me` com validação estrita de payload e rejeição de elevação de privilégio.

## Impact

- **Backend**:
  - `apps/backend/src/modules/auth/auth.routes.ts`: adiciona rota `PUT /me`.
  - `apps/backend/src/modules/auth/auth.controller.ts`: adiciona método `updateProfile`.
  - `apps/backend/src/modules/auth/auth.schema.ts`: adiciona validador `validateUpdateProfile`.
  - `apps/backend/src/modules/auth/auth.service.ts`: implementa `updateProfile`.
  - `docs/backend/collections/bruno/Auth/UpdateMe.bru`: nova requisição documentada na collection.
- **Frontend**:
  - `frontend/src/router/index.ts`: registra rota `/perfil` com `meta: { requiresAuth: true }`.
  - `frontend/src/views/profile/PerfilView.vue`: nova tela de perfil.
  - `frontend/src/views/admin/usuarios/UsuarioForm.vue`: prop para ocultar seleção de cargo.
  - `frontend/src/components/layout/AppNavbar.vue`: atualiza links de "Editar Usuário / Meu Perfil" (desktop e mobile).
  - `frontend/src/api/auth.ts`: adiciona método `atualizarPerfil(dados)`.
