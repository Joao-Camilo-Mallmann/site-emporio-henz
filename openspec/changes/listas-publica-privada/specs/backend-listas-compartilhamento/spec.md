## ADDED Requirements

### Requirement: Lista privada por padrão

Toda lista (padrão ou personalizada) SHALL ser criada com `is_public = FALSE`. A rota pública `GET /api/v1/listas/compartilhadas/:shareSlug` SHALL responder `404` enquanto a lista for privada.

#### Scenario: Lista nova não abre pelo link

- **WHEN** um cliente cria uma lista e alguém acessa `GET /api/v1/listas/compartilhadas/<shareSlug>` dessa lista
- **THEN** a resposta SHALL ser `404`

### Requirement: Dono liga e desliga o link público

O sistema SHALL expor `PATCH /api/v1/listas/:id/compartilhamento` para o cliente autenticado, com corpo `{ "isPublic": boolean }`, respondendo `200` com a lista atualizada (incluindo `isPublic` e `shareSlug`). A rota SHALL valer também para as listas padrão.

#### Scenario: Tornar a lista pública

- **WHEN** o dono envia `{ "isPublic": true }`
- **THEN** a resposta SHALL trazer `isPublic: true` e o mesmo `shareSlug`
- **AND** `GET /api/v1/listas/compartilhadas/<shareSlug>` SHALL responder `200` com nome, tipo e itens, sem dados do dono

#### Scenario: Tornar a lista privada de novo

- **WHEN** o dono envia `{ "isPublic": false }` para uma lista pública
- **THEN** o link público SHALL voltar a responder `404`

#### Scenario: Corpo inválido

- **WHEN** `isPublic` está ausente ou não é booleano
- **THEN** a resposta SHALL ser `400`

#### Scenario: Lista de outro cliente

- **WHEN** um cliente envia a requisição para uma lista que não é dele
- **THEN** a resposta SHALL ser `404` e a lista não SHALL mudar
