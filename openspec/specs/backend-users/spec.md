# Backend Users

## Purpose

Gerenciar o cadastro unificado, listagem administrativa com filtros, edição e desativação lógica (soft delete) de usuários e clientes.

## Requirements

### Requirement: Administrative User Listing
The users module SHALL provide an endpoint `GET /api/v1/users` restricted to `ADMIN` users that lists active users, joining `users` and `clients`.

#### Scenario: List active users successfully
- **WHEN** an authenticated `ADMIN` requests `GET /api/v1/users`
- **THEN** the system SHALL return a paginated list of active users (`deleted_at IS NULL`) with combined profile data (`id`, `email`, `role`, `fullName`, `phone`, `city`)

#### Scenario: Filter users by search term
- **WHEN** an `ADMIN` requests `GET /api/v1/users?search=termo`
- **THEN** the system SHALL return only users whose name or email matches the search query

### Requirement: User Details Retrieval
The users module SHALL provide an endpoint `GET /api/v1/users/:id` restricted to `ADMIN` users to inspect a specific user's complete profile.

#### Scenario: Retrieve existing user
- **WHEN** an `ADMIN` requests `GET /api/v1/users/:id` with a valid active user UUID
- **THEN** the system SHALL return HTTP 200 with the full user profile

#### Scenario: User not found or deleted
- **WHEN** an `ADMIN` requests a non-existent UUID or a user with `deleted_at IS NOT NULL`
- **THEN** the system SHALL respond with HTTP 404 Not Found

### Requirement: Administrative User Creation
The users module SHALL provide an endpoint `POST /api/v1/users` allowing `ADMIN` users to create accounts with any designated role (`CUSTOMER`, `SELLER`, `ADMIN`).

#### Scenario: Admin creates new user
- **WHEN** an `ADMIN` submits valid user data including `email`, `password`, `role`, `fullName`, and `phone`
- **THEN** the system SHALL create the user and client records in a transaction and return HTTP 201 with the created profile

### Requirement: User Update
The users module SHALL provide an endpoint `PUT /api/v1/users/:id` allowing `ADMIN` users to update user profile information and access role.

#### Scenario: Update user details
- **WHEN** an `ADMIN` submits updated `fullName`, `phone`, `city`, or `role` for an existing user
- **THEN** the system SHALL update the database records and return HTTP 200 with the updated profile

### Requirement: Soft Delete User
The users module SHALL provide an endpoint `DELETE /api/v1/users/:id` that performs a logical deletion without removing database rows.

#### Scenario: Soft delete user record
- **WHEN** an `ADMIN` requests deletion of a user
- **THEN** the system SHALL update `deleted_at = CURRENT_TIMESTAMP` on both `users` and associated `clients` records, revoke active associations, and return HTTP 200
