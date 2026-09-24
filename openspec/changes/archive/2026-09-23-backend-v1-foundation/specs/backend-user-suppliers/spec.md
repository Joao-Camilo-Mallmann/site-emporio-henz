## ADDED Requirements

### Requirement: List Assigned Suppliers for Seller
The user-suppliers module SHALL provide an endpoint `GET /api/v1/users/:userId/suppliers` allowing `ADMIN` users to inspect the suppliers assigned to a specific seller.

#### Scenario: List active links for seller
- **WHEN** an `ADMIN` requests `GET /api/v1/users/:userId/suppliers`
- **THEN** the system SHALL return HTTP 200 with an array of active suppliers (`user_suppliers.deleted_at IS NULL` and `suppliers.deleted_at IS NULL`) associated with that user

### Requirement: Assign Supplier to Seller
The user-suppliers module SHALL provide an endpoint `POST /api/v1/users/:userId/suppliers` allowing `ADMIN` users to grant a seller authorization over a partner supplier.

#### Scenario: Successfully link seller and supplier
- **WHEN** an `ADMIN` submits a valid `{ "supplierId": "uuid" }` for an active seller
- **THEN** the system SHALL create or reactivate a row in `user_suppliers` with `deleted_at = NULL` and return HTTP 201

#### Scenario: Duplicate link prevention
- **WHEN** an `ADMIN` attempts to create an already active link between the same user and supplier
- **THEN** the system SHALL return HTTP 409 Conflict

### Requirement: Revoke Supplier Link from Seller
The user-suppliers module SHALL provide an endpoint `DELETE /api/v1/users/:userId/suppliers/:supplierId` allowing `ADMIN` users to remove a seller's authorization over a supplier.

#### Scenario: Soft delete seller-supplier link
- **WHEN** an `ADMIN` requests deletion of a link
- **THEN** the system SHALL set `deleted_at = CURRENT_TIMESTAMP` on the matching `user_suppliers` record and return HTTP 200
