## 1. Back-end: Endpoint e Validações de Perfil Próprio [BE]

- [x] 1.1 Criar schema de validação `validateUpdateProfile` em `apps/backend/src/modules/auth/auth.schema.ts` aceitando `fullName`, `phone`, `city` e `password` com os 5 critérios de segurança, descartando e bloqueando `role` e `email`
- [x] 1.2 Implementar método `updateProfile` em `apps/backend/src/modules/auth/auth.service.ts` reutilizando transação do repositório para atualizar `users` e `clients` usando `ctx.user.id`
- [x] 1.3 Implementar método `updateProfile` em `apps/backend/src/modules/auth/auth.controller.ts` para processar a requisição e responder com perfil atualizado
- [x] 1.4 Registrar rota `PUT /me` protegida exclusivamente com `authMiddleware` em `apps/backend/src/modules/auth/auth.routes.ts`
- [x] 1.5 Criar arquivo de requisição `UpdateMe.bru` na pasta `docs/backend/collections/bruno/Auth/` com header Bearer e payload JSON
- [x] 1.6 Adicionar testes automatizados cobrindo atualização com sucesso, validação de senha fraca e prevenção de elevação de privilégios

## 2. Front-end: Tela de Perfil e Navegação [FE]

- [x] 2.1 Adicionar método `atualizarPerfil` no serviço `apps/web/src/api/auth.ts` consumindo `PUT /auth/me`
- [x] 2.2 Atualizar o componente `apps/web/src/views/admin/usuarios/UsuarioForm.vue` para aceitar prop `hideRole?: boolean` e ocultar a seleção de "Perfil de Acesso"
- [x] 2.3 Criar a view `apps/web/src/views/profile/PerfilView.vue` carregando dados via `authApi.me()`, renderizando o formulário adaptado e salvando via `authApi.atualizarPerfil()`
- [x] 2.4 Registrar a rota `/perfil` em `apps/web/src/router/index.ts` com `meta: { requiresAuth: true, title: 'Meu Perfil | Empório Henz' }`
- [x] 2.5 Atualizar o componente `apps/web/src/components/layout/AppNavbar.vue` nos menus desktop e mobile para direcionar Admin para `/admin/usuarios/${user.id}/editar` e Cliente/Vendedor para `/perfil`
- [x] 2.6 Executar build e validação de types no front (`bun run typecheck` / `bun run build`) e conferir o redirecionamento com toasts
