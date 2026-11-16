# Design

## Context

The backend uses Bun's native `Router` and stores authenticated identity in `RequestContext.user`. `requireRole` currently lives in `backend/src/middlewares/role.ts`; supplier-specific product authorization is separately enforced by `ProductsService`. See [proposal.md](./proposal.md) for motivation and scope.

## Goals / Non-Goals

**Goals:**

- Make `backend/src/middlewares/rbac.ts` the canonical location for the existing role guard and constants.
- Verify the actual middleware response shape/status and the seller's `user_suppliers` product scope without a live database.
- Preserve the current authorization policy and HTTP contract.

**Non-Goals:**

- Changing endpoint access, authentication, product authorization rules, or response behavior.
- Adding database fixtures, migrations, runtime dependencies, or API documentation changes.

## Decisions

- Move the existing middleware implementation to `rbac.ts` and update all internal imports, rather than maintaining duplicate implementations or a compatibility wrapper; the repository has no external package boundary for these imports.
- Exercise the guard through the existing `Router` with a test-only identity injector. This verifies 403/200/201 responses and the JSON contract without JWT or database setup, which are outside this middleware's responsibility.
- Test product supplier ownership through `ProductsService.assertCanManageProduct` with a `ProductsRepository` subclass that provides only the seller's active supplier IDs and target product. This isolates the `user_suppliers` authorization boundary while keeping database access out of the test.
- Keep OpenSpec specs unchanged: the existing `backend-middlewares-rbac` capability and PRD already define these behaviors, so this is test coverage and file alignment only.

## Risks / Trade-offs

- The router tests inject a user instead of exercising JWT authentication → authentication has its own middleware and test scope; these tests focus on authorization after identity is established.
- The product-scope tests use a repository stub → they verify the service's authorization decision, not PostgreSQL query correctness; the query remains covered by the repository's existing implementation and schema.

## Migration Plan

No runtime migration is required. Update source imports with the middleware move, add tests, and run the focused test plus backend test, lint, and type-check commands.
