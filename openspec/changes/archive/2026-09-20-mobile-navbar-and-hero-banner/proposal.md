## Why

A experiência atual do frontend foi desenvolvida com foco no layout desktop. Conforme os protótipos oficiais do Figma (nó `#38:2521` e referências `image.png` e `munu-mobile.png`), o site necessita de uma adaptação mobile de alta fidelidade para cabeçalho, menu de navegação e banner principal da Home, garantindo usabilidade ágil, pesquisa acessível e fidelidade visual à identidade da Empório Henz em dispositivos móveis.

## What Changes

- **Mobile Navigation Header (`AppNavbar.vue`)**:
  - Reorganização responsiva da barra superior no mobile (`md:hidden`): ícone hambúrguer à esquerda, logo centralizada, ícones de Salvos e Perfil à direita.
  - Linha de busca dedicada no cabeçalho mobile (`block md:hidden`), posicionada abaixo da logo e acima da faixa de entrega.
  - Faixa de entrega e montagem (`bg-secondary`) centralizada em telas menores.
- **Drawer / Menu Lateral Mobile (`munu-mobile.png`)**:
  - Implementação do drawer deslizante a partir da esquerda sobre overlay escuro.
  - Cabeçalho do drawer em azul-marinho (`bg-primary`) com logo institucional.
  - Corpo do drawer em azul vibrante (`bg-secondary`), contendo lista de categorias com acordeão expansível para subcategorias e ícone de seta (`v`).
  - Divisor sutil e links de ações: Salvos (coração), Sobre a loja (loja física), Minha conta (perfil) e Sair / Entrar (autenticação integrada ao Pinia).
- **Separação de Componentes do Banner da Home**:
  - Criação de `HeroBannerDesktop.vue` encapsulando o banner largo para PC (composição horizontal com sofá de 3 lugares e card flutuante de 3 benefícios).
  - Criação de `HeroBannerMobile.vue` encapsulando o banner vertical para mobile (composição recortada com poltrona azul, mesa lateral, luminária, planta e tapete, fundo orgânico e título em destaque de 26px, SEM os cards de benefícios).
  - Ajuste de responsividade no `HomeView.vue` para alternar entre os banners sem conflitos de estilos (`hidden md:block` e `block md:hidden`).
- **Ajuste no Grid de Categorias**:
  - Ajuste de margem superior para o grid de categorias no mobile (`mt-4 sm:mt-6 lg:-mt-24`), eliminando sobreposição indevida sobre o banner mobile.
- **Ativo Gráfico Mobile**:
  - Extração/disponibilização do asset de imagem da cena do banner mobile (`hero-banner-mobile.png`) recortado fielmente conforme o Figma.

## Capabilities

### Modified Capabilities

- `home-main-layout`: Adiciona requisitos e cenários para navegação móvel (drawer lateral, busca integrada ao cabeçalho) e segregação responsiva do hero banner para desktop e dispositivos móveis.

## Impact

- `apps/web/src/components/layout/AppNavbar.vue`: Refatoração estrutural com Tailwind responsivo para acomodar linha de busca mobile e gaveta lateral de navegação.
- `apps/web/src/components/home/HeroBannerDesktop.vue`: Novo componente extraído do `HomeView.vue`.
- `apps/web/src/components/home/HeroBannerMobile.vue`: Novo componente para o banner mobile.
- `apps/web/src/views/HomeView.vue`: Importação e orquestração responsiva dos banners e ajuste nas margens das categorias.
- `apps/web/public/images/`: Adição do asset visual para o banner mobile.
