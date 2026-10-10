## ADDED Requirements

### Requirement: Rota Pública e Carregamento do Detalhe do Produto
The application SHALL provide a public route `/produtos/:id` in Vue Router, accessible to both anonymous visitors and authenticated users without requiring prior login. It SHALL fetch product details from the API or resort to resilient rich catalog mock data when disconnected.

#### Scenario: Visitante anônimo acessa a página de um produto específico
- **WHEN** um visitante sem login navega para `/produtos/p-1`
- **THEN** o sistema carrega a tela de detalhe com os dados completos do produto (Roupeiro Roma) sem redirecionar para `/login`

#### Scenario: Produto inexistente ou identificador inválido
- **WHEN** o usuário acessa uma URL `/produtos/:id` cujo identificador não exista
- **THEN** o sistema exibe estado visual amigável de produto não encontrado e botão para retornar ao catálogo

---

### Requirement: Galeria Interativa de Imagens com Miniaturas e Carrossel
The product details view SHALL display an interactive media gallery conforming to Figma `#1:418` (Desktop) and `#1:338` (Mobile). On desktop, it SHALL display a vertical strip of 5 thumbnails (80x80px) on the left of the main image, highlighting the active thumbnail with a blue border (`#007CD8`). On mobile, it SHALL provide a swipeable carousel. The gallery SHALL feature a floating badge with the current photo indicator (e.g. `1/5`) and dot indicators at the bottom.

#### Scenario: Alternância de foto principal ao clicar em miniatura
- **WHEN** o usuário clica na terceira miniatura da lista vertical no desktop
- **THEN** a imagem principal do contêiner central é atualizada para a foto correspondente e o chip de paginação exibe `3/5`

#### Scenario: Navegação por toque em dispositivos móveis
- **WHEN** o usuário desliza o dedo horizontalmente sobre a imagem do produto no mobile
- **THEN** o carrossel avança para a próxima foto e atualiza o indicador ativo de paginação

---

### Requirement: Seletor de Acabamentos com Amostras Circulares
The product view SHALL display available finishes and color variations with visual circular swatches. When a finish is selected, the view SHALL dynamically update the label "Acabamento: [Nome]" and switch the main product image if an image is mapped to that finish.

#### Scenario: Seleção de uma cor de acabamento diferente
- **WHEN** o usuário clica na amostra de cor "Itaúba Âmbar"
- **THEN** o texto do acabamento exibe "Acabamento: Itaúba Âmbar" e a amostra recebe anel visual de seleção ativa

---

### Requirement: Bloco de Preço de Referência e Condições Comerciais
The view SHALL display the reference price formatted in Brazilian Real (`R$`), with large bold integer typography, aligned cents, and commercial chips highlighting "Até 10x no cartão" and "3% OFF no PIX".

#### Scenario: Renderização do preço e condições comerciais
- **WHEN** o produto possui preço de R$ 4.850,30
- **THEN** o sistema exibe `R$`, o valor `4.850` em tipografia bold de destaque, `,30` em tamanho médio, acompanhado dos chips "Até 10x no cartão" e "3% OFF no PIX"

---

### Requirement: Disparo Contextualizado de Contato via WhatsApp
The view SHALL present a prominent primary call-to-action button `<UiButton variant="primary" block>` with WhatsApp icon labeled "Entrar em contato" conforming to RF12. Clicking this button SHALL open WhatsApp with a pre-filled message containing the furniture name, chosen finish, reference price, and page URL.

#### Scenario: Clique no botão de contato via WhatsApp
- **WHEN** o usuário clica no botão "Entrar em contato"
- **THEN** o navegador abre o link do WhatsApp direcionado para o número da loja com o texto pré-formatado incluindo o nome do produto, o acabamento selecionado e a URL da página

---

### Requirement: Card Oficial de Convite ao Showroom Físico
The view SHALL display an official invitation card encouraging the customer to visit the physical showroom in Cruzeiro do Sul to touch and see fabric/wood samples, conforming to RF06. The card SHALL include an illustration/photo of material samples, title "Experimente as amostras", subtitle "Visite nossa loja e conheça de perto a qualidade dos materiais", and a button/link "Ver localização" navigating to `/sobre-a-loja`.

#### Scenario: Usuário clica em ver localização no card do showroom
- **WHEN** o usuário clica em "Ver localização" no card do showroom
- **THEN** a aplicação navega para a página institucional `/sobre-a-loja` onde constam endereço, horário e fotos do showroom físico

---

### Requirement: Descrição e Ficha Técnica Estruturada em Tabela Zebrada
The view SHALL render a rich textual description of the furniture and a structured technical specifications table with alternating row background colors (`bg-white` and `bg-stone-50`), detailing Brand, Collection/Line, Structure Material, Finishes, Dimensions (H x W x D), Composition (doors/drawers), Door Materials, Hardware, and Handles.

#### Scenario: Exibição da tabela técnica
- **WHEN** a página do Roupeiro Roma é carregada
- **THEN** a tabela zebrada exibe os 9 campos técnicos especificados no Figma de forma legível e responsiva

---

### Requirement: Seção de Recomendações Você Também Pode Gostar
The view SHALL render a related products section titled "Você também pode gostar" displaying 4 complementary furniture cards utilizing the canonical `<CatalogProductCard>` component.

#### Scenario: Clique em um produto recomendado
- **WHEN** o usuário clica em um card da seção "Você também pode gostar"
- **THEN** a aplicação navega para a rota `/produtos/:id` do produto clicado e rola a tela para o topo

---

### Requirement: Ações Rápidas de Favoritar e Compartilhar
The main photo container SHALL include quick action buttons in its top-right corner: a bookmark/heart button and a share button. Clicking the share button SHALL copy the current product link to the user's clipboard and display a success toast feedback. Clicking the bookmark/heart button SHALL toggle the visual state and display immediate feedback.

#### Scenario: Compartilhamento do link do produto
- **WHEN** o usuário clica no botão de compartilhar
- **THEN** a URL do produto é copiada para a área de transferência e uma notificação toast de sucesso informa "Link copiado para a área de transferência!"
