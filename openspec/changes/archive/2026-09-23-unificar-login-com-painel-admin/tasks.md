# Tasks

## 1. Unificação da Autenticação e Limpeza de Rotas Legadas

- [x] 1.1 Atualizar `LoginView.vue` em `apps/web/src/views/auth/LoginView.vue` para disponibilizar atalhos de teste para os três perfis (Cliente, Vendedor, Admin) e redirecionar para a Home (`/`) ou parâmetro de consulta `redirect`.
- [x] 1.2 Remover a rota legada `/equipe/login` em `apps/web/src/router/index.ts` e excluir o componente obsoleto `apps/web/src/views/auth/EquipeLoginView.vue`.
- [x] 1.3 Atualizar `apps/web/src/plugins/axios.ts` e `apps/web/src/components/layout/AppFooter.vue` removendo checagens e atalhos obsoletos para `/equipe/login`.

## 2. Implementação da Rota e Guarda do Painel Administrativo

- [x] 2.1 Criar o componente de visualização base `AdminDashboardView.vue` em `apps/web/src/views/admin/AdminDashboardView.vue` com identidade visual nobre, saudação ao usuário autenticado, badge de cargo (`Vendedor` / `Administrador`) e botão de retorno à vitrine da loja.
- [x] 2.2 Registrar a rota `/admin` em `apps/web/src/router/index.ts` e implementar a guarda de navegação global (`router.beforeEach`) que redireciona visitantes para `/login?redirect=/admin` e barra clientes comuns (`role = 1`) redirecionando para a Home com notificação.

## 3. Botão do Painel Admin no Header e Validação Final

- [x] 3.1 Adicionar o botão "Painel Admin" adjacente a "Minha conta" no cabeçalho desktop e no drawer mobile em `apps/web/src/components/layout/AppNavbar.vue` condicionado a `authStore.isEquipe`, atualizando também o link interno no dropdown do usuário para `/admin`.
- [x] 3.2 Executar build do projeto (`bun run build`) e validar que a compilação TypeScript e Vite é concluída sem erros ou avisos de tipos.
