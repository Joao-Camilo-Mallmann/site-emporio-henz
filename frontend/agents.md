# Diretrizes e Padrões — Frontend (`frontend`)

## Escopo

Este arquivo é o contexto completo do ambiente **frontend**: cobre `frontend/` e `docs/frontend/`. Tarefas `[FE]` não precisam ler `backend/agents.md`, `docs/backend/README.md` nem `docs/database/`.

- A única ponte com o backend é o [PRD](../docs/PRD.md) (regras de negócio) e a [collection Bruno](../docs/backend/collections/bruno/) (contrato da API, apenas para consulta).
- Se a interface depender de rota, payload ou campo que não existe na collection Bruno, não improvise: abra uma tarefa `[BE]` separada, que roda no ambiente backend.

> [!IMPORTANT]
> **ATENÇÃO:**
>
> - Antes de trabalhar no frontend, siga a hierarquia de [`agents.md`](../agents.md): o [`docs/PRD.md`](../docs/PRD.md) define produto e regras de negócio; este arquivo define apenas como implementá-los na interface.
> - **NOVAS FUNCIONALIDADES DEVEM PASSAR PELO OPENSPEC:** Ao solicitar ou desenvolver novas features, sempre alertar e direcionar o usuário para o fluxo do OpenSpec (`openspec-explore` e `openspec-propose`).
> - **DECOMPOSIÇÃO ESTRITA DE TAREFAS:** Telas e componentes correspondem a tarefas `[FE]` integradas a rotas `[BE]` e esquemas de dados previamente estruturados. Consulte [docs/padrao-historias-tarefas.md](../docs/padrao-historias-tarefas.md).
> - **DESIGN SYSTEM E PADRONIZAÇÃO DE CORES (OBRIGATÓRIO):** É estritamente proibido usar valores hexadecimais arbitrários nas classes de estilo. Use apenas os tokens semânticos do tema Tailwind configurados em `src/style.css`. O catálogo canônico está em [docs/frontend/design-system-cores.md](../docs/frontend/design-system-cores.md).
> - **COMPONENTES DE UI DO DESIGN SYSTEM (OBRIGATÓRIO):** Construa interfaces e disparadores de ação apenas com os componentes globais de `src/components/ui/`, conforme a seção 1.2. É estritamente proibido utilizar tags `<button>` nativas soltas com estilos arbitrários.
> - **PAGINAÇÃO (OBRIGATÓRIO):** Toda listagem paginada usa `<UiPagination>`. Veja a seção 4.
> - **MANUTENÇÃO DOCUMENTAL:** Mudanças de comportamento do produto atualizam primeiro o PRD. Demais atualizações seguem a seção 5.

---

## 1. Stack Tecnológico

O frontend é Vue 3 com Composition API e TypeScript, empacotado com Vite. A estilização é Tailwind CSS v4 com tokens no tema global. O roteamento fica em `src/router/`, o estado em Pinia (`src/stores/`) e o cliente HTTP em `src/plugins/axios.ts`. A checagem de tipos usa `vue-tsc`.

### 1.1. Design System e Tokens de Cores

Os tokens oficiais vivem em `src/style.css` e são documentados exclusivamente em [docs/frontend/design-system-cores.md](../docs/frontend/design-system-cores.md). Não replique seus valores neste arquivo.

### 1.2. Componentes e Auto-import (`unplugin-vue-components`)

O frontend possui auto-import automático de componentes configurado no Vite via `unplugin-vue-components`.
- Qualquer componente criado dentro de `src/components/` (ex: `src/components/ui/`, `src/components/layout/`, etc.) é automaticamente resolvido e importado nos templates Vue sem necessidade de imports manuais (`import ...`) nem registros manuais no `main.ts` / `plugins/index.ts` com `app.component()`.
- O arquivo `src/components.d.ts` é mantido e gerado automaticamente pelo plugin para tipagem completa no TypeScript.

