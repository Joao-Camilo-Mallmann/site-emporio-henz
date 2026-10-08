# Diretrizes e Padrões — Frontend (`frontend`)

> [!IMPORTANT]
> **ATENÇÃO:**
>
> - Antes de trabalhar no frontend, siga a hierarquia de [`agents.md`](../agents.md): o [`docs/PRD.md`](../docs/PRD.md) define produto e regras de negócio; este arquivo define apenas como implementá-los na interface.
> - **NOVAS FUNCIONALIDADES DEVEM PASSAR PELO OPENSPEC:** Ao solicitar ou desenvolver novas features, sempre alertar e direcionar o usuário para o fluxo do OpenSpec (`openspec-explore` e `openspec-propose`).
> - **DECOMPOSIÇÃO ESTRITA DE TAREFAS:** Telas e componentes correspondem a tarefas `[FE]` integradas a rotas `[BE]` e esquemas de dados previamente estruturados. Consulte [docs/padrao-historias-tarefas.md](../docs/padrao-historias-tarefas.md).
> - **DESIGN SYSTEM E PADRONIZAÇÃO DE CORES (OBRIGATÓRIO):** É estritamente proibido usar valores hexadecimais arbitrários nas classes de estilo. Use apenas os tokens semânticos do tema Tailwind configurados em `src/style.css`. O catálogo canônico está em [docs/frontend/design-system-cores.md](../docs/frontend/design-system-cores.md).
> - **COMPONENTES DE UI DO DESIGN SYSTEM (OBRIGATÓRIO):** Sempre utilize os componentes globais reutilizáveis de `src/components/ui/` (`<UiButton>`, `<UiModal>`, `<UiCard>`, etc.) para construir interfaces e disparadores de ação. É estritamente proibido utilizar tags `<button>` nativas soltas com estilos arbitrários. O `<UiButton>` suporta as variantes `'primary'`, `'secondary'`, `'outline'`, `'ghost'`, `'danger'` e `'link'`.
> - **MANUTENÇÃO DOCUMENTAL:** Mudanças de fluxo ou arquitetura atualizam [docs/frontend/README.md](../docs/frontend/README.md). Mudanças de comportamento do produto atualizam primeiro o PRD. Alterações no consumo da API devem permanecer compatíveis com a collection Bruno em [docs/backend/collections/bruno/](../docs/backend/collections/bruno/).

---

## 1. Stack Tecnológico

O frontend é Vue 3 com Composition API e TypeScript, empacotado com Vite. A estilização é Tailwind CSS v4 com tokens no tema global. O roteamento fica em `src/router/`, o estado em Pinia (`src/stores/`) e o cliente HTTP em `src/plugins/axios.ts`. A checagem de tipos usa `vue-tsc`.

### 1.1. Design System e Tokens de Cores

Os tokens oficiais vivem em `src/style.css` e são documentados exclusivamente em [docs/frontend/design-system-cores.md](../docs/frontend/design-system-cores.md). Não replique seus valores neste arquivo.

### 1.2. Componentes e Auto-import (`unplugin-vue-components`)

O frontend possui auto-import automático de componentes configurado no Vite via `unplugin-vue-components`.
- Qualquer componente criado dentro de `src/components/` (ex: `src/components/ui/`, `src/components/layout/`, etc.) é automaticamente resolvido e importado nos templates Vue sem necessidade de imports manuais (`import ...`) nem registros manuais no `main.ts` / `plugins/index.ts` com `app.component()`.
- O arquivo `src/components.d.ts` é mantido e gerado automaticamente pelo plugin para tipagem completa no TypeScript.
- **Obrigatoriedade e Reaproveitamento dos componentes de UI (`src/components/ui/`)**:
  - **NÃO RECRIE COMPONENTES NEM ESTILOS DO ZERO**: Sempre reutilize os componentes de `src/components/ui/`. Nunca escreva botões manuais com `<button>` ou estilizações soltas de classes Tailwind quando já existe variante oficial no componente.
  - `<UiButton>`: Obrigatório para qualquer botão, link com cara de botão ou ação interativa na interface. Variantes: `'primary'`, `'secondary'`, `'outline'`, `'ghost'`, `'danger'` e `'link'`. Tamanhos: `'xs'`, `'sm'`, `'md'`, `'lg'`, `'xl'`, `'icon'` e `'none'`. Suporta `block` (largura total) e `:loading` (spinner integrado).
  - `<UiModal>`: Obrigatório para diálogos, confirmações e modais da interface.
  - `<UiCard>`, `<UiFloatingActions>` e `<UiFloatingButton>`: Componentes oficiais de superfícies e ações flutuantes.

#### Cheat Sheet de Reutilização (`<UiButton>`):
- **Formulário / Submit**: `<UiButton type="submit" variant="primary" size="lg" block :loading="loading">Entrar</UiButton>`
- **Cadastro / Novo**: `<UiButton variant="secondary" size="md" @click="goToNew">Novo Registro</UiButton>`
- **Cancelar / Voltar**: `<UiButton variant="outline" size="md" @click="cancel">Cancelar</UiButton>`
- **Ação em Linha de Tabela**: `<UiButton variant="ghost" size="icon" title="Editar" aria-label="Editar" @click="edit"><Icon icon="mdi:pencil-outline" class="w-4 h-4" /></UiButton>`
- **Link Inline no Texto**: `<UiButton variant="link" size="none" @click="go">Clique aqui</UiButton>`
- **Paginação / Ícones**: `<UiButton variant="outline" size="sm" :disabled="isFirst" @click="prev">Anterior</UiButton>`

---

## 2. Estrutura de Camadas e Diretórios (`src/`)

### 2.1. Plugins (`src/plugins/`)

Centraliza a configuração de bibliotecas de terceiros. O Axios define URL base, timeout e interceptors. O Pinia é criado e registrado a partir desta pasta, e o ponto de montagem da aplicação deve usar o registro único de plugins.

### 2.2. Tipos e Modelos de Domínio (`src/types/`)

Centraliza tipos, interfaces e classes da aplicação: modelos de domínio, contratos de rede e props de componentes. A exportação pública deve passar pelo barrel da pasta, sem espalhar tipos soltos pelas views.

### 2.3. Camada de Serviços de Rotas de API (`src/api/`)

Encapsula as requisições HTTP com o Axios configurado. Os módulos exportam métodos assíncronos tipados e nunca inventam rotas ou payloads: a fonte de consulta da API é a [collection Bruno](../docs/backend/collections/bruno/). A exportação pública passa pelo barrel da pasta.

### 2.4. Stores (`src/stores/`)

As stores do Pinia consomem exclusivamente os serviços de `src/api/` e tipam o estado utilizando `src/types/`.

---

## 3. Comandos do Frontend

Use os scripts do `frontend` via Bun: desenvolvimento com HMR, lint, checagem de tipos e build de produção. Não documente a invocação desses scripts neste arquivo; o README do serviço e o `package.json` são a referência operacional.
