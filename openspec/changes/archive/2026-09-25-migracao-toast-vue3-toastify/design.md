# Design Técnico: Sistema de Notificações com vue3-toastify

## Context

O front-end do Portal Empório Henz (`apps/web`) utiliza Vue 3 com Composition API, Vite e Tailwind CSS v4. Atualmente, os alertas são gerenciados pela store Pinia `useAppStore` através de `systemAlert`, renderizado em um componente fixo logo abaixo da navbar em `App.vue`.

Esse modelo causa saltos de layout (*layout shifts*), limita as mensagens a uma única simultânea, exige intervenção manual do usuário para fechar e acopla a camada de apresentação transitória a uma store global do Pinia voltada para dados da aplicação.

Para modernizar o feedback visual, a biblioteca `vue3-toastify` será adotada como solução padrão para toasts não intrusivos, posicionados no canto inferior direito (`bottom-right`), com tema claro nativo e persistência visual durante trocas de rota.

## Goals / Non-Goals

**Goals:**
- Instalar e configurar `vue3-toastify` com opções globais pré-definidas (tema `light`, posição `bottom-right`, `autoClose: 3500ms`, `clearOnUrlChange: false`).
- Registrar o plugin em `src/plugins/index.ts` e expor `$toast` em `app.config.globalProperties.$toast` com tipagem TypeScript completa (`ComponentCustomProperties`).
- Criar o composable `useToast` em `src/composables/useToast.ts` com métodos convenientes (`success`, `error`, `warning`, `info`, `clear`) para uso na Composition API.
- Remover completamente `systemAlert`, `showAlert` e `clearAlert` da store `useAppStore`.
- Remover a barra estática de notificação de `App.vue`.
- Migrar todos os pontos de consumo (`router/index.ts` e views de fornecedores e usuários) para a nova API de toast.
- Alinhar a tipografia e estilização do toast com o Design System do Empório Henz (`var(--font-sans)`).

**Non-Goals:**
- Criar sistema de notificações persistentes em banco de dados ou painel de notificações com histórico (inbox).
- Alterar APIs de backend, endpoints ou collections Bruno.
- Modificar estilos do modal de confirmação existente (`UiModal`).

## Decisions

### 1. Adoção da biblioteca `vue3-toastify`
- **Decisão**: Utilizar `vue3-toastify` como motor de toasts.
- **Alternativas consideradas**:
  - *Construir componente proprietário de toasts com Pinia e TransitionGroup*: Maior custo de desenvolvimento e manutenção de animações, acessibilidade, filas e temporizadores.
  - *SweetAlert2 / vue-sweetalert2*: Focado em modais/alertas bloqueantes pesados, não ideal para notificações flutuantes sutis.
- **Motivação**: `vue3-toastify` é leve, amplamente testado, possui TypeScript nativo, suporta fila de toasts, temporizadores precisos e personalização via CSS variables.

### 2. Dupla Camada de Acesso: `$toast` Global + Composable `useToast()`
- **Decisão**: Disponibilizar o toast de duas formas:
  1. Globalmente em templates via `$toast` registrado no `app.config.globalProperties` e tipado em TypeScript.
  2. Via composable `useToast()` em `src/composables/useToast.ts` para uso dentro de `<script setup>` e rotas.
- **Motivação**: Oferece máxima ergonomia para o desenvolvedor: chamadas rápidas inline em templates (`@click="$toast.info('...')"`), suporte estruturado na Composition API com facilidade de mocking em testes e chamadas diretas em guards de rotas (`router/index.ts`).

### 3. Posição e Tema
- **Decisão**: Posicionamento fixo em `bottom-right` e tema `light`.
- **Motivação**: Mantém a área de leitura e o cabeçalho livres de distrações no desktop, combinando com o tema claro e refinado do Empório Henz definido no Design System.

### 4. Persistência de Toasts em Mudança de Rota (`clearOnUrlChange: false`)
- **Decisão**: Manter toasts visíveis durante navegações de rota até o esgotamento do tempo limite (`autoClose`).
- **Motivação**: Permite padrões comuns de UX, como preencher formulário de criação/edição, redirecionar para a listagem (`router.push`) e exibir a mensagem de sucesso na tela de destino sem que a troca de rota interrompa o feedback.

## Risks / Trade-offs

- **[Risco] Incompatibilidade ou conflito com o Tailwind CSS v4**:
  - *Mitigação*: Importar o CSS de `vue3-toastify/dist/index.css` no plugin ou no `style.css` e ajustar variáveis de fonte `--toastify-font-family: var(--font-sans)`.
- **[Risco] Erros de tipagem do TypeScript no uso de `$toast` em templates**:
  - *Mitigação*: Declarar módulo para `vue` estendendo `ComponentCustomProperties` com `$toast` tipado em `src/vite-env.d.ts` e validar com `bun run check-types`.
- **[Risco] Quebra em views esquecidas que ainda chamam `appStore.showAlert`**:
  - *Mitigação*: Varredura completa via `git grep "showAlert"` e checagem estrita de tipos com `vue-tsc --noEmit`.

## Migration Plan

1. Adicionar dependência `vue3-toastify` via Bun (`bun add vue3-toastify --filter web`).
2. Configurar o plugin em `src/plugins/index.ts` e criar tipagem em `src/vite-env.d.ts`.
3. Criar o composable `src/composables/useToast.ts`.
4. Atualizar `src/router/index.ts` para invocar o toast nas validações de rota.
5. Atualizar as views administrativas de fornecedores e usuários para usar `useToast()`.
6. Remover `systemAlert`, `showAlert` e `clearAlert` de `src/stores/app.ts`.
7. Remover o container de alerta em `src/App.vue`.
8. Executar `bun run check-types` e `bun run lint` para garantir zero regressões.
