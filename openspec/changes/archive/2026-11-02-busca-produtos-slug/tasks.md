## 1. Banco `[DB]`

- [x] 1.1 Criar `backend/database/migrations/014_search_slug.sql` com `CREATE EXTENSION IF NOT EXISTS unaccent` e a função `search_slug(text)` imutável, com a mesma regra do `slugify`
- [x] 1.2 Documentar a extensão e a função em `docs/database/README.md`

## 2. Backend `[BE]`

- [x] 2.1 Criar `parseSearchSlug` em `src/lib/pagination.ts` (corte em 100 + `slugify`, vazio vira `undefined`) e chamá-la em `validateProductQuery` (`products.schema.ts`)
- [x] 2.2 Em `products.repository.ts`, `listPaginated` compara `search_slug(p.name)`, `search_slug(p.description)` e `search_slug(p.collection_line)` com `LIKE '%termo%'` nas consultas de contagem e de página
- [x] 2.3 Documentar em `products.types.ts` que `ProductQueryFilters.search` está na forma de slug
- [x] 2.4 Atualizar `docs/backend/collections/bruno/Products/List Products.bru` e `List Products Admin.bru` com a normalização do `search`

## 3. Testes `[TEST]`

- [x] 3.0 Criar `backend/tests/lib/pagination.test.ts` para `parseSearchSlug` e confirmar que `parseSearch` segue literal
- [x] 3.1 Criar `backend/tests/lib/slug.test.ts` cobrindo acento, caixa, underline, espaços repetidos, símbolos e termo que vira vazio
- [x] 3.2 Criar `backend/tests/modules/products/products.schema.test.ts` para `validateProductQuery`: termo normalizado, termo só de símbolos ignorado, limite de 100 caracteres aplicado antes da normalização
- [x] 3.3 Ajustar `MockProductsRepository` para comparar `slugify` de nome, descrição e linha, e cobrir em `products.service.test.ts` uma busca com acento, caixa e underline
- [x] 3.4 Rodar `bun test`, `bun run check-types` e `bun run lint` no `backend`

## 4. Frontend `[FE]`

- [x] 4.0 Criar `limparTermoBusca` em `utils/slug.ts` e aplicá-la direto no campo da navbar (`watch` em `searchQuery`)
- [x] 4.1 Em `AppNavbar.vue`, `handleSearch` apara e junta espaços repetidos antes de enviar `name` para `/catalogo`
- [x] 4.2 Em `api/catalogo.ts`, enviar `search: slugify(name)` à API no lugar de `name` e filtrar o fallback mockado com `slugify` dos dois lados
- [x] 4.3 Rodar `bun run check-types` e `bun run lint` no `frontend`
- [x] 4.4 Conferir no navegador que "ROUPEIRO_ROMÃ" e "roupeiro roma" encontram o Roupeiro Roma e que o resumo mostra o termo como digitado

## 5. Documentação

- [x] 5.1 Registrar as histórias `[US-BE-18]` e `[US-FE-16]` em `docs/planning/user-stories-backlog.md` e marcar os critérios atendidos
