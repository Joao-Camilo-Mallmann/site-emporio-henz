## Context

`GET /api/v1/categorias` é público (`attachUserIfAuthenticated`) e devolve `{ data, pagination }`, ordenado por nome. Cada categoria traz `subtypes[]` (`id`, `categoryId`, `name`, `slug`, `active`). Para visitante, Cliente e Vendedor só vêm registros ativos; com token de Admin vêm também os inativos. O `limit` máximo é 100 (RNF11).

A home tem 6 cards com imagens recortadas do Figma (`/images/categories/cat-*.webp`). A navbar tem uma barra secundária (`bg-secondary`, `max-w-7xl`) com o aviso de entrega à esquerda e as categorias à direita, com dropdown no hover. No mobile, um drawer com acordeão. Hoje as três listas são fixas no código.

## Goals / Non-Goals

**Goals:**
- Navbar desktop e drawer mobile listam as categorias e subcategorias cadastradas.
- A barra desktop nunca passa da largura do Figma: no máximo 6 itens, com "Mais" para o excedente.
- Os cards da home continuam fixos, mas só aparecem os que existem na listagem, linkando para o slug real.
- Uma única requisição alimenta navbar e home.

**Non-Goals:**
- Ligar o catálogo à API real. `api/catalogo.ts` ainda espera `{ items }` e os params `categoria`/`subcategoria`; a API usa `categoryId`/`subtypeId`. Isso fica para uma mudança própria.
- Trocar a lista fixa de `CatalogoFiltroLateral.vue`.
- Imagem ou ordem de exibição configuráveis no cadastro de categoria (não há campo para isso no banco).

## Decisions

### 1. Estado e regras na store `categorias`
- **Decisão:** Tudo fica em `useCategoriasStore` (`frontend/src/stores/categorias.ts`):
  - a carga: `lista`, `loading`, `error`, `carregadas` e `carregar()`;
  - os recortes: `barra`, `mais` e `cardsHome`;
  - os helpers e constantes exportados: `CARDS_HOME`, `MAX_ITENS_BARRA` e `encontrarCategoria`.
  - os links para o catálogo não passam pela store: cada componente monta o `:to` direto (`/catalogo?categoria=<slug>` e `&subcategoria=<nome>`).
- **Justificativa:** O `frontend/AGENTS.md` (§2.4) manda a store consumir só `src/api/`. Um composable só com as regras ficaria abaixo do mínimo de 150 linhas exigido para composables. Com tudo na store, home, barra e drawer usam a mesma regra.
- **Carga única:** a primeira chamada guarda a promise; chamadas simultâneas a reaproveitam e, depois do sucesso, não há nova requisição. Em caso de erro, a próxima montagem tenta de novo.

### 2. Filtro de ativos no cliente
- **Decisão:** A store descarta categorias e subtipos com `active === false`.
- **Justificativa:** Um Admin logado navegando pelo site receberia os inativos da API. O mesmo filtro já é feito em `useProdutoTela`.

### 3. Limite fixo de 6 itens na barra
- **Decisão:** `MAX_ITENS_BARRA = 6`. Com até 6 categorias, todas ficam na barra. Com 7 ou mais, as 5 primeiras ficam visíveis e o botão "Mais" ocupa o sexto espaço.
- **Justificativa:** Respeita a largura do Figma sem medir o DOM. Medir com `ResizeObserver` mudaria o número por resolução e traria mais complexidade.
- **Ordem:** a da API (alfabética). Com as 6 categorias do Figma, a barra fica Banheiro, Cozinha, Escritório, Quarto, Sala de Estar, Sala de Jantar.

### 4. Conteúdo do "Mais"
- **Decisão:** Painel alinhado à direita, com `max-h` e rolagem. Cada categoria extra aparece como título com link e as subcategorias embaixo.
- **Interação:** abre no hover (timer de 180 ms, igual aos outros dropdowns) e no clique (toque e teclado). Fecha com Esc, com clique fora e ao escolher um link. Usa `aria-haspopup` e `aria-expanded`.

### 5. Cards da home casados com a listagem
- **Decisão:** `CARDS_HOME` guarda slug do Figma, nome e imagem. Um card aparece quando existe categoria com o mesmo slug ou com `slugify(name)` igual ao slug do card. O link usa o slug real da API.
- **Estados:**
  - Enquanto carrega, mostra os 6 cards, para evitar salto de layout.
  - Se a API falhar, mantém os 6.
  - Depois da carga, esconde os que não existem.

### 6. Drawer mobile sem limite
- **Decisão:** O drawer lista todas as categorias, porque tem rolagem vertical e não sofre com a largura.

### 7. Contrato de URL do catálogo mantido
- **Decisão:** Os links continuam `/catalogo?categoria=<slug>` e `&subcategoria=<nome do subtipo>`.
- **Justificativa:** É o que `CatalogoView` e o filtro de `api/catalogo.ts` interpretam hoje. Mudar isso faz parte da integração do catálogo com a API.

## Risks / Trade-offs

- **[Ordem alfabética]** → Uma categoria nova com inicial "A" empurra as últimas em ordem alfabética para o "Mais". Foi escolha do produto; uma ordem manual exigiria campo novo no backend.
- **[Card escondido]** → Com menos de 6 cards, o grid `lg:grid-cols-6` fica com espaço vazio à direita. Aceito: é situação de cadastro incompleto.
- **[Categoria sem subtipo]** → Vira link simples na barra, sem seta e sem dropdown. No drawer, o acordeão mostra só "Ver todos em X".
