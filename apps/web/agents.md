# Diretrizes e Padrões — Frontend (`apps/web`)

> [!IMPORTANT]
> **ATENÇÃO:**
>
> - Antes de trabalhar no frontend, siga a hierarquia de [`agents.md`](../../agents.md): o [`docs/PRD.md`](../../docs/PRD.md) define produto e regras de negócio; este arquivo define apenas como implementá-los na interface.
> - **NOVAS FUNCIONALIDADES DEVEM PASSAR PELO OPENSPEC:** Ao solicitar ou desenvolver novas features, sempre alertar e direcionar o usuário para o fluxo do OpenSpec (`openspec-explore` e `openspec-propose`).
> - **DECOMPOSIÇÃO ESTRITA DE TAREFAS:** Telas e componentes correspondem a tarefas `[FE]` integradas a rotas `[BE]` e esquemas de dados previamente estruturados. Consulte [docs/padrao-historias-tarefas.md](../../docs/padrao-historias-tarefas.md).
> - **DESIGN SYSTEM E PADRONIZAÇÃO DE CORES (OBRIGATÓRIO):** É estritamente proibido usar valores hexadecimais arbitrários nas classes de estilo. Use apenas os tokens semânticos do tema Tailwind configurados em `src/style.css`. O catálogo canônico está em [docs/frontend/design-system-cores.md](../../docs/frontend/design-system-cores.md).
> - **COMPONENTE GLOBAL DE BOTÃO (`<UiButton>` — OBRIGATÓRIO):** É mandatório utilizar o componente global `<UiButton>` para todos os botões e disparadores de ação na interface. Nunca utilize tags `<button>` nativas soltas com estilos arbitrários. O `<UiButton>` está registrado globalmente em `src/plugins/index.ts` e tipado em `src/components.d.ts` (dispensando imports locais). Suporta as variantes `'primary'` (padrão), `'secondary'` e `'outline'`.
> - **MANUTENÇÃO DOCUMENTAL:** Mudanças de fluxo ou arquitetura atualizam [docs/frontend/README.md](../../docs/frontend/README.md). Mudanças de comportamento do produto atualizam primeiro o PRD. Alterações no consumo da API devem permanecer compatíveis com a collection Bruno em [docs/backend/collections/bruno/](../../docs/backend/collections/bruno/).

---

## 1. Stack Tecnológico

O frontend é Vue 3 com Composition API e TypeScript, empacotado com Vite. A estilização é Tailwind CSS v4 com tokens no tema global. O roteamento fica em `src/router/`, o estado em Pinia (`src/stores/`) e o cliente HTTP em `src/plugins/axios.ts`. A checagem de tipos usa `vue-tsc`.

### 1.1. Design System e Tokens de Cores

Os tokens oficiais vivem em `src/style.css` e são documentados exclusivamente em [docs/frontend/design-system-cores.md](../../docs/frontend/design-system-cores.md). Não replique seus valores neste arquivo.

### 1.2. Componentes e Auto-import (`unplugin-vue-components`)

O frontend possui auto-import automático de componentes configurado no Vite via `unplugin-vue-components`.
- Qualquer componente criado dentro de `src/components/` (ex: `src/components/ui/`, `src/components/layout/`, etc.) é automaticamente resolvido e importado nos templates Vue sem necessidade de imports manuais (`import ...`) nem registros manuais no `main.ts` / `plugins/index.ts` com `app.component()`.
- O arquivo `src/components.d.ts` é mantido e gerado automaticamente pelo plugin para tipagem completa no TypeScript.
- **Obrigatoriedade de uso do `<UiButton>`**: Sempre utilize o componente `<UiButton>` para qualquer botão ou ação interativa na interface web, garantindo consistência visual e semântica com o Design System. Não utilize tags `<button>` nativas soltas com estilos manuais. Variantes disponíveis: `'primary'`, `'secondary'` e `'outline'`.

---

## 2. Estrutura de Camadas e Diretórios (`src/`)

### 2.1. Plugins (`src/plugins/`)

Centraliza a configuração de bibliotecas de terceiros. O Axios define URL base, timeout e interceptors. O Pinia é criado e registrado a partir desta pasta, e o ponto de montagem da aplicação deve usar o registro único de plugins.

### 2.2. Tipos e Modelos de Domínio (`src/types/`)

Centraliza tipos, interfaces e classes da aplicação: modelos de domínio, contratos de rede e props de componentes. A exportação pública deve passar pelo barrel da pasta, sem espalhar tipos soltos pelas views.

### 2.3. Camada de Serviços de Rotas de API (`src/api/`)

Encapsula as requisições HTTP com o Axios configurado. Os módulos exportam métodos assíncronos tipados e nunca inventam rotas ou payloads: a fonte de consulta da API é a [collection Bruno](../../docs/backend/collections/bruno/). A exportação pública passa pelo barrel da pasta.

### 2.4. Stores (`src/stores/`)

As stores do Pinia consomem exclusivamente os serviços de `src/api/` e tipam o estado utilizando `src/types/`.

---

## 3. Comandos do Frontend

Use os scripts do pacote `apps/web` via Bun: desenvolvimento, lint, checagem de tipos e build de produção. Não documente a invocação desses scripts neste arquivo; o README do serviço e o `package.json` são a referência operacional.
