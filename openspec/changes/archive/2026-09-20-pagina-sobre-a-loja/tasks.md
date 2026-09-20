## 1. Assets e Configuração de Rota [FE]

- [x] 1.1 Extrair e disponibilizar as imagens da loja e da equipe de `image.png` / Figma para o diretório `apps/web/public/images/about/`
- [x] 1.2 Registrar a nova rota `/sobre-a-loja` com meta tag de título no roteador do Vue (`apps/web/src/router/index.ts`)
- [x] 1.3 Atualizar os links de navegação para `/sobre-a-loja` no `AppNavbar.vue` (desktop e drawer mobile) e no `AppFooter.vue`

## 2. Construção da Página Institucional Sobre a Loja [FE]

- [x] 2.1 Criar a view institucional `apps/web/src/views/AboutView.vue` com a estrutura base e tokens semânticos do Tailwind v4
- [x] 2.2 Implementar o Hero Banner institucional com imagem de fundo do showroom, overlay azul marinho (`bg-primary/80`), logo branca, selo de "Há quase 50 ANOS CONSTRUINDO HISTÓRIAS" e botão de voltar com navegação SPA
- [x] 2.3 Implementar a seção editorial com o título "Empório Henz: Onde a sua história encontra o seu lugar" e os textos institucionais sobre tradição familiar e compra acolhedora
- [x] 2.4 Implementar a galeria/carrossel responsivo com suporte a navegação por controles de setas (slides de fotos da equipe e da loja)

## 3. Ajustes de Responsividade Desktop/Mobile e Validação [FE]

- [x] 3.1 Refinar os espaçamentos, tipografia fluida e proporções no mobile (< 768px) e desktop (>= 768px / >= 1024px)
- [x] 3.2 Executar a verificação estrita de tipagem (`bun run check-types`) e lint (`bun run lint`) no monorepo
- [x] 3.3 Validar a navegação e a fidelidade visual contra os protótipos de referência
