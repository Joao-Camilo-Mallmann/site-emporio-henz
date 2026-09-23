## ADDED Requirements

### Requirement: Customer Self-Registration
The authentication module SHALL allow public customer registration via `POST /api/v1/auth/register`, creating both credentials in `users` and profile data in `clients` within a database transaction.

#### Scenario: Successful customer registration
- **WHEN** a client sends a valid registration payload (`fullName`, `email`, `phone`, `password`)
- **THEN** the system SHALL hash the password with Argon2id, insert the user with role `CUSTOMER` (1), create the client profile, and respond with HTTP 201 containing a signed JWT token and user profile

#### Scenario: Duplicate email rejection
- **WHEN** a client attempts registration with an email that is already active (`deleted_at IS NULL`) in `users`
- **THEN** the system SHALL reject the request with HTTP 409 Conflict and an explanatory error message

### Requirement: User Authentication via Credentials
The authentication module SHALL authenticate users via `POST /api/v1/auth/login` by verifying email and password against stored Argon2id hashes.

#### Scenario: Successful login
- **WHEN** a client submits valid email and password credentials for an active user
- **THEN** the system SHALL verify the password using `Bun.password.verify`, generate an HMAC-SHA256 JWT token with claims (`id`, `email`, `role`, `exp`), and respond with HTTP 200

#### Scenario: Invalid credentials
- **WHEN** a client submits an incorrect password or an email that does not exist
- **THEN** the system SHALL respond with HTTP 401 Unauthorized

#### Scenario: Inactive or soft-deleted user login attempt
- **WHEN** a user whose account has `deleted_at IS NOT NULL` attempts to log in
- **THEN** the system SHALL reject the login with HTTP 401 Unauthorized

### Requirement: Authenticated User Profile Retrieval
The authentication module SHALL provide a `GET /api/v1/auth/me` endpoint to return the current profile of the authenticated user.

#### Scenario: Fetch current user profile
- **WHEN** an authenticated request with a valid Bearer token accesses `GET /api/v1/auth/me`
- **THEN** the system SHALL respond with HTTP 200 containing the user's `id`, `email`, `role`, `fullName`, and `phone`
