## Why

Para atender aos requisitos RF02, RF03, RF16, RF17, RF19, RNF08, RNF09 e RNF11 do PRD ([US-BE-09]), o portal da Empório Henz precisa da fundação de banco de dados do domínio de produtos (`products`, `product_variations` e `product_images`) e de endpoints REST completos sob `/api/v1/produtos` para cadastrar, listar, consultar, editar e desativar móveis com dimensões estruturadas em milímetros, especificações técnicas em `JSONB`, variações de acabamento, regras de disponibilidade (`IN_STOCK` / `ON_DEMAND`) e isolamento estrito multi-empresa para vendedores vinculados em `user_suppliers`. Atualmente, o módulo de produtos possui apenas a rota de recomendações (`GET /api/v1/produtos/:id/recomendados`) e as tabelas de produtos ainda não existem nas migrações do PostgreSQL.

## What Changes

- **Banco de Dados (Database First)**:
  - Criação da migração `010_create_products.sql` com a tabela `products` (`category_id` e `supplier_id` obrigatórios, `subtype_id` opcional com `ON DELETE RESTRICT`, dimensões obrigatórias em milímetros `height_mm`, `width_mm`, `depth_mm`, disponibilidade `IN_STOCK` / `ON_DEMAND`, `estimated_days`, `specifications JSONB`, `active`, `deleted_at` e índice único parcial `idx_products_slug_active WHERE deleted_at IS NULL`).
  - Criação da migração `011_create_product_variations.sql` com a tabela `product_variations` (`product_id`, `name`, `variation_type`, `colors_hex VARCHAR(7)[]`, `sample_image_path VARCHAR(255)`, `finish_details JSONB`, `sort_order`, `in_stock`, `deleted_at`).
  - Criação da migração `012_create_product_images.sql` com a tabela `product_images` (`product_id`, `variation_id` opcional, `thumbnail_path VARCHAR(255)`, `full_image_path VARCHAR(255)`, `sort_order`, `deleted_at`), deixando o esquema pronto para a US-BE-10 e já integrado ao `GET /api/v1/produtos/:id` e ao soft delete em cascata.
- **Imagens em arquivo, sem Base64 (RNF02)**:
  - O banco guarda só o caminho relativo de cada arquivo. Fotos e amostras ficam no diretório de uploads do backend, que em produção é o volume Docker `uploads_data` da VM, montado em `/app/uploads`.
  - As respostas expõem URLs (`thumbnailUrl`, `fullImageUrl`, `sampleImageUrl`) montadas por `toUploadUrl` em `backend/src/lib/uploads.ts`. O JSON de `POST`/`PUT` não aceita imagem, e editar uma variação preserva o `sample_image_path` já gravado.
  - `docker-compose.yml` declara o volume `uploads_data` no serviço `backend`; `backend/uploads/` entra no `.gitignore` e `uploads` no `backend/.dockerignore`.
- **Back-end (CRUD de Produtos com Escopo por Fornecedor — `backend/src/modules/products/`)**:
  - Expansão de `products.types.ts`, criação de `products.schema.ts` e evolução de `products.repository.ts`, `products.service.ts`, `products.controller.ts` e `products.routes.ts` mantendo compatibilidade com `GET /api/v1/produtos/:id/recomendados`.
  - `GET /api/v1/produtos` (`attachUserIfAuthenticated`): Listagem paginada padrão (`{ data, pagination }`) com filtros por `status`/`active`, `supplierId`, `categoryId`, `subtypeId`, `availabilityType` e `search`. Visitantes e Clientes visualizam apenas itens ativos (`active = true`); Vendedores visualizam apenas produtos de suas empresas vinculadas em `user_suppliers` (retornando `403 Forbidden` se não possuírem vínculos ativos ou se filtrarem por `supplierId` não autorizado); Administradores possuem visão global de todos os fornecedores e status.
  - `GET /api/v1/produtos/:id` (`attachUserIfAuthenticated`): Retorna todos os dados do produto, variações ativas (`variations`) e imagens ativas (`images`) ordenadas por `sort_order`. Bloqueia com `403 Forbidden` se um Vendedor tentar consultar privadamente produto de empresa não vinculada, e retorna `404 Not Found` para visitantes/clientes se o produto estiver inativo.
  - `POST /api/v1/produtos` (`authMiddleware`, `requireRole(ROLES.SELLER, ROLES.ADMIN)`): Criação transacional de produto (e variações opcionais) com validação de dimensões em mm (`> 0`), disponibilidade (`ON_DEMAND` exige `estimatedDays >= 1`; `IN_STOCK` normaliza `estimatedDays = 0`), integridade de `categoryId`, `subtypeId` (opcional, mas validado contra `categoryId` quando enviado) e `supplierId`, unicidade de `slug` ativo (`409 Conflict`) e validação estrita de escopo multi-empresa em `user_suppliers` (`403 Forbidden`).
  - `PUT /api/v1/produtos/:id` (`authMiddleware`, `requireRole(ROLES.SELLER, ROLES.ADMIN)`): Atualização transacional de dados cadastrais e sincronização opcional de `variations` preservando IDs existentes (atualiza variações com `id`, insere novas sem `id` e aplica `deleted_at` nas omitidas), validando o escopo do Vendedor tanto sobre o fornecedor atual do produto quanto sobre o novo `supplierId` (se alterado).
  - `DELETE /api/v1/produtos/:id` (`authMiddleware`, `requireRole(ROLES.SELLER, ROLES.ADMIN)`): Soft delete transacional preenchendo `deleted_at = CURRENT_TIMESTAMP` no produto e em cascata lógica nas suas variações e imagens, após validar o vínculo do Vendedor com o fornecedor do produto.
- **Documentação Técnica e Collection Bruno**:
  - Documentação do fluxograma de autorização por papel de `/api/v1/produtos` em `docs/PRD.md` e `docs/backend/README.md`, além da atualização de `docs/database/README.md`.
  - Atualização da collection Bruno em `docs/backend/collections/bruno/Products/` com os arquivos `.bru` do CRUD (`List Products`, `Get Product by ID`, `Create Product`, `Update Product`, `Delete Product`).

## Capabilities

### New Capabilities
- `backend-products-crud`: Persistência relacional do domínio de produtos (`products`, `product_variations`, `product_images`) e endpoints REST do CRUD de produtos (`/api/v1/produtos`) com paginação padronizada, sincronização de variações, soft delete em cascata lógica e controle de escopo multi-empresa por fornecedor vinculado.

### Modified Capabilities

## Impact

- **Banco de Dados**: Novas migrações `010_create_products.sql`, `011_create_product_variations.sql` e `012_create_product_images.sql` em `backend/database/migrations/`.
- **Backend**: Evolução completa de `backend/src/modules/products/`, novo helper `backend/src/lib/uploads.ts` e testes automatizados em `backend/tests/products-service.test.ts`.
- **Infraestrutura**: Volume `uploads_data` em `docker-compose.yml`, `.gitignore`, `backend/.dockerignore` e avisos de operação no `README.md` da raiz.
- **Documentação e Contratos**: Atualização de `docs/PRD.md`, `docs/backend/README.md`, `docs/database/README.md`, `docs/planning/user-stories-backlog.md` e `docs/backend/collections/bruno/Products/`.
