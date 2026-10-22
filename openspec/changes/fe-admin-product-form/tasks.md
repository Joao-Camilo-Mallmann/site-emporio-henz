## 1. [DOCS] PRD e backlog

- [x] 1.1 Registrar no UC08 do `docs/PRD.md` que a listagem de fornecedores devolvida ao Vendedor contém só as empresas com vínculo ativo, e que é ela que alimenta o seletor do formulário
- [x] 1.2 Ajustar a especificação técnica da US-FE-08 no backlog para a estrutura `views/admin/produtos/` e o fluxo de envio em sequência (design D5, D6 e D12)

## 2. [BE] Listagem de fornecedores restrita ao Vendedor

- [x] 2.1 Filtrar `GET /api/v1/suppliers` pelos vínculos ativos em `user_suppliers` quando o usuário autenticado é `SELLER`, mantendo envelope, filtros, ordenação e paginação (design D1)
- [x] 2.2 Cobrir em `backend/tests/suppliers-service.test.ts`: Admin vê todos; Vendedor vê só os vinculados, com `total` correto; Vendedor sem vínculo recebe lista vazia; vínculo revogado some
- [x] 2.3 Atualizar a collection Bruno: `Suppliers/List Suppliers.bru` (comportamento do Vendedor) e `Products/Create Product.bru` (corpo da resposta `201` com `variations[].id` e `sortOrder`)
- [x] 2.4 Atualizar `docs/backend/README.md` conforme a matriz de manutenção do backend

## 3. [FE] Contrato, serviços e utilitários

- [x] 3.1 Criar `src/types/products.ts` com `AvailabilityType`, `VariationType`, `ProductVariationDto`, `ProductImageDto`, `ProductDto`, `ProductVariationPayload` e `ProductCreatePayload`, exportados pelo barrel, e remover o `ProductCreateInput` antigo de `models.ts`
- [x] 3.2 Em `src/api/produtos.ts`, adicionar `criar`, `enviarFoto` e `enviarAmostra` (multipart com header explícito, design D7), trocar `insert` por `criar` e corrigir os caminhos de `atualizar` e `deletar` para `/produtos`, sem mexer em `listar` e `buscarPorId`
- [x] 3.3 Criar `src/utils/uploads.ts` com `MAX_IMAGE_BYTES`, `ACCEPTED_IMAGE_TYPES`, `validateImageFile` e `toApiAssetUrl` (design D8)

## 4. [FE] Tela de cadastro

- [x] 4.1 Criar os módulos de `src/utils/produtos/` com os tipos do formulário, `createEmptyForm`, `validateForm` e `toCreatePayload` (design D3, D4 e D10)
- [x] 4.2 Criar `KeyValueEditor.vue` e `ColorSwatch.vue`
- [x] 4.3 Criar `ProdutoVariacaoCard.vue` e `ProdutoVariacoesSection.vue`: incluir, mover e remover variações, cores com `<input type="color">` e texto hex, detalhes de acabamento, estoque e amostra com preview e validação
- [x] 4.4 Criar `ProdutoFotosSection.vue`: seleção múltipla, preview local, recusa de arquivo inválido com mensagem, associação a variação, ordem, indicação de capa e estado do envio com "Tentar de novo"
- [x] 4.5 Criar `ProdutoForm.vue` com as seções 1, 2, 3 e 6, o indicador de etapas, a composição das seções 4 e 5, os erros por campo e a rolagem até o primeiro erro
- [x] 4.6 Criar `ProdutoNewView.vue`: carga paralela de categorias e fornecedores, regra do seletor por perfil (vazio, um ou vários), gravação em etapas, trava pós-`201`, falha parcial, toast e redirecionamento (design D5, D6 e D9)
- [x] 4.7 Revogar os object URLs ao remover ou trocar arquivos e no `onBeforeUnmount`

## 5. [FE] Navegação

- [x] 5.1 Registrar a rota `admin-produtos-novo` (`/admin/produtos/novo`) para Vendedor e Administrador
- [x] 5.2 Adicionar o card "Produtos" no `AdminDashboardView.vue`, visível a Admin e Vendedor, com `newTo` `/admin/produtos/novo`
- [x] 5.3 Atualizar `docs/frontend/README.md` com o fluxo da tela de cadastro de produto

## 6. Validação

