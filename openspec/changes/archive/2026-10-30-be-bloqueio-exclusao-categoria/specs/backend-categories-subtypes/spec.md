## ADDED Requirements

### Requirement: Bloqueio de Exclusão de Categoria com Produtos Vinculados
O endpoint `DELETE /api/v1/categorias/:id`, restrito ao Administrador, SHALL recusar o soft delete de uma categoria que tenha ao menos um produto vinculado com `deleted_at IS NULL`, esteja o produto ativo ou inativo. A checagem dos produtos e o soft delete da categoria e de seus subtipos MUST ocorrer na mesma transação, com a linha da categoria bloqueada.

#### Scenario: Categoria com produto ativo vinculado
- **WHEN** o Administrador enviar `DELETE /api/v1/categorias/:id` para uma categoria com um ou mais produtos não excluídos e ativos
- **THEN** o sistema responde `409 Conflict` com uma mensagem que informa a quantidade de produtos vinculados

#### Scenario: Categoria com produto inativo vinculado
- **WHEN** o Administrador enviar `DELETE /api/v1/categorias/:id` para uma categoria cujo único produto vinculado está com `active = false` e `deleted_at IS NULL`
- **THEN** o sistema responde `409 Conflict`, porque o produto inativo continua vinculado

#### Scenario: Recusa não altera categoria nem subtipos
- **WHEN** a exclusão de uma categoria for recusada por haver produtos vinculados
- **THEN** a categoria e todos os seus subtipos permanecem com `deleted_at` nulo

#### Scenario: Categoria apenas com produtos excluídos logicamente
- **WHEN** o Administrador enviar `DELETE /api/v1/categorias/:id` para uma categoria cujos produtos vinculados têm todos `deleted_at` preenchido
- **THEN** o sistema aplica o soft delete na categoria e em seus subtipos e responde `200 OK`

#### Scenario: Categoria sem produtos vinculados
- **WHEN** o Administrador enviar `DELETE /api/v1/categorias/:id` para uma categoria sem nenhum produto vinculado
- **THEN** o sistema aplica o soft delete na categoria e em seus subtipos ativos na mesma transação e responde `200 OK`

#### Scenario: Categoria inexistente ou já excluída
- **WHEN** o Administrador enviar `DELETE /api/v1/categorias/:id` para um UUID sem categoria com `deleted_at IS NULL`
- **THEN** o sistema responde `404 Not Found`
