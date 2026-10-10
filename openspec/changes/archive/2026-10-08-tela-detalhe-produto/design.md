## Context

O portal Empório Henz possui seu catálogo digital estruturado em Vue 3 + Tailwind CSS v4, com cabeçalho, rodapé e página de listagem (`/catalogo`) já consolidados. O protótipo do Figma (`nx4bJnz6Hj3seJHFAC5sHO`, nós `#1:418` Desktop e `#1:338` Mobile) e as imagens de referência fornecidas (`produto1.png`, `produto1.2.png`, `produto1.3.png`) estabelecem a experiência completa da página de produto específico (Roupeiro Roma e acervo de móveis).

Esta mudança introduz a tela de detalhe de produto (`/produtos/:id`) no frontend (`[FE]`), conectando o catálogo à conversão de vendas via WhatsApp e reforçando a segurança do consumidor com especificações técnicas e o convite oficial ao showroom físico da loja.

## Goals / Non-Goals

**Goals:**
- Implementar a página pública de detalhes do produto em `frontend/src/views/ProdutoDetalheView.vue`, associada à rota `/produtos/:id` no Vue Router.
- Desenvolver a galeria de fotos com 5 miniaturas verticais à esquerda no desktop, carrossel com gestos/dots no mobile, chip indicador `1/5` e botões de ação flutuantes.
- Prover seletor de acabamentos/cores com amostras visuais circulares e atualização dinâmica do rótulo ativo.
- Estruturar bloco de preço de referência com parcelamento em 10x e desconto PIX de 3%.
- Implementar o botão `<UiButton variant="primary">` com ícone do WhatsApp que gera a mensagem pré-formatada de compra (**RF12**).
- Renderizar o card oficial de convite ao showroom físico em Cruzeiro do Sul com botão "Ver localização" direcionando para `/sobre-a-loja`.
- Exibir a descrição rica do móvel e a ficha técnica estruturada em tabela zebrada (`bg-white` / `bg-stone-50`).
- Apresentar a seção "Você também pode gostar" com 4 produtos relacionados reutilizando o componente `<CatalogProductCard>`.
- Integrar o redirecionamento ao clicar no card de produto em `CatalogProductCard.vue` e `CatalogoView.vue` para `/produtos/:id`.
- Garantir resiliência na busca por ID com fallback no catálogo mockado caso o backend esteja offline.

**Non-Goals:**
- Alterações em migrações SQL ou modelos do banco de dados (o banco já está modelado na Fase 0).
- Alterações no backend Bun nesta mudança (o endpoint `US-BE-12` é uma tarefa de backend separada; o frontend deve funcionar de forma autônoma e desacoplada).
- Implementação do modal complexo de seleção de listas/pastas do cliente (postergado para a história de listas `[US-FE-11]`). A ação de favoritar fornece feedback visual imediato.
- Carrinho de compras ou checkout por pagamento eletrônico (o modelo de negócio do PRD converte por negociação humanizada no WhatsApp).

## Decisions

### 1. Rota canônica `/produtos/:id` no Vue Router
- **Decisão**: A rota oficial para a tela de produto é `/produtos/:id`.
- **Alternativas consideradas**:
  - `/catalogo/:id`: Rejeitada por misturar a rota de busca/filtros (`/catalogo`) com a entidade individual de produto.
  - `/produtos/:slug`: Embora elegante, o usuário escolheu expressamente `/produtos/:id`. O resolvedor de dados suportará tanto o ID (`p-1`) quanto busca por slug como conveniência.

### 2. Reutilização do componente oficial `CatalogProductCard.vue`
- **Decisão**: A seção de recomendações "Você também pode gostar" reutiliza `<CatalogProductCard>` passando os produtos relacionados da mesma categoria.
- **Alternativas consideradas**:
  - Criar um novo componente simplificado `RecommendedProductCard.vue`. Rejeitado por duplicar estilos e violar a diretriz de não duplicar componentes quando já existe um card oficial do Figma (`#12:2374`).

### 3. Galeria de Imagens Responsiva e Interativa
- **Decisão**: No Desktop, layout em duas colunas no bloco superior: faixa de miniaturas verticais (80x80px) à esquerda da imagem principal (aspect-square de até 687px). No Mobile, carrossel horizontal com swipe e dots de paginação. O chip `1/5` e os botões flutuantes de ação (favoritar e compartilhar) ficam sobrepostos à foto principal.
- **Alternativas consideradas**:
  - Miniaturas horizontais abaixo da imagem principal no desktop. Rejeitado pois o protótipo do Figma nó `#1:418` e a imagem `produto1.png` posicionam as 5 miniaturas estritamente à esquerda.

### 4. Card de Showroom Integrado à Rota Institucional
- **Decisão**: O botão "Ver localização" no card "Experimente as amostras" navega para a rota `/sobre-a-loja`, onde constam endereço, horário, galeria do showroom e mapa.
- **Alternativas consideradas**:
  - Abrir diretamente um link externo do Google Maps: Menos imersivo, remove o usuário da plataforma sem apresentar o contexto da loja física reconstruída.

### 5. Resiliência de Dados com Fallback Rico
- **Decisão**: O serviço `produtosApi.buscarPorId(id)` consulta o backend e, caso ocorra falha de rede ou 404, resgata o produto correspondente em `MOCK_CATALOG_PRODUCTS` ou um objeto de detalhe rico estruturado (com ficha técnica completa e carrossel de fotos do Roupeiro Roma).
- **Alternativas consideradas**:
  - Exibir apenas erro se a API não responder: Impediria testes do front-end desacoplado e avaliações visuais da banca.

## Risks / Trade-offs

- **[Risco] Imagens com resoluções ou proporções variadas quebrando o layout da galeria**
  - *Mitigação*: Utilização de contêiner com `aspect-square`, `overflow-hidden` e `object-cover`, garantindo encaixe perfeito em 1:1 conforme o Figma.
- **[Risco] Navegação entre produtos recomendados mantendo o scroll na parte inferior da página**
  - *Mitigação*: Adicionar `window.scrollTo({ top: 0, behavior: 'smooth' })` na troca de rota de produto ou no hook `watch(() => route.params.id)`.
