# Spec Delta

## MODIFIED Requirements

### Requirement: Listagem Paginada e Consulta Detalhada de Produtos
O sistema MUST disponibilizar `GET /api/v1/produtos` com paginação padronizada (`{ data, pagination }`) e filtros combinados (`categoryId`, `subtypeId`, `supplierId`, `availabilityType`, `active`, `search`), e `GET /api/v1/produtos/:id` retornando todos os dados do produto, suas `variations`, suas `images` ordenadas por `sort_order`, e os objetos aninhados `category` (`{ id, name, slug }`) e `supplier` (`{ id, name }`) sem valores nulos, preservando os campos escalares `categoryId`, `subtypeId` e `supplierId`.

#### Scenario: Listagem filtrada automaticamente pelos fornecedores do Vendedor
- **WHEN** um Vendedor vinculado aos fornecedores A e B chama `GET /api/v1/produtos`
- **THEN** o sistema MUST retornar no envelope paginado exclusivamente os produtos pertencentes aos fornecedores A e B, ocultando produtos de outros fornecedores

#### Scenario: Visitante ou Cliente consulta listagem e detalhes de produtos
- **WHEN** um visitante anônimo ou usuário Cliente (`role = 1`) chama `GET /api/v1/produtos` ou `GET /api/v1/produtos/:id`
- **THEN** o sistema MUST retornar apenas produtos com `active = true` e `deleted_at IS NULL` (retornando `404 Not Found` em `GET /:id` se o produto estiver inativo ou deletado)

#### Scenario: Detalhe do produto retorna objetos aninhados de categoria e fornecedor
- **WHEN** um usuário autorizado ou visitante consulta um produto ativo via `GET /api/v1/produtos/:id`
- **THEN** a resposta 200 MUST conter o objeto `category` com `{ id, name, slug }`, o objeto `supplier` com `{ id, name }`, as fotos em `images` ordenadas por `sort_order`, as variações em `variations` com cores e amostras, e o objeto JSONB `specifications`, mantendo `categoryId`, `subtypeId` e `supplierId`

#### Scenario: Identificador inválido na consulta por ID
- **WHEN** uma requisição para `GET /api/v1/produtos/:id` contiver um identificador que não seja um UUID válido
- **THEN** o sistema MUST retornar status `400 Bad Request` com mensagem informativa
