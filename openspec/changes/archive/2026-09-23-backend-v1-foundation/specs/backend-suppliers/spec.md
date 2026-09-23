## ADDED Requirements

### Requirement: Supplier Listing
The suppliers module SHALL provide an endpoint `GET /api/v1/suppliers` to list active partner manufacturers and brands.

#### Scenario: List active suppliers
- **WHEN** an authenticated `ADMIN` or `SELLER` requests `GET /api/v1/suppliers`
- **THEN** the system SHALL return HTTP 200 with an array of suppliers having `deleted_at IS NULL`, ordered alphabetically by name

#### Scenario: Non-authenticated or customer access blocked
- **WHEN** an unauthenticated client or a user with role `CUSTOMER` (1) requests `GET /api/v1/suppliers`
- **THEN** the system SHALL reject the request with HTTP 401 or HTTP 403 Forbidden

### Requirement: Supplier Details Retrieval
The suppliers module SHALL provide an endpoint `GET /api/v1/suppliers/:id` to retrieve details for a specific supplier.

#### Scenario: Get existing supplier
- **WHEN** an authorized user requests `GET /api/v1/suppliers/:id` with a valid supplier UUID
- **THEN** the system SHALL return HTTP 200 with the supplier record

#### Scenario: Supplier not found
- **WHEN** an authorized user requests a non-existent supplier or one marked as deleted
- **THEN** the system SHALL respond with HTTP 404 Not Found

### Requirement: Supplier Creation
The suppliers module SHALL provide an endpoint `POST /api/v1/suppliers` allowing `ADMIN` users to register new partner suppliers.

#### Scenario: Admin creates supplier
- **WHEN** an `ADMIN` submits valid supplier data (`name`, `contact`, `active`)
- **THEN** the system SHALL insert the supplier into PostgreSQL with `deleted_at = NULL` and return HTTP 201 with the created record

### Requirement: Supplier Update
The suppliers module SHALL provide an endpoint `PUT /api/v1/suppliers/:id` allowing `ADMIN` users to modify supplier information.

#### Scenario: Admin updates supplier
- **WHEN** an `ADMIN` submits updated details for an existing supplier
- **THEN** the system SHALL update the database record and return HTTP 200

### Requirement: Soft Delete Supplier
The suppliers module SHALL provide an endpoint `DELETE /api/v1/suppliers/:id` allowing `ADMIN` users to logically deactivate a supplier.

#### Scenario: Soft delete supplier record
- **WHEN** an `ADMIN` requests deletion of a supplier
- **THEN** the system SHALL update `deleted_at = CURRENT_TIMESTAMP` on the `suppliers` table and return HTTP 200
