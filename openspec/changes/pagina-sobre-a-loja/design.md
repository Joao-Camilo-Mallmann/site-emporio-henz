## Context

O Empório Henz possui seu catálogo digital estruturado em Vue 3 + Tailwind CSS v4, com cabeçalho e rodapé já consolidados. No entanto, o link "Sobre a loja" estava redirecionando para a raiz `/`. O protótipo do Figma (nó `1:1518`) e a imagem de referência `image.png` demonstram a tela institucional "Sobre a Loja", destacando a história de quase 50 anos da empresa familiar em Cruzeiro do Sul, sua proposta de valor e a equipe. Esta mudança visa implementar a página com total fidelidade visual, alta performance e responsividade tanto para PC (desktop) quanto para mobile.

## Goals / Non-Goals

**Goals:**
- Criar a view `AboutView.vue` em `apps/web/src/views/AboutView.vue`.
- Registrar a rota correspondente `/sobre-a-loja` no `src/router/index.ts` com título de página SEO amigável.
- Atualizar os links de navegação em `AppNavbar.vue` (desktop e drawer mobile) e em `AppFooter.vue` para apontarem para `/sobre-a-loja`.
- Implementar o Hero institucional com overlay azul-marinho (`primary`), logo branca e o selo "Há quase 50 ANOS CONSTRUINDO HISTÓRIAS" e botão de retorno.
- Implementar a seção de texto institucional com tipografia condizente ao design system ("Empório Henz: Onde a sua história encontra o seu lugar").
- Implementar componente de carrossel de fotos (equipe da loja e showroom) com botões de controle de slides e transições suaves.
- Adaptar o layout com perfeição visual tanto em telas estreitas (mobile vertical) quanto em monitores largos (desktop grid/flex centralizado).
- Respeitar 100% o Design System sem utilizar hexadecimais arbitrários inline (`#...`).

**Non-Goals:**
- Não há necessidade de alterações no Backend (`apps/backend`) ou migrações de banco (`packages/database`), uma vez que os dados são institucionais e estáticos da marca.
- Não inclui edição de conteúdo via CMS no momento (o texto e imagens são fixos no frontend conforme o protótipo do Figma).

## Decisions

1. **Estrutura de Componentes**:
   - `AboutView.vue` será a view orquestradora da rota `/sobre-a-loja`.
   - Poderão ser criados componentes modulares ou seções bem isoladas dentro da view, garantindo manutenibilidade:
     - `AboutHero`: Seção do topo com imagem de fundo, overlay azul, selo de 50 anos e botão de voltar.
     - `AboutStory`: Seção editorial com o texto histórico e proposta de valor.
     - `AboutGallery`: Carrossel/slider interativo de imagens da loja e da equipe.
   - *Alternativa considerada*: Colocar tudo em um único arquivo monolítico. Decidiu-se por manter o código modular e limpo, aproveitando a reutilização de tokens.

2. **Gerenciamento de Imagens e Assets**:
   - Imagens institucionais da loja e equipe serão adicionadas em `apps/web/public/images/about/` ou diretamente em `public/images/`.
   - Assegurar formatos otimizados (WebP/PNG comprimidos) com dimensões adequadas.

3. **Carrossel Interativo**:
   - Implementação reativa simples com Vue 3 `ref(currentIndex)` e transições `<TransitionGroup>` ou transição CSS suave, sem adicionar bibliotecas externas pesadas desnecessárias (mantendo o bundle enxuto).

4. **Design System & Tokens Tailwind v4**:
   - Uso de `bg-primary`, `bg-primary-dark`, `text-neutral-dark`, `text-secondary`, `bg-surface-light`, `bg-surface-tint`.
   - Utilização de `font-serif` para os títulos elegantes da marca e `font-sans` para os parágrafos de leitura confortável.

## Risks / Trade-offs

- **[Imagens e proporções em telas ultra-wide vs mobile]** → Uso de `object-cover`, `aspect-ratio` responsivo (ex: `aspect-[4/3]` no mobile e `aspect-[16/9]` ou container com max-w no desktop) e containers com `max-w-4xl` / `max-w-6xl` centralizados.
- **[Acessibilidade do Carrossel]** → Adicionar `aria-label` aos botões de navegação e suporte a navegação por teclado.
