# Proposta: Migração do Sistema de Notificações para vue3-toastify

## Why

Atualmente, o sistema de alertas do front-end (`frontend`) baseia-se em um banner estático em `App.vue` acoplado ao estado da store `useAppStore`. Esse modelo apresenta limitações severas de UX: suporta apenas uma notificação por vez (sobrescrevendo mensagens anteriores), não possui auto-dismiss (exigindo ação manual do usuário para fechar), desloca o layout da página para baixo ao ser exibido e sobrecarrega a store global de estado com dados transitórios de interface.

A migração para a biblioteca `vue3-toastify` substitui o banner estático por notificações flutuantes dinâmicas, com animações suaves, empilhamento, fechamento automático configurável e suporte a temas, preservando a visibilidade durante navegações de rota.

## What Changes

- **Instalação de Dependência**: Adição do pacote `vue3-toastify` no workspace do front-end (`frontend`).
- **Plugin e Configuração Global**:
  - Registro e inicialização do `Vue3Toastify` em `src/plugins/index.ts` com tema claro (`light`), posicionamento no canto inferior direito (`bottom-right`), autoClose padrão de 3500ms e `clearOnUrlChange: false` (toasts permanecem ativos mesmo após redirecionamento de rotas).
  - Disponibilização da propriedade global `$toast` via `app.config.globalProperties.$toast` com tipagem TypeScript em `ComponentCustomProperties` para uso direto em templates Vue.
- **Composable Dedicado (`useToast`)**:
  - Criação de `frontend/src/composables/useToast.ts` fornecendo métodos tipados (`success`, `error`, `warning`, `info`, `clear`) para uso idiomático na Composition API.
- **Remoção de Código Legado (BREAKING INTERNO)**:
  - Remoção de `systemAlert`, `showAlert` e `clearAlert` da store `useAppStore` (`frontend/src/stores/app.ts`).
  - Remoção do bloco de renderização do banner estático em `frontend/src/App.vue`.
  - Refatoração de todas as chamadas `appStore.showAlert(...)` para a nova API de toast nas views administrativas e no guard de rotas (`src/router/index.ts`).

## Capabilities

### New Capabilities

- `toast-notifications`: Sistema moderno de feedback visual e notificações flutuantes (toasts) no front-end web, integrando `vue3-toastify`, composable `useToast` e propriedade global `$toast`.

### Modified Capabilities

<!-- Nenhuma especificação de requisito existente precisa de alteração estrutural delta. -->

## Impact

- **Código Afetado**:
  - `frontend/package.json`: inclusão da dependência `vue3-toastify`.
  - `frontend/src/plugins/index.ts`: registro do plugin e injeção do `$toast`.
  - `frontend/src/vite-env.d.ts` (ou `src/types/`): tipagem TypeScript de `$toast`.
  - `frontend/src/composables/useToast.ts`: criação do composable.
  - `frontend/src/stores/app.ts`: remoção de estado e métodos de alerta.
  - `frontend/src/App.vue`: remoção do banner de notificação fixo.
  - `frontend/src/router/index.ts`: atualização dos avisos de redirecionamento/permissão.
  - `frontend/src/views/admin/fornecedores/*` e `frontend/src/views/admin/usuarios/*`: substituição de `appStore.showAlert` por toast.
- **APIs / Dependências**: Adição da dependência `vue3-toastify`. Nenhuma alteração no backend ou banco de dados.
