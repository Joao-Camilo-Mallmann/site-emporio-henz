## 1. Contratos de Dados e Tipos TypeScript (`[FE]`)

- [x] 1.1 Criar `src/types/catalogo.ts` com interfaces tipadas `CatalogFilterParams`, `CatalogProductItem`, `CatalogVariationBadge`, `CatalogPaginationMeta` e `CatalogResponse`
- [x] 1.2 Exportar os novos contratos no barrel `src/types/index.ts`
- [x] 1.3 Criar massa estática `src/mocks/catalogo.ts` e cliente `src/api/catalogo.ts` integrado ao `src/api/index.ts` para despachar requisições GET com parâmetros e fallback mockado

## 2. Componentes Especializados do Catálogo (`[FE]`)

- [x] 2.1 Criar `src/components/catalogo/CatalogProductCard.vue` reproduzindo o componente Figma `#12:2374` com imagem 1:1, badge de acabamentos `#1:61` no canto da imagem, nome, preço em destaque (`text-secondary`) e parcelamento
- [x] 2.2 Criar `src/components/catalogo/CatalogFilterSidebar.vue` com chips de categorias `#168:4304`, subcategorias, checkboxes de materiais/marcas `#85:5102`, swatches de cor `#57:2218`, faixa de preço e botões estilizados obrigatoriamente com `<UiButton>`
- [x] 2.3 Criar `src/components/catalogo/CatalogSortDropdown.vue` com dropdown seletor de ordenação (Relevância, Menor Preço, Maior Preço, Mais Recentes)
- [x] 2.4 Criar `src/components/catalogo/CatalogPagination.vue` com suporte a navegação por páginas, botões anterior/próximo e indicador numérico usando `<UiButton>`

## 3. View Principal e Integração de Rotas (`[FE]`)

- [x] 3.1 Criar `src/views/CatalogoView.vue` consumindo `catalogoApi.buscarProdutos` com parâmetros GET (sem filtragem client-side por `computed`), skeleton de carregamento, layout desktop e drawer mobile
- [x] 3.2 Registrar a rota pública `/catalogo` em `src/router/index.ts` sem restrição de autenticação
- [x] 3.3 Atualizar `src/components/layout/AppNavbar.vue` para redirecionar as pesquisas do formulário de busca e os links de categorias para a rota `/catalogo` com parâmetros de consulta


## 4. Validação e Qualidade (`[FE]`)

- [x] 4.1 Executar validação de tipos do frontend com `vue-tsc` para garantir integridade e ausência de erros de compilação
- [x] 4.2 Validar a fidelidade estética e responsiva em relação à especificação do Figma nó `96:6513` e imagem `FrontBusca.png`
