## Why

Atualmente, o site do Empório Henz possui links para "Sobre a loja" tanto na barra de navegação Desktop/Mobile quanto no rodapé, porém eles apontam para a rota inicial (`/`) sem uma página institucional própria implementada. Os clientes precisam conhecer a história da marca, a tradição familiar de quase 50 anos em Cruzeiro do Sul e entender como funciona a experiência híbrida (escolher digitalmente e comprar com atendimento acolhedor na loja física).

## What Changes

- Criação da nova view institucional `AboutView.vue` correspondente à rota `/sobre-a-loja`.
- Registro da rota `/sobre-a-loja` no roteador do Vue (`apps/web/src/router/index.ts`).
- Atualização dos links de "Sobre a loja" na Navbar (Desktop e Mobile Drawer) e no Footer para apontar para `/sobre-a-loja`.
- Implementação da seção Hero institucional com imagem de fundo, overlay azul marinho, logo branca e o selo "Há quase 50 ANOS CONSTRUINDO HISTÓRIAS" com botão de retorno/navegação.
- Implementação da seção de história e proposta de valor "Empório Henz: Onde a sua história encontra o seu lugar" com carrossel/slider de fotos da loja e equipe familiar.
- Total responsividade para Desktop (>= 768px/1024px) e Mobile (< 768px), em estrita conformidade com o Design System Tailwind v4 (sem cores hexadecimais inline arbitrárias).

## Capabilities

### New Capabilities

- `pagina-sobre-a-loja`: Apresentação institucional da história, tradição de quase 50 anos, valores e fotos da equipe/loja física do Empório Henz, acessível via `/sobre-a-loja` tanto no desktop quanto no mobile.

### Modified Capabilities

<!-- Nenhuma especificação anterior teve seus requisitos alterados -->

## Impact

- **Frontend (`apps/web`)**:
  - Nova rota `/sobre-a-loja` em `src/router/index.ts`.
  - Nova página `src/views/AboutView.vue` (ou `src/views/about/AboutView.vue`).
  - Atualização dos links em `src/components/layout/AppNavbar.vue` e `src/components/layout/AppFooter.vue`.
  - Inclusão dos assets/imagens de referência necessários em `public/images/`.
- **Backend / Database**: Nenhuma alteração de banco de dados ou backend necessária, pois trata-se de conteúdo institucional estático da marca.
