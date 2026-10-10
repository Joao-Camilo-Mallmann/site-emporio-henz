## Why

Para viabilizar a navegação por ambientes no catálogo de móveis da Empório Henz e atender ao requisito RF04 do PRD, o sistema precisa classificar seus produtos em categorias principais (ambientes da casa) e subtipos vinculados (tipologias de móveis). No momento, as tabelas `categories` e `product_subtypes` ainda não existem nas migrações do PostgreSQL, e não existem endpoints REST nem documentação Bruno para gerenciar essas entidades no backend com regras estritas de soft delete e RBAC.

## What Changes

- **Banco de Dados (Database First)**:
  - Criação das migrações SQL `008_create_categories.sql` e `009_create_product_subtypes.sql` com as tabelas `categories` e `product_subtypes`, constraints de chave estrangeira (`ON DELETE RESTRICT`), colunas `deleted_at` e índices parciais de unicidade ativa (`WHERE deleted_at IS NULL`).
  - Atualização do `backend/database/seed.ts` para popular de forma idempotente os 6 ambientes oficiais do frontend (Quarto, Sala de Estar, Sala de Jantar, Cozinha, Escritório, Banheiro) e seus respectivos subtipos essenciais.
- **Back-end (Rotas, Módulos e Regras de Negócio)**:
  - Criação de módulos desacoplados e independentes: `backend/src/modules/categories/` e `backend/src/modules/subtypes/`, ambos estruturados com DTOs, schemas de validação, repositórios SQL nativos, serviços de negócio e controllers.
  - Criação do utilitário compartilhado `backend/src/lib/slug.ts` para normalização de slugs e validação de UUID.
  - Endpoint público de categorias: `GET /api/v1/categorias` retornando a hierarquia completa de categorias com subtipos ativos em JSON limpo ou resultado paginado quando informados os parâmetros de paginação (`page`, `limit`, `search`).
  - Endpoint público de subtipos: `GET /api/v1/subtipos` com suporte a listagem paginada e filtros combinados por `categoryId`, `search` e `active`.
  - Endpoints restritos ao Administrador (`role = 3`):
    - `POST /api/v1/categorias`: Criação de categoria principal com geração automática ou validação de slug e checagem de unicidade ativa (409 Conflict).
    - `PUT /api/v1/categorias/:id`: Atualização de categoria com validação estrita de unicidade de slug excluindo o próprio ID.
    - `DELETE /api/v1/categorias/:id`: Soft delete da categoria e cascata lógica atômica em transação preenchendo `deleted_at` em todos os seus subtipos vinculados.
    - `POST /api/v1/subtipos`: Criação de subtipo associado a uma `category_id`.
    - `PUT /api/v1/subtipos/:id`: Atualização de subtipo com validação estrita de unicidade de slug.
    - `DELETE /api/v1/subtipos/:id`: Soft delete do subtipo.
  - Registro independente das rotas em `backend/src/routes/index.ts` sob `/api/v1/categorias` e `/api/v1/subtipos`.
- **Documentação de API (Bruno)**:
  - Criação da coleção Bruno com arquivos `.bru` em `docs/backend/collections/bruno/Categories/` e `docs/backend/collections/bruno/Subtypes/`, cobrindo listagens paginadas/hierárquicas públicas e operações administrativas com token Bearer.

## Capabilities

### New Capabilities
- `backend-categories-subtypes`: Gerenciamento de categorias (ambientes) e subtipos de móveis com persistência relacional, soft delete com cascata lógica, unicidade de slug ativa e documentação interativa na coleção Bruno.

### Modified Capabilities

## Impact

- Banco de dados: Novas migrações `008_create_categories.sql`, `009_create_product_subtypes.sql` e expansão de `seed.ts`.
- Backend: Novos endpoints sob `/api/v1/categorias` e `/api/v1/subtipos`, integração ao roteador central `backend/src/routes/index.ts`.
- Documentação: Novas pastas e arquivos `.bru` em `docs/backend/collections/bruno/Categories/` e `docs/backend/collections/bruno/Subtypes/`.
