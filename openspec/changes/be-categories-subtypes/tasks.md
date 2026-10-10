## 1. Banco de Dados First (Persistência e Seed) [DB]

- [x] 1.1 Criar as migrações `backend/database/migrations/008_create_categories.sql` e `backend/database/migrations/009_create_product_subtypes.sql` com as tabelas `categories` e `product_subtypes`, chaves estrangeiras (`ON DELETE RESTRICT`), colunas `deleted_at` e índices parciais de slug ativo
- [x] 1.2 Atualizar `backend/database/seed.ts` para incluir o seed idempotente dos 6 ambientes oficiais (`quarto`, `sala-de-estar`, `sala-de-jantar`, `cozinha`, `escritorio`, `banheiro`) e seus subtipos correspondentes
- [x] 1.3 Executar e validar `bun run migrate` e `bun run seed` no PostgreSQL

## 2. Implementação dos Módulos Backend Desacoplados [BE]

- [x] 2.1 Criar DTOs e tipos TypeScript em `backend/src/modules/categories/categories.types.ts` e `backend/src/modules/subtypes/subtypes.types.ts` com suporte a metadados de paginação
- [x] 2.2 Criar utilitário `backend/src/lib/slug.ts`, schemas e validações de payload, filtros de query e slugs em `categories.schema.ts` e `subtypes.schema.ts`
- [x] 2.3 Criar os repositórios SQL nativos em `categories.repository.ts` e `subtypes.repository.ts` com consultas otimizadas para hierarquia aninhada e listagens paginadas
- [x] 2.4 Implementar regras de negócio, validação estrita de slug, paginação e soft delete em cascata lógica transacional em `categories.service.ts` e `subtypes.service.ts`
- [x] 2.5 Implementar `categories.controller.ts` e `subtypes.controller.ts` com rotas `GET /` paginadas (com filtros por categoria e busca) e respostas HTTP semânticas
- [x] 2.6 Configurar rotas isoladas em `categories.routes.ts` e `subtypes.routes.ts` com RBAC e registrar no roteador principal `backend/src/routes/index.ts` sob `/api/v1/categorias` e `/api/v1/subtipos`

## 3. Coleção Bruno e Documentação [DOCS]

- [x] 3.1 Criar a pasta `docs/backend/collections/bruno/Categories/` com arquivos `.bru` para `List Categories` (público hierárquico/paginado), `Create Category`, `Update Category` e `Delete Category` (Admin)
- [x] 3.2 Criar a pasta `docs/backend/collections/bruno/Subtypes/` com arquivos `.bru` para `List Subtypes` (público paginado), `Create Subtype`, `Update Subtype` e `Delete Subtype` (Admin)

## 4. Validação de Qualidade e Governança

- [x] 4.1 Executar `bun run check-types` e garantir que não há erros de tipagem no backend
- [x] 4.2 Executar `bun run lint` e garantir código limpo sem violações de regras

## 5. Correções de Segurança da Revisão de Código [BE]

- [x] 5.1 Restringir as leituras públicas a registros ativos (`attachUserIfAuthenticated` + `includeInactive` apenas para Administrador) e registrar a regra no RF04 do PRD
- [x] 5.2 Validar `:id` como UUID nos controllers de categorias e subtipos (`400 Bad Request`)
- [x] 5.3 Limitar paginação e busca em `backend/src/lib/pagination.ts` e `name`/`slug` a 255 caracteres nos schemas
- [x] 5.4 Converter violação do índice único de slug em `409 Conflict` e tornar genérica a mensagem do `500` no `errorHandler`
- [x] 5.5 Cobrir as correções com testes em `backend/tests/` e atualizar a collection Bruno
- [ ] 5.6 Validar contra o PostgreSQL as consultas de visibilidade de subtipos e o `409` em escrita concorrente

## 6. Demais Achados da Revisão de Código [DB] [BE]

- [x] 6.1 Rejeitar com `400` nome que não gera slug quando o slug não é informado
- [x] 6.2 Tornar atômica a checagem da categoria na criação e movimentação de subtipos (`FOR SHARE`) e marcar a categoria antes dos subtipos na cascata
- [x] 6.3 Tornar o seed não destrutivo (somente insere o que nunca existiu) e transacional
- [x] 6.4 Executar em paralelo as consultas da hierarquia e das listagens paginadas e escapar curingas do `ILIKE`
- [x] 6.5 Unificar o mapeamento de linhas e a checagem de slug nos repositórios
- [ ] 6.6 Validar contra o PostgreSQL o `INSERT ... SELECT ... FOR SHARE`, o `UPDATE` com `EXISTS ... FOR SHARE` e o seed
- [ ] 6.7 Decidir e registrar no PRD o tratamento dos produtos ao deletar ou desativar categoria ou subtipo
