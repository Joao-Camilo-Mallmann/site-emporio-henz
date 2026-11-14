# Proposal

## Why

The backend already enforces the documented role policy, but it has no focused RBAC test suite and the guard lives in `role.ts` rather than the requested `rbac.ts`. Adding regression tests and aligning the middleware path will make the existing authorization contract explicit without changing its behavior.

## What Changes

- Move the existing role middleware to `backend/src/middlewares/rbac.ts` and update its imports.
- Add `backend/tests/rbac.test.ts` coverage for role-based HTTP outcomes and seller product-supplier scope.
- Update the RBAC-related backlog test path and acceptance criteria after validation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The authorization behavior is already specified by the PRD and the existing `backend-middlewares-rbac` capability; this change adds regression coverage without changing requirements.

## Impact

- Backend middleware imports and RBAC tests.
- `docs/planning/user-stories-backlog.md` for the existing RBAC test story.
- No API contract, database, dependency, or product-rule changes.