#### Componentes de UI (`src/components/ui/`)

**NÃO RECRIE COMPONENTES NEM ESTILOS DO ZERO**: sempre reutilize os componentes de `src/components/ui/`. Nunca escreva botões manuais com `<button>` ou estilizações soltas de classes Tailwind quando já existe variante oficial no componente.

| Componente | Uso obrigatório em |
| --- | --- |
| `<UiButton>` | Qualquer botão, link com cara de botão ou ação interativa. Variantes: `'primary'`, `'secondary'`, `'outline'`, `'ghost'`, `'danger'` e `'link'`. Tamanhos: `'xs'`, `'sm'`, `'md'`, `'lg'`, `'xl'`, `'icon'` e `'none'`. Suporta `block` (largura total) e `:loading` (spinner integrado). |
| `<UiModal>` | Diálogos, confirmações e modais. |
| `<UiCard>` | Superfícies de conteúdo. |
| `<UiFloatingActions>` e `<UiFloatingButton>` | Ações flutuantes. |
| `<UiPagination>` | Paginação de qualquer listagem. Veja a seção 4. |

#### Cheat Sheet de Reutilização (`<UiButton>`):
- **Formulário / Submit**: `<UiButton type="submit" variant="primary" size="lg" block :loading="loading">Entrar</UiButton>`
- **Cadastro / Novo**: `<UiButton variant="secondary" size="md" @click="goToNew">Novo Registro</UiButton>`
- **Cancelar / Voltar**: `<UiButton variant="outline" size="md" @click="cancel">Cancelar</UiButton>`
- **Ação em Linha de Tabela**: `<UiButton variant="ghost" size="icon" title="Editar" aria-label="Editar" @click="edit"><Icon icon="mdi:pencil-outline" class="w-4 h-4" /></UiButton>`
- **Link Inline no Texto**: `<UiButton variant="link" size="none" @click="go">Clique aqui</UiButton>`
- **Paginação**: use `<UiPagination>`, nunca botões Anterior/Próxima montados à mão. Veja a seção 4.

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

---

## 4. Paginação de Listagens

### 4.1. Contrato consumido

Toda rota de listagem da API é paginada e responde no envelope único `{ data, pagination }`. Os padrões (`page`, `limit`, valores padrão e máximos, tratamento de valores inválidos) e as exceções são definidos pelo RNF11 do [PRD](../docs/PRD.md); não copie esses números para o código nem para a documentação do frontend. Os parâmetros aceitos por cada rota estão na [collection Bruno](../docs/backend/collections/bruno/).

O frontend tipa esse contrato com os tipos genéricos de `src/types/pagination.ts`, exportados pelo barrel de `src/types/`:

```ts
export interface PaginationParams { page?: number; limit?: number }
export interface PaginationMeta { page: number; limit: number; total: number; totalPages: number }
export interface Paginated<T> { data: T[]; pagination: PaginationMeta }
```

- Os tipos de resposta de cada domínio são alias de `Paginated<T>` (por exemplo `type PaginatedSuppliersResponse = Paginated<ISupplier>`), sem redeclarar `data` e `pagination`.
- Os tipos de filtro de cada domínio estendem `PaginationParams` (por exemplo `SupplierFilterParams extends PaginationParams`), acrescentando só os filtros próprios da rota.
- A camada `src/api/` devolve o envelope inteiro; a view lê `response.data` para as linhas e `response.pagination` para os controles.

### 4.2. Regra de uso

- `<UiPagination>` é obrigatório em toda listagem paginada, no admin e no catálogo.
- É proibido escrever botões Anterior/Próxima inline, montar o texto "Página X de Y" à mão ou criar outro componente de paginação.
- O componente vive em `src/components/ui/UiPagination.vue`, tem as props tipadas em `UiPaginationProps` (`src/types/components.ts`) e é resolvido pelo auto-import, sem import manual nem registro em `plugins/index.ts`.
- Internamente usa apenas `<UiButton>` (`outline`/`primary`, `size="sm"`), ícones `mdi:chevron-left` e `mdi:chevron-right`, classes Tailwind e tokens do design system. Não adicione hex, `<button>` nativo nem estilos próprios por tela.

