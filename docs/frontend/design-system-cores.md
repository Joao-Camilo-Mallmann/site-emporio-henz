# Design System — Cores e Tokens Oficiais (Empório Henz)

> [!IMPORTANT]
> **REGRA MANDATÓRIA PARA DESENVOLVEDORES E AGENTES DE IA:**
> É **estritamente proibido** utilizar valores hexadecimais arbitrários inline (como `bg-[#123854]`, `text-[#007CD8]`, `text-[#1D1D24]`, etc.) na estilização do frontend.
> **SEMPRE** utilize as classes utilitárias semânticas geradas a partir da diretiva `@theme` em `apps/web/src/style.css`.

---

## 1. Referência Oficial do Figma

- **Arquivo Oficial do Figma**: [Catálogo digital - Empório Henz](https://www.figma.com/proto/nx4bJnz6Hj3seJHFAC5sHO/Cat%C3%A1logo-digital---Emp%C3%B3rio-Henz?node-id=38-2521)
- **Tecnologia de Configuração**: Tailwind CSS v4 via `@theme` no arquivo `apps/web/src/style.css`.

---

## 2. Tabela de Mapeamento de Cores e Tokens Semânticos

| Variável `@theme` | HEX | Classes Tailwind Geradas | Papel Semântico & Casos de Uso |
| :--- | :--- | :--- | :--- |
| `--color-primary` | `#123854` | `bg-primary`, `text-primary`, `border-primary` | **Azul Institucional Principal**. Utilizado na Navbar principal, cabeçalhos de destaque, cards ativos e formas orgânicas. |
| `--color-primary-dark` | `#0C2340` | `bg-primary-dark`, `text-primary-dark`, `border-primary-dark` | **Azul Marinho Profundo**. Utilizado em áreas restritas (Portal da Equipe), contrastes escuros e rodapés institucionais. |
| `--color-secondary` | `#007CD8` | `bg-secondary`, `text-secondary`, `border-secondary` | **Azul Destaque & Ação**. Utilizado em preços, sub-navbar de categorias, botões interativos, links ativos e ícones sociais. |
| `--color-secondary-hover` | `#005CA1` | `bg-secondary-hover`, `text-secondary-hover`, `border-secondary-hover` | **Azul Interativo / Hover**. Utilizado no estado `:hover` de botões de ação e bordas em foco de formulários (`focus:border-secondary-hover`). |
| `--color-neutral-dark` | `#1D1D24` | `text-neutral-dark`, `bg-neutral-dark`, `border-neutral-dark` | **Grafite Escuro Institucional**. Cor primária para tipografia de alta legibilidade, títulos de produtos e pills de acabamento com opacidade (`bg-neutral-dark/80`). |
| `--color-surface-light` | `#FEFEFE` | `bg-surface-light` | **Superfície Clara**. Cor base para fundo de páginas, containers e superfícies limpas. |
| `--color-surface-tint` | `#D2E8F8` | `bg-surface-tint` | **Azul Celeste Suave**. Fundo do Hero Banner, banners secundários e fundos de seção suavemente coloridos. |

---

## 3. Tokens de Acabamento de Móveis e Madeiras

Para referenciar cores de catálogo e acabamentos em componentes e mostruários:

| Variável `@theme` | HEX | Classes Tailwind Geradas | Acabamento de Referência |
| :--- | :--- | :--- | :--- |
| `--color-wood-dark` | `#4A3024` | `bg-wood-dark`, `text-wood-dark` | Imbuia Escura / Madeira Nobre |
| `--color-wood-light` | `#A58D63` | `bg-wood-light`, `text-wood-light` | Nogueira / Linho Bege |
| `--color-wood-cherry` | `#C97C49` | `bg-wood-cherry`, `text-wood-cherry` | Cerejeira |
| `--color-wood-honey` | `#EFC171` | `bg-wood-honey`, `text-wood-honey` | Mel |
| `--color-wood-offwhite` | `#D7D5CF` | `bg-wood-offwhite`, `text-wood-offwhite` | Off White |

---

## 4. Exemplos Práticos de Uso no Tailwind CSS v4

### Botão Primário Institucional
```vue
<button class="bg-primary hover:bg-primary-dark text-white font-medium px-4 py-2 rounded-lg transition-colors">
  Comprar Móvel
</button>
```

### Botão de Ação / Destaque Secundário
```vue
<button class="bg-secondary hover:bg-secondary-hover text-white font-medium px-4 py-2 rounded-lg transition-colors">
  Solicitar Orçamento
</button>
```

### Cartão de Produto com Preço e Tipografia Padronizada
```vue
<div class="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
  <h3 class="text-neutral-dark font-medium text-base hover:text-secondary transition-colors">
    Mesa de Jantar Pétala
  </h3>
  <div class="text-secondary font-bold text-2xl tracking-tight mt-1">
    R$ 1.900,00
  </div>
  <div class="bg-neutral-dark/80 text-white text-xs px-2 py-1 rounded-full inline-block mt-2">
    Acabamento Mel
  </div>
</div>
```

### Hero Banner com Superfície Suave e Elemento Orgânico
```vue
<section class="bg-surface-tint py-16 relative overflow-hidden">
  <div class="absolute -right-20 -top-10 w-96 h-96 bg-primary rounded-full"></div>
  <div class="max-w-7xl mx-auto px-4 relative z-10">
    <h1 class="text-primary font-bold text-4xl">Transforme seu Lar</h1>
  </div>
</section>
```
