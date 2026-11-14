## 1. Backend: bloqueio na exclusão de categoria `[BE]`

- [x] 1.1 Criar `CategoriesRepository.countLinkedProducts` (produtos com `deleted_at IS NULL`)
- [x] 1.2 Reescrever `CategoriesRepository.softDeleteCategoryWithCascade`: `SELECT ... FOR UPDATE` na categoria e `UPDATE ... WHERE NOT EXISTS` produto vinculado como trava, tudo na mesma transação
- [x] 1.3 Em `categories.schema.ts`, `assertCanDeleteCategory` valida antes (`404` e `409` com a quantidade); o controller a chama e só então chama o service

## 2. Testes `[TEST]`

- [x] 2.1 Ajustar `MockCategoriesRepository` para guardar produtos e contar produtos vinculados
- [x] 2.2 Cobrir em `categories.service.test.ts`: produto ativo bloqueia, produto inativo bloqueia, recusa não altera subtipos, produto excluído não bloqueia e categoria inexistente responde `404`
- [x] 2.3 Rodar `bun test`, `bun run check-types` e `bun run lint` no `backend`

## 3. Documentação

- [x] 3.1 Documentar o `409` em `docs/backend/collections/bruno/Categories/Delete Category.bru`
- [x] 3.2 Registrar a história `[US-BE-17]` em `docs/planning/user-stories-backlog.md` e marcar os critérios atendidos