### 4.3. Props e eventos

| Prop | Tipo | Padrão | Função |
| --- | --- | --- | --- |
| `page` | `number` | — | Página atual (`v-model:page`) |
| `totalPages` | `number` | — | Total de páginas |
| `total` | `number?` | — | Quando informado, mostra o resumo "Página X de Y (N registros)" |
| `itemLabel` | `string?` | `"registros"` | Substantivo do resumo (ex.: `"categorias"`) |
| `disabled` | `boolean?` | `false` | Trava a navegação durante o carregamento |

| Evento | Payload | Quando |
| --- | --- | --- |
| `update:page` | `number` | O usuário escolhe outra página. Páginas fora do intervalo ou iguais à atual são ignoradas. |

Comportamento de exibição:

- Os botões de navegação (Anterior, números com reticências e Próxima) somem quando `totalPages <= 1`.
- O resumo aparece sempre que `total` é informado, mesmo com página única.
- Sem `total` e com página única, o componente não renderiza nada.
- O rótulo do botão de avanço é sempre "Próxima".
- O markup é um `<nav aria-label="Navegação da paginação">`, com `aria-current="page"` na página ativa.

### 4.4. Exemplos

Listagem do admin, com resumo e trava durante o carregamento:

```vue
<UiPagination
  :page="currentPage"
  :total-pages="totalPages"
  :total="totalSuppliers"
  :disabled="loading"
  @update:page="carregarFornecedores"
/>
```

Mesma listagem com substantivo próprio no resumo:

```vue
<UiPagination
  :page="currentPage"
  :total-pages="totalPages"
  :total="totalCategories"
  item-label="categorias"
  :disabled="loading"
  @update:page="carregarCategorias"
/>
```

Catálogo, sem resumo (some por completo com página única):

```vue
<UiPagination
  :page="paginationMeta.currentPage"
  :total-pages="paginationMeta.totalPages"
  @update:page="handlePageChange"
/>
```

### 4.5. Receita para uma view de listagem

1. Mantenha o estado de paginação na view: `currentPage`, `totalPages` e o total de registros, preenchidos a partir de `response.pagination` (`totalPages || 1` evita zero quando a lista está vazia).
2. A função de carga recebe a página (`async function carregar(page = 1)`), monta os `params` tipados com `page`, `limit` e filtros, e atualiza o estado ao final com os valores devolvidos pela API.
3. Busca e mudança de filtro chamam a função de carga com a página `1`, nunca com a página corrente.
4. Passe `:disabled="loading"` ao `<UiPagination>` para impedir cliques durante a requisição.
5. Ligue `@update:page` direto à função de carga, que já aceita a página como argumento.

Fora do padrão atual: seletor de tamanho de página e sincronização de `?page=` no admin. Se precisar de algo assim, trate como mudança de escopo e passe pelo OpenSpec antes de customizar o componente.

---

## 5. Manutenção Documental

| Mudança                                                 | Atualizações obrigatórias                                       |
| ------------------------------------------------------- | --------------------------------------------------------------- |
| Regra, requisito, escopo ou comportamento do produto    | [`docs/PRD.md`](../docs/PRD.md), antes de qualquer outro artefato |
| Fluxo, arquitetura ou integração do frontend            | [`docs/frontend/README.md`](../docs/frontend/README.md)         |
| Token ou regra visual                                   | [`docs/frontend/design-system-cores.md`](../docs/frontend/design-system-cores.md) |

Alterações no consumo da API devem permanecer compatíveis com a [collection Bruno](../docs/backend/collections/bruno/); se a API precisar mudar, a collection é atualizada pela tarefa `[BE]`.
