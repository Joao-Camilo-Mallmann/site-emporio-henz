# Tasks

## 1. [BE] RBAC Middleware and Tests

- [x] 1.1 Move the existing role guard to `backend/src/middlewares/rbac.ts`, update all internal imports, and verify backend type-checking succeeds.
- [x] 1.2 Add `backend/tests/rbac.test.ts` cases for customer denial, seller supplier-write denial, seller authorized product access, administrator bypass, and the standardized 403 JSON response; verify with `bun test tests/rbac.test.ts` from `backend/`.
- [x] 1.3 Add seller product-scope tests for no active supplier link, a product belonging to another supplier, and an allowed linked supplier; verify with `bun test tests/rbac.test.ts` from `backend/`.

## 2. [TEST/DOCS] Acceptance and Validation

- [x] 2.1 Update the existing RBAC test story in `docs/planning/user-stories-backlog.md` to reference `backend/tests/rbac.test.ts` and mark only verified acceptance criteria complete.
- [x] 2.2 Run `bun test`, `bun run check-types`, and `bun run lint` from `backend/`; record the results and resolve any failures caused by this change.
