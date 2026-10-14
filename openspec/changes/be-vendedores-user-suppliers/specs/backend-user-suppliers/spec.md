# Spec Delta

## ADDED Requirements

### Requirement: List Assigned Suppliers via Seller Route
The user-suppliers module SHALL provide an endpoint `GET /api/v1/vendedores/:id/fornecedores`
restricted exclusively to the `ADMIN` role (returning `403 Forbidden` for any other role).
It SHALL return a paginated list of suppliers actively linked to the seller
(where `user_suppliers.deleted_at IS NULL` and `suppliers.deleted_at IS NULL`),
using the standard pagination envelope `{ data, pagination: { page, limit, total, totalPages } }` produced by `src/lib/pagination.ts`.
If `:id` does not belong to an active user with `role = 2`, it SHALL return `404 Not Found`.

#### Scenario: Admin retrieves seller's linked suppliers
- **WHEN** an authenticated `ADMIN` user sends `GET /api/v1/vendedores/:id/fornecedores` for a valid seller id
- **THEN** the system responds `200 OK` with paginated suppliers linked to that seller where `user_suppliers.deleted_at IS NULL`

#### Scenario: Revoked links are excluded from the list (Soft Delete)
- **WHEN** a supplier link in `user_suppliers` has `deleted_at IS NOT NULL`
- **THEN** that supplier SHALL NOT appear in the response `data`, guaranteeing immediate revocation reflection

#### Scenario: Non-admin is forbidden (403)
- **WHEN** an authenticated user with role `SELLER` or `CUSTOMER` calls `GET /api/v1/vendedores/:id/fornecedores`
- **THEN** the system responds `403 Forbidden`

#### Scenario: Non-seller or non-existent id returns 404
- **WHEN** an `ADMIN` calls `GET /api/v1/vendedores/:id/fornecedores` where `:id` does not exist or has `role != 2`
- **THEN** the system responds `404 Not Found`

#### Scenario: Standard pagination applied
- **WHEN** `page` and `limit` are passed or omitted
- **THEN** defaults and limits from `src/lib/pagination.ts` apply (`page = 1`, `limit = 20`, max `limit = 100`)

### Requirement: Assign Supplier via Seller Route
The user-suppliers module SHALL provide an endpoint `POST /api/v1/vendedores/:id/fornecedores`
restricted exclusively to the `ADMIN` role. It SHALL create or reactivate a `user_suppliers`
link between the seller and the specified `supplierId`.
If `:id` does not belong to an active user with `role = 2`, it SHALL return `404 Not Found`.

#### Scenario: Admin assigns supplier to seller
- **WHEN** an `ADMIN` user sends `POST /api/v1/vendedores/:id/fornecedores` with body `{ "supplierId": "<uuid>" }`
- **THEN** the system responds `201 Created` with the created or reactivated link object

#### Scenario: Duplicate active link is rejected (409)
- **WHEN** the link already exists with `deleted_at IS NULL`
- **THEN** the system responds `409 Conflict`

#### Scenario: Previously revoked link is reactivated
- **WHEN** the link exists with `deleted_at IS NOT NULL`
- **THEN** the system updates `deleted_at = NULL` and `updated_at = CURRENT_TIMESTAMP`, responding `201 Created`

#### Scenario: Invalid supplierId rejected (400)
- **WHEN** `supplierId` is missing or not a valid UUID format
- **THEN** the system responds `400 Bad Request`

#### Scenario: Non-admin is forbidden (403)
- **WHEN** a non-`ADMIN` user calls the endpoint
- **THEN** the system responds `403 Forbidden`

#### Scenario: Non-seller or non-existent id returns 404
- **WHEN** `:id` does not belong to an active user with `role = 2`
- **THEN** the system responds `404 Not Found`

### Requirement: Revoke Supplier via Seller Route
The user-suppliers module SHALL provide an endpoint `DELETE /api/v1/vendedores/:id/fornecedores/:supplierId`
restricted exclusively to the `ADMIN` role.
It SHALL perform a soft delete by setting `deleted_at = CURRENT_TIMESTAMP` on the matching active link.
The revocation SHALL take effect immediately: subsequent calls to `GET /api/v1/vendedores/:id/fornecedores`
SHALL omit the revoked supplier, and queries checking `user_suppliers` with `WHERE deleted_at IS NULL` SHALL not find it.

#### Scenario: Admin revokes supplier from seller
- **WHEN** an `ADMIN` user calls `DELETE /api/v1/vendedores/:id/fornecedores/:supplierId` and an active link exists
- **THEN** the system sets `deleted_at = CURRENT_TIMESTAMP` and responds `200 OK` with `{ "message": "Vínculo revogado com sucesso." }`

#### Scenario: Revoking non-existent or already-revoked link returns 404
- **WHEN** no active link (`deleted_at IS NULL`) exists for the specified `userId` and `supplierId`
- **THEN** the system responds `404 Not Found`

#### Scenario: Immediate reflection in listing (Soft delete verification)
- **WHEN** a link is revoked via DELETE
- **THEN** a subsequent `GET /api/v1/vendedores/:id/fornecedores` response SHALL NOT include the revoked supplier in the `data` array

#### Scenario: Non-admin is forbidden (403)
- **WHEN** a non-`ADMIN` user calls the endpoint
- **THEN** the system responds `403 Forbidden`

#### Scenario: Non-seller or non-existent id returns 404
- **WHEN** `:id` does not belong to an active user with `role = 2`
- **THEN** the system responds `404 Not Found`
