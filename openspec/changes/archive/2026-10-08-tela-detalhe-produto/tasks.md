## 1. Fundação de Tipos, Mock e Roteamento

- [x] 1.1 [FE] Estruturar tipos e interfaces de detalhe de produto em `frontend/src/types/` (`ProductDetail`, `ProductImageItem`, `ProductVariationItem`, `ProductSpecificationItem`)
- [x] 1.2 [FE] Enriquecer dados no mock (`frontend/src/mocks/catalogo.ts`) com os dados completos do Roupeiro Roma do Figma (galeria de 5 fotos, especificações técnicas detalhadas, dimensões e acabamentos)
- [x] 1.3 [FE] Registrar a rota `/produtos/:id` no Vue Router (`frontend/src/router/index.ts`) com carregamento assíncrono e definição de título dinâmico
- [x] 1.4 [FE] Atualizar serviço `frontend/src/api/produtos.ts` com método `buscarPorId` resiliente com fallback no catálogo mockado caso o backend não esteja disponível

## 2. Componentização da Interface de Detalhes

- [x] 2.1 [FE] Criar componente de galeria `frontend/src/components/produto/ProductGallery.vue` com miniaturas verticais (Desktop), carrossel com toque/swipe (Mobile), chip indicador `1/5` e botões de ação flutuantes
- [x] 2.2 [FE] Criar componente `frontend/src/components/produto/ProductFinishesSelector.vue` com amostras circulares de cores/tecidos e atualização dinâmica do acabamento selecionado
- [x] 2.3 [FE] Criar componente `frontend/src/components/produto/ProductShowroomCard.vue` reproduzindo o card de visita física com imagem de amostras, título "Experimente as amostras" e link "Ver localização" direcionando para `/sobre-a-loja`
- [x] 2.4 [FE] Criar componente `frontend/src/components/produto/ProductSpecsTable.vue` com renderizador da ficha técnica em tabela zebrada (`bg-white` e `bg-stone-50`)

## 3. View Principal e Integração do Catálogo

- [x] 3.1 [FE] Desenvolver a página principal `frontend/src/views/ProdutoDetalheView.vue` integrando a galeria, bloco de preço (R$ 4.850,30, 10x e PIX 3%), botão `<UiButton variant="primary">` com WhatsApp (RF12) e carrossel de recomendados
- [x] 3.2 [FE] Implementar as ações rápidas de favoritar/salvar (toggle visual imediato) e compartilhar (cópia de URL para a área de transferência com toast feedback)
- [x] 3.3 [FE] Habilitar navegação ao clicar no card de produto em `frontend/src/components/catalogo/CatalogProductCard.vue` e `frontend/src/views/CatalogoView.vue` para `/produtos/:id`

## 4. Validação, Responsividade e Fidelidade Visual

- [x] 4.1 [FE] Validar a fidelidade visual e responsividade em Desktop e Mobile conforme Figma nós `#1:418` e `#1:338` e imagens de referência (`produto1.png`, `produto1.2.png`, `produto1.3.png`)
- [x] 4.2 [FE] Executar `bun run check-types` e `bun run lint` no diretório `frontend` assegurando integridade dos tipos TypeScript e padrões de código
