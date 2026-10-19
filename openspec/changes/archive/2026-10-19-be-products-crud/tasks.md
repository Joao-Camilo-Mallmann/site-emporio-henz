## 1. [DB] Migrações de Banco de Dados (Database First)

- [x] 1.1 Criar `backend/database/migrations/010_create_products.sql` com a tabela `products`, FKs `ON DELETE RESTRICT` (`category_id`, `supplier_id`, `subtype_id` opcional), dimensões em mm (`height_mm`, `width_mm`, `depth_mm` NOT NULL), `specifications JSONB`, `deleted_at` e índice único parcial `idx_products_slug_active WHERE deleted_at IS NULL`
- [x] 1.2 Criar `backend/database/migrations/011_create_product_variations.sql` com a tabela `product_variations` (`product_id` FK `ON DELETE RESTRICT`, `name`, `variation_type`, `colors_hex VARCHAR(7)[]`, `sample_image_path VARCHAR(255)`, `finish_details JSONB`, `sort_order`, `in_stock`, `deleted_at`)
- [x] 1.3 Criar `backend/database/migrations/012_create_product_images.sql` com a tabela `product_images` (`product_id` FK `ON DELETE RESTRICT`, `variation_id` FK opcional, `thumbnail_path VARCHAR(255)`, `full_image_path VARCHAR(255)`, `sort_order`, `deleted_at`)
- [x] 1.4 Atualizar `docs/database/README.md` registrando as novas tabelas implementadas (`categories`, `product_subtypes`, `products`, `product_variations`, `product_images`)

## 2. [BE] Tipos, Schemas e Validações do Módulo de Produtos

- [x] 2.1 Expandir `backend/src/modules/products/products.types.ts` com DTOs de criação/atualização (`CreateProductDto`, `UpdateProductDto`, `ProductVariationInputDto`), retorno detalhado (`ProductDetailDto`, `ProductVariationDto`, `ProductImageDto`), filtros (`ProductQueryFilters`), paginação (`PaginatedProductsResult`) e linhas do banco (`ProductDbRow`, `ProductVariationDbRow`, `ProductImageDbRow`)
- [x] 2.2 Criar `backend/src/modules/products/products.schema.ts` validando query params (`validateProductQuery` com `parsePagination` e `parseSearch`) e payloads (`validateCreateProduct`, `validateUpdateProduct`), incluindo dimensões em mm (`> 0`), regras de disponibilidade (`IN_STOCK` normaliza `estimatedDays = 0`; `ON_DEMAND` exige `estimatedDays >= 1`), `categoryId` e `supplierId` obrigatórios, `subtypeId` opcional e validação do array opcional `variations`

## 3. [BE] Repositório, Serviço, Controller e Rotas REST (`/api/v1/produtos`)

- [x] 3.1 Expandir `backend/src/modules/products/products.repository.ts` com métodos para listagem paginada (`listPaginated` com filtros combinados e escopo por `supplierIds`), busca completa por ID (`findDetailById` trazendo `variations` e `images` ordenados por `sort_order`), checagem de unicidade de slug (`existsProductSlugActive`), verificação de vínculos (`findActiveSupplierIdsByUserId`, validação de existência de `category`, `subtype` pertencente à categoria e `supplier`), criação transacional (`createProduct`), atualização transacional com sincronização de variações preservando IDs (`updateProduct`) e soft delete em cascata lógica (`softDeleteProductWithCascade`)
- [x] 3.2 Expandir `backend/src/modules/products/products.service.ts` implementando `listPaginated`, `getById`, `createProduct`, `updateProduct` e `deleteProduct`, aplicando rigorosamente a matriz de autorização e isolamento multi-empresa para `ROLES.SELLER (2)` (`403 Forbidden` em E1, E2 e E3) e mantendo `getRecommendations` intacto
- [x] 3.3 Expandir `backend/src/modules/products/products.controller.ts` e `backend/src/modules/products/products.routes.ts` registrando `GET /`, `GET /:id`, `POST /`, `PUT /:id` e `DELETE /:id` com os middlewares adequados (`attachUserIfAuthenticated` nas leituras e `authMiddleware` + `requireRole(ROLES.SELLER, ROLES.ADMIN)` nas mutações)

## 4. [TEST] Testes Automatizados e Documentação Bruno

- [x] 4.1 Expandir `backend/tests/products-service.test.ts` cobrindo o CRUD completo de produtos, validações de schema (dimensões em mm, `IN_STOCK` vs `ON_DEMAND`, `subtypeId`), sincronização de variações preservando IDs, soft delete e bloqueios `403 Forbidden` de escopo multi-empresa do Vendedor (sem vínculo, fornecedor não autorizado no POST/PUT/DELETE/GET)
- [x] 4.2 Atualizar a collection Bruno em `docs/backend/collections/bruno/Products/` com os arquivos `.bru` para `List Products`, `Get Product by ID`, `Create Product`, `Update Product` e `Delete Product`
- [x] 4.3 Executar `bun run check-types`, `bun run lint`, `bun test` e `bun run build` em `backend/` e marcar os critérios concluídos da `US-BE-09` em `docs/planning/user-stories-backlog.md`

## 5. Correção: Imagens em Arquivo no Volume de Uploads (sem Base64)

- [x] 5.1 [DB] Trocar as colunas Base64 de `011` e `012` por `sample_image_path`, `thumbnail_path` e `full_image_path` (`VARCHAR(255)`), alinhando ao DER do PRD
- [x] 5.2 [BE] Remover `sampleImageBase64` do payload de variações e expor `thumbnailUrl`, `fullImageUrl` e `sampleImageUrl` via `toUploadUrl` (`backend/src/lib/uploads.ts`)
- [x] 5.3 [BE] Manter `sample_image_path` fora do `UPDATE` da sincronização de variações no `PUT`
- [x] 5.4 [TEST] Cobrir a conversão caminho → URL, os mapeadores de imagem e variação e o descarte de imagem no JSON de variações
- [x] 5.5 [INFRA] Declarar o volume `uploads_data` em `/app/uploads` no serviço `backend` e ignorar `backend/uploads/` no git e no build Docker
- [x] 5.6 [DOCS] Atualizar PRD (RF02, RNF02, história 8, UC08, DER, decisões, testes e glossário), backlog (US-BE-09, US-BE-10, US-FE-08, US-BE-11, US-BE-12), documentação de banco e de back-end, collection Bruno e `README.md`
- [ ] 5.7 [DB] Rodar `bun run migrate` em banco limpo e conferir as colunas `*_path` em `product_images` e `product_variations`
- [ ] 5.8 [INFRA] Subir `docker compose --profile prod up -d --build` e confirmar `/app/uploads` montado no volume `uploads_data`
