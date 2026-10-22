# Spec Delta

## MODIFIED Requirements

### Requirement: Listagem Paginada e Consulta Detalhada de Produtos
O sistema MUST disponibilizar `GET /api/v1/produtos` com paginação padronizada (`{ data, pagination }`) e filtros combinados (`categoryId`, `subtypeId`, `supplierId`, `availabilityType`, `active`, `search`), e `GET /api/v1/produtos/:id` retornando todos os dados do produto, suas `variations` e suas `images` ordenadas por `sort_order`. Cada item da listagem MUST trazer `thumbnailUrl` com a miniatura da capa do produto e nenhuma outra URL de imagem. A capa é a foto ativa sem variação vinculada de menor `sort_order`; sem foto desse tipo, a foto ativa de variação de menor `sort_order`; sem nenhuma foto ativa, `thumbnailUrl` MUST ser `null`.

#### Scenario: Listagem filtrada automaticamente pelos fornecedores do Vendedor
- **WHEN** um Vendedor vinculado aos fornecedores A e B chama `GET /api/v1/produtos`
- **THEN** o sistema MUST retornar no envelope paginado exclusivamente os produtos pertencentes aos fornecedores A e B, ocultando produtos de outros fornecedores

#### Scenario: Visitante ou Cliente consulta listagem e detalhes de produtos
- **WHEN** um visitante anônimo ou usuário Cliente (`role = 1`) chama `GET /api/v1/produtos` ou `GET /api/v1/produtos/:id`
- **THEN** o sistema MUST retornar apenas produtos com `active = true` e `deleted_at IS NULL` (retornando `404 Not Found` em `GET /:id` se o produto estiver inativo ou deletado)

#### Scenario: Capa vem da primeira foto sem variação
- **WHEN** um produto tem uma foto vinculada a variação com `sort_order` 0 e uma foto sem variação com `sort_order` 1, e alguém chama `GET /api/v1/produtos`
- **THEN** o item desse produto MUST trazer em `thumbnailUrl` a miniatura da foto sem variação

#### Scenario: Capa cai para foto de variação
- **WHEN** todas as fotos ativas de um produto estão vinculadas a variações
- **THEN** o item desse produto MUST trazer em `thumbnailUrl` a miniatura da foto de menor `sort_order`

#### Scenario: Produto sem foto
- **WHEN** um produto não tem nenhuma foto ativa
- **THEN** o item desse produto MUST trazer `thumbnailUrl: null`

#### Scenario: Foto excluída deixa de ser capa
- **WHEN** a foto que era capa de um produto recebe soft delete
- **THEN** a listagem MUST passar a usar a próxima foto pela mesma regra, ou `null` se não restar nenhuma

#### Scenario: Listagem não traz a imagem completa
- **WHEN** alguém chama `GET /api/v1/produtos`
- **THEN** nenhum item MUST conter `fullImageUrl` nem o array `images`
