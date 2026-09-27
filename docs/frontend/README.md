# Documentação de Front-end — Empório Henz

Este diretório concentra as diretrizes visuais, catálogo do Design System e especificações de interface e experiência de usuário (UI/UX) do Portal Empório Henz.

---

## 🎨 Diretrizes Arquiteturais (Front-end)

Conforme estabelecido nas regras do projeto ([agents.md](../../agents.md) e [apps/web/agents.md](../../apps/web/agents.md)):

1. **Stack Técnica**:
   - **Framework**: [Vue 3](https://vuejs.org/) (Composition API com `<script setup lang="ts">`).
   - **Build Tool**: [Vite](https://vitejs.dev/).
   - **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) com tokens semânticos centralizados no `@theme` (`src/style.css`).
   - **Gerenciamento de Estado**: [Pinia](https://pinia.vuejs.org/).
   - **Roteamento**: [Vue Router 4](https://router.vuejs.org/).

2. **Regra de Ouro do Design System (Proibição de Hexadecimais Arbitrários)**:
   > [!IMPORTANT]
   > É **terminantemente proibido** utilizar valores hexadecimais inline arbitrários (como `bg-[#123854]`, `text-[#007CD8]`, `border-[#D0D5DD]`).
   > Todas as cores do Figma possuem tokens semânticos oficiais mapeados no Tailwind.

3. **Padronização de Botões com `<UiButton>` e Auto-import de Componentes**:
   > [!IMPORTANT]
   > - É **obrigatório** utilizar o componente `<UiButton>` para todos os botões e disparadores de ação na interface. Não utilize tags `<button>` nativas soltas com estilos ad-hoc. Variantes disponíveis: `primary`, `secondary` e `outline`.
   > - O projeto utiliza `unplugin-vue-components`. Todo e qualquer componente criado em `apps/web/src/components/` é automaticamente importado nos templates e tem seus tipos TypeScript gerados em `apps/web/src/components.d.ts` sem necessidade de imports manuais ou registros com `app.component()`.

4. **Sistema de Notificações Flutuantes (Toasts)**:
   Notificações e feedbacks visuais transitórios utilizam a biblioteca `vue3-toastify` configurada no plugin global (tema `light`, posição `bottom-right`, `autoClose: 3500ms` e `clearOnUrlChange: false`). Devem ser acionadas idiomaticamente via composable `useToast()` (`apps/web/src/composables/useToast.ts`) na Composition API ou pela propriedade global de template `$toast`. O banner estático em `App.vue` e o estado `systemAlert` na store `useAppStore` foram descontinuados.

---

## 📁 Arquivos e Guias do Diretório

| Arquivo                                            | Descrição                                                                                                                                                                        |
| :------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [design-system-cores.md](./design-system-cores.md) | Catálogo completo de cores oficiais do Figma, tokens semânticos do Tailwind v4 (`primary`, `secondary`, `neutral-dark`, `wood-*`, `surface-*`), códigos HEX e diretrizes de uso. |
| [backend/collections/bruno/](../backend/collections/bruno/) | Fonte de consulta da API V1 para integração do front-end: rotas, payloads, autenticação Bearer e ambientes. |

---

## 🖥️ Aplicação Web (`apps/web`)

Para detalhes de desenvolvimento, estrutura de componentes, views e regras específicas do cliente web, consulte:

- Diretório da aplicação: [apps/web](../../apps/web)
- Regras para agentes e desenvolvedores: [apps/web/agents.md](../../apps/web/agents.md)

---

## 🚀 Como Executar o Front-end

- **Desenvolvimento (porta 3000)**:
  ```bash
  bun run --filter web dev
  # ou na raiz
  bun run dev
  ```
- **Checagem de Tipos e Lint**:
  ```bash
  bun run check-types
  bun run lint
  ```
- **Build de Produção**:
  ```bash
  bun run build
  ```
