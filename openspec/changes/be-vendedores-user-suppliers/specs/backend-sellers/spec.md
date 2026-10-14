# Spec Delta

## Purpose

Fornece ao Administrador um endpoint paginado para listar todos os usuários com
perfil Vendedor (`role = 2`) ativos, e estabelece a regra de escopo e RBAC para
o recurso `/api/v1/vendedores`.

## ADDED Requirements

### Requirement: List Active Sellers
The backend-sellers module SHALL provide an endpoint `GET /api/v1/vendedores`
restricted exclusively to the `ADMIN` role. It SHALL return a paginated list of active users with
`role = 2` (`deleted_at IS NULL`), wrapped in the project standard pagination envelope
`{ data, pagination: { page, limit, total, totalPages } }` produced via `src/lib/pagination.ts`.

#### Scenario: Admin lists sellers successfully
- **WHEN** an authenticated user with role `ADMIN` sends `GET /api/v1/vendedores`
- **THEN** the system responds `200 OK` with `{ data: [...], pagination: { page, limit, total, totalPages } }` containing only users where `role = 2` and `deleted_at IS NULL`

#### Scenario: Non-admin is forbidden (403)
- **WHEN** an authenticated user with role `SELLER` or `CUSTOMER` sends `GET /api/v1/vendedores`
- **THEN** the system responds `403 Forbidden` with standard error payload `{ "error": "Forbidden", "message": "Acesso não autorizado." }`

#### Scenario: Unauthenticated request is rejected (401)
- **WHEN** a request without valid session cookie/token is sent to `GET /api/v1/vendedores`
- **THEN** the system responds `401 Unauthorized`

#### Scenario: Pagination standard applies
- **WHEN** query parameters `page` and `limit` are provided or omitted
- **THEN** the system parses and enforces pagination via `src/lib/pagination.ts` (`DEFAULT_PAGE_LIMIT = 20`, max 100 limit, max 10000 page), clamping out-of-range values silently

#### Scenario: Empty list when no sellers exist
- **WHEN** no active users with `role = 2` exist
- **THEN** the system responds `200 OK` with `data: []` and `pagination.total = 0`

### Requirement: Seller-Scoped Sub-Routes Require ADMIN and Valid Seller Id (404)
All sub-routes under `/api/v1/vendedores/:id/...` SHALL enforce `ADMIN`-only access (returning `403 Forbidden` for other roles).
Furthermore, the system SHALL validate the path parameter `:id` and respond with `404 Not Found` if the user does not exist in the database, has `deleted_at IS NOT NULL`, or has a role other than Vendedor (`role !== 2`).

#### Scenario: Non-admin is forbidden on sub-routes (403)
- **WHEN** an authenticated user with role `SELLER` or `CUSTOMER` sends any request to `/api/v1/vendedores/:id/fornecedores` or its sub-paths
- **THEN** the system responds `403 Forbidden`

#### Scenario: Id belongs to a non-seller user (e.g. ADMIN or CUSTOMER)
- **WHEN** an `ADMIN` sends a request to `/api/v1/vendedores/:id/fornecedores` where `:id` belongs to a user with `role = 3` or `role = 1`
- **THEN** the system responds `404 Not Found` with `{ "error": "Not Found", "message": "Vendedor não encontrado." }`

#### Scenario: Id does not exist or is soft-deleted
- **WHEN** an `ADMIN` sends a request to `/api/v1/vendedores/:id/fornecedores` where `:id` is not in the database or has `deleted_at IS NOT NULL`
- **THEN** the system responds `404 Not Found` with `{ "error": "Not Found", "message": "Vendedor não encontrado." }`
