## 1. Banco de Dados First (Persistência e Seed) [DB]

- [ ] 1.1 Criar a migração `backend/database/migrations/008_create_categories_and_subtypes.sql` com as tabelas `categories` e `product_subtypes`, chaves estrangeiras (`ON DELETE RESTRICT`), colunas `deleted_at` e índices parciais de slug ativo
- [ ] 1.2 Atualizar `backend/database/seed.ts` para incluir o seed idempotente dos 6 ambientes oficiais (`quarto`, `sala-de-estar`, `sala-de-jantar`, `cozinha`, `escritorio`, `banheiro`) e seus subtipos correspondentes
- [ ] 1.3 Executar e validar `bun run migrate` e `bun run seed` no PostgreSQL

## 2. Implementação do Módulo Backend [BE]

- [ ] 2.1 Criar DTOs e tipos TypeScript em `backend/src/modules/categories/categories.types.ts`
- [ ] 2.2 Criar schemas e validações de payload e slugs (com utilitário `slugify`) em `backend/src/modules/categories/categories.schema.ts`
- [ ] 2.3 Criar o repositório SQL nativo em `backend/src/modules/categories/categories.repository.ts` com consultas otimizadas para árvore aninhada
- [ ] 2.4 Implementar regras de negócio, validação estrita de slug no update (ignorando o próprio ID) e soft delete em cascata lógica transacional em `backend/src/modules/categories/categories.service.ts`
- [ ] 2.5 Implementar `backend/src/modules/categories/categories.controller.ts` com respostas HTTP semânticas (200, 201, 400, 403, 404, 409)
- [ ] 2.6 Configurar `backend/src/modules/categories/categories.routes.ts` com RBAC e registrar no roteador principal `backend/src/routes/index.ts` sob `/api/v1/categorias` e `/api/v1/subtipos`

## 3. Coleção Bruno e Documentação [DOCS]

- [ ] 3.1 Criar a pasta `docs/backend/collections/bruno/Categories/` com arquivos `.bru` para `List Categories` (público), `Create Category`, `Update Category` e `Delete Category` (Admin)
- [ ] 3.2 Criar a pasta `docs/backend/collections/bruno/Subtypes/` com arquivos `.bru` para `Create Subtype`, `Update Subtype` e `Delete Subtype` (Admin)

## 4. Validação de Qualidade e Governança

- [ ] 4.1 Executar `bun run check-types` e garantir que não há erros de tipagem no backend
- [ ] 4.2 Executar `bun run lint` e garantir código limpo sem violações de regras
