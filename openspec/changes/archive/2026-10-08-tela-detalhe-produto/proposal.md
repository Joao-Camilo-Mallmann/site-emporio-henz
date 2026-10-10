## Why

Atualmente, os visitantes e clientes que navegam pelo catálogo digital do Empório Henz não conseguem acessar os detalhes aprofundados de um produto específico ao clicar nos cards da listagem pública (`/catalogo`). O portal necessita de uma tela de detalhamento rica, responsiva e esteticamente fiel ao protótipo do Figma (`nx4bJnz6Hj3seJHFAC5sHO` nós `#1:418` Desktop e `#1:338` Mobile) e imagens de referência (`produto1.png`, `produto1.2.png`, `produto1.3.png`). Essa interface resolve a insegurança do consumidor ao comprar móveis à distância, provendo carrossel de fotos em alta resolução, seletor de acabamentos, especificações técnicas detalhadas e o convite oficial ao showroom físico em Cruzeiro do Sul (atendendo ao **RF06** do PRD e **US-FE-10** do Backlog).

## What Changes

- **Rota de Detalhes no Frontend**: Registro da rota `/produtos/:id` no Vue Router (`frontend/src/router/index.ts`) com carregamento assíncrono e atualização do título da página.
- **View Principal do Produto (`ProdutoDetalheView.vue`)**: Criação da página completa de detalhes do móvel com fidelidade visual ao layout do Figma para resoluções Desktop e Mobile.
- **Galeria Interativa de Imagens**: Exibição de carrossel de fotos com miniaturas verticais à esquerda no desktop, carrossel swiper com gestos/dots no mobile, chip indicador de imagem (`1/5`) e botões de ação flutuantes (favoritar com feedback e compartilhar com cópia do link no clipboard via toast).
- **Seletor de Variações e Acabamentos**: Interface de seleção de cores/tecidos com amostras circulares e atualização dinâmica do acabamento selecionado.
- **Bloco de Preço e Condições Comerciais**: Destaque para o valor de referência, parcelamento em até 10x no cartão e desconto de 3% no PIX.
- **Disparo Contextualizado de WhatsApp**: Botão principal `<UiButton variant="primary">` abrindo o WhatsApp da loja com mensagem pré-formatada contendo nome do móvel, acabamento e URL da página (**RF12**).
- **Card Oficial de Visita ao Showroom**: Card convidando o cliente a visitar a loja física em Cruzeiro do Sul para tocar nas amostras de materiais, com link "Ver localização" direcionando para `/sobre-a-loja`.
- **Ficha Técnica Zebrada e Descrição**: Renderização organizada da descrição e tabela zebrada com dimensões (A x L x P), materiais, puxadores e ferragens.
- **Seção de Produtos Relacionados**: Exibição de "Você também pode gostar" reutilizando `CatalogProductCard.vue` para recomendar móveis complementares.
- **Navegação do Catálogo**: Integração do evento de clique em `CatalogProductCard.vue` e `CatalogoView.vue` direcionando para `/produtos/${product.id}`.
- **Resiliência e Fallback de Dados**: Suporte na camada de serviço (`frontend/src/api/produtos.ts`) para consulta à API REST com fallback garantido no catálogo mockado caso o backend não esteja em execução.

## Capabilities

### New Capabilities
- `tela-detalhes-produto`: Tela pública completa de detalhes e especificações do produto no frontend, com galeria de fotos, variações de acabamento, políticas comerciais, convite ao showroom e disparo de WhatsApp.

### Modified Capabilities
- `catalogo-busca-produtos`: Habilitação do redirecionamento ao clicar no card de produto na listagem do catálogo para a rota de detalhes `/produtos/:id`.

## Impact

- **Código Frontend**: `frontend/src/views/ProdutoDetalheView.vue`, `frontend/src/router/index.ts`, `frontend/src/components/catalogo/CatalogProductCard.vue`, `frontend/src/views/CatalogoView.vue`, `frontend/src/mocks/catalogo.ts`, `frontend/src/api/produtos.ts`.
- **Design System**: Reutilização estrita dos componentes de `frontend/src/components/ui/` (`<UiButton>`, `<UiCard>`) e tokens semânticos definidos em `docs/frontend/design-system-cores.md`.
- **APIs/Backend**: Sem alterações no backend ou nas migrações do PostgreSQL nesta etapa focada exclusivamente na interface do front-end (`[FE]`).
