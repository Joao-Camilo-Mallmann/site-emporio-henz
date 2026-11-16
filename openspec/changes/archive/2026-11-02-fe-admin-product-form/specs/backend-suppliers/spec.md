## MODIFIED Requirements

### Requirement: Supplier Listing
The suppliers module SHALL provide an endpoint `GET /api/v1/suppliers` to list active partner manufacturers and brands. For a `SELLER`, the result SHALL be restricted to suppliers with an active link in `user_suppliers` (`deleted_at IS NULL`), keeping the same `{ data, pagination }` envelope and the same `search` and `active` filters.

#### Scenario: List active suppliers
- **WHEN** an authenticated `ADMIN` requests `GET /api/v1/suppliers`
- **THEN** the system SHALL return HTTP 200 with an array of suppliers having `deleted_at IS NULL`, ordered alphabetically by name

#### Scenario: Seller sees only linked suppliers
- **WHEN** an authenticated `SELLER` requests `GET /api/v1/suppliers`
- **THEN** the system SHALL return HTTP 200 with only the non-deleted suppliers linked to that seller through an active `user_suppliers` row, ordered alphabetically by name, and `pagination.total` SHALL count only those suppliers

#### Scenario: Seller without links
- **WHEN** an authenticated `SELLER` with no active link requests `GET /api/v1/suppliers`
- **THEN** the system SHALL return HTTP 200 with an empty `data` array and `pagination.total` equal to 0

#### Scenario: Revoked link is hidden
- **WHEN** the link between a `SELLER` and a supplier has `deleted_at` filled
- **THEN** that supplier SHALL NOT appear in the seller's listing

#### Scenario: Non-authenticated or customer access blocked
- **WHEN** an unauthenticated client or a user with role `CUSTOMER` (1) requests `GET /api/v1/suppliers`
- **THEN** the system SHALL reject the request with HTTP 401 or HTTP 403 Forbidden
