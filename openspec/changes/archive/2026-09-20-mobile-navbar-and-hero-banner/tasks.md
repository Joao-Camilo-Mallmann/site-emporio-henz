## 1. Preparação de Assets Visuais

- [x] 1.1 [FE] Recortar e preparar o asset da composição do banner mobile (`hero-banner-mobile.png`) a partir do protótipo/referência do Figma
- [x] 1.2 [FE] Verificar dimensões, transparência e nitidez do asset em `apps/web/public/images/hero-banner-mobile.png`

## 2. Segregação do Hero Banner da Home

- [x] 2.1 [FE] Extrair o banner desktop para `apps/web/src/components/home/HeroBannerDesktop.vue`, preservando a composição larga, sofá de 3 lugares e o card de 3 benefícios
- [x] 2.2 [FE] Criar `apps/web/src/components/home/HeroBannerMobile.vue` com tipografia em 26px, cena da poltrona azul, fundo orgânico marinho e sem os cards de benefícios conforme Figma
- [x] 2.3 [FE] Integrar ambos os banners em `apps/web/src/views/HomeView.vue` com alternância responsiva (`hidden md:block` e `block md:hidden`) e ajustar a margem superior do grid de categorias (`mt-4 sm:mt-6 lg:-mt-24`)

## 3. Reorganização do Cabeçalho e Linha de Busca no Mobile

- [x] 3.1 [FE] Reestruturar a linha superior do `AppNavbar.vue` para mobile: hambúrguer à esquerda, logo centralizada e ícones de Salvos e Perfil à direita
- [x] 3.2 [FE] Adicionar a linha de busca dedicada no cabeçalho mobile (`block md:hidden`), abaixo da logo e com input estilizado conforme o Figma
- [x] 3.3 [FE] Centralizar o texto da faixa de entrega e montagem (`bg-secondary`) em telas mobile

## 4. Implementação do Drawer Lateral Mobile

- [x] 4.1 [FE] Implementar o painel deslizante (drawer) com backdrop escurecido e transições suaves em `AppNavbar.vue`
- [x] 4.2 [FE] Estilizar o cabeçalho do drawer em `bg-primary` com a logo branca e botão de fechamento
- [x] 4.3 [FE] Implementar a lista de categorias em `bg-secondary` com comportamento de acordeão expansível para subcategorias e rotação da seta `v`
- [x] 4.4 [FE] Adicionar a seção de ações rápidas com ícones e links: Salvos, Sobre a loja, Minha conta e Sair/Entrar integrado ao Pinia `authStore`
- [x] 4.5 [FE] Adicionar trava de scroll (`overflow-hidden`) no `document.body` enquanto o drawer estiver aberto e suporte à tecla `Escape`

## 5. Validação, Lint e Testes Visuais

- [x] 5.1 [FE] Executar `bun run check-types` e `bun run lint` garantindo conformidade com TypeScript e ESLint
- [x] 5.2 [FE] Executar `bun run build` para validar compilação de produção sem erros de templates ou CSS
- [x] 5.3 [FE] Testar em resoluções mobile (< 768px) e desktop (>= 768px) comprovando fidelidade aos mockups `image.png` e `munu-mobile.png`
