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

### Requirement: Listagem paginada das listas do cliente

`GET /api/v1/listas` SHALL responder no envelope de paginação do sistema (`{ data, pagination: { page, limit, total, totalPages } }`), lendo `page` e `limit` com as mesmas regras das outras listagens (`parsePagination`: `page` de 1 a 10000, `limit` de 1 a 100, padrão 20). Com `?itens=true`, cada lista de `data` SHALL trazer `items`.

#### Scenario: Segunda página
- **WHEN** o cliente tem 6 listas e pede `GET /api/v1/listas?page=2&limit=4`
- **THEN** a resposta SHALL trazer 2 listas em `data` e `pagination` igual a `{ page: 2, limit: 4, total: 6, totalPages: 2 }`

#### Scenario: Front carrega todas as listas
- **WHEN** o front monta "Minhas listas"
- **THEN** ele SHALL pedir as páginas com `limit=100` até `totalPages`, como a store de categorias
