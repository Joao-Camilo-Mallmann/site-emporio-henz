# Tarefas de Implementação: Migração para vue3-toastify

## 1. Instalação e Configuração Global do Toast

- [x] 1.1 [FE] Instalar o pacote `vue3-toastify` na aplicação web (`apps/web`) via Bun
- [x] 1.2 [FE] Registrar o plugin `Vue3Toastify` em `apps/web/src/plugins/index.ts` com configurações padrão (posição `bottom-right`, tema `light`, `autoClose: 3500`, `clearOnUrlChange: false`) e importação do CSS correspondente
- [x] 1.3 [FE] Expor `$toast` em `app.config.globalProperties.$toast` e estender a tipagem de `ComponentCustomProperties` em `apps/web/src/vite-env.d.ts` para suporte tipado em templates
- [x] 1.4 [FE] Criar o composable `apps/web/src/composables/useToast.ts` exportando métodos tipados (`success`, `error`, `warning`, `info`, `clear`) e a instância original

## 2. Remoção do Sistema Legado de Alertas

- [x] 2.1 [FE] Remover `SystemAlert`, `systemAlert`, `showAlert` e `clearAlert` de `apps/web/src/stores/app.ts`
- [x] 2.2 [FE] Remover o container do banner estático de notificação e seu botão fechar em `apps/web/src/App.vue`
- [x] 2.3 [FE] Atualizar os guards de autenticação e autorização em `apps/web/src/router/index.ts` para disparar toasts via `useToast` ou `toast`

## 3. Migração das Views e Verificação de Qualidade

- [x] 3.1 [FE] Migrar notificações de fornecedores em `FornecedorNewView.vue`, `FornecedorEditView.vue` e `FornecedorListView.vue` para `useToast()`
- [x] 3.2 [FE] Migrar notificações de usuários em `UsuarioNewView.vue`, `UsuarioEditView.vue` e `UsuarioListView.vue` para `useToast()`
- [x] 3.3 [FE] Validar harmonia visual dos toasts com a tipografia do tema e executar `bun run check-types` e `bun run lint` garantindo zero erros ou regressões
