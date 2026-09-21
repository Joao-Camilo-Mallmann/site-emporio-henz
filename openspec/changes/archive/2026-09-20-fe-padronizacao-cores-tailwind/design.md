## Context

O projeto `site-emporio-henz` utiliza Tailwind CSS v4 no pacote `apps/web`, integrado via `@tailwindcss/vite` e `@import "tailwindcss";` em `src/style.css`.
Atualmente, as telas (`App.vue`, `HomeView.vue`, entre outras) utilizam valores hexadecimais arbitrários inline (como `bg-[#D2E8F8]`, `bg-[#123854]`, `text-[#123854]`, `text-[#1D1D24]`, `text-[#007CD8]`, `bg-[#FEFEFE]`).

As cores oficiais do projeto foram definidas no Figma ([Catálogo digital - Empório Henz](https://www.figma.com/proto/nx4bJnz6Hj3seJHFAC5sHO/Cat%C3%A1logo-digital---Emp%C3%B3rio-Henz?node-id=38-2521)), onde estão catalogadas variáveis globais de preenchimento e estilos.

## Goals / Non-Goals

**Goals:**
- Configurar formalmente a paleta de cores do Figma no Tailwind CSS v4 utilizando a diretiva `@theme` em `apps/web/src/style.css`.
- Estabelecer uma nomenclatura semântica clara: `primary`, `primary-dark`, `secondary`, `secondary-hover`, `neutral-dark`, `surface-light`, `surface-tint`, além de tokens para acabamentos de madeira (`wood-*`).
- Criar a documentação completa do Design System em `docs/design-system-cores.md`.
- Atualizar as regras em `apps/web/agents.md` e `AGENTS.md`, instruindo agentes de IA e desenvolvedores a nunca usarem classes hexadecimais inline (`[#...]`), mas sim os utilitários de tema padronizados.
- Refatorar os arquivos existentes no frontend (`App.vue`, `HomeView.vue`, `AppNavbar.vue`, etc.) substituindo os hexadecimais pelas novas classes utilitárias.
- Garantir que a verificação de tipos e o build continuem executando com 100% de sucesso.

**Non-Goals:**
- Alterar regras de layout, tipografia ou responsividade não relacionadas à tokenização de cores.
- Alterações em APIs, contratos de backend ou migrações de banco de dados.

## Decisions

### 1. Utilização da diretiva `@theme` nativa do Tailwind CSS v4
- **Decisão**: Declarar as cores no bloco `@theme` em `apps/web/src/style.css`.
- **Alternativas consideradas**:
  - `tailwind.config.js`: Descontinuado como padrão no Tailwind CSS v4, que adota configuração CSS-first.
  - Variáveis CSS nativas avulsas sem `@theme`: Não integrariam automaticamente com os utilitários de opacidade e classes do Tailwind (`bg-primary/80`, `text-secondary`, etc.).
- **Mapeamento de Cores**:
  ```css
  @theme {
    /* Identidade Principal - Azul Institucional Empório Henz */
    --color-primary: #123854;
    --color-primary-dark: #0C2340;

    /* Destaques e Ações - Azul Vibrante */
    --color-secondary: #007CD8;
    --color-secondary-hover: #005CA1;

    /* Superfícies e Textos */
    --color-neutral-dark: #1D1D24;
    --color-surface-light: #FEFEFE;
    --color-surface-tint: #D2E8F8;

    /* Tons Terrosos / Madeiras (Acabamentos) */
    --color-wood-dark: #4A3024;
    --color-wood-light: #A58D63;
    --color-wood-cherry: #C97C49;
    --color-wood-honey: #EFC171;
    --color-wood-offwhite: #D7D5CF;
  }
  ```

### 2. Nomenclatura Semântica com Suporte a Variações
- **Decisão**: Usar nomes semânticos (`primary`, `secondary`, `neutral-dark`, `surface-*`) para a estrutura do layout, permitindo que a intenção do design permaneça evidente e desacoplada do tom exato.
- **Alternativas consideradas**: Nomes puramente descritivos (`navy-500`, `blue-600`). Rejeitado para evitar ambiguidades sobre qual cor aplicar em botões primários vs elementos de fundo.

### 3. Duplo Nível de Documentação (Humanos e Agentes)
- **Decisão**: Criar `docs/design-system-cores.md` com a tabela visual de referência e atualizar `apps/web/agents.md` e `AGENTS.md` com diretrizes imperativas para agentes.
- **Justificativa**: Agentes de IA consultam primordialmente os arquivos `agents.md` do repositório antes de realizar tarefas; documentar ali garante que futuras gerações de componentes respeitem o padrão automaticamente.

## Risks / Trade-offs

- **[Risco]** Quebra ou alteração inadvertida de opacidades (ex: `bg-[#1D1D24]/80`) durante o refactor.
  - **Mitigação**: O Tailwind v4 com `@theme` suporta nativamente modificadores de opacidade (`bg-neutral-dark/80`). Cada ocorrência será conferida e inspecionada.
- **[Risco]** Inconsistência entre `#123854` e `#0C2340`.
  - **Mitigação**: Ambos os tons existem no projeto; `#123854` mapeado como `primary` (fundo principal e cabeçalhos do Figma) e `#0C2340` como `primary-dark` (tom profundo de contraste/fundo institucional).