- [x] 6.1 Backend: `bun test`, `bun run lint` e `bun run check-types` em `backend/`
- [x] 6.2 Frontend: `bun run lint`, `bun run check-types` e `bun run build` em `frontend/`
- [ ] 6.3 Marcar no backlog os critérios da US-FE-08 que foram validados (depende de rodar as telas contra a API)

## 7. [FE] Listagem e edição de produtos

- [x] 7.1 Estender o contrato: `ProductListItemDto`, `ProductAdminFilterParams` e `PaginatedProductsResponse` em `src/types/products.ts`, e `existingSampleUrl` no `VariationFormItem`
- [x] 7.2 Adicionar em `src/api/produtos.ts`: `listarAdmin`, `buscarDetalhe`, `removerFoto` e `removerAmostra`
- [x] 7.3 Adicionar em `src/utils/produtos/`: `formFromProduct`, `toUpdatePayload`, `recordToRows` e os rótulos da listagem (`formatCurrencyBRL`, `availabilityLabel`, `formatDimensions`); enviar o `id` das variações no payload
- [x] 7.4 Criar `ProdutoListView.vue`: listagem paginada com busca, filtros por categoria, fornecedor, disponibilidade e status, miniatura da capa, estados de carga, erro e vazio, e desativação com confirmação
- [x] 7.5 Criar `ProdutoEditView.vue`: carga do produto, `PUT /produtos/:id`, envio dos arquivos novos em sequência e exclusão imediata de foto, amostra e produto, cada uma com confirmação
- [x] 7.6 Estender `ProdutoForm.vue`, `ProdutoFotosSection.vue`, `ProdutoVariacoesSection.vue` e `ProdutoVariacaoCard.vue` com `submitLabel`, as fotos já publicadas e a amostra já publicada
- [x] 7.7 Registrar as rotas `admin-produtos` e `admin-produtos-editar` para Vendedor e Administrador
- [x] 7.8 Atualizar `docs/frontend/README.md` com as telas de listagem e edição
- [x] 7.9 Frontend: `bun run lint`, `bun run check-types` e `bun run build` em `frontend/`
- [x] 7.10 Atualizar a especificação técnica da US-FE-08 no backlog com as telas de listagem e edição
- [x] 7.11 Transformar o `ProdutoForm.vue` em formulário em etapas: indicador de etapas, "Voltar" e "Próximo" com validação por etapa, `fieldStep` para abrir a etapa do primeiro erro e etapas livres na edição (design D2)
- [x] 7.12 Componentizar as telas de produto em `src/components/produtos/`, com o composable `useProdutoEnvioArquivos` para o envio comum ao cadastro e à edição, e nenhum arquivo acima de 500 linhas
- [x] 7.13 Criar o componente global `UiSelect` e trocar por ele todos os `<select>` do frontend
- [x] 7.14 Reorganizar o módulo de produto para todos os arquivos ficarem entre 150 e 500 linhas, com `ProdutoTelaLayout`, `ProdutoFormNavegacao`, `ProdutoPrecoDimensoesSection`, `ProdutoVariacaoAcabamento`, `ProdutoVariacaoAmostra`, `ProdutoListCabecalho` e `ProdutoListTabela`
- [x] 7.15 Corrigir os achados do code review: `PUT` com `null`/`{}` para limpar campos opcionais (`toUpdatePayload`), categoria e subtipo inativos do produto mantidos na edição, carga de opções e erro 409 compartilhados em `useProdutoTela`, rolagem do painel por callback explícito, validação calculada uma vez por mudança e mensagem de erro única na listagem

## 8. [DB] e [BE] JSONB gravado como texto

- [x] 8.1 [DB] Migração `013_fix_jsonb_string_values.sql`: converte `products.specifications` e `product_variations.finish_details` gravados como string de volta para objeto e cria `CHECK (jsonb_typeof(...) = 'object')` nas duas colunas
- [x] 8.2 [BE] `products.repository.ts` envia o objeto direto às colunas `jsonb`, sem `JSON.stringify`, e recebe o cliente SQL no construtor para teste
- [x] 8.3 [BE] Teste de regressão `tests/products-repository-jsonb.test.ts` (cadastro e edição enviam objeto, nunca texto JSON)
- [x] 8.4 Atualizar `docs/database/README.md` com a regra de JSONB sempre objeto
- [x] 8.5 Validação: migrações em banco vazio e segunda rodada sem pendências; `bun test`, `bun run lint` e `bun run check-types` no backend; teste de ponta a ponta de cadastro, edição e limpeza de campos contra a API
