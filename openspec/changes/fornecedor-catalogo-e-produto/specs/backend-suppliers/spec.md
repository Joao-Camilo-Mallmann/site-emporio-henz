# Delta Spec: backend-suppliers

## MODIFIED Requirements

### Requirement: Role-Scoped Public Listing on `GET /api/v1/suppliers`
The suppliers module SHALL expose `GET /api/v1/suppliers` publicly using `attachUserIfAuthenticated` (without `authMiddleware` or `requireRole`), returning a paginated list (`{ data, pagination }`) ordered alphabetically by `name`:
- For unauthenticated visitors and `CUSTOMER` (`role = 1`), the endpoint SHALL return only active, non-deleted suppliers (`active = true`, `deleted_at IS NULL`), MUST set `contact` to `null`, and MUST restrict `search` matching to `name` in slug form.
- For `SELLER` (`role = 2`), the endpoint SHALL preserve existing RF16 behavior (only actively linked suppliers via `user_suppliers`, with `contact` included).
- For `ADMIN` (`role = 3`), the endpoint SHALL preserve full listing (active and inactive, `active` query filter, `contact` included and searchable).
- `GET /api/v1/suppliers/:id`, `POST`, `PUT`, and `DELETE` SHALL retain their existing authentication and RBAC middlewares.

#### Scenario: Anonymous visitor or Customer lists suppliers
- **WHEN** an unauthenticated visitor or `CUSTOMER` calls `GET /api/v1/suppliers` (even passing `active=false`)
- **THEN** the system SHALL return HTTP 200 with only active, non-deleted suppliers and `contact: null` on every item

#### Scenario: Public search does not leak B2B contact
- **WHEN** an unauthenticated visitor calls `GET /api/v1/suppliers?search=<email_or_phone_fragment>`
- **THEN** the system SHALL NOT match suppliers by `contact`

#### Scenario: Seller and Admin retain scoped and full views
- **WHEN** an authenticated `SELLER` calls `GET /api/v1/suppliers`
- **THEN** the system SHALL return only their linked suppliers with `contact` preserved
- **WHEN** an authenticated `ADMIN` calls `GET /api/v1/suppliers?active=false`
- **THEN** the system SHALL return inactive suppliers with `contact` preserved
